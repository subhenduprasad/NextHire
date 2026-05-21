import express from 'express';
import {
    createCompany,
    getAllCompanies,
    getCompanyById,
    getCompanyByEmployer,
    updateCompany,
    addTeamMember,
    removeTeamMember,
    getMyCompany,
    toggleConnectUser,
    getCompanyNetwork
} from '../controllers/Company/companyController.js';
import { authenticate } from '../middleware/VerifyToken.js';

const router = express.Router();

// Public routes
router.get('/all-companies', getAllCompanies);
router.get('/company/:id', getCompanyById);
router.get('/by-employer/:employerId', getCompanyByEmployer);

// Protected routes (require authentication)
router.post('/create', authenticate, createCompany);
router.put('/update/:id', authenticate, updateCompany);
router.post('/add-member/:id', authenticate, addTeamMember);
router.post('/remove-member/:id', authenticate, removeTeamMember);
router.get('/my-company', authenticate, getMyCompany);
router.put('/:id/connect', authenticate, toggleConnectUser);
router.get('/:id/network', getCompanyNetwork);

export default router;
