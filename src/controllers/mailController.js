const MailLog = require('../models/mailLogModel');
const Company = require('../models/companyModel');
const Resume = require('../models/resumeModel');
const Settings = require('../models/settingsModel');
const EmailService = require('../services/emailService');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { MESSAGES } = require('../utils/constants');
const path = require('path');

// --- Send single email manually ---
exports.sendEmail = async (req, res, next) => {
  try {
    const { company_id, subject, body, templateType } = req.body;

    // Validation
    if (!company_id || !subject || !body) {
      return sendError(res, 'Please provide company ID, subject, and body');
    }

    // Get company
    const company = await Company.findById(company_id, req.user.id);
    if (!company) {
      return sendError(res, MESSAGES.COMPANY_NOT_FOUND, 404);
    }

    // Get default resume
    const resume = await Resume.getDefault(req.user.id);
    if (!resume) {
      return sendError(res, 'Please upload a default resume first', 400);
    }

    // Check daily limit
    const todayStats = await MailLog.getStats(req.user.id, 'today');
    const settings = await Settings.findByUserId(req.user.id);

    if (todayStats.total >= settings.daily_limit) {
      return sendError(res, MESSAGES.DAILY_LIMIT_REACHED, 429);
    }

    // Create mail log
    const logId = await MailLog.create({
      user_id: req.user.id,
      company_id: company.id,
      recipient_email: company.email,
      subject: subject,
      status: 'pending'
    });

    // Build HTML email using template
    const htmlBody = EmailService.renderHtmlTemplate({
      company_name: company.company_name,
      hr_name: company.hr_name,
      user_name: req.user.name,
      user_email: req.user.email,
      user_phone: req.user.phone || '+91 98765 43210',
      user_linkedin: req.user.linkedin || 'https://linkedin.com/in/yourprofile',
      templateType: templateType || 'modern'
    });

    // Path to resume
    const resumePath = path.join(process.cwd(), 'uploads', resume.filename);

    // Send email
    const result = await EmailService.sendEmail({
      to: company.email,
      subject: subject,
      body: htmlBody,
      resumePath: resumePath,
      resumeName: resume.original_name
    });

    // Update log & respond
    if (result.success) {
      await MailLog.updateStatus(logId, 'sent');
      sendSuccess(res, MESSAGES.EMAIL_SENT, {
        logId,
        recipient: company.email,
        company: company.company_name
      });
    } else {
      await MailLog.updateStatus(logId, 'failed', result.error);
      return sendError(res, `${MESSAGES.EMAIL_FAILED}: ${result.error}`, 500);
    }
  } catch (error) {
    next(error);
  }
};

// --- Send bulk emails ---
exports.sendBulkEmails = async (req, res, next) => {
  try {
    const { company_ids, subject, body, templateType } = req.body;

    // Validation
    if (!company_ids || !Array.isArray(company_ids) || company_ids.length === 0) {
      return sendError(res, 'Please provide company IDs');
    }
    if (!subject || !body) {
      return sendError(res, 'Please provide subject and body');
    }

    // Get default resume
    const resume = await Resume.getDefault(req.user.id);
    if (!resume) {
      return sendError(res, 'Please upload a default resume first', 400);
    }

    // Check daily limit
    const todayStats = await MailLog.getStats(req.user.id, 'today');
    const settings = await Settings.findByUserId(req.user.id);

    const remainingLimit = settings.daily_limit - todayStats.total;
    if (remainingLimit <= 0) {
      return sendError(res, MESSAGES.DAILY_LIMIT_REACHED, 429);
    }

    const limitedIds = company_ids.slice(0, remainingLimit);
    const results = [];
    const resumePath = path.join(process.cwd(), 'uploads', resume.filename);

    for (const companyId of limitedIds) {
      try {
        const company = await Company.findById(companyId, req.user.id);
        if (!company) continue;

        // Create mail log
        const logId = await MailLog.create({
          user_id: req.user.id,
          company_id: company.id,
          recipient_email: company.email,
          subject: subject.replace('{company}', company.company_name),
          status: 'pending'
        });

        // Build HTML email using template
        const htmlBody = EmailService.renderHtmlTemplate({
          company_name: company.company_name,
          hr_name: company.hr_name,
          user_name: req.user.name,
          user_email: req.user.email,
          user_phone: req.user.phone || '+91 98765 43210',
          user_linkedin: req.user.linkedin || 'https://linkedin.com/in/yourprofile',
          templateType: templateType || 'modern'
        });

        // Send email
        const result = await EmailService.sendEmail({
          to: company.email,
          subject: subject.replace('{company}', company.company_name),
          body: htmlBody,
          resumePath: resumePath,
          resumeName: resume.original_name
        });

        // Update log
        if (result.success) {
          await MailLog.updateStatus(logId, 'sent');
          results.push({ company: company.company_name, status: 'sent' });
        } else {
          await MailLog.updateStatus(logId, 'failed', result.error);
          results.push({ company: company.company_name, status: 'failed', error: result.error });
        }

        await EmailService.delay(2000); // Rate limit between emails
      } catch (error) {
        results.push({ companyId, status: 'error', error: error.message });
      }
    }

    const successCount = results.filter(r => r.status === 'sent').length;
    const failedCount = results.filter(r => r.status === 'failed').length;

    sendSuccess(res, `Bulk email completed: ${successCount} sent, ${failedCount} failed`, {
      results,
      summary: { successCount, failedCount, total: results.length }
    });
  } catch (error) {
    next(error);
  }
};

// --- Get email logs ---
exports.getMailLogs = async (req, res, next) => {
  try {
    const { status, startDate, endDate, limit } = req.query;
    const logs = await MailLog.findByUserId(req.user.id, {
      status,
      startDate,
      endDate,
      limit: limit || 50
    });
    sendSuccess(res, 'Email logs retrieved successfully', {
      logs,
      count: logs.length
    });
  } catch (error) {
    next(error);
  }
};

// --- Get email statistics ---
exports.getMailStats = async (req, res, next) => {
  try {
    const { period } = req.query;
    const stats = await MailLog.getStats(req.user.id, period || 'all');
    sendSuccess(res, 'Email statistics retrieved successfully', { stats });
  } catch (error) {
    next(error);
  }
};

// --- Get recent emails ---
exports.getRecentEmails = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const logs = await MailLog.getRecent(req.user.id, limit);
    sendSuccess(res, 'Recent emails retrieved successfully', { logs });
  } catch (error) {
    next(error);
  }
};

// --- Test email configuration ---
exports.testEmail = async (req, res, next) => {
  try {
    const result = await EmailService.testConnection();
    if (result.success) {
      sendSuccess(res, 'Email configuration is valid');
    } else {
      return sendError(res, `Email configuration error: ${result.message}`, 500);
    }
  } catch (error) {
    next(error);
  }
};
