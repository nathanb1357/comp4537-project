const jwt = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail')


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


module.exports = { authenticateToken, passwordEmail }