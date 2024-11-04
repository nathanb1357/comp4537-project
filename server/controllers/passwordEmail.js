const sgMail = require('@sendgrid/mail')
require('dotenv').config({ path: '../.env' });

async function passwordEmail(email, token) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    const msg = {
      to: email,
      from: process.env.GMAIL_USER, 
      templateId: process.env.RECOVERY_TMEPLATE_EMAIL_ID, 
      dynamicTemplateData: {
        "url": `${process.env.BASE_URL}resetPassword.html/?token=${token}&email=${email}`, 
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

module.exports = {
    passwordEmail
}
