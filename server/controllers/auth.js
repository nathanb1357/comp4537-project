const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { passwordEmail } = require('./passwordEmail');
const db = require('../db/db');


/**
 * Middleware to authenticate JWT token in request header.
 * Checks if token exists, is valid or expired, allowing access to next route.
 */
function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).send('Access denied.');

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.status(403).send('Invalid token.');
      req.user = user; 
      next();
  });
}

/**
 * Register a new user in the database.
 * Hashes the password and checks if user email already exists.
 */
async function register(req, res) {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const userExistsQuery = 'SELECT * FROM User WHERE user_email = ?;';
    const insertUserQuery = 'INSERT INTO User (user_email, user_pass) VALUES (?, ?);';

    // Check if user with same email exists
    db.query(userExistsQuery, [email], (err, results) => {
        if (err) return res.status(500).send(`Database error: ${err}`); // Handle database error
        if (results.length) return res.status(409).send('User already exists'); // Email already registered

        db.query(insertUserQuery, [email, hashedPassword], (err) => {
            if (err) return res.status(500).send(`Database error: ${err}`); // Handle database error during insertion
            res.status(201).send('User registered successfully'); // Success response  
        });
    });
}

/**
 * Authenticates an existing user during login.
 * Verifies user credentials from the database, generates a JWT on success.
 */
async function login(req, res) {
    const { email, password } = req.body;
    const userQuery = 'SELECT * FROM User WHERE user_email = ?;';

    db.query(userQuery, [email], async (err, results) => {
        if (err) {
            return res.status(500).json({ error: `Database error: ${err}` }); 
        }
        if (!results.length) {
            return res.status(404).json({ error: 'User not found' }); 
        }

        const user = results[0];
        const validPassword = await bcrypt.compare(password, user.user_pass);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials: passwords do not match' }); 
        }

        // Generate a JWT token with user email and ID, valid for 1 hour
        const token = jwt.sign({ userId: user.user_id, email: user.user_email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    });
}

/**
 * Sends a password reset token via email to the user.
 * Generates a JWT token for password reset, stores it in the database with an expiry.
 */
async function resetPassword(req, res) {
    const { email } = req.params;

    const userQuery = 'SELECT * FROM User WHERE user_email = ?;';
    const tokenQuery = 'INSERT INTO ResetToken (token, user_id, expiry) VALUES (?, ?, ?);';

    try {
        const userResults = await new Promise((resolve, reject) => {
            db.query(userQuery, [email], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });

        if (!userResults.length) return res.status(200).send('If an account with that email exists, a reset email will be sent.'); // Generic message

        const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' });
        const expirationDate = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 1 day

        await new Promise((resolve, reject) => {
            db.query(tokenQuery, [token, userResults[0].user_id, expirationDate], (err) => {
                if (err) return reject(err);
                resolve();
            });
        });

        await passwordEmail(email, token);
        res.status(200).send('Password reset email sent successfully');
    } catch (err) {
        return res.status(500).send(`Database error: ${err}`);
    }
}
  

// /**
//  * Verifies a password reset token from the URL.
//  * Checks the token's validity and expiry date in the database.
//  */
// async function verifyToken(req, res) {
//     const { token } = req.params;
//     const tokenQuery = 'SELECT * FROM ResetToken WHERE token = ?;';
    
//     db.query(tokenQuery, [token], (err, results) => {
//         if (err) return res.status(500).send(`Database error: ${err}`); // Handle database error
//         if (!results.length) return res.status(404).send('Token not found'); // Token not found in the database

//         const tokenObj = results[0]; // Get the token record
//         if (new Date(tokenObj.expiry) < new Date()) {
//             return res.status(403).send('Token expired'); // Token has expired
//         }

//         // Redirect to a specific page, passing the user's email as a query parameter
//         const userEmail = tokenObj.user_id; 
//         res.redirect(`/your-specific-page?email=${encodeURIComponent(userEmail)}`);
//     });
// }


/**
 * changes the password
 * 
 */
async function changePassword(req, res) {
    const { token, email, password } = req.body;

    try {
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        
        if (decoded.email !== email) {
            return res.status(403).send('Invalid token for the provided email');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userExistsQuery = 'SELECT * FROM User WHERE user_email = ?;';
        const updatePasswordQuery = 'UPDATE User SET user_pass = ? WHERE user_email = ?;';

        
        db.query(userExistsQuery, [email], (err, results) => {
            if (err) return res.status(500).send(`Database error: ${err}`);
            if (!results.length) return res.status(404).send('User not found');

            
            db.query(updatePasswordQuery, [hashedPassword, email], (err) => {
                if (err) return res.status(500).send(`Database error: ${err}`);
                res.status(200).send('Password changed successfully');
            });
        });
    } catch (err) {
        if (err instanceof jwt.JsonWebTokenError) {
            return res.status(401).send('Invalid or expired token');
        }
        return res.status(500).send(`Error verifying token: ${err.message}`);
    }
}

/**
 * Return user information base on the token
 * Excludes the password from the response
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

async function getAllUsers(req, res) {
    // Extract the token from the Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ message: 'Access token required' });

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if the role is admin
        const userRoleQuery = 'SELECT user_role FROM User WHERE user_id = ?;';
        db.query(userRoleQuery, [decoded.userId], (err, results) => {
            if (err) return res.status(500).json({ message: `Database error: ${err}` });
            if (!results.length || results[0].user_role !== 'admin') {
                return res.status(403).json({ message: 'Access denied' });
            }

            // Query to get all users, excluding passwords
            const allUsersQuery = 'SELECT user_id, user_email, user_role FROM User;';
            db.query(allUsersQuery, (err, users) => {
                if (err) return res.status(500).json({ message: `Database error: ${err}` });
                
                // Return all users' information, excluding passwords
                res.status(200).json(users);
            });
        });
    } catch (error) {
        res.status(403).json({ message: 'Invalid or expired token' });
    }
}

module.exports = { getAllUsers };

  
module.exports = { register, login, authenticateToken, resetPassword, getUserInfo, changePassword, getAllUsers };