const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes are protected
router.use(authMiddleware);

router.get('/', companyController.getAllCompanies);
router.get('/stats', companyController.getCompanyStats);
router.get('/:id', companyController.getCompanyById);
router.post('/', companyController.createCompany);
router.post('/import', companyController.importCompanies);
router.put('/:id', companyController.updateCompany);
router.delete('/:id', companyController.deleteCompany);
router.post('/bulk-delete', companyController.bulkDeleteCompanies);

module.exports = router;