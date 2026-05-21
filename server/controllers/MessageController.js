import Message from '../models/Message.js';
import Chat from '../models/Chat.js';
import User from '../models/User.js';

export const addMessage = async (req, res) => {
    const { chatId, text } = req.body;
    const senderId = req.userId;

    try {
        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ success: false, error: 'Chat not found' });
        }

        // Verify all members of the chat still exist in the database
        const memberCount = await User.countDocuments({ _id: { $in: chat.members } });
        if (memberCount < chat.members.length) {
            return res.status(400).json({ success: false, error: 'Cannot send message: one or more participants have deleted their accounts.' });
        }

        const message = new Message({
            chatId,
            senderId,
            text
        });

        const savedMessage = await message.save();
        
        // Update the chat's last message and updatedAt timestamp
        await Chat.findByIdAndUpdate(chatId, {
            lastMessage: {
                text,
                senderId,
                isRead: false,
                status: 'sent'
            }
        }, { new: true });

        res.status(200).json({ success: true, data: savedMessage });
    } catch (error) {
        console.error('Error adding message:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

export const getMessages = async (req, res) => {
    const { chatId } = req.params;

    try {
        const messages = await Message.find({ chatId }).sort({ createdAt: 1 });
        res.status(200).json({ success: true, data: messages });
    } catch (error) {
        console.error('Error getting messages:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

export const updateMessageStatus = async (req, res) => {
    const { chatId } = req.params;
    const { status } = req.body;
    const userId = req.userId;

    if (!['delivered', 'seen'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    try {
        // Update all messages in this chat where the sender is NOT the current user
        // and the status is 'less' than the target status.
        // For simplicity, we just update all messages not from current user to this status if they aren't already seen.
        
        const filter = {
            chatId,
            senderId: { $ne: userId }
        };

        if (status === 'delivered') {
            filter.status = 'sent'; // Only update sent to delivered
        } else if (status === 'seen') {
            filter.status = { $in: ['sent', 'delivered'] }; // Update both sent and delivered to seen
        }

        await Message.updateMany(filter, { $set: { status, isRead: status === 'seen' } });

        // Update the chat's last message status if the last message is from the other user
        const chat = await Chat.findById(chatId);
        if (chat && chat.lastMessage && chat.lastMessage.senderId.toString() !== userId) {
            // Only upgrade status, don't downgrade
            const currentStatus = chat.lastMessage.status;
            if (status === 'seen' || (status === 'delivered' && currentStatus === 'sent')) {
                chat.lastMessage.status = status;
                if (status === 'seen') chat.lastMessage.isRead = true;
                await chat.save();
            }
        }

        res.status(200).json({ success: true, message: `Messages marked as ${status}` });
    } catch (error) {
        console.error('Error updating message status:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};
