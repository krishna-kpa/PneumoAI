import sys
import cv2
import numpy as np
from keras.models import load_model

# Load the trained model
model = load_model("trained.h5")

# Function to preprocess image for prediction
def preprocess_image(image_path):
    img = cv2.imread(image_path)
    tempimg = img
    img = cv2.resize(img, (300, 300))
    img = img / 255.0
    img = img.reshape(1, 300, 300, 3)
    return img, tempimg

# Function to predict pneumonia
def predict_pneumonia(image_path):
    img, tempimg = preprocess_image(image_path)
    prediction = model.predict(img) >= 0.5
    if prediction:
        return "Pneumonia"
    else:
        return "Normal"

# Get image path from command-line argument
image_path = sys.argv[1]

# Perform prediction
prediction = predict_pneumonia(image_path)
print(prediction)
