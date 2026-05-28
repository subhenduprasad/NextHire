import express from 'express';
import rateLimit from 'express-rate-limit';
import { login, logout, register, getCurrentUser, sendRegisterOtp, sendLoginOtp, sendPasswordResetOtp, resetPassword, sendDeleteAccountOtp } from '../controllers/Auth/Auth.js';
import { authenticate } from '../middleware/VerifyToken.js';

const router = express.Router();

const otpLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 3, // Limit each IP to 3 OTP requests per windowMs
    message: { success: false, error: 'Too many OTP requests from this IP, please try again after 5 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
    // Required when deployed behind a reverse proxy (e.g., Render, Nginx)
    validate: { xForwardedForHeader: false },
});

// Public routes
import multer from 'multer';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const cpUpload = upload.fields([
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'bannerPhoto', maxCount: 1 }
]);

router.post('/send-login-otp', otpLimiter, sendLoginOtp);
router.post('/login', login); 
router.post('/logout', logout); 
router.post('/send-register-otp', otpLimiter, sendRegisterOtp);
router.post('/register', cpUpload, register);
router.post('/send-password-reset-otp', otpLimiter, sendPasswordResetOtp);
router.post('/reset-password', resetPassword);
router.post('/send-delete-otp', otpLimiter, sendDeleteAccountOtp);

// Protected routes
router.get('/me', authenticate, getCurrentUser);
router.get('/validuser', authenticate, getCurrentUser);

export default router;