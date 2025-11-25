const mysql = require('mysql2/promise');
const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = require('./env');

const initDatabase = async () => {
  let connection;
  
  try {
    // Connect without database
    connection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      port: DB_PORT
    });

    console.log('📦 Initializing AutoHR Database...');

    // Create database if not exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${DB_NAME}`);
    console.log(`✅ Database '${DB_NAME}' created/verified`);

    // Use database
    await connection.query(`USE ${DB_NAME}`);

    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email)
      )
    `);
    console.log('✅ Table "users" created');

    // Create companies table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        company_name VARCHAR(200) NOT NULL,
        email VARCHAR(100) NOT NULL,
        hr_name VARCHAR(100),
        phone VARCHAR(20),
        website VARCHAR(255),
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_email (email),
        INDEX idx_status (status)
      )
    `);
    console.log('✅ Table "companies" created');

    // Create resumes table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS resumes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INT NOT NULL,
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_is_default (is_default)
      )
    `);
    console.log('✅ Table "resumes" created');

    // Create mail_logs table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS mail_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        company_id INT,
        recipient_email VARCHAR(100) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        status ENUM('sent', 'failed', 'pending') DEFAULT 'pending',
        error_message TEXT,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_sent_at (sent_at),
        INDEX idx_user_status (user_id, status)
      )
    `);
    console.log('✅ Table "mail_logs" created');

    // Create settings table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        email_subject VARCHAR(255) DEFAULT 'Job Application',
        email_body TEXT,
        auto_send BOOLEAN DEFAULT TRUE,
        send_time TIME DEFAULT '09:00:00',
        daily_limit INT DEFAULT 50,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_settings (user_id),
        INDEX idx_auto_send (auto_send)
      )
    `);
    console.log('✅ Table "settings" created');

    console.log('🎉 Database initialization completed successfully!');
    console.log('📊 Tables created with performance indexes');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Run if executed directly
if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log('✅ Database setup complete');
      process.exit(0);
    })
    .catch(() => {
      console.error('❌ Database setup failed');
      process.exit(1);
    });
}

module.exports = initDatabase;