const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes are protected
router.use(authMiddleware);

router.get('/', settingsController.getSettings);
router.put('/', settingsController.updateSettings);
router.post('/toggle-auto-send', settingsController.toggleAutoSend);
router.post('/reset', settingsController.resetSettings);

module.exports = router;