import express from 'express';
import { getNotifications, markAsRead, markAllAsRead, deleteNotification, clearAllNotifications } from '../controllers/Notification/notificationController.js';

const router = express.Router();

router.get('/:userId', getNotifications);
router.put('/:id/read', markAsRead);
router.put('/read-all/user', markAllAsRead);
router.delete('/clear/user/:userId', clearAllNotifications);
router.delete('/:id', deleteNotification);

export default router;
