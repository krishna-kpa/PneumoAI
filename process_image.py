import sys
import json
import subprocess

# Install required Python packages
packages = ['numpy', 'tensorflow', 'Pillow']
for package in packages:
    subprocess.run(['pip', 'install', package])

# Import installed packages
import numpy as np
from tensorflow.keras.models import load_model
from PIL import Image
import base64

try:
    print("Image processing...")
    # Load the image data from Node.js
    image_data = json.loads(sys.stdin.readline())

<<<<<<< HEAD
    # Convert image data to numpy array or perform any required preprocessing
    image = np.array(Image.open(image_data))

    # Load the TensorFlow model
    model = load_model('trained.h5')  # Replace 'your_model.h5' with your model file path

    # Perform inference
    predictions = model.predict(image)

    # Convert predictions to JSON or any other suitable format
    output = predictions.tolist()
=======
# Convert base64 encoded image data to numpy array
image_bytes = base64.b64decode(image_data['image'])
image = np.array(Image.open(io.BytesIO(image_bytes)))

# Load the TensorFlow model
model = load_model('trained.h5')  # Replace 'trained.h5' with your model file path

# Perform inference
prediction = model.predict(np.expand_dims(image, axis=0))[0][0]

# Determine class label
class_label = "Pneumonia" if prediction >= 0.5 else "Normal"

# Prepare output
output = {
    'prediction': prediction.tolist(),
    'class_label': class_label
}
>>>>>>> 4b35b5f (Some more edits are done on upload route)

    # Send the output back to Node.js
    print(json.dumps(output))
    sys.stdout.flush()

except json.JSONDecodeError as e:
    print(e+" first")
    print("Error: Invalid JSON format:", e)
    sys.stdout.flush()

except Exception as e:
    print(e)
    print(json.dumps({"error": "An error occurred during image processing", "exception": str(e)}))
    sys.stdout.flush()
