const express = require('express');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');

const app = express();
const port = 3000;
app.use(express.json());
// Connect to MongoDB
mongoose.connect('mongodb+srv://admin_kp:admin123@cluster0.hlr4lt7.mongodb.net/PneumoAI?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('Failed to connect to MongoDB:', error));

const fileSchema = new mongoose.Schema({
  filename: String,
  mimetype: String,
  size: Number,
}, { collection: 'files' }); // Specify collection name as 'files'

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
}, { collection: 'users' }); // Specify collection name as 'users'

const User = mongoose.model('User', userSchema);

// Authenticate with ADC
const storage = new Storage({
  projectId: 'e-class-file-upload', // Replace with your actual Google Cloud project ID
  keyFilename: path.join(__dirname, 'e-class-file-upload-firebase-adminsdk-5yx1f-ee3142614f.json'), // Provide the relative path to the JSON key file
});

async function listStorageBuckets() {
  try {
    const [buckets] = await storage.getBuckets();
    console.log('Buckets:');
    buckets.forEach((bucket) => {
      console.log(`- ${bucket.name}`);
    });
  } catch (error) {
    console.error('Error listing storage buckets:', error);
  }
}

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
    console.log("req for upload received");
    const timestamp = Date.now(); 
    const uniqueFilename = `${userId}-${timestamp}`;
    const newFile = new File({
      fileorgname: req.file.originalname,
      filename:uniqueFilename,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    const savedFile = await newFile.save();// Get current timestamp

    const fileUpload = storage.bucket('e-class-file-upload.appspot.com').file(uniqueFilename);
    const stream = fileUpload.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    stream.on('error', (error) => {
      res.status(500).json({ error: error.message }); // Send error message as JSON response
    });

    stream.on('finish', async () => {
      res.json({ fileId: savedFile._id }); // Send file ID as JSON response
    });

    stream.end(req.file.buffer);
  } catch (error) {
    res.status(500).json({ error: error.message }); // Send error message as JSON response
  }
});

// Get file route
app.get('/files/:id', async (req, res) => {
  try {
    const fileId = req.params.id;
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' }); // Send error message as JSON response
    }

    const fileDownload = storage.bucket('e-class-file-upload.appspot.com').file(file.filename);
    const stream = fileDownload.createReadStream();

    stream.on('error', (error) => {
      res.status(500).json({ error: error.message }); // Send error message as JSON response
    });

    stream.pipe(res);
  } catch (error) {
    res.status(500).json({ error: error.message }); // Send error message as JSON response
  }
});

// User check route
app.get('/usercheck', (req, res) => {
// User check route
app.post('/usercheck', async (req, res) => {
    try {
      const { userID, passWord, authenticated } = req.body;
  
      // Check if the request is authenticated
      if (authenticated) {
        // If authenticated is true, check if the userID exists in the database
        const userExists = await User.exists({ userID });
        res.json({ user: userExists });
      } else {
        // If authenticated is false, check if the userID and password match
        const user = await User.findOne({ userID, passWord });
        res.json({ user: !!user }); // Convert user to boolean and send as response
      }
    } catch (error) {
      res.status(500).json({ error: error.message }); // Send error message as JSON response
    }
  });
  res.json({ message: 'User check successful' });
});
// user registeration
// Register route
app.post('/register', async (req, res) => {
    try {
      const { userId, name, password, age, bloodGroup } = req.body;
  
      // Check if the user already exists
      const existingUser = await User.findOne({ userId });
  
      if (existingUser) {
        // If the user already exists, return false indicating user creation failed
        res.json({ 'user-created': false,'existing-user':True });
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
      // If an error occurs, return false indicating user creation failed
      res.status(500).json({ 'user-created': false, error: error.message,'existing-user':false  });
    }
  });
  
// Updation operations

// Update user's name
app.put('/users/:userId/name', async (req, res) => {
    try {
      const { userId } = req.params;
      const { name } = req.body;
  
      // Find the user by userId and update the name
      const updatedUser = await User.findOneAndUpdate(
        { userId },
        { $set: { name } },
        { new: true } // Return the updated user
      );
  
      res.json({ updatedUser });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Update user's password
  app.put('/users/:userId/password', async (req, res) => {
    try {
      const { userId } = req.params;
      const { password } = req.body;
  
      // Find the user by userId and update the password
      const updatedUser = await User.findOneAndUpdate(
        { userId },
        { $set: { password } },
        { new: true } // Return the updated user
      );
  
      res.json({ updatedUser });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Update user's age
  app.put('/users/:userId/age', async (req, res) => {
    try {
      const { userId } = req.params;
      const { age } = req.body;
  
      // Find the user by userId and update the age
      const updatedUser = await User.findOneAndUpdate(
        { userId },
        { $set: { age } },
        { new: true } // Return the updated user
      );
  
      res.json({ updatedUser });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Update user's blood group
  app.put('/users/:userId/bloodgroup', async (req, res) => {
    try {
      const { userId } = req.params;
      const { bloodGroup } = req.body;
  
      // Find the user by userId and update the blood group
      const updatedUser = await User.findOneAndUpdate(
        { userId },
        { $set: { bloodGroup } },
        { new: true } // Return the updated user
      );
  
      res.json({ updatedUser });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
   

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// List storage buckets
listStorageBuckets();
