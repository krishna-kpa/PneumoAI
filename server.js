// Upload route
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
      console.log("req for upload received");
      const timestamp = Date.now(); 
      const uniqueFilename = `${timestamp}-${req.file.originalname}`;
      const newFile = new File({
        fileorgname: req.file.originalname,
        filename:uniqueFilename,
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
        // If an error occurs during upload, send the error message as response
        res.status(500).json({ error: error.message });
      });
  
      stream.on('finish', async () => {
        res.json(savedFile._id);
      });
  
      stream.end(req.file.buffer);
    } catch (error) {
      // If an error occurs during processing, send the error message as response
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
        // If an error occurs during download, send the error message as response
        res.status(500).json({ error: error.message });
      });
  
      stream.pipe(res);
    } catch (error) {
      // If an error occurs during processing, send the error message as response
      res.status(500).json({ error: error.message });
    }
  });
  