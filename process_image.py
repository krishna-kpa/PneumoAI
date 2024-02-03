import sys
import json
import subprocess
import base64
import numpy as np
from tensorflow.keras.models import load_model
from PIL import Image
import io

try:
    print("Image processing...")
    # Load the image data from Node.js
    image_data = json.loads(sys.stdin.readline())
    # Convert base64 encoded image data to numpy array
    image_bytes = base64.b64decode(image_data['image'])
    image = np.array(Image.open(io.BytesIO(image_bytes)))

    # Install required Python packages
    subprocess.run(['pip', 'install', 'numpy', 'tensorflow', 'Pillow'])

    # Reload numpy after installation
    import numpy as np

    # Load the TensorFlow model
    model = load_model('trained.h5')  # Replace 'trained.h5' with your model file path

    # Perform inference
    predictions = model.predict(np.expand_dims(image, axis=0))

    # Convert predictions to JSON or any other suitable format
    output = predictions.tolist()

    # Send the output back to Node.js
    print(json.dumps(output))
    sys.stdout.flush()

except json.JSONDecodeError as e:
    print("Error: Invalid JSON format:", e)
    sys.stdout.flush()

except Exception as e:
    print("Error during image processing:", e)
    print(json.dumps({"error": "An error occurred during image processing", "exception": str(e)}))
    sys.stdout.flush()
