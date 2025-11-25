const brevo = require('@getbrevo/brevo');
const { BREVO_API_KEY } = require('./env');

// Initialize Brevo API
const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  BREVO_API_KEY
);

// Send Email Function with attachment support
async function sendEmail({ to, subject, html, text, from, fromName, replyTo, attachment }) {
  try {
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = html;
    sendSmtpEmail.textContent = text || '';
    sendSmtpEmail.sender = { 
      email: from || 'noreply@yourdomain.com', 
      name: fromName || "AutoHR" 
    };
    sendSmtpEmail.to = [{ email: to }];
    
    // Add replyTo if provided
    if (replyTo) {
      sendSmtpEmail.replyTo = { email: replyTo };
    }

    // Add attachment if provided (base64 format)
    if (attachment && Array.isArray(attachment)) {
      sendSmtpEmail.attachment = attachment;
    }

    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Email sent successfully via Brevo API');
    console.log(`📧 Sent to: ${to}`);
    console.log(`📎 Attachment: ${attachment ? 'Yes' : 'No'}`);
    
    return response;
  } catch (error) {
    console.error('❌ Brevo email send error:', error.message);
    console.error('Full error:', error);
    throw error;
  }
}

// Test connection (optional)
async function testBrevoConnection() {
  try {
    const accountApi = new brevo.AccountApi();
    accountApi.setApiKey(
      brevo.AccountApiApiKeys.apiKey,
      BREVO_API_KEY
    );
    const account = await accountApi.getAccount();
    console.log('✅ Brevo API connected successfully');
    console.log(`📧 Account: ${account.email}`);
    return true;
  } catch (error) {
    console.error('❌ Brevo API connection error:', error.message);
    return false;
  }
}

module.exports = { sendEmail, testBrevoConnection };