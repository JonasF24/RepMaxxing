const nodemailer = require('nodemailer');

// Create a Nodemailer transporter using env vars (set EMAIL_USER and EMAIL_PASS in .env)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    }
});

// Function to send verification email
const sendVerificationEmail = (to, verificationCode) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject: 'Your RepMax verification code',
        text: `Your verification code is: ${verificationCode}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log('Email error:', error);
        }
        console.log('Email sent: ' + info.response);
    });
};

// Placeholder function for sending SMS
const sendVerificationSMS = (phoneNumber, message) => {
    // TODO: Implement SMS sending functionality (e.g., via Twilio)
    console.log(`SMS sent to ${phoneNumber}: ${message}`);
};

module.exports = { sendVerificationEmail, sendVerificationSMS };