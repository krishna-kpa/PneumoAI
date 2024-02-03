import cv2
import matplotlib.pyplot as plt
from keras.models import load_model
import os

directory_path = os.path.dirname(__file__)
image_path = os.path.join(directory_path, 'pneumonia.png')
image_path1 = os.path.join(directory_path, 'normal.png')
# Load the pre-trained model
model = load_model("trained.h5")

def predict_single_image(image_path):
    # Load and preprocess the image
    print("Attempting to load image from:", image_path)
    img = cv2.imread(image_path)
    
    if img is None:
        print(f"Error: Unable to load image '{image_path}'")
        return None, None
    
    temp_img = img.copy()  # Save a copy for plotting
    img = cv2.resize(img, (300, 300))
    img = img / 255.0
    img = img.reshape(1, 300, 300, 3)

    # Predict
    prediction = model.predict(img)

    return prediction, temp_img


# Predict and visualize sample images
def visualize_prediction(image_path):
    prediction, temp_img = predict_single_image(image_path)
    
    if prediction is None:
        print(f"Error: Unable to make prediction for image '{image_path}'")
        return
    
    class_label = "Pneumonia" if prediction >= 0.5 else "Normal"
    plt.imshow(cv2.cvtColor(temp_img, cv2.COLOR_BGR2RGB))
    plt.title(f"True Class: {image_path.split('/')[-2]}\nPrediction: {class_label}")
    plt.axis('off')
    plt.show()


# Visualize predictions for sample images
sample_images = [image_path,image_path1]


for image_path in sample_images:
    visualize_prediction(image_path)
