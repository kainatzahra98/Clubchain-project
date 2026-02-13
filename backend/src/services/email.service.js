const nodemailer = require('nodemailer');

// Create transporter
let transporterConfig;

if (process.env.SMTP_USER && process.env.SMTP_USER.includes('gmail.com')) {
    transporterConfig = {
        service: 'gmail',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    };
} else if (process.env.SMTP_HOST) {
    transporterConfig = {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    };
} else {
    transporterConfig = {
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    };
}

const transporter = nodemailer.createTransport(transporterConfig);

/**
 * Send OTP email
 * @param {string} to - Recipient email
 * @param {string} otp - OTP code
 */
const sendOtpEmail = async (to, otp) => {
    // Check if credentials are missing or dummy
    const isMockCreds = !process.env.SMTP_USER || process.env.SMTP_USER === 'dummy' || !process.env.SMTP_PASS || process.env.SMTP_PASS === 'dummy';

    // If no real email credentials, log OTP to console only (Dev mode)
    if (isMockCreds) {
        console.log(`\n==================================================`);
        console.log(`[DEV MODE] OTP for ${to}: ${otp}`);
        console.log(`To send real emails, configure SMTP_USER and SMTP_PASS in .env`);
        console.log(`==================================================\n`);
        return;
    }

    const mailOptions = {
        from: process.env.SMTP_USER || process.env.EMAIL_USER,
        to,
        subject: 'Your Clubchain Verification Code',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Verify Your Account</h2>
                <p>Thank you for registering with Clubchain. Please use the verification code below to complete your registration:</p>
                <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold; border-radius: 5px;">
                    ${otp}
                </div>
                <p>This code will expire in 10 minutes.</p>
                <p>If you didn't request this code, please ignore this email.</p>
            </div>
        `
    };

    console.log(`Attempting to send email via ${transporterConfig.host || transporterConfig.service}...`);
    console.log(`From: ${mailOptions.from}`);
    console.log(`To: ${to}`);

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`OTP email sent to ${to}`);
        console.log(`Message ID: ${info.messageId}`);
    } catch (error) {
        console.error('Error sending email:', error);
        // Fallback for dev/testing even if config exists but fails
        console.log(`[FALLBACK (Error)] OTP for ${to}: ${otp}`);
        throw new Error('Email could not be sent');
    }
};

/**
 * Send support request email
 * @param {string} userEmail - User's email
 * @param {string} message - User's message
 */
const sendSupportEmail = async (userEmail, message) => {
    const isMockCreds = !process.env.SMTP_USER || process.env.SMTP_USER === 'dummy' || !process.env.SMTP_PASS || process.env.SMTP_PASS === 'dummy';

    const mailOptions = {
        from: process.env.SMTP_USER || process.env.EMAIL_USER,
        to: 'clubchain209@gmail.com',
        subject: `Support Request from ${userEmail}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">New Support Request</h2>
                <p><strong>From:</strong> ${userEmail}</p>
                <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin-top: 10px;">
                    ${message}
                </div>
            </div>
        `
    };

    if (isMockCreds) {
        console.log(`\n==================================================`);
        console.log(`[DEV MODE] Support Email to clubchain209@gmail.com`);
        console.log(`From: ${userEmail}`);
        console.log(`Message: ${message}`);
        console.log(`==================================================\n`);
        return;
    }

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Support email sent to clubchain209@gmail.com`);
    } catch (error) {
        console.error('Error sending support email:', error);
        throw new Error('Support email could not be sent');
    }
};

module.exports = {
    sendOtpEmail,
    sendSupportEmail
};
