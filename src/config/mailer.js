const nodemailer = require('nodemailer');
const { MAIL_HOST, MAIL_PORT, MAIL_SECURE, MAIL_USER, MAIL_PASSWORD } = require('./env');

// Brevo / SMTP Transporter
const transporter = nodemailer.createTransport({
  host: MAIL_HOST,            // smtp-relay.brevo.com
  port: MAIL_PORT,            // 587
  secure: MAIL_SECURE === 'true' || MAIL_SECURE === true, // false for 587
  auth: {
    user: MAIL_USER,          // your Brevo login
    pass: MAIL_PASSWORD       // your Brevo SMTP key
  },
  // Timeout settings add pannunga - connection issues fix aagum
  connectionTimeout: 30000,   // 30 seconds (Render-la sometimes slow aagum)
  greetingTimeout: 30000,     // 30 seconds
  socketTimeout: 30000,       // 30 seconds
  // Optional: Render-la helpful aagum
  tls: {
    rejectUnauthorized: false // SSL certificate issues avoid pannanum
  }
});

// Verify SMTP Connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email configuration error:', error.message);
    console.error('Full error:', error);
  } else {
    console.log('✅ Email server ready to send messages!');
    console.log(`📧 Using Brevo SMTP: ${MAIL_USER}`);
  }
});

// Export Transporter
module.exports = transporter;