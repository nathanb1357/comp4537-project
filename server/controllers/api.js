const db = require("../db/db");
const multer = require("multer");
const { exec } = require("child_process");
const fs = require('fs');
const path = require('path');

const uploadPath = path.join(__dirname, "..", "model", "uploads");

// Check if the directory exists, create it if not
if (!fs.existsSync(uploadPath)) { fs.mkdirSync(uploadPath, { recursive: true }) }


// Configure multer to save files in the upload directory with a unique name
const storage = multer.diskStorage({
  destination: (req, file, cb) => {cb(null, uploadPath)},
  filename: (req, file, cb) => {cb(null, `${Date.now()}-${file.originalname}`)}
});

const upload = multer({ storage: storage });


// ---------------------------------------------------------------- ENDPOINTS -----------------------------------------------------------------------------


/**
 * Return user information based on the token.
 * Excludes the password from the response.
 */
async function getUserInfo(req, res) {
  const { userId } = req.user; 
  const userQuery = 'SELECT user_id, user_email, user_calls, user_role FROM User WHERE user_id = ?;';

  db.query(userQuery, [userId], (err, results) => {
      if (err) return res.status(500).send(`Database error: ${err}`); 
      if (!results.length) return res.status(404).send('User not found'); 

      const user = results[0];
      delete user.user_pass; // Remove password from the response
      res.json(user);
  });
}

/**
 * Get information about all users in the system.
 * Requires admin privilages to access.
 */
async function getAllUsers(req, res) {
  // Extract the token from the Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'Access token required' });

  try { 
      const decoded = jwt.verify(token, process.env.JWT_SECRET);     
      const userRoleQuery = 'SELECT user_role FROM User WHERE user_id = ?;';

      db.query(userRoleQuery, [decoded.userId], (err, results) => {
          if (err) return res.status(500).json({ message: `Database error: ${err}` });
          if (!results.length || results[0].user_role !== 'admin') {
              return res.status(403).json({ message: 'Access denied' });
          }

          const allUsersQuery = 'SELECT user_id, user_email, user_calls, user_role FROM User;';
          db.query(allUsersQuery, (err, users) => {
              if (err) return res.status(500).json({ message: `Database error: ${err}` });
              res.status(200).json(users);
          });
      });
  } catch (error) {
      res.status(403).json({ message: 'Invalid or expired token' });
  }
}


/**
 * Upload an image file to a specified folder and update the user's image path in the database.
 * If a previous image exists, it will be deleted from the server.
 * Returns a success message upon successful upload and database update.
 */
const uploadImage = (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded");
  const newImagePath = path.join(uploadPath, req.file.filename);
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


/**
 * Predict the contents of the user's uploaded image using an external Python model.
 * Retrieves the stored image path, then runs a prediction command with the Python script.
 * Returns prediction results in JSON format, including predicted class and confidences.
 */
const predictImage = (req, res) => {
  const { userId } = req.user;

  const query = 'SELECT user_image FROM User WHERE user_id = ?';
  db.query(query, [userId], (err, results) => {
    if (err) return res.status(500).send(`Database error: ${err}`);
    if (!results.length || !results[0].user_image) return res.status(404).send('No image found for prediction');

    const imagePath = results[0].user_image;

    // Step 2: Run the prediction command with the retrieved image path
    exec(`python3 server/model/model.py ${imagePath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Prediction error: ${error}`);
        return res.status(500).send(`Server error ${error}`);
      }

      try {
        // Parse the JSON output from Python
        const predictionResult = JSON.parse(stdout.trim());
        
        res.json({
          predicted_class: predictionResult.predicted_class,
          confidence: predictionResult.confidence,
          class_confidences: predictionResult.class_confidences
        });
      } catch (parseError) {
        console.error(`Parse error: ${parseError}`);
        res.status(500).send('Failed to parse prediction output');
      }
    });
  });
}



const getApiStats = (req, res) => {

}


const deleteUser = (req, res) => {
  
}


const editUser = (req, res) => {

}


module.exports = { upload, uploadImage, predictImage, getUserInfo, getAllUsers, getApiStats, deleteUser, editUser };