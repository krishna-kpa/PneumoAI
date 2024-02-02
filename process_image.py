import sys
import json
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
from PIL import Image

try:
    # Load the image data from Node.js
    image_data = json.loads(sys.stdin.readline())

    # Convert image data to numpy array or perform any required preprocessing
    image = np.array(Image.open(image_data))

    # Load the TensorFlow model
    model = load_model('trained.h5')  # Replace 'your_model.h5' with your model file path

    # Perform inference
    predictions = model.predict(image)

    # Convert predictions to JSON or any other suitable format
    output = predictions.tolist()

    # Send the output back to Node.js
    print(json.dumps(output))
    sys.stdout.flush()

except json.JSONDecodeError as e:
    print("Error: Invalid JSON format:", e)
    sys.stdout.flush()

except Exception as e:
    print("Error:", e)
    sys.stdout.flush()
