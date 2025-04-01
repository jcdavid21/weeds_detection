# Weed and Paddy Detector

This project is a Flask-based web application that uses a YOLOv5 deep learning model to detect paddy plants and weeds in images and videos. The model identifies and classifies objects in uploaded images or video frames.

## Prerequisites

Before running the application, make sure you have the following installed:

### Required Dependencies:
- Python 3.x
- Flask
- Flask-CORS
- OpenCV (cv2)
- NumPy
- Torch (PyTorch)
- PIL (Pillow)
- Werkzeug
- YOLOv5 (from Ultralytics)

## Installation

Follow these steps to set up the project:

1. **Clone the Repository**
```sh
   git clone https://github.com/jcdavid21/weeds_detection.git
   cd your-repo
```

2. **Create and Activate a Virtual Environment (Optional but Recommended)**
```sh
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   cd weed-detector
```


3. **Install Dependencies**
```sh
   pip install -r requirements.txt
```

4. **Download and Set Up the YOLOv5 Model**
Ensure you downloaded the trained YOLOv5 model (`best.pt`). Place it in the project directory.

## Running the Application

To start the Flask application, run:
```sh
   python app.py
```

The server will start on `http://127.0.0.1:8800/`.

## File Structure
```
├── app.py                # Main Flask application
├── ImageForTest/         # images for testing
├── templates/
│   ├── index.php         # Frontend template
│   ├── navbar.php         # Frontend template
│   ├── footer.php         # Frontend template
│   ├── healthRisk.php         # Frontend template
│   ├── video.php         # Frontend template
├── static/
│   ├── uploads/          # Directory to store uploaded files
│   ├── ccs/              # Directory to store styles
│   ├── js/               # Directory to store js files
├── best.pt               # YOLOv5 trained model file
├── requirements.txt      # Required Python packages
├── README.md             # This documentation file
```

## API Endpoints

### 1. Home Page
- **URL:** `/`
- **Method:** GET
- **Description:** Serves the index.php file.

### 2. Process Frame
- **URL:** `/process-frame`
- **Method:** POST
- **Data:** JSON with base64 encoded image
- **Response:** Detected objects, including paddy and weeds with confidence levels.

### 3. Upload and Predict
- **URL:** `/predict`
- **Method:** POST
- **Data:** Image file
- **Response:** Detected objects, weed density statistics, and a link to the processed image.

### 4. Model Info
- **URL:** `/model-info`
- **Method:** GET
- **Response:** Returns model name, classes, and a description.

## Notes
- Make sure the `best.pt` model is correctly placed.
- Adjust the confidence threshold in `app.py` if needed.
- The Flask server runs on port `8800` by default; update it in `app.py` if necessary.


## Author
Juan Carlo David

