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

async function listStorageBuckets() {
  try {
    const [buckets] = await storage.getBuckets();
    console.log('Buckets:');
    buckets.forEach(bucket => {
      console.log(bucket.name);
    });
  } catch (error) {
    console.error('Error listing buckets:', error);
  }
}

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

    // Convert uploaded image data to base64 string
    const imageBuffer = req.file.buffer.toString('base64');
    
    // Pass uploaded image data to the Python script
   const pythonProcess = spawn('python', ['process_image.py']);

  const jsonData = {
    userId: req.body.userId,
    image: req.file.buffer.toString('base64'),
};

pythonProcess.stdin.write(JSON.stringify(jsonData));
pythonProcess.stdin.end();
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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get file route
app.get('/files/:id', async (req, res) => {
  try {
    const fileId = req.params.id;
    if (!fileId) {
      return res.status(400).json({ error: 'File ID is required' });
    }

    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const fileDownload = storage.bucket('e-class-file-upload.appspot.com').file(file.filename);
    const stream = fileDownload.createReadStream();

    stream.on('error', (error) => {
      console.error('Error during file download:', error);
      res.status(500).json({ error: 'An error occurred during file download' });
    });

    stream.pipe(res);
  } catch (error) {
    console.error('Error during file retrieval:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

// User check route
app.post('/usercheck', async (req, res) => {
  try {
    const { userId, passWord, authenticated } = req.body;
    if (!userId || (!authenticated && !passWord)) {
      return res.status(400).json({ error: 'User ID and password are required' });
    }

    if (authenticated) {
      const userExists = await User.exists({ userId });
      res.json({ user: userExists });
    } else {
      const user = await User.findOne({ userId, password: passWord });
      res.json({ user: !!user });
    }
  } catch (error) {
    console.error('Error during user check:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

// User registration route
app.post('/register', async (req, res) => {
  try {
    const { userId, name, password, age, bloodGroup } = req.body;
    if (!userId || !name || !password || !age || !bloodGroup) {
      return res.status(400).json({ error: 'All fields are required for registration' });
    }

    const existingUser = await User.findOne({ userId });
    if (existingUser) {
      return res.json({ 'user-created': false, 'existing-user': true });
    }

    const newUser = new User({
      userId,
      name,
      password,
      age,
      bloodGroup
    });

    await newUser.save();
    res.json({ 'user-created': true, 'existing-user': false });
  } catch (error) {
    console.error('Error during user registration:', error);
    res.status(500).json({ 'user-created': false, error: 'An unexpected error occurred' });
  }
});

// Update user's name
app.put('/users/:userId/name', async (req, res) => {
  try {
    const { userId } = req.params;
    const { name } = req.body;
    if (!userId || !name) {
      return res.status(400).json({ error: 'User ID and name are required' });
    }

    const updatedUser = await User.findOneAndUpdate(
      { userId },
      { $set: { name } },
      { new: true }
    );

    res.json({ updatedUser });
  } catch (error) {
    console.error('Error during updating user name:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

// Update user's password
app.put('/users/:userId/password', async (req, res) => {
  try {
    const { userId } = req.params;
    const { password } = req.body;
    if (!userId || !password) {
      return res.status(400).json({ error: 'User ID and password are required' });
    }

    const updatedUser = await User.findOneAndUpdate(
      { userId },
      { $set: { password } },
      { new: true }
    );

    res.json({ updatedUser });
  } catch (error) {
    console.error('Error during updating user password:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

// Update user's age
app.put('/users/:userId/age', async (req, res) => {
  try {
    const { userId } = req.params;
    const { age } = req.body;
    if (!userId || !age) {
      return res.status(400).json({ error: 'User ID and age are required' });
    }

    const updatedUser = await User.findOneAndUpdate(
      { userId },
      { $set: { age } },
      { new: true }
    );

    res.json({ updatedUser });
  } catch (error) {
    console.error('Error during updating user age:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

// Update user's blood group
app.put('/users/:userId/bloodgroup', async (req, res) => {
  try {
    const { userId } = req.params;
    const { bloodGroup } = req.body;
    if (!userId || !bloodGroup) {
      return res.status(400).json({ error: 'User ID and blood group are required' });
    }

    const updatedUser = await User.findOneAndUpdate(
      { userId },
      { $set: { bloodGroup } },
      { new: true }
    );

    res.json({ updatedUser });
  } catch (error) {
    console.error('Error during updating user blood group:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// List storage buckets
listStorageBuckets();
