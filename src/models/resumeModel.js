const db = require('../config/db');

class Resume {
  // Create resume record
  static async create(resumeData) {
    const { user_id, filename, original_name, file_path, file_size, is_default } = resumeData;
    
    // If this is default, remove default from others
    if (is_default) {
      await db.query(
        'UPDATE resumes SET is_default = FALSE WHERE user_id = $1',
        [user_id]
      );
    }
    
    const result = await db.query(
      `INSERT INTO resumes (user_id, filename, original_name, file_path, file_size, is_default) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [user_id, filename, original_name, file_path, file_size, is_default || false]
    );
    
    return result.rows[0].id;
  }

  // Get all resumes for user
  static async findByUserId(userId) {
    const result = await db.query(
      'SELECT * FROM resumes WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
      [userId]
    );
    return result.rows;
  }

  // Get resume by ID
  static async findById(id, userId) {
    const result = await db.query(
      'SELECT * FROM resumes WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return result.rows[0];
  }

  // Get default resume
  static async getDefault(userId) {
    const result = await db.query(
      'SELECT * FROM resumes WHERE user_id = $1 AND is_default = TRUE',
      [userId]
    );
    return result.rows[0];
  }

  // Set as default
  static async setDefault(id, userId) {
    // Remove default from all
    await db.query(
      'UPDATE resumes SET is_default = FALSE WHERE user_id = $1',
      [userId]
    );
    
    // Set new default
    await db.query(
      'UPDATE resumes SET is_default = TRUE WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    return await this.findById(id, userId);
  }

  // Delete resume
  static async delete(id, userId) {
    const result = await db.query(
      'DELETE FROM resumes WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    return result.rowCount > 0;
  }

  // Get resume count
  static async count(userId) {
    const result = await db.query(
      'SELECT COUNT(*) as count FROM resumes WHERE user_id = $1',
      [userId]
    );
    return parseInt(result.rows[0].count);
  }
}

module.exports = Resume;