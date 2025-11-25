const Resume = require('../models/resumeModel');
const FileService = require('../services/fileService');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { MESSAGES } = require('../utils/constants');

// Get all resumes
exports.getAllResumes = async (req, res, next) => {
  try {
    const resumes = await Resume.findByUserId(req.user.id);

    // Format file sizes
    const formattedResumes = resumes.map(resume => ({
      ...resume,
      file_size_formatted: FileService.formatFileSize(resume.file_size)
    }));

    sendSuccess(res, 'Resumes retrieved successfully', { 
      resumes: formattedResumes,
      count: resumes.length
    });
  } catch (error) {
    next(error);
  }
};

// Get resume by ID
exports.getResumeById = async (req, res, next) => {
  try {
    const resume = await Resume.findById(req.params.id, req.user.id);

    if (!resume) {
      return sendError(res, MESSAGES.RESUME_NOT_FOUND, 404);
    }

    sendSuccess(res, 'Resume retrieved successfully', { resume });
  } catch (error) {
    next(error);
  }
};

// Upload resume
exports.uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 'Please upload a file');
    }

    const { is_default } = req.body;

    const resumeData = {
      user_id: req.user.id,
      filename: req.file.filename,
      original_name: req.file.originalname,
      file_path: `uploads/${req.file.filename}`,
      file_size: req.file.size,
      is_default: is_default === 'true' || is_default === true
    };

    const resumeId = await Resume.create(resumeData);
    const resume = await Resume.findById(resumeId, req.user.id);

    sendSuccess(res, MESSAGES.RESUME_UPLOADED, { resume }, 201);
  } catch (error) {
    // Delete uploaded file if database insert fails
    if (req.file) {
      await FileService.deleteFile(`uploads/${req.file.filename}`);
    }
    next(error);
  }
};

// Delete resume
exports.deleteResume = async (req, res, next) => {
  try {
    const resume = await Resume.findById(req.params.id, req.user.id);

    if (!resume) {
      return sendError(res, MESSAGES.RESUME_NOT_FOUND, 404);
    }

    // Delete from database
    const deleted = await Resume.delete(req.params.id, req.user.id);

    if (deleted) {
      // Delete file from filesystem
      await FileService.deleteFile(resume.file_path);
    }

    sendSuccess(res, MESSAGES.RESUME_DELETED);
  } catch (error) {
    next(error);
  }
};

// Set default resume
exports.setDefaultResume = async (req, res, next) => {
  try {
    const resume = await Resume.findById(req.params.id, req.user.id);

    if (!resume) {
      return sendError(res, MESSAGES.RESUME_NOT_FOUND, 404);
    }

    const updatedResume = await Resume.setDefault(req.params.id, req.user.id);

    sendSuccess(res, MESSAGES.DEFAULT_SET, { resume: updatedResume });
  } catch (error) {
    next(error);
  }
};

// Get default resume
exports.getDefaultResume = async (req, res, next) => {
  try {
    const resume = await Resume.getDefault(req.user.id);

    if (!resume) {
      return sendError(res, 'No default resume found', 404);
    }

    sendSuccess(res, 'Default resume retrieved successfully', { resume });
  } catch (error) {
    next(error);
  }
};