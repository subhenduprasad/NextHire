import Chat from '../models/Chat.js';
import User from '../models/User.js';
import Message from '../models/Message.js';
import ogs from 'open-graph-scraper';

export const createChat = async (req, res) => {
    try {
        const { receiverId } = req.body;
        const senderId = req.userId;

        // Verify that the receiver user exists and is not deleted
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ success: false, error: 'Cannot initiate chat: receiver account has been deleted or does not exist.' });
        }

        // Check if chat already exists
        const existingChat = await Chat.findOne({
            members: { $all: [senderId, receiverId] }
        }).populate({
            path: 'members',
            select: 'firstName lastName profilePhoto role companyId',
            populate: {
                path: 'companyId',
                select: 'companyName companyLogo'
            }
        });

        if (existingChat) {
            // If the chat is blank (no message sent yet), update createdBy to the current senderId
            // so that this initiator is guaranteed to see it in their chat list.
            if (!existingChat.lastMessage || !existingChat.lastMessage.senderId) {
                existingChat.createdBy = senderId;
                await existingChat.save();
            }
            return res.status(200).json({ success: true, data: existingChat });
        }

        const newChat = new Chat({
            members: [senderId, receiverId],
            createdBy: senderId
        });

        const savedChat = await newChat.save();
        const populatedChat = await Chat.findById(savedChat._id).populate({
            path: 'members',
            select: 'firstName lastName profilePhoto role companyId',
            populate: {
                path: 'companyId',
                select: 'companyName companyLogo'
            }
        });
        
        res.status(201).json({ success: true, data: populatedChat });

    } catch (error) {
        console.error('Error creating chat:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

export const userChats = async (req, res) => {
    try {
        const chats = await Chat.find({
            members: { $in: [req.userId] },
            $or: [
                { "lastMessage.senderId": { $ne: null } },
                { createdBy: req.userId },
                { "lastMessage.text": "" } // Handles cleared chats explicitly
            ]
        })
        .populate({
            path: 'members',
            select: 'firstName lastName profilePhoto role companyId',
            populate: {
                path: 'companyId',
                select: 'companyName companyLogo'
            }
        })
        .sort({ updatedAt: -1 });

        // Gracefully handle deleted members by converting to objects and replacing null values
        const processedChats = chats.map(chat => {
            const chatObj = chat.toObject();
            
            chatObj.members = chatObj.members.map((member, index) => {
                if (!member) {
                    return {
                        _id: 'deleted-user-' + index,
                        firstName: 'Deleted',
                        lastName: 'Account',
                        profilePhoto: 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
                        role: 'Inactive',
                        isDeleted: true
                    };
                }
                return member;
            });

            if (chatObj.members.length < 2) {
                const hasCurrentUser = chatObj.members.some(m => m && m._id && m._id.toString() === req.userId);
                const placeholder = {
                    _id: 'deleted-user',
                    firstName: 'Deleted',
                    lastName: 'Account',
                    profilePhoto: 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
                    role: 'Inactive',
                    isDeleted: true
                };
                if (hasCurrentUser) {
                    chatObj.members.push(placeholder);
                } else {
                    chatObj.members.unshift(placeholder);
                }
            }

            return chatObj;
        });

        res.status(200).json({ success: true, data: processedChats });
    } catch (error) {
        console.error('Error fetching user chats:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

export const findChat = async (req, res) => {
    try {
        const chat = await Chat.findOne({
            members: { $all: [req.userId, req.params.secondId] }
        }).populate({
            path: 'members',
            select: 'firstName lastName profilePhoto role companyId',
            populate: {
                path: 'companyId',
                select: 'companyName companyLogo'
            }
        });

        if (!chat) {
            return res.status(200).json({ success: true, data: null });
        }

        const chatObj = chat.toObject();
        chatObj.members = chatObj.members.map((member, index) => {
            if (!member) {
                return {
                    _id: 'deleted-user-' + index,
                    firstName: 'Deleted',
                    lastName: 'Account',
                    profilePhoto: 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
                    role: 'Inactive',
                    isDeleted: true
                };
            }
            return member;
        });

        if (chatObj.members.length < 2) {
            const hasCurrentUser = chatObj.members.some(m => m && m._id && m._id.toString() === req.userId);
            const placeholder = {
                _id: 'deleted-user',
                firstName: 'Deleted',
                lastName: 'Account',
                profilePhoto: 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
                role: 'Inactive',
                isDeleted: true
            };
            if (hasCurrentUser) {
                chatObj.members.push(placeholder);
            } else {
                chatObj.members.unshift(placeholder);
            }
        }

        res.status(200).json({ success: true, data: chatObj });
    } catch (error) {
        console.error('Error finding chat:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

export const getUnreadCount = async (req, res) => {
    try {
        const count = await Chat.countDocuments({
            members: { $in: [req.userId] },
            'lastMessage.isRead': false,
            'lastMessage.senderId': { $ne: req.userId }
        });
        res.status(200).json({ success: true, data: count });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

export const getOgPreview = async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) {
            return res.status(400).json({ success: false, error: 'URL parameter is required' });
        }

        const options = { url };
        const { error, result } = await ogs(options);

        if (error) {
            return res.status(500).json({ success: false, error: 'Failed to fetch OpenGraph metadata' });
        }

        res.status(200).json({ success: true, data: result });
    } catch (err) {
        console.error('Error fetching OG preview:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

export const deleteChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.userId;

        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ success: false, error: 'Chat not found' });
        }

        // Verify that the requester is a member of the chat
        if (!chat.members.some(memberId => memberId.toString() === userId.toString())) {
            return res.status(403).json({ success: false, error: 'Unauthorized to delete this conversation' });
        }

        // Delete all messages associated with the chat
        await Message.deleteMany({ chatId });

        // Delete the chat itself
        await Chat.findByIdAndDelete(chatId);

        // Emit real-time socket event
        if (global.io) {
            global.io.emit('conversationDeleted', { chatId });
        }

        res.status(200).json({ success: true, message: 'Conversation deleted successfully' });
    } catch (error) {
        console.error('Error deleting chat:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

export const clearChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.userId;

        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ success: false, error: 'Chat not found' });
        }

        // Verify that the requester is a member of the chat
        if (!chat.members.some(memberId => memberId.toString() === userId.toString())) {
            return res.status(403).json({ success: false, error: 'Unauthorized to clear this conversation' });
        }

        // Delete all messages associated with the chat
        await Message.deleteMany({ chatId });

        // Reset the last message details in the chat session
        chat.lastMessage = {
            text: "",
            senderId: null,
            isRead: true,
            status: 'seen'
        };
        await chat.save();

        // Emit real-time socket event
        if (global.io) {
            global.io.emit('chatHistoryCleared', { chatId });
        }

        res.status(200).json({ success: true, message: 'Chat history cleared successfully' });
    } catch (error) {
        console.error('Error clearing chat:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};
