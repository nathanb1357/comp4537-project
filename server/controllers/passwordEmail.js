const sgMail = require('@sendgrid/mail')

async function passwordEmail(email, token) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    const msg = {
      to: email,
      from: process.env.GMAIL_USER, 
      templateId: process.env.RECOVERY_TMEPLATE_EMAIL_ID, 
      dynamicTemplateData: {
        "url": `google.com?token=${token}`, 
      },
    };
      sgMail.send(msg)
        .then(() => {
          console.log('Email sent')
        })
        .catch((error) => {
          console.error(error)
        })
}

module.exports = {
    passwordEmail
}
