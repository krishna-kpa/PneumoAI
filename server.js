const express = require('express');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');
const { spawn } = require('child_process');

const app = express();
const port = 3000;
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb+srv://admin_kp:admin123@cluster0.hlr4lt7.mongodb.net/PneumoAI?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('Failed to connect to MongoDB:', error));

// Define schemas and models
const fileSchema = new mongoose.Schema({
  filename: String,
  mimetype: String,
  size: Number,
}, { collection: 'files' });

const File = mongoose.model('File', fileSchema);

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  bloodGroup: {
    type: String,
    required: true,
  },
}, { collection: 'users' });

const User = mongoose.model('User', userSchema);

// Authenticate with Google Cloud Storage
const storage = new Storage({
  projectId: 'e-class-file-upload', // Replace with your actual Google Cloud project ID
  keyFilename: path.join(__dirname, 'e-class-file-upload-firebase-adminsdk-5yx1f-ee3142614f.json'), // Provide the relative path to the JSON key file
});

// Initialize Firebase Admin SDK
const serviceAccount = require('./e-class-file-upload-firebase-adminsdk-5yx1f-ee3142614f.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Configure multer storage
const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });

// Upload route
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const userId = req.body.userId;
    console.log("Request for upload received");
    const timestamp = Date.now(); 
    const uniqueFilename = `${userId}-${timestamp}`;
    const newFile = new File({
      filename: uniqueFilename,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    const savedFile = await newFile.save();

    const fileUpload = storage.bucket('e-class-file-upload.appspot.com').file(uniqueFilename);
    const stream = fileUpload.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    stream.on('error', (error) => {
      res.status(500).json({ error: error.message });
    });

    stream.on('finish', async () => {
      // Process image using Python CNN model
      const pythonProcess = spawn('python', ['process_image.py', savedFile.filename]);
      
      let modelOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        console.log(`Python model output: ${data}`);
        modelOutput += data;
      });

      pythonProcess.stderr.on('data', (data) => {
        console.error(`Python model error: ${data}`);
      });

      pythonProcess.on('close', (code) => {
        console.log(`Python model process exited with code ${code}`);
        // Send the model output back to the client as JSON response
        res.json({ fileId: savedFile._id, message: 'Image uploaded and processed successfully', modelOutput });
      });
    });

    stream.end(req.file.buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get file route
app.get('/files/:id', async (req, res) => {
  try {
    const fileId = req.params.id;
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const fileDownload = storage.bucket('e-class-file-upload.appspot.com').file(file.filename);
    const stream = fileDownload.createReadStream();

    stream.on('error', (error) => {
      res.status(500).json({ error: error.message });
    });

    stream.pipe(res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User check route
app.post('/usercheck', async (req, res) => {
  try {
    const { userId, passWord, authenticated } = req.body;
  
    // Check if the request is authenticated
    if (authenticated) {
      // If authenticated is true, check if the userId exists in the database
      const userExists = await User.exists({ userId });
      res.json({ user: userExists });
    } else {
      // If authenticated is false, check if the userId and password match
      const user = await User.findOne({ userId, password: passWord });
      res.json({ user: !!user });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User registration route
app.post('/register', async (req, res) => {
    try {
      const { userId, name, password, age, bloodGroup } = req.body;
  
      // Check if the user already exists
      const existingUser = await User.findOne({ userId });
  
      if (existingUser) {
        // If the user already exists, return false indicating user creation failed
        res.json({ 'user-created': false,'existing-user':true });
      } else {
        // Create a new user
        const newUser = new User({
          userId,
          name,
          password,
          age,
          bloodGroup
        });
  
        // Save the new user to the database
        await newUser.save();
  
        // Return true indicating successful user creation
        res.json({ 'user-created': true,'existing-user':false  });
      }
    } catch (error) {
      res.status(500).json({ 'user-created': false, error: error.message,'existing-user':false  });
    }
  });
  
// User update routes...

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// List storage buckets
listStorageBuckets();
