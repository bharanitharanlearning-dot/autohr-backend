const db = require('../config/db');

class Company {
  // Create company
  static async create(companyData) {
    const { user_id, company_name, email, hr_name, phone, website, status } = companyData;
    
    const result = await db.query(
      `INSERT INTO companies (user_id, company_name, email, hr_name, phone, website, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [user_id, company_name, email, hr_name, phone, website, status || 'active']
    );
    
    return result.rows[0].id;
  }

  // Get all companies for a user
  static async findByUserId(userId, filters = {}) {
    let query = 'SELECT * FROM companies WHERE user_id = $1';
    const params = [userId];
    let paramIndex = 2;
    
    if (filters.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }
    
    if (filters.search) {
      query += ` AND (company_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex + 1})`;
      params.push(`%${filters.search}%`, `%${filters.search}%`);
      paramIndex += 2;
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await db.query(query, params);
    return result.rows;
  }

  // Get company by ID
  static async findById(id, userId) {
    const result = await db.query(
      'SELECT * FROM companies WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return result.rows[0];
  }

  // Update company
  static async update(id, userId, companyData) {
    const { company_name, email, hr_name, phone, website, status } = companyData;
    
    await db.query(
      `UPDATE companies 
       SET company_name = $1, email = $2, hr_name = $3, phone = $4, website = $5, status = $6
       WHERE id = $7 AND user_id = $8`,
      [company_name, email, hr_name, phone, website, status, id, userId]
    );
    
    return await this.findById(id, userId);
  }

  // Delete company
  static async delete(id, userId) {
    const result = await db.query(
      'DELETE FROM companies WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    return result.rowCount > 0;
  }

  // Bulk delete
  static async bulkDelete(ids, userId) {
    const placeholders = ids.map((_, index) => `$${index + 1}`).join(',');
    const result = await db.query(
      `DELETE FROM companies WHERE id IN (${placeholders}) AND user_id = $${ids.length + 1}`,
      [...ids, userId]
    );
    
    return result.rowCount;
  }

  // Get active companies for email sending
  static async getActiveCompanies(userId, limit = null) {
    let query = 'SELECT * FROM companies WHERE user_id = $1 AND status = $2';
    const params = [userId, 'active'];
    
    if (limit) {
      query += ' LIMIT $3';
      params.push(limit);
    }
    
    const result = await db.query(query, params);
    return result.rows;
  }

  // Get statistics
  static async getStats(userId) {
    const totalResult = await db.query(
      'SELECT COUNT(*) as total FROM companies WHERE user_id = $1',
      [userId]
    );
    
    const activeResult = await db.query(
      'SELECT COUNT(*) as active FROM companies WHERE user_id = $1 AND status = $2',
      [userId, 'active']
    );
    
    const inactiveResult = await db.query(
      'SELECT COUNT(*) as inactive FROM companies WHERE user_id = $1 AND status = $2',
      [userId, 'inactive']
    );
    
    return {
      total: parseInt(totalResult.rows[0].total),
      active: parseInt(activeResult.rows[0].active),
      inactive: parseInt(inactiveResult.rows[0].inactive)
    };
  }
}

module.exports = Company;