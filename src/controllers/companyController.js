const Company = require('../models/companyModel');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { MESSAGES } = require('../utils/constants');

// Get all companies
exports.getAllCompanies = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    
    const companies = await Company.findByUserId(req.user.id, { status, search });

    sendSuccess(res, 'Companies retrieved successfully', { 
      companies,
      count: companies.length 
    });
  } catch (error) {
    next(error);
  }
};

// Get company by ID
exports.getCompanyById = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id, req.user.id);

    if (!company) {
      return sendError(res, MESSAGES.COMPANY_NOT_FOUND, 404);
    }

    sendSuccess(res, 'Company retrieved successfully', { company });
  } catch (error) {
    next(error);
  }
};

// TEMPORARY FIX - Replace your createCompany function with this
exports.createCompany = async (req, res, next) => {
  try {
    const { company_name, email, hr_name, phone, website, status } = req.body;

    // Required field validation
    if (!company_name || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Company name and email are required' 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email format' 
      });
    }

    // Phone validation
    if (phone) {
      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
      if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid phone number format' 
        });
      }
    }

    // Website URL validation
    let finalWebsite = website;
    if (website) {
      const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
      if (!urlRegex.test(website)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid website URL format' 
        });
      }
      // Add https:// if not present
      if (!website.startsWith('http://') && !website.startsWith('https://')) {
        finalWebsite = 'https://' + website;
      }
    }

    console.log('Creating company with data:', {
      user_id: req.user.id,
      company_name,
      email,
      hr_name,
      phone,
      website: finalWebsite,
      status: status || 'active'
    });

    const companyId = await Company.create({
      user_id: req.user.id,
      company_name,
      email,
      hr_name,
      phone,
      website: finalWebsite,
      status: status || 'active'
    });

    console.log('✅ Company created with ID:', companyId);

    const company = await Company.findById(companyId, req.user.id);

    console.log('✅ Company retrieved:', company);

    // Direct response instead of using sendSuccess
    return res.status(201).json({
      success: true,
      message: 'Company added successfully',
      data: { company }
    });

  } catch (error) {
    console.error('❌ Error in createCompany:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create company'
    });
  }
};
// Update company (ENHANCED with validation)
exports.updateCompany = async (req, res, next) => {
  try {
    const { company_name, email, hr_name, phone, website, status } = req.body;

    // Check if company exists
    const existing = await Company.findById(req.params.id, req.user.id);
    if (!existing) {
      return sendError(res, MESSAGES.COMPANY_NOT_FOUND, 404);
    }

    // Required field validation
    if (!company_name || !email) {
      return sendError(res, 'Company name and email are required');
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendError(res, 'Invalid email format');
    }

    // Phone validation (ADDED)
    if (phone) {
      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
      if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
        return sendError(res, 'Invalid phone number format');
      }
    }

    // Website URL validation (ADDED)
    if (website) {
      const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
      if (!urlRegex.test(website)) {
        return sendError(res, 'Invalid website URL format');
      }
      // Add https:// if not present
      if (!website.startsWith('http://') && !website.startsWith('https://')) {
        req.body.website = 'https://' + website;
      }
    }

    const company = await Company.update(req.params.id, req.user.id, {
      company_name,
      email,
      hr_name,
      phone,
      website: req.body.website,
      status: status || existing.status
    });

    sendSuccess(res, MESSAGES.COMPANY_UPDATED, { company });
  } catch (error) {
    next(error);
  }
};

// Delete company
exports.deleteCompany = async (req, res, next) => {
  try {
    const deleted = await Company.delete(req.params.id, req.user.id);

    if (!deleted) {
      return sendError(res, MESSAGES.COMPANY_NOT_FOUND, 404);
    }

    sendSuccess(res, MESSAGES.COMPANY_DELETED);
  } catch (error) {
    next(error);
  }
};

// Bulk delete companies
exports.bulkDeleteCompanies = async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return sendError(res, 'Please provide company IDs to delete');
    }

    const deletedCount = await Company.bulkDelete(ids, req.user.id);

    sendSuccess(res, `${deletedCount} companies deleted successfully`, {
      deletedCount
    });
  } catch (error) {
    next(error);
  }
};

// Get company statistics
exports.getCompanyStats = async (req, res, next) => {
  try {
    const stats = await Company.getStats(req.user.id);

    sendSuccess(res, 'Statistics retrieved successfully', { stats });
  } catch (error) {
    next(error);
  }
};

// Import companies (CSV/bulk)
exports.importCompanies = async (req, res, next) => {
  try {
    const { companies } = req.body;

    if (!companies || !Array.isArray(companies) || companies.length === 0) {
      return sendError(res, 'Please provide companies data');
    }

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const companyData of companies) {
      try {
        // Validate each company before import
        if (!companyData.company_name || !companyData.email) {
          results.push({ 
            company_name: companyData.company_name || 'Unknown', 
            status: 'failed',
            error: 'Missing required fields'
          });
          errorCount++;
          continue;
        }

        const companyId = await Company.create({
          user_id: req.user.id,
          ...companyData,
          status: companyData.status || 'active'
        });
        
        results.push({ 
          company_name: companyData.company_name, 
          status: 'success',
          id: companyId
        });
        successCount++;
      } catch (error) {
        results.push({ 
          company_name: companyData.company_name, 
          status: 'failed',
          error: error.message
        });
        errorCount++;
      }
    }

    sendSuccess(res, `Import completed: ${successCount} success, ${errorCount} failed`, {
      results,
      summary: { successCount, errorCount, total: companies.length }
    });
  } catch (error) {
    next(error);
  }
};