const cron = require('node-cron');
const { CRON_SCHEDULE } = require('../config/env');
const Settings = require('../models/settingsModel');
const Company = require('../models/companyModel');
const Resume = require('../models/resumeModel');
const MailLog = require('../models/mailLogModel');
const EmailService = require('./emailService');
const path = require('path');

class SchedulerService {
  constructor() {
    this.task = null;
  }

  // Start the scheduler
  start() {
    if (this.task) {
      console.log('⚠️ Scheduler already running');
      return;
    }

    // Schedule task (default: every day at 9:00 AM)
    this.task = cron.schedule(CRON_SCHEDULE, async () => {
      console.log(`⏰ [${new Date().toISOString()}] Running scheduled email task...`);
      await this.runEmailTask();
    });

    console.log(`✅ Scheduler started with schedule: ${CRON_SCHEDULE}`);
  }

  // Stop the scheduler
  stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
      console.log('🛑 Scheduler stopped');
    }
  }

  // Main email task
  async runEmailTask() {
    try {
      // Get all users with auto-send enabled
      const users = await Settings.getUsersWithAutoSend();

      console.log(`📧 Found ${users.length} users with auto-send enabled`);

      for (const user of users) {
        try {
          await this.processUserEmails(user);
        } catch (error) {
          console.error(`❌ Error processing emails for user ${user.user_id}:`, error.message);
        }
      }

      console.log('✅ Scheduled email task completed');
    } catch (error) {
      console.error('❌ Scheduled email task failed:', error.message);
    }
  }

  // Process emails for a single user
  async processUserEmails(user) {
    const userId = user.user_id;

    // Check daily limit
    const todayStats = await MailLog.getStats(userId, 'today');
    if (todayStats.total >= user.daily_limit) {
      console.log(`⚠️ Daily limit (${user.daily_limit}) reached for user ${userId}`);
      return;
    }

    // Get default resume
    const resume = await Resume.getDefault(userId);
    if (!resume) {
      console.log(`⚠️ No default resume found for user ${userId}`);
      return;
    }

    // Get active companies (respecting daily limit)
    const remainingLimit = user.daily_limit - todayStats.total;
    const companies = await Company.getActiveCompanies(userId, remainingLimit);

    if (companies.length === 0) {
      console.log(`⚠️ No active companies found for user ${userId}`);
      return;
    }

    console.log(`📤 Sending ${companies.length} emails for user ${userId} (${user.user_name})`);

    // FIXED: Correct path to resume file using process.cwd()
    const resumePath = path.join(process.cwd(), 'uploads', resume.filename);
    
    let successCount = 0;
    let failCount = 0;

    for (const company of companies) {
      try {
        // Create mail log
        const logId = await MailLog.create({
          user_id: userId,
          company_id: company.id,
          recipient_email: company.email,
          subject: user.email_subject,
          status: 'pending'
        });

        // Send email with variable replacement
        const result = await EmailService.sendEmail({
          to: company.email,
          subject: user.email_subject.replace('{company}', company.company_name),
          body: user.email_body
            .replace('{company}', company.company_name)
            .replace('{hr_name}', company.hr_name || 'Hiring Manager'),
          resumePath: resumePath,
          resumeName: resume.original_name
        });

        // Update log
        if (result.success) {
          await MailLog.updateStatus(logId, 'sent');
          console.log(`✅ [${new Date().toISOString()}] Email sent to ${company.email}`);
          successCount++;
        } else {
          await MailLog.updateStatus(logId, 'failed', result.error);
          console.log(`❌ [${new Date().toISOString()}] Email failed to ${company.email}: ${result.error}`);
          failCount++;
        }

        // Delay between emails (2 seconds to avoid rate limiting)
        await EmailService.delay(2000);
      } catch (error) {
        console.error(`❌ Error sending email to ${company.email}:`, error.message);
        failCount++;
      }
    }

    console.log(`✅ User ${userId} completed: ${successCount} success, ${failCount} failed`);
  }

  // Manual trigger for testing
  async triggerManually() {
    console.log('🔧 Manually triggering email task...');
    await this.runEmailTask();
  }

  // Get scheduler status
  getStatus() {
    return {
      running: this.task !== null,
      schedule: CRON_SCHEDULE
    };
  }
}

// Export singleton instance
module.exports = new SchedulerService();