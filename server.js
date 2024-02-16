const express = require('express');
const bodyParser = require('body-parser');
const tf = require('@tensorflow/tfjs-node');
const fs = require('fs').promises;

const app = express();
const port = 3000;

// Load the trained model
let model;
(async () => {
    try {
        model = await tf.loadLayersModel('file://trained.h5');
        console.log('Model loaded');
    } catch (error) {
        console.error('Error loading model:', error);
    }
})();

// Middleware to parse JSON body
app.use(bodyParser.json({ limit: '50mb' }));

// Route to handle image upload and prediction
app.post('/predict', async (req, res) => {
    try {
        // Get the image data from the request
        const imageData = req.body.imageData;

        // Validate input data
        if (!imageData) {
            throw new Error('Image data is missing');
        }

        // Convert base64 image data to buffer
        const buffer = Buffer.from(imageData, 'base64');

        // Write buffer to a temporary file
        const tempImagePath = 'temp-image.jpg'; // Choose a temporary file name
        await fs.writeFile(tempImagePath, buffer);

        // Preprocess the image
        const img = await preprocessImage(tempImagePath);

        // Run prediction with the model
        const prediction = model.predict(img);

        // Get the predicted class
        const predictedClassIndex = prediction.argMax(1).dataSync()[0];

        // Respond with prediction result
        res.json({ predictedClassIndex });
    } catch (error) {
        console.error('Prediction error:', error);
        res.status(500).json({ error: 'An error occurred during prediction' });
    }
});

// Function to preprocess image
async function preprocessImage(imagePath) {
    const img = await tf.node.decodeImage(await fs.readFile(imagePath), 3); // Assuming RGB image with 3 channels
    const resizedImg = tf.image.resizeBilinear(img, [300, 300]); // Resize image to match model input shape
    const expandedImg = resizedImg.expandDims(0); // Add batch dimension
    return expandedImg;
}

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
