import sys
import json
import subprocess
import base64
import io
from PIL import Image
import numpy as np
from tensorflow.keras.models import load_model

def preprocess_image(image):
    # Add your image preprocessing steps here
    # Ensure the image is resized, normalized, and formatted according to the model requirements
    # Example:
    resized_img = np.array(Image.fromarray(image).resize((300, 300)))
    normalized_img = resized_img / 255.0  # Normalize pixel values
    return normalized_img

def process_image(image_data):
    try:
        # Convert base64 encoded image data to numpy array
        image_bytes = base64.b64decode(image_data)
        image = np.array(Image.open(io.BytesIO(image_bytes)))

        # Load the TensorFlow model
        model = load_model('trained.h5')  # Replace 'trained.h5' with your model file path

        # Perform inference
        img = preprocess_image(image)
        predictions = model.predict(np.expand_dims(img, axis=0))

        # Convert predictions to JSON or any other suitable format
        output = predictions.tolist()

        return output

    except Exception as e:
        return {"error": "An error occurred during image processing", "exception": str(e)}

if __name__ == "__main__":
    try:
        print("Image processing...")
        # Load the image data from Node.js
        image_data = json.loads(sys.stdin.readline())

        # Check if 'image' key exists in the JSON data
        if 'image' not in image_data:
            raise KeyError("'image' key not found in JSON data")

        # Install required Python packages
        pip_command = ['pip', 'install', 'numpy', 'tensorflow', 'Pillow']
        pip_process = subprocess.Popen(pip_command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        pip_output, pip_error = pip_process.communicate()

        # Check if there were any errors during package installation
        if pip_process.returncode != 0:
            raise RuntimeError(f"Package installation failed with error: {pip_error.decode()}")

        # Reload numpy after installation
        import numpy as np
        from tensorflow.keras.models import load_model

        # Process the image
        model_output = process_image(image_data['image'])

        # Send the output back to Node.js
        print(json.dumps(model_output))
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
