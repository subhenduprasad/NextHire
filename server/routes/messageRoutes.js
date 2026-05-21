import express from 'express';
import { addMessage, getMessages, updateMessageStatus } from '../controllers/MessageController.js';
import { authenticate } from '../middleware/VerifyToken.js';

const router = express.Router();

router.post('/', authenticate, addMessage);
router.get('/:chatId', authenticate, getMessages);
router.put('/status/:chatId', authenticate, updateMessageStatus);

export default router;
