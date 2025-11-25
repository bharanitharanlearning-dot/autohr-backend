const Settings = require('../models/settingsModel');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { MESSAGES } = require('../utils/constants');

// Get settings
exports.getSettings = async (req, res, next) => {
  try {
    const settings = await Settings.findByUserId(req.user.id);

    sendSuccess(res, 'Settings retrieved successfully', { settings });
  } catch (error) {
    next(error);
  }
};

// Update settings
exports.updateSettings = async (req, res, next) => {
  try {
    const { email_subject, email_body, auto_send, send_time, daily_limit } = req.body;

    // Validation
    if (!email_subject || !email_body) {
      return sendError(res, 'Email subject and body are required');
    }

    if (daily_limit && (daily_limit < 1 || daily_limit > 100)) {
      return sendError(res, 'Daily limit must be between 1 and 100');
    }

    const settings = await Settings.update(req.user.id, {
      email_subject,
      email_body,
      auto_send: auto_send !== undefined ? auto_send : true,
      send_time: send_time || '09:00:00',
      daily_limit: daily_limit || 50
    });

    sendSuccess(res, MESSAGES.SETTINGS_UPDATED, { settings });
  } catch (error) {
    next(error);
  }
};

// Toggle auto send
exports.toggleAutoSend = async (req, res, next) => {
  try {
    const newStatus = await Settings.toggleAutoSend(req.user.id);

    sendSuccess(res, `Auto send ${newStatus ? 'enabled' : 'disabled'}`, {
      auto_send: newStatus
    });
  } catch (error) {
    next(error);
  }
};

// Reset to default settings
exports.resetSettings = async (req, res, next) => {
  try {
    const defaultBody = `Dear Hiring Manager,

I am writing to express my interest in job opportunities at your esteemed organization. I have attached my resume for your review.

I would appreciate the opportunity to discuss how my skills and experience align with your requirements.

Thank you for your time and consideration.

Best regards`;

    const settings = await Settings.update(req.user.id, {
      email_subject: 'Job Application - Resume Submission',
      email_body: defaultBody,
      auto_send: true,
      send_time: '09:00:00',
      daily_limit: 50
    });

    sendSuccess(res, 'Settings reset to default', { settings });
  } catch (error) {
    next(error);
  }
};