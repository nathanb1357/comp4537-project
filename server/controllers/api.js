const db = require('../db/db');
const multer = require('multer');
const { exec } = require('child_process');
const upload = multer({ dest: '../uploads/' });


// Middleware to handle image uploads
exports.uploadImage = upload.single('image');


// Define the predictImage function
exports.predictImage = (req, res) => {
  const imagePath = req.file.path;

  exec(`python server/model/model.py ${imagePath}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error}`);
      res.status(500).send('Server error');
      return;
    }

    res.json({ prediction: stdout.trim() });
  });
};
