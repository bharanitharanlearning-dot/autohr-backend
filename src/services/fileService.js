const fs = require('fs').promises;
const path = require('path');

class FileService {
  // Delete file
  static async deleteFile(filePath) {
    try {
      const fullPath = path.join(__dirname, '../../', filePath);
      await fs.unlink(fullPath);
      return true;
    } catch (error) {
      console.error('File deletion error:', error.message);
      return false;
    }
  }

  // Check if file exists
  static async fileExists(filePath) {
    try {
      const fullPath = path.join(__dirname, '../../', filePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  // Get file size
  static async getFileSize(filePath) {
    try {
      const fullPath = path.join(__dirname, '../../', filePath);
      const stats = await fs.stat(fullPath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  // Format file size
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  // Clean up old files
  static async cleanupOldFiles(directory, daysOld = 90) {
    try {
      const dir = path.join(__dirname, '../../', directory);
      const files = await fs.readdir(dir);
      const now = Date.now();
      const maxAge = daysOld * 24 * 60 * 60 * 1000;

      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtimeMs > maxAge) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('Cleanup error:', error.message);
      return 0;
    }
  }

  // Create directory if not exists
  static async ensureDirectory(directory) {
    try {
      const dir = path.join(__dirname, '../../', directory);
      await fs.mkdir(dir, { recursive: true });
      return true;
    } catch (error) {
      console.error('Directory creation error:', error.message);
      return false;
    }
  }
}

module.exports = FileService;