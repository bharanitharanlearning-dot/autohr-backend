const db = require('../config/db');

class Settings {
  // Create settings for new user (FIXED - accepts settingsData parameter)
  static async create(userId, settingsData = {}) {
    const { 
      daily_limit = 100,
      email_from_name = '',
      email_from_address = '' 
    } = settingsData;

    const defaultBody = `Dear Hiring Manager,

I am writing to express my interest in job opportunities at your esteemed organization. I have attached my resume for your review.

I would appreciate the opportunity to discuss how my skills and experience align with your requirements.

Thank you for your time and consideration.

Best regards`;

    const result = await db.query(
      `INSERT INTO settings (user_id, email_subject, email_body, daily_limit) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [userId, 'Job Application - Resume Submission', defaultBody, daily_limit]
    );
    
    return result.rows[0].id;
  }

  // Legacy method for backward compatibility
  static async createDefault(userId) {
    return await this.create(userId);
  }

  // Get settings by user ID
  static async findByUserId(userId) {
    const result = await db.query(
      'SELECT * FROM settings WHERE user_id = $1',
      [userId]
    );
    
    // If no settings exist, create default
    if (result.rows.length === 0) {
      await this.create(userId);
      return await this.findByUserId(userId);
    }
    
    return result.rows[0];
  }

  // Update settings
  static async update(userId, settingsData) {
    const { email_subject, email_body, auto_send, send_time, daily_limit } = settingsData;
    
    // Check if settings exist
    const existing = await this.findByUserId(userId);
    
    if (existing) {
      await db.query(
        `UPDATE settings 
         SET email_subject = $1, email_body = $2, auto_send = $3, send_time = $4, daily_limit = $5
         WHERE user_id = $6`,
        [email_subject, email_body, auto_send, send_time, daily_limit, userId]
      );
    } else {
      await db.query(
        `INSERT INTO settings (user_id, email_subject, email_body, auto_send, send_time, daily_limit) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, email_subject, email_body, auto_send, send_time, daily_limit]
      );
    }
    
    return await this.findByUserId(userId);
  }

  // Toggle auto send
  static async toggleAutoSend(userId) {
    const settings = await this.findByUserId(userId);
    const newStatus = !settings.auto_send;
    
    await db.query(
      'UPDATE settings SET auto_send = $1 WHERE user_id = $2',
      [newStatus, userId]
    );
    
    return newStatus;
  }

  // Get all users with auto send enabled
  static async getUsersWithAutoSend() {
    const result = await db.query(
      `SELECT s.*, u.email as user_email, u.name as user_name
       FROM settings s
       JOIN users u ON s.user_id = u.id
       WHERE s.auto_send = TRUE`
    );
    return result.rows;
  }
}

module.exports = Settings;