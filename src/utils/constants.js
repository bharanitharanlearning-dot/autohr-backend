module.exports = {
  // Mail status
  MAIL_STATUS: {
    SENT: 'sent',
    FAILED: 'failed',
    PENDING: 'pending'
  },

  // Company status
  COMPANY_STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive'
  },

  // File types
  ALLOWED_FILE_TYPES: ['.pdf', '.doc', '.docx'],

  // Limits
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_DAILY_EMAILS: 100, // FIXED: Increased from 50 to 100 (Gmail allows 500/day)

  // Messages
  MESSAGES: {
    // Auth
    REGISTER_SUCCESS: 'User registered successfully',
    LOGIN_SUCCESS: 'Login successful',
    INVALID_CREDENTIALS: 'Invalid email or password',
    USER_EXISTS: 'User already exists',

    // Company
    COMPANY_CREATED: 'Company added successfully',
    COMPANY_UPDATED: 'Company updated successfully',
    COMPANY_DELETED: 'Company deleted successfully',
    COMPANY_NOT_FOUND: 'Company not found',

    // Resume
    RESUME_UPLOADED: 'Resume uploaded successfully',
    RESUME_DELETED: 'Resume deleted successfully',
    RESUME_NOT_FOUND: 'Resume not found',
    DEFAULT_SET: 'Default resume set successfully',

    // Mail
    EMAIL_SENT: 'Email sent successfully',
    EMAIL_FAILED: 'Failed to send email',
    BULK_EMAIL_COMPLETED: 'Bulk email sending completed',
    DAILY_LIMIT_REACHED: 'Daily email limit reached',

    // Settings
    SETTINGS_UPDATED: 'Settings updated successfully',
    AUTO_SEND_ENABLED: 'Auto-send enabled',
    AUTO_SEND_DISABLED: 'Auto-send disabled',

    // General
    SERVER_ERROR: 'Internal server error',
    UNAUTHORIZED: 'Unauthorized access',
    VALIDATION_ERROR: 'Validation error'
  }
};