const db = require("../db/db");
const multer = require("multer");
const { exec } = require("child_process");
const fs = require('fs');
const path = require('path');
const { incrementEndpointCalls, incrementUserCalls } = require('./middleware');
const USER_LIMIT = 20;

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
 * Includes user ID, email, calls, and role.
 * Checks if user is over the USER_LIMIT and adds an overLimit field to the response.
 */
async function getUserInfo(req, res) {
  const { userId } = req.user; 
  const userQuery = 'SELECT user_id, user_email, user_calls, user_role FROM User WHERE user_id = ?;';

  try {
      // Convert db.query to a promise-based call
      const results = await new Promise((resolve, reject) => {
          db.query(userQuery, [userId], (err, results) => {
              if (err) return reject(err); 
              resolve(results);
          });
      });

      if (!results.length) {
          return res.status(404).json({ error: 'User not found' });
      }

      const user = results[0];
      user.overLimit = user.user_calls > USER_LIMIT; 

      try {
          await incrementEndpointCalls(req);
          await incrementUserCalls(req);
      } catch (incrementErr) {
          console.error(`Failed to increment endpoint calls: ${incrementErr.message}`);
      }

    
      res.json(user);
  } catch (err) {
      console.error('Error fetching user info:', err);
      res.status(500).json({ error: `Internal server error: ${err.message}` });
  }
}


/**
 * Get information about all users in the system.
 * Requires admin privilages to access.
 */
async function getAllUsers(req, res) {
  const { user_role } = req.user; 

  if (user_role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' }); // only admin
  }

  try {
    // Query to fetch all users
    const allUsersQuery = 'SELECT user_id, user_email, user_calls, user_role FROM User;';
    const users = await new Promise((resolve, reject) => {
      db.query(allUsersQuery, (err, results) => {
        if (err) return reject(err); // Reject promise if there's an error
        resolve(results); // Resolve with the results
      });
    });

    await incrementEndpointCalls(req);
    await incrementUserCalls(req);

    // Return the users as a response
    res.status(200).json(users);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}



/**
 * Upload an image file to a specified folder and update the user's image path in the database.
 * If a previous image exists, it will be deleted from the server.
 * Returns a success message upon successful upload and database update.
 */
const uploadImage = (req, res, next) => {
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
      next();
    });
  });
};


/**
 * Predict the contents of the user's uploaded image using an external Python model.
 * Retrieves the stored image path, then runs a prediction command with the Python script.
 * Returns prediction results in JSON format, including predicted class and confidences.
 */
const predictImage = async (req, res, next) => {
  const { userId } = req.user;
  const query = 'SELECT user_image FROM User WHERE user_id = ?';

  db.query(query, [userId], async (err, results) => {
    if (err) return res.status(500).json({error: `Database error: ${err}`});
    if (!results.length || !results[0].user_image) return res.status(404).json({error: 'No image found for prediction'});

    const imagePath = results[0].user_image;

    // Step 2: Run the prediction command with the retrieved image path
    exec(`python3 server/model/model.py ${imagePath}`, async (error, stdout, stderr) => {
      if (error) {
        console.error(`Prediction error: ${error}`);
        return res.status(500).json({error: `Server error ${error}`});
      }

      try {
        // Parse the JSON output from Python
        const predictionResult = JSON.parse(stdout.trim());

        try {
          await incrementEndpointCalls(req); 
          await incrementUserCalls(req);
        } catch (incrementErr) {
          console.error(`Failed to increment calls: ${incrementErr.message}`);
        }

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

};

/**
 * Returns statistics about all API usage from Endpoint table.
 * 
 */
const getApiStats = async (req, res) => {

  const role = req.user.user_role;
  if (role !== 'admin') {
    return res.status(403).json({error: 'Access denied'});
  }

  const query = 'SELECT * FROM Endpoint;';
  try {
    const results = await new Promise((resolve, reject) => {
      db.query(query, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });

    await incrementEndpointCalls(req);
    await incrementUserCalls(req);

    res.status(200).json(results);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: `Database error: ${err}` });
  }
}

/**
 * Delete a user from the database.
 * Requires admin privilages to access.
 */
const deleteUser = async (req, res, next) => {
  try {
    if (!req.user || req.user.user_role !== 'admin') {
      return res.status(403).json({error: 'Access denied'});
    }
    const query = 'DELETE FROM User WHERE user_email = ?;';
    
    const { email } = req.params;

    db.query(query, [email], async (err) => {
      if (err) return res.status(500).json({error: `Database error: ${err}`});
      try {
        await incrementEndpointCalls(req);
        await incrementUserCalls(req);
      } catch (incrementErr) {
        console.error(`Failed to increment calls: ${incrementErr.message}`);
      }
      res.status(200).json({message: 'User deleted successfully'});
    });
  }
  catch (err) {
    return res.status(500).json({error: `Internal server error: ${err}`});
  }

};


/**
 * change password of a user
 */

const editPassword = async (req, res, next) => {
  try{ 
    const { userId } = req.user;
    const { password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'UPDATE User SET user_pass = ? WHERE user_id = ?;';
    await new Promise((resolve, reject) => {
      db.query(query, [hashedPassword, userId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    try {
      await incrementEndpointCalls(req);
      await incrementUserCalls(req);
    } catch (incrementErr) {
      console.error(`Failed to increment calls: ${incrementErr.message}`);
    }
    res.status(200).json({message: 'Password updated successfully'});
  } catch (err) {
    return res.status(500).json({error: `Internal server error: ${err}`});
  }

  next();
}

/**
 * Allow admin to change roles of other users
 */
const editRole = async (req, res, next) => {
  //check if user is admin
  if (req.user.user_role !== 'admin') {
    return res.status(403).json({error: 'Admin permission required to edit role'});
  }
  
  const { email, role } = req.body;
  const query = 'UPDATE User SET user_role = ? WHERE user_email = ?;';

  db.query(query, [role, email], async (err) => {
    if (err) return res.status(500).json({error: `Database error: ${err}`});
    try {
      await incrementEndpointCalls(req);
      await incrementUserCalls(req);
    } catch (incrementErr) {
      console.error(`Failed to increment calls: ${incrementErr.message}`);
    }
    res.status(200).json({message: 'Role updated successfully'});
  });

  next();
}


module.exports = { upload, uploadImage, predictImage, getUserInfo, getAllUsers, getApiStats, deleteUser, editPassword, editRole };