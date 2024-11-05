const db = require("../db/db");
const multer = require("multer");
const { exec } = require("child_process");

const uploadPath = path.join(__dirname, "..", "model", "uploads");


// Configure multer to save files in the upload directory with a unique name
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });


// Uploads file to folder and stores a reference to it's path in the User table
const uploadImage = (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded");
  const newImagePath = `${uploadPath}${req.file.filename}`;
  const { userId } = req.user;

  const selectQuery = "SELECT user_image FROM User WHERE user_id = ?";
  db.query(selectQuery, [userId], (err, results) => {
    if (err) return res.status(500).send(`Database error: ${err}`);
    const oldImagePath = results[0]?.user_image;

    // Step 2: Delete the previous image file if it exists
    if (oldImagePath && fs.existsSync(oldImagePath)) {
      fs.unlink(oldImagePath, (unlinkErr) => {
        if (unlinkErr) console.error(`Error deleting old image: ${unlinkErr}`);
      });
    }

    // Step 3: Update the user's image path in the database
    const updateQuery = "UPDATE User SET user_image = ? WHERE user_id = ?";
    db.query(updateQuery, [newImagePath, userId], (updateErr) => {
      if (updateErr)
        return res.status(500).send(`Database error: ${updateErr}`);
      res.status(200).send("Image uploaded successfully");
    });
  });
};



const predictImage = (req, res) => {
  const { userId } = req.user;

  const query = 'SELECT user_image FROM User WHERE user_id = ?';
  db.query(query, [userId], (err, results) => {
    if (err) return res.status(500).send(`Database error: ${err}`);
    if (!results.length || !results[0].user_image) return res.status(404).send('No image found for prediction');

    const imagePath = results[0].user_image;

    // Step 2: Run the prediction command with the retrieved image path
    exec(`python server/model/model.py ${imagePath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Prediction error: ${error}`);
        return res.status(500).send(`Server error ${error}`);
      }

      res.json({ prediction: stdout.trim() });
    });
  });
}


module.exports = { upload, uploadImage, predictImage };