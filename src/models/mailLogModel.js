const db = require('../config/db');

class MailLog {
  // Create mail log
  static async create(logData) {
    const { user_id, company_id, recipient_email, subject, status, error_message } = logData;
    
    const result = await db.query(
      `INSERT INTO mail_logs (user_id, company_id, recipient_email, subject, status, error_message) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [user_id, company_id, recipient_email, subject, status, error_message]
    );
    
    return result.rows[0].id;
  }

  // Get logs by user
  static async findByUserId(userId, filters = {}) {
    let query = `
      SELECT ml.*, c.company_name 
      FROM mail_logs ml
      LEFT JOIN companies c ON ml.company_id = c.id
      WHERE ml.user_id = $1
    `;
    const params = [userId];
    let paramIndex = 2;
    
    if (filters.status) {
      query += ` AND ml.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }
    
    if (filters.startDate && filters.endDate) {
      query += ` AND ml.sent_at BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      params.push(filters.startDate, filters.endDate);
      paramIndex += 2;
    }
    
    query += ' ORDER BY ml.sent_at DESC';
    
    if (filters.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(parseInt(filters.limit));
    }
    
    const result = await db.query(query, params);
    return result.rows;
  }

  // Get log by ID
  static async findById(id, userId) {
    const result = await db.query(
      `SELECT ml.*, c.company_name 
       FROM mail_logs ml
       LEFT JOIN companies c ON ml.company_id = c.id
       WHERE ml.id = $1 AND ml.user_id = $2`,
      [id, userId]
    );
    return result.rows[0];
  }

  // Update log status
  static async updateStatus(id, status, errorMessage = null) {
    await db.query(
      'UPDATE mail_logs SET status = $1, error_message = $2 WHERE id = $3',
      [status, errorMessage, id]
    );
  }

  // Get statistics
  static async getStats(userId, period = 'all') {
    let dateCondition = '';
    const params = [userId];
    
    if (period === 'today') {
      dateCondition = 'AND DATE(sent_at) = CURRENT_DATE';
    } else if (period === 'week') {
      dateCondition = "AND sent_at >= NOW() - INTERVAL '7 days'";
    } else if (period === 'month') {
      dateCondition = "AND sent_at >= NOW() - INTERVAL '30 days'";
    }
    
    const totalResult = await db.query(
      `SELECT COUNT(*) as total FROM mail_logs WHERE user_id = $1 ${dateCondition}`,
      params
    );
    
    const sentResult = await db.query(
      `SELECT COUNT(*) as sent FROM mail_logs WHERE user_id = $1 AND status = 'sent' ${dateCondition}`,
      params
    );
    
    const failedResult = await db.query(
      `SELECT COUNT(*) as failed FROM mail_logs WHERE user_id = $1 AND status = 'failed' ${dateCondition}`,
      params
    );
    
    const pendingResult = await db.query(
      `SELECT COUNT(*) as pending FROM mail_logs WHERE user_id = $1 AND status = 'pending' ${dateCondition}`,
      params
    );
    
    const total = parseInt(totalResult.rows[0].total);
    const sent = parseInt(sentResult.rows[0].sent);
    
    return {
      total: total,
      sent: sent,
      failed: parseInt(failedResult.rows[0].failed),
      pending: parseInt(pendingResult.rows[0].pending),
      successRate: total > 0 
        ? ((sent / total) * 100).toFixed(2) 
        : 0
    };
  }

  // Get recent logs
  static async getRecent(userId, limit = 10) {
    const result = await db.query(
      `SELECT ml.*, c.company_name 
       FROM mail_logs ml
       LEFT JOIN companies c ON ml.company_id = c.id
       WHERE ml.user_id = $1
       ORDER BY ml.sent_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }

  // Delete old logs (cleanup)
  static async deleteOlderThan(days = 90) {
    const result = await db.query(
      "DELETE FROM mail_logs WHERE sent_at < NOW() - INTERVAL '$1 days'",
      [days]
    );
    return result.rowCount;
  }
}

module.exports = MailLog;