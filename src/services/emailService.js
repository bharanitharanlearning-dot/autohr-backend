const { sendEmail: sendBrevoEmail } = require('../config/emailBrevo');
const { MAIL_USER } = require('../config/env');
const path = require('path');
const fs = require('fs').promises;

class EmailService {
  // Returns HTML email based on template type and user/company data
  static renderHtmlTemplate({ 
    company_name, hr_name, user_name, user_email, user_phone, user_linkedin, templateType = 'modern' 
  }) {
    if (templateType === 'modern') {
      return `<!DOCTYPE html>
      <html>
      <head>
        <style>
          body { background: #F4F6FC; font-family: 'Segoe UI',Arial,sans-serif; margin:0; padding:0; }
          .container { max-width: 540px; background: #fff; border-radius: 14px; box-shadow: 0 4px 24px rgba(96,58,234,0.07); margin:32px auto; overflow:hidden; border:1px solid #ececff;}
          .header { background: linear-gradient(90deg,#6334f8,#a958fd 60%); color: #fff; padding: 32px 28px 18px 28px; font-size: 24px; font-weight: 600; letter-spacing: 2px;}
          .content { padding: 26px 28px; font-size: 16px; color:#282553; line-height:1.7;}
          .btn { display:inline-block; margin-top:24px; background:#6334f8;color:#fff; font-weight:500; text-decoration:none; padding:12px 28px;border-radius:6px; font-size:16px; letter-spacing:1px;}
          .footer { background:#f5f3ff; color:#8a71d6; text-align:center;font-size:13px; padding:16px 8px;}
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            Application for ${company_name}
          </div>
          <div class="content">
            Dear ${hr_name || 'Hiring Manager'},<br><br>
            I am writing to express my interest in job opportunities at <b>${company_name}</b>.<br>
            My resume is attached for your review.<br><br>
            I look forward to connecting and discussing how my experience can add value to your team.<br>
            Thank you for your time and consideration.<br><br>
            Best Regards,<br>
            <b>${user_name}</b><br>
            <span style="font-size:13px; color:#6334f8;">
              ${user_email} | ${user_phone} | <a href="${user_linkedin}" style="color:#6334f8;">LinkedIn</a>
            </span>
            <a class="btn" href="mailto:${user_email}">Reply</a>
          </div>
          <div class="footer">
            Sent via AutoHR &mdash; Making job applications easy
          </div>
        </div>
      </body>
      </html>`;
    }
    if (templateType === 'corporate') {
      return `<!DOCTYPE html>
      <html>
      <head>
        <style>
          body {background:#f7f7fa; font-family:'Roboto',Arial,sans-serif; margin:0;padding:0;}
          .container { max-width:520px;background:#fff;border-radius:10px;box-shadow:0 2px 14px #eef1f4;margin:40px auto; border:1px solid #eaeaea;}
          .header {background:#1a2027;color:#fff;padding:20px 26px;font-size:24px;font-weight:600;}
          .content {padding:24px 26px;font-size:16px;color:#222842;line-height:1.7;}
          .footer {background:#ededf7;color:#7b7c8b;text-align:center;padding:14px 6px;font-size:12px;}
          a.button { background:#1a2027;color:#fff;text-decoration:none;display:inline-block; border-radius:5px;padding:10px 22px;font-size:15px;margin:24px 0 0 0; font-weight:500;letter-spacing:1px;}
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">Job Application - ${company_name}</div>
          <div class="content">
            Hello ${hr_name || 'Hiring Manager'},<br><br>
            I am interested in joining <b>${company_name}</b>. My resume is attached.<br><br>
            Please let me know if we can schedule a conversation. Thank you!<br><br>
            Regards,<br>
            <b>${user_name}</b><br>
            <span style="font-size:13px;color:#1a2027;">
              ${user_email} | ${user_phone} | <a href="${user_linkedin}" style="color:#1456b2;">LinkedIn</a>
            </span><br><a class="button" href="mailto:${user_email}">Reply</a>
          </div>
          <div class="footer">
            Powered by AutoHR. Application managed for you.
          </div>
        </div>
      </body>
      </html>`;
    }
    if (templateType === 'tech') {
      return `<!DOCTYPE html>
      <html>
      <head>
        <style>
          body { background:#20212b; font-family:'Montserrat',Arial,sans-serif; margin:0;padding:0;}
          .container { max-width:520px;background:#292c38;border-radius:12px;margin:38px auto;
            box-shadow:0 6px 28px rgba(50,60,110,0.12); border-top:4px solid #0af5be; color:#e7eaef;}
          .header {color:#0af5be;font-weight:700;font-size:22px;padding:28px 30px 10px 30px;}
          .content {padding:22px 30px;font-size:15px;color:#e7eaef;line-height:1.7;}
          .footer {background:#22244f;color:#0af5be;text-align:center;padding:14px 6px;font-size:13px;}
          .btn { background:#0af5be;color:#20212b;font-weight:600;padding:10px 24px; text-decoration:none;border-radius:8px;display:inline-block;margin:20px 0 0 0; font-size:15px;}
          a {color:#0af5be;}
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">Applying to ${company_name}</div>
          <div class="content">
            Hi ${hr_name || 'Hiring Manager'},<br><br>
            Excited to apply for a role at <b>${company_name}</b>.<br>
            Find my resume attached.<br><br>
            Let's connect soon!<br><br>
            Regards,<br>
            <b>${user_name}</b><br>
            <span style="font-size:13px;color:#0af5be;">
              ${user_email} | ${user_phone} | <a href="${user_linkedin}">LinkedIn</a>
            </span><br>
            <a href="mailto:${user_email}" class="btn">Reply</a>
          </div>
          <div class="footer">
            AutoHR - Smart job applications, seamless experience.
          </div>
        </div>
      </body>
      </html>`;
    }
  }

  // Single email send - UPDATED TO USE BREVO API
  static async sendEmail(options) {
    const {
      to, subject, body, resumePath, resumeName,
      company_name, hr_name, templateType = 'modern', userData = {}
    } = options;
    
    try {
      // Resume file check
      let attachmentBase64 = null;
      if (resumePath) {
        try {
          await fs.access(resumePath);
          // Read file as base64 for Brevo API
          const fileBuffer = await fs.readFile(resumePath);
          attachmentBase64 = fileBuffer.toString('base64');
        } catch (err) {
          throw new Error('Resume file not found: ' + resumePath);
        }
      }

      const htmlBody = body || this.renderHtmlTemplate({
        company_name: company_name || (userData.company_name),
        hr_name: hr_name || (userData.hr_name),
        user_name: userData.name || 'Your Name',
        user_email: userData.email || MAIL_USER,
        user_phone: userData.phone || '+91 98765 43210',
        user_linkedin: userData.linkedin || 'linkedin.com/in/yourprofile',
        templateType: templateType
      });

      // Prepare email options for Brevo API
      const emailOptions = {
        to: to,
        subject: subject,
        html: htmlBody,
        from: userData.email || MAIL_USER,
        fromName: userData.name || 'Job Applicant',
        replyTo: userData.email || MAIL_USER
      };

      // Add attachment if resume exists
      if (attachmentBase64 && resumeName) {
        emailOptions.attachment = [{
          name: resumeName,
          content: attachmentBase64
        }];
      }

      // Send via Brevo API
      const result = await sendBrevoEmail(emailOptions);
      
      return { 
        success: true, 
        messageId: result.messageId || 'sent', 
        response: 'Email sent successfully via Brevo API' 
      };
    } catch (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }
  }

  // Delay utility for bulk
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = EmailService;