const express = require('express');
const bodyParser = require('body-parser');
const tf = require('@tensorflow/tfjs-node');

const app = express();
const port = 3000;

// Body parser middleware to parse JSON body
app.use(bodyParser.json({ limit: '50mb' }));

// Example route for image upload
app.post('/predict', async (req, res) => {
  try {
    // Get the image data from the request
    const imageData = req.body.imageData;

    // Validate input data
    if (!imageData) {
      throw new Error('Image data is missing');
    }

    // Load the model
    const model = await tf.loadLayersModel('file://trained.h5');
    
    // Preprocess the image data
    const tensorData = preprocessImageData(imageData);

    // Run prediction with the model
    const result = model.predict(tensorData);

    // Convert result to JSON format or any other desired format
    const predictionResult = processPredictionResult(result);

    // Send the prediction result back to the frontend
    res.json({ prediction: predictionResult });
  } catch (error) {
    // Handle errors
    console.error('Prediction error:', error);
    res.status(500).json({ error: 'An error occurred during prediction' });
  }
});

// Example function to preprocess image data
function preprocessImageData(imageData) {
  // Convert base64 image data to tensor
  const buffer = Buffer.from(imageData, 'base64');
  const tensorData = tf.node.decodeImage(buffer, 3); // Assuming RGB image with 3 channels
  return tensorData;
}

// Example function to process prediction result
function processPredictionResult(result) {
  // Process the result as needed (example)
  const predictionResult = result.dataSync(); // Get data from tensor
  return predictionResult;
}

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
