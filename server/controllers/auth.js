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
        if (err) return res.status(500).send('Database error', err); // Handle database error
        if (results.length) return res.status(409).send('User already exists'); // Email already registered

        db.query(insertUserQuery, [email, hashedPassword], (err) => {
            if (err) return res.status(500).send('Database error', err); // Handle database error during insertion
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
        if (err) return res.status(500).send('Database error', err); // Handle database error
        if (!results.length) return res.status(404).send('User not found'); // No user found with the provided email
    
        const user = results[0];
        const validPassword = await bcrypt.compare(password, user.user_pass);
        if (!validPassword) return res.status(401).send('Invalid credentials: passwords dont match'); // Password does not match
    
        // Generate a JWT token with user email and ID, valid for 1 hour
        const token = jwt.sign({ userId: user.user_id, email: user.user_email }, jwtSecret, { expiresIn: '1h' });
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

    db.query(userQuery, [email], (err, results) => {
        if (err) return res.status(500).send('Database error', err); // Handle database error
        if (!results.length) return res.status(404).send('User not found'); // No user found with the provided email
    
        const token = jwt.sign({ email }, jwtSecret, { expiresIn: '1d' });
        const expirationDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 1 day

        db.query(tokenQuery, [token, results[0].user_id, expirationDate], (err) => {
            if (err) return res.status(500).send('Database error', err); // Handle database error
            passwordEmail(email, token);

            res.status(200).send('Password reset successfully');
        });
    }); 
}
  

/**
 * Verifies a password reset token from the URL.
 * Checks the token's validity and expiry date in the database.
 */
async function verifyToken(req, res) {
    const { token } = req.params;
    const tokenQuery = 'SELECT * FROM ResetToken WHERE token = ?;';
    
    db.query(tokenQuery, [token], (err, results) => {
        if (err) return res.status(500).send('Database error', err); // Handle database error
        if (!results.length) return res.status(404).send('Token not found'); // Token not found in the database

        const tokenObj = results[0]; // Get the token record
        if (new Date(tokenObj.expiry) < new Date()) {
            return res.status(403).send('Token expired'); // Token has expired
        }

        // Redirect to a specific page, passing the user's email as a query parameter
        const userEmail = tokenObj.user_id; 
        res.redirect(`/your-specific-page?email=${encodeURIComponent(userEmail)}`);
    });
}

  
module.exports = { register, login, authenticateToken, resetPassword, verifyToken };