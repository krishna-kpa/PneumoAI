import sys
import json
import subprocess
import base64
import io
from PIL import Image
import numpy as np
from tensorflow.keras.models import load_model

try:
    print("Image processing...")
    # Load the image data from Node.js
    image_data = json.loads(sys.stdin.readline())

    # Check if 'image' key exists in the JSON data
    if 'image' not in image_data:
        raise KeyError("'image' key not found in JSON data")

    # Convert base64 encoded image data to numpy array
    image_bytes = base64.b64decode(image_data['image'])
    image = np.array(Image.open(io.BytesIO(image_bytes)))

    # Install required Python packages
    subprocess.run(['pip', 'install', 'numpy', 'tensorflow', 'Pillow'])

    # Reload numpy after installation
    import numpy as np
    from tensorflow.keras.models import load_model

    # Load the TensorFlow model
    model = load_model('trained.h5')  # Replace 'trained.h5' with your model file path

    # Perform inference
    # Ensure the image is properly preprocessed according to the model requirements
    img = preprocess_image(image)
    predictions = model.predict(np.expand_dims(img, axis=0))

    # Convert predictions to JSON or any other suitable format
    output = predictions.tolist()

    # Send the output back to Node.js
    print(json.dumps(output))
    sys.stdout.flush()

except json.JSONDecodeError as e:
    print("Error: Invalid JSON format:", e)
    sys.stdout.flush()

except KeyError as e:
    print("Error during image processing:", e)
    print(json.dumps({"error": "An error occurred during image processing", "exception": str(e)}))
    sys.stdout.flush()

except Exception as e:
    print("Error during image processing:", e)
    print(json.dumps({"error": "An error occurred during image processing", "exception": str(e)}))
    sys.stdout.flush()

def preprocess_image(image):
    # Add your image preprocessing steps here
    # Ensure the image is resized, normalized, and formatted according to the model requirements
    # Example: 
    resized_img = np.array(Image.fromarray(image).resize((300, 300)))
    normalized_img = resized_img / 255.0  # Normalize pixel values
    return normalized_img
