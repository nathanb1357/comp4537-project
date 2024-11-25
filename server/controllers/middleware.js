const jwt = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail')
const db = require('../db/db');


/**
 * Middleware to authenticate http only JWT tokens.
 */
function authenticateToken(req, res, next) {
    console.log(req.cookies);
    const token = req.cookies?.['token'];
    if (!token) return res.status(401).json({error: 'Access denied. No token provided.'});

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({error: 'Invalid token.'});
        req.user = user;
        next();
    });
}


/**
 * Middleware that sends an email to the user to reset their password.
 */
async function passwordEmail(email, token) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    const msg = {
        to: email,
        from: process.env.GMAIL_USER, 
        templateId: process.env.RECOVERY_TMEPLATE_EMAIL_ID, 
        dynamicTemplateData: {
            "url": `${process.env.BASE_URL}resetPassword.html?token=${token}&email=${email}`
        },
    };
    try {
        await sgMail.send(msg);
        console.log('Email sent');
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Email not sent'); // Propagate error back to the caller
    }
}


/**
 * Increment call value in the Endpoint table based on successful request completion
 */
function incrementEndpointCalls(req) {
    return new Promise((resolve, reject) => {
        const endpoint = req.originalUrl.split('?')[0]; // Extract the endpoint path without query parameters
        const method = req.method;
        console.log(`Endpoint called ${method}: ${endpoint}`);

        const updateQuery = 'UPDATE Endpoint SET endpoint_calls = endpoint_calls + 1 WHERE endpoint_path = ?';
        db.query(updateQuery, [endpoint], (err, results) => {
            if (err) {
                console.error(`Error updating call count for endpoint ${endpoint}:`, err);
                return reject(err);
            }

            // If the endpoint path doesn't exist in the table, insert it
            if (results.affectedRows === 0) {
                const insertQuery = 'INSERT INTO Endpoint (endpoint_path, endpoint_method) VALUES (?, ?)';
                db.query(insertQuery, [endpoint, method], (insertErr) => {
                    if (insertErr) {
                        console.error(`Error inserting new endpoint ${endpoint}:`, insertErr);
                        return reject(insertErr);
                    }
                    resolve(); // Resolve once the insert query completes
                });
            } else {
                resolve(); // Resolve if the update query was successful
            }
        });
    });
}



/**
 * Increases the amount of calls a user has requested
 */
function incrementUserCalls(req) {
    return new Promise((resolve, reject) => {
        const { userId } = req.user;
        const updateQuery = `UPDATE User SET user_calls = user_calls + 1 WHERE user_id = ?`;

        db.query(updateQuery, [userId], (err, results) => {
            if (err) {
                console.error(`Error updating call count for user ${userId}:`, err);
                return reject(new Error('Database error occurred.'));
            }

            resolve();
        });
    });
}


module.exports = { authenticateToken, passwordEmail, incrementEndpointCalls, incrementUserCalls }