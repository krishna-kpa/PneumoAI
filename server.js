const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const tf = require('@tensorflow/tfjs-node');
const fs = require('fs').promises;
const { spawn } = require('child_process');

const app = express();
const port = 3000;

// Configure multer to handle file uploads
const upload = multer({ dest: 'uploads/' });

// Middleware to parse JSON body
app.use(bodyParser.json({ limit: '50mb' }));

// Route to handle image upload and prediction
app.post('/predict', upload.single('image'), async (req, res) => {
    try {
        // Get the uploaded image file path
        const tempImagePath = req.file.path;

        // Call Python script for prediction
        const pythonProcess = spawn('python', ['predict.py', tempImagePath]);

        // Handle output from the Python script
        pythonProcess.stdout.on('data', (data) => {
            const predictedClassIndex = data.toString().trim();
            res.json({ predictedClassIndex });
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error('Python script error:', data.toString());
            res.status(500).json({ error: 'An error occurred during prediction' });
        });
    } catch (error) {
        console.error('Prediction error:', error);
        res.status(500).json({ error: 'An error occurred during prediction' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
