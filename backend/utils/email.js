const nodemailer = require('nodemailer');

// Create a Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail', // e.g., Gmail
    auth: {
        user: 'your-email@gmail.com', // Your email address
        pass: 'your-email-password' // Your email password
    }
});

// Function to send verification email
const sendVerificationEmail = (to, verificationLink) => {
    const mailOptions = {
        from: 'your-email@gmail.com',
        to,
        subject: 'Please verify your email',
        text: `Click the link to verify your email: ${verificationLink}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Email sent: ' + info.response);
    });
};

// Placeholder function for sending SMS
const sendVerificationSMS = (phoneNumber, message) => {
    // TODO: Implement SMS sending functionality
    console.log(`SMS sent to ${phoneNumber}: ${message}`);
};

module.exports = { sendVerificationEmail, sendVerificationSMS };