import os
from flask import Flask, render_template, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
import cv2
import numpy as np
from flask_cors import CORS
import torch

app = Flask(__name__)

# Allow specific origin (more secure)
CORS(app)  # This allows all origins

# Configuration
UPLOAD_FOLDER = 'static/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB limit

# Load the trained model - update path to your model
# Using YOLOv5 instead of Ultralytics YOLO
model = torch.hub.load('ultralytics/yolov5', 'custom', path='best.pt')
model.conf = 0.25  # Confidence threshold
model.classes = [0, 1]  # Both classes (0: Weed, 1: Paddy)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    print("Received request")
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Perform prediction with YOLOv5
        results = model(filepath)
        
        # Initialize counters for statistics
        paddy_count = 0
        weed_count = 0
        
        # Process results (YOLOv5 format)
        output = []
        
        # Convert the image for visualization
        img = cv2.imread(filepath)
        
        # Get detections
        detections = results.pandas().xyxy[0]  # Results in pandas DataFrame
        
        for idx, detection in detections.iterrows():
            class_id = int(detection['class'])
            confidence = float(detection['confidence'])
            x1, y1 = int(detection['xmin']), int(detection['ymin'])
            x2, y2 = int(detection['xmax']), int(detection['ymax'])
            
            # Calculate center, width, height (for compatibility with your expected output)
            width = x2 - x1
            height = y2 - y1
            center_x = x1 + width/2
            center_y = y1 + height/2
            
            # Get class name (note: in YOLOv5 model, 0: Weed, 1: Paddy)
            if class_id == 0:
                class_name = 'Weed'
                weed_count += 1
                color = (0, 0, 255)  # Red for weeds
            else:
                class_name = 'Paddy'
                paddy_count += 1
                color = (0, 255, 0)  # Green for paddy
            
            # Draw bounding box
            cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)
            
            # Add label
            label = f"{class_name}: {confidence:.2f}"
            cv2.putText(img, label, (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
            
            output.append({
                'class': class_name,
                'confidence': round(confidence, 2),
                'bbox': [round(center_x, 2), round(center_y, 2), round(width, 2), round(height, 2)]
            })
        
        # Save the output image
        output_path = os.path.join(app.config['UPLOAD_FOLDER'], 'predicted_' + filename)
        cv2.imwrite(output_path, img)
        
        # Calculate weed density if any plants are detected
        weed_density = 0
        total_plants = paddy_count + weed_count
        if total_plants > 0:
            weed_density = round((weed_count / total_plants) * 100, 2)
        
        return jsonify({
            'original': f'../static/uploads/{filename}',
            'predicted': f'../static/uploads/predicted_{filename}',
            'results': output,
            'statistics': {
                'paddy_count': paddy_count,
                'weed_count': weed_count,
                'total_objects': total_plants,
                'weed_density': weed_density,
                'avg_confidence': sum(r['confidence'] for r in output) / len(output) if output else 0
            },
            'status': 'success'
        })
    
    return jsonify({'error': 'Invalid file type'}), 400

@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

# Add a simple API endpoint to get model information
@app.route('/model-info', methods=['GET'])
def model_info():
    return jsonify({
        'model_name': 'Weed and Paddy Detector',
        'classes': ['Weed', 'Paddy'],
        'description': 'This model detects paddy (rice) plants and weeds in paddy fields.'
    })

if __name__ == '__main__':
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    app.run(debug=True, port=8800)