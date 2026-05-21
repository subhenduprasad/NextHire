import Notification from '../models/Notification.js';

/**
 * Creates a notification in the database and broadcasts it in real-time via Socket.io
 * @param {Object} params
 * @param {string} params.recipient - The recipient's user ID
 * @param {string} [params.sender] - The sender's user ID (optional)
 * @param {string} params.title - Notification title
 * @param {string} params.message - Notification body/message
 * @param {string} params.type - Notification type ('like', 'comment', 'follow', 'connection', 'job_alert', 'application_update', 'system')
 * @param {string} [params.relatedId] - Related object ID (Job, Post, User, or Company)
 */
export const createNotification = async ({ recipient, sender, title, message, type, relatedId }) => {
    try {
        // Prevent self-notification
        if (sender && sender.toString() === recipient.toString()) {
            return null;
        }

        const notification = new Notification({
            recipient,
            sender,
            title,
            message,
            type,
            relatedId
        });

        await notification.save();

        let populatedNotification = notification;
        if (sender) {
            populatedNotification = await Notification.findById(notification._id)
                .populate('sender', 'userName profilePhoto role');
        }

        // Push real-time event via Socket.io if global.io is available
        if (global.io && global.onlineUsers) {
            const recipientSocketIds = global.onlineUsers.get(recipient.toString());
            if (recipientSocketIds && recipientSocketIds.size > 0) {
                recipientSocketIds.forEach(socketId => {
                    global.io.to(socketId).emit('getNotification', populatedNotification);
                });
            }
        }

        return populatedNotification;
    } catch (error) {
        console.error('Error creating notification:', error);
        return null;
    }
};

export default createNotification;
