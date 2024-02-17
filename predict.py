import cv2
import sys
import subprocess
import numpy as np
from keras.models import load_model

# Define required dependencies
dependencies = ['opencv-python', 'numpy', 'tensorflow']

# Install dependencies using pip
for dependency in dependencies:
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', dependency])

# Load the trained model
model = load_model("trained.h5")

# Function to preprocess image for prediction
def preprocess_image(image_path):
    img = cv2.imread(image_path)
    tempimg = img
    img = cv2.resize(img, (300, 300))
    img = img / 255.0
    img = np.expand_dims(img, axis=0)  # Add batch dimension
    return img, tempimg

# Function to predict pneumonia
def predict_pneumonia(image_path):
    img, tempimg = preprocess_image(image_path)
    prediction = model.predict(img)
    # Assuming binary classification, use argmax to get predicted class index
    predicted_class_index = np.argmax(prediction)
    return "Pneumonia" if predicted_class_index == 1 else "Normal"

# Check if image path is provided
if len(sys.argv) != 2:
    print("Usage: python script_name.py <image_path>")
    sys.exit(1)

# Get image path from command-line argument
image_path = sys.argv[1]

# Perform prediction
prediction = predict_pneumonia(image_path)
print("Prediction:", prediction)
