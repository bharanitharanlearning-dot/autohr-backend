const express = require('express');
const router = express.Router();
const mailController = require('../controllers/mailController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes are protected
router.use(authMiddleware);

router.post('/send', mailController.sendEmail);
router.post('/send-bulk', mailController.sendBulkEmails);
router.get('/logs', mailController.getMailLogs);
router.get('/stats', mailController.getMailStats);
router.get('/recent', mailController.getRecentEmails);
router.get('/test', mailController.testEmail);

module.exports = router;