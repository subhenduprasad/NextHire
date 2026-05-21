import express from 'express';
import { createChat, userChats, findChat, getUnreadCount, getOgPreview, deleteChat, clearChat } from '../controllers/ChatController.js';
import { authenticate } from '../middleware/VerifyToken.js';

const router = express.Router();

router.get('/unread-count', authenticate, getUnreadCount);
router.get('/og-preview', authenticate, getOgPreview);
router.post('/', authenticate, createChat);
router.get('/', authenticate, userChats);
router.get('/find/:secondId', authenticate, findChat);
router.delete('/:chatId', authenticate, deleteChat);
router.delete('/:chatId/clear', authenticate, clearChat);

export default router;
