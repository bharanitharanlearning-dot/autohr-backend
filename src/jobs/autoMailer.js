const schedulerService = require('../services/schedulerService');

// This file can be used to manually trigger the email job
// or to schedule additional custom jobs

// Export the scheduler service
module.exports = schedulerService;

// If this file is run directly, trigger the job manually
if (require.main === module) {
  console.log('🔧 Manually triggering email job...');
  schedulerService.triggerManually()
    .then(() => {
      console.log('✅ Job completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Job failed:', error);
      process.exit(1);
    });
}