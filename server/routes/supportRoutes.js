import express from 'express';
import { handleContactSubmit } from '../controllers/supportController.js';

const router = express.Router();

// Public route to submit support contact form
router.post('/contact', handleContactSubmit);

export default router;
