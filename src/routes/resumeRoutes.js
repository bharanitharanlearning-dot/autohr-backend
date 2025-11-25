const express = require('express');
const router = express.Router();
const resumeController = require('../controllers/resumeController');
const authMiddleware = require('../middleware/authMiddleware');
const { upload, handleUploadError } = require('../middleware/uploadMiddleware');

// All routes are protected
router.use(authMiddleware);

router.get('/', resumeController.getAllResumes);
router.get('/default', resumeController.getDefaultResume);
router.get('/:id', resumeController.getResumeById);
router.post('/upload', upload.single('resume'), handleUploadError, resumeController.uploadResume);
router.put('/:id/set-default', resumeController.setDefaultResume);
router.delete('/:id', resumeController.deleteResume);

module.exports = router;