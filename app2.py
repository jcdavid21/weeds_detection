import os
import time
import threading
import tempfile
from flask import Flask, render_template, request, jsonify, send_from_directory, Response
from werkzeug.utils import secure_filename
import cv2
import numpy as np
from flask_cors import CORS
import base64
import io
from PIL import Image
import json
import platform
import sys

# Fix for POSIX path issue on Windows with PyTorch
import torch
import pathlib
temp = pathlib.PosixPath
pathlib.PosixPath = pathlib.WindowsPath

app = Flask(__name__)
CORS(app)  

# Use Windows-friendly path separators
UPLOAD_FOLDER = os.path.join('static', 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'mp4', 'avi', 'mov'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  

# Add error handling for model loading
try:
    print("Loading YOLOv5 model...")
    # Use proper path handling for Windows
    model_path = os.path.abspath('best.pt')
    print(f"Looking for model at: {model_path}")
    
    if not os.path.exists(model_path):
        print("Warning: Model file not found!")
    
    model = torch.hub.load('ultralytics/yolov5', 'custom', path=model_path, force_reload=True)
    model.conf = 0.25  # Confidence threshold
    model.classes = [0, 1]  # Both classes (0: Weed, 1: Paddy)
    model_loaded = True
    print("Model loaded successfully!")
    
    # Load model metrics from the checkpoint if available
    try:
        checkpoint = torch.load(model_path, map_location='cpu')
        if 'training_results' in checkpoint:
            training_metrics = checkpoint['training_results']
            print("\n----- MODEL TRAINING METRICS -----")
            print(training_metrics)
            print("----------------------------------\n")
        else:
            # Extract metrics from the model metadata if available
            metrics = {}
            if hasattr(checkpoint, 'keys'):
                if 'optimizer' in checkpoint:
                    metrics['optimizer'] = str(type(checkpoint['optimizer']).__name__)
                if 'epoch' in checkpoint:
                    metrics['epochs_trained'] = checkpoint['epoch']
                if 'best_fitness' in checkpoint:
                    metrics['best_fitness'] = float(checkpoint['best_fitness'])
                if 'ema' in checkpoint and hasattr(checkpoint['ema'], 'updates'):
                    metrics['training_iterations'] = int(checkpoint['ema'].updates)
                if 'model' in checkpoint and hasattr(checkpoint['model'], 'yaml'):
                    metrics['model_config'] = checkpoint['model'].yaml
            
            if metrics:
                print("\n----- MODEL TRAINING METRICS -----")
                for k, v in metrics.items():
                    print(f"{k}: {v}")
                print("----------------------------------\n")
            else:
                print("\nNo detailed training metrics found in the model file\n")
    except Exception as e:
        print(f"Could not extract training metrics: {e}")
        
except Exception as e:
    print(f"Error loading model: {e}")
    model = None
    model_loaded = False

# Global variables for video streaming
video_capture = None
lock = threading.Lock()
is_streaming = False

# Calculate and store model performance metrics
model_metrics = {
    'predictions_count': 0,
    'avg_inference_time': 0,
    'total_inference_time': 0,
    'weed_accuracy': 0,  # Will be calculated based on confidence
    'paddy_accuracy': 0,
    'class_distribution': {0: 0, 1: 0}  # 0: Weed, 1: Paddy
}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def allowed_image_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg', 'webp'}

def allowed_video_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in {'mp4', 'avi', 'mov'}

def update_metrics(inference_time, detections):
    """Update model performance metrics with new detection results"""
    with lock:
        # Update inference time
        model_metrics['predictions_count'] += 1
        model_metrics['total_inference_time'] += inference_time
        model_metrics['avg_inference_time'] = model_metrics['total_inference_time'] / model_metrics['predictions_count']
        
        # Update class distribution and confidence
        weed_confs = []
        paddy_confs = []
        
        for idx, detection in detections.iterrows():
            class_id = int(detection['class'])
            confidence = float(detection['confidence'])
            
            # Update class distribution
            model_metrics['class_distribution'][class_id] += 1
            
            # Collect confidences by class
            if class_id == 0:  # Weed
                weed_confs.append(confidence)
            else:  # Paddy
                paddy_confs.append(confidence)
        
        # Update class-specific average confidence (as a proxy for accuracy)
        if weed_confs:
            model_metrics['weed_accuracy'] = sum(weed_confs) / len(weed_confs)
        if paddy_confs:
            model_metrics['paddy_accuracy'] = sum(paddy_confs) / len(paddy_confs)
        
        # Print metrics to terminal
        print("\n----- DETECTION METRICS -----")
        print(f"Inference time: {inference_time:.4f} seconds")
        print(f"Average inference time: {model_metrics['avg_inference_time']:.4f} seconds")
        print(f"Total detections: {len(detections)}")
        print(f"Weed count: {len(weed_confs)}")
        print(f"Paddy count: {len(paddy_confs)}")
        
        if weed_confs:
            print(f"Weed detection confidence: {model_metrics['weed_accuracy']:.4f}")
        if paddy_confs:
            print(f"Paddy detection confidence: {model_metrics['paddy_accuracy']:.4f}")
        
        # Calculate precision and recall if ground truth is available
        # (Not implemented as we don't have ground truth during inference)
        
        total_detections = sum(model_metrics['class_distribution'].values())
        if total_detections > 0:
            print("\nClass distribution:")
            for class_id, count in model_metrics['class_distribution'].items():
                class_name = 'Weed' if class_id == 0 else 'Paddy'
                percentage = (count / total_detections) * 100
                print(f"  {class_name}: {count} ({percentage:.2f}%)")
        
        print("-----------------------------\n")

@app.route('/')
def index():
    try:
        return render_template('index.php')
    except Exception as e:
        # Fall back to index.html if index.php isn't found/supported
        try:
            return render_template('index.html')
        except Exception as e2:
            return jsonify({'error': 'Template not found. Please ensure index.php or index.html exists in the templates folder.'}), 404

@app.route('/check-status', methods=['GET'])
def check_status():
    """API endpoint to check if the system is running properly"""
    status = {
        'system': platform.system(),
        'python_version': sys.version,
        'model_loaded': model_loaded,
        'model_path_exists': os.path.exists('best.pt'),
        'upload_folder_exists': os.path.exists(UPLOAD_FOLDER),
        'pytorch_version': torch.__version__,
        'opencv_version': cv2.__version__,
        'pytorch_cuda_available': torch.cuda.is_available() if hasattr(torch, 'cuda') else False,
        'model_metrics': model_metrics
    }
    return jsonify(status)

@app.route('/process-frame', methods=['POST'])
def process_frame():
    if not model_loaded:
        return jsonify({'error': 'Model not loaded properly', 'status': 'error'}), 500
        
    try:
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({'error': 'No image data provided'}), 400
        
        # Decode the base64 image
        header, encoded = data['image'].split(",", 1)
        image_data = base64.b64decode(encoded)
        image = Image.open(io.BytesIO(image_data))
        image_np = np.array(image)
        
        # Convert RGB to BGR for OpenCV
        if len(image_np.shape) == 3 and image_np.shape[2] == 3:  # RGB image
            image_np = image_np[:, :, ::-1].copy()
        
        # Time the inference
        start_time = time.time()
        
        # Perform detection
        results = model(image_np)
        
        # Calculate inference time
        inference_time = time.time() - start_time
        
        # Process results
        output = []
        paddy_count = 0
        weed_count = 0
        
        detections = results.pandas().xyxy[0]  # Results in pandas DataFrame
        
        # Update metrics
        update_metrics(inference_time, detections)
        
        for idx, detection in detections.iterrows():
            class_id = int(detection['class'])
            confidence = float(detection['confidence'])
            x1, y1 = int(detection['xmin']), int(detection['ymin'])
            x2, y2 = int(detection['xmax']), int(detection['ymax'])
            
            width = x2 - x1
            height = y2 - y1
            center_x = x1 + width/2
            center_y = y1 + height/2
            
            if class_id == 0:
                class_name = 'Weed'
                weed_count += 1
            else:
                class_name = 'Paddy'
                paddy_count += 1
            
            output.append({
                'class': class_name,
                'confidence': round(confidence, 2),
                'bbox': [round(center_x, 2), round(center_y, 2), round(width, 2), round(height, 2)]
            })
        
        # Calculate weed density
        total_plants = paddy_count + weed_count
        weed_density = round((weed_count / total_plants) * 100, 2) if total_plants > 0 else 0
        
        return jsonify({
            'status': 'success',
            'results': output,
            'statistics': {
                'paddy_count': paddy_count,
                'weed_count': weed_count,
                'total_objects': total_plants,
                'weed_density': weed_density,
                'avg_confidence': sum(r['confidence'] for r in output) / len(output) if output else 0,
                'inference_time': round(inference_time, 4)
            }
        })
    
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500


@app.route('/predict', methods=['POST'])
def predict():
    if not model_loaded:
        return jsonify({'error': 'Model not loaded properly', 'status': 'error'}), 500
        
    print("Received predict request")
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and allowed_image_file(file.filename):
        try:
            # Create upload folder if it doesn't exist
            os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
            
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            print(f"Saved file to {filepath}")
            
            # Time the inference
            start_time = time.time()
            
            # Perform prediction with YOLOv5
            print(f"Running prediction on {filepath}")
            results = model(filepath)
            
            # Calculate inference time
            inference_time = time.time() - start_time
            
            # Initialize counters for statistics
            paddy_count = 0
            weed_count = 0
            
            # Process results (YOLOv5 format)
            output = []
            
            # Convert the image for visualization
            img = cv2.imread(filepath)
            if img is None:
                print(f"Warning: Could not load image from {filepath}")
                return jsonify({'error': 'Failed to load the uploaded image'}), 500
            
            # Get detections
            detections = results.pandas().xyxy[0]  # Results in pandas DataFrame
            print(f"Found {len(detections)} detections")
            
            # Update metrics
            update_metrics(inference_time, detections)
            
            for idx, detection in detections.iterrows():
                class_id = int(detection['class'])
                confidence = float(detection['confidence'])
                x1, y1 = int(detection['xmin']), int(detection['ymin'])
                x2, y2 = int(detection['xmax']), int(detection['ymax'])
                
                # Calculate center, width, height
                width = x2 - x1
                height = y2 - y1
                center_x = x1 + width/2
                center_y = y1 + height/2
                
                # Get class name (0: Weed, 1: Paddy)
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
            
            # Save the output image - use Windows-friendly paths
            output_filename = 'predicted_' + filename
            output_path = os.path.join(app.config['UPLOAD_FOLDER'], output_filename)
            success = cv2.imwrite(output_path, img)
            if not success:
                print(f"Warning: Failed to save image to {output_path}")
            else:
                print(f"Saved predicted image to {output_path}")
            
            # Calculate weed density if any plants are detected
            weed_density = 0
            total_plants = paddy_count + weed_count
            if total_plants > 0:
                weed_density = round((weed_count / total_plants) * 100, 2)
            
            # Use forward slashes in URLs (web standard) even on Windows
            return jsonify({
                'original': f'../static/uploads/{filename}',
                'predicted': f'../static/uploads/{output_filename}',
                'results': output,
                'statistics': {
                    'paddy_count': paddy_count,
                    'weed_count': weed_count,
                    'total_objects': total_plants,
                    'weed_density': weed_density,
                    'avg_confidence': sum(r['confidence'] for r in output) / len(output) if output else 0,
                    'inference_time': round(inference_time, 4)
                },
                'status': 'success'
            })
        except Exception as e:
            import traceback
            print(f"Error in predict: {e}")
            print(traceback.format_exc())
            return jsonify({'error': str(e), 'status': 'error'}), 500
    
    return jsonify({'error': 'Invalid file type'}), 400


@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

@app.route('/model-info', methods=['GET'])
def model_info():
    return jsonify({
        'model_name': 'Weed and Paddy Detector',
        'classes': ['Weed', 'Paddy'],
        'description': 'This model detects paddy (rice) plants and weeds in paddy fields.',
        'model_loaded': model_loaded,
        'metrics': model_metrics
    })

@app.route('/metrics', methods=['GET'])
def get_metrics():
    """API endpoint to get current model metrics"""
    return jsonify({
        'model_metrics': model_metrics,
        'status': 'success'
    })

if __name__ == '__main__':
    # Create upload folder if it doesn't exist
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    
    # Print startup information
    print(f"System: {platform.system()}")
    print(f"Python version: {sys.version}")
    print(f"PyTorch version: {torch.__version__}")
    print(f"OpenCV version: {cv2.__version__}")
    print(f"Model loaded: {model_loaded}")
    print(f"Upload folder: {os.path.abspath(UPLOAD_FOLDER)}")
    print("Starting Flask server on http://localhost:8800")
    
    # Set threaded=True for better performance on Windows
    app.run(debug=True, port=8800, threaded=True, host='0.0.0.0')