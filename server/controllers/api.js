const db = require("../db/db");
const multer = require("multer");
const { exec } = require("child_process");
const fs = require('fs');
const path = require('path');
const { editPassword } = require("./auth");

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
      if (err) return res.status(500).json({error: `Database error: ${err}`}); 
      if (!results.length) return res.status(404).json({error: 'User not found'}); 

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
  
  if (!token) return res.status(401).json({ error: 'Access token required' });

  try { 
      const decoded = jwt.verify(token, process.env.JWT_SECRET);     
      const userRoleQuery = 'SELECT user_role FROM User WHERE user_id = ?;';

      db.query(userRoleQuery, [decoded.userId], (err, results) => {
          if (err) return res.status(500).json({ error: `Database error: ${err}` });
          if (!results.length || results[0].user_role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
          }

          const allUsersQuery = 'SELECT user_id, user_email, user_calls, user_role FROM User;';
          db.query(allUsersQuery, (err, users) => {
              if (err) return res.status(500).json({ error: `Database error: ${err}` });
              res.status(200).json(users);
          });
      });
  } catch (error) {
      res.status(401).json({ error: 'Invalid or expired token' });
  }
}


/**
 * Upload an image file to a specified folder and update the user's image path in the database.
 * If a previous image exists, it will be deleted from the server.
 * Returns a success message upon successful upload and database update.
 */
const uploadImage = (req, res) => {
  if (!req.file) return res.status(400).json({error: "No file uploaded"});
  const newImagePath = path.join(uploadPath, req.file.filename);
  const { userId } = req.user;

  const selectQuery = "SELECT user_image FROM User WHERE user_id = ?";
  db.query(selectQuery, [userId], (err, results) => {
    if (err) return res.status(500).json({error: `Database error: ${err}`});
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
        return res.status(500).json({error: `Database error: ${updateErr}`});
      res.status(200).json({message: "Image uploaded successfully"});
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
    if (err) return res.status(500).json({error: `Database error: ${err}`});
    if (!results.length || !results[0].user_image) return res.status(404).json({error: 'No image found for prediction'});

    const imagePath = results[0].user_image;

    // Step 2: Run the prediction command with the retrieved image path
    exec(`python3 server/model/model.py ${imagePath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Prediction error: ${error}`);
        return res.status(500).json({error: `Server error ${error}`});
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
        res.status(500).json({error: 'Failed to parse prediction output'});
      }
    });
  });
}

/**
 * Returns statistics about all API usage from Endpoint table.
 * 
 */
const getApiStats = (req, res) => {
  const query = 'SELECT * FROM Endpoint;';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({error: `Database error: ${err}`});
    res.status(200).json(results);
  });
}

/**
 * Delete a user from the database.
 * Requires admin privilages to access.
 */
const deleteUser = (req, res) => {
  if (!req.user || req.user.user_role !== 'admin') {
    return res.status(403).send('Access denied');
  }
  const query = 'DELETE FROM User WHERE user_email = ?;';
  // Extract the email from the request body
  const { email } = req.body;
  db.query(query, [email], (err) => {
    if (err) return res.status(500).send(`Database error: ${err}`);
    res.status(200).send('User deleted successfully');
  });
}

/**
 * change password of a user
 */

const editPassword = async (req, res) => {
  try{ 
    const { userId } = req.user;
    const { password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'UPDATE User SET user_pass = ? WHERE user_id = ?;';
    db.query(query, [hashedPassword, userId], (err) => {
      if (err) return res.status(500).send(`Database error: ${err}`);
      res.status(200).send('Password updated successfully');
    });
  } catch (err) {
    return res.status(500).send(`internal server error: ${err}`);
  }

}

/**
 * Allow admin to change roles of other users
 */
const editRole = async (req, res) => {
  //check if user is admin
  if (req.user.user_role !== 'admin') {
    return res.status(403).send('Access denied');
  }
  const { email, role } = req.body;
  const query = 'UPDATE User SET user_role = ? WHERE user_email = ?;';
  db.query(query, [role, email], (err) => {
    if (err) return res.status(500).send(`Database error: ${err}`);
    res.status(200).send('Role updated successfully');
  });
}


module.exports = { upload, uploadImage, predictImage, getUserInfo, getAllUsers, getApiStats, deleteUser, editPassword, editRole };