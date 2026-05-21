import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
    {
        members: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }],
        lastMessage: {
            text: { type: String },
            senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            isRead: { type: Boolean, default: false },
            status: { type: String, enum: ['sent', 'delivered', 'seen'], default: 'sent' }
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false
        }
    },
    { timestamps: true }
);

const Chat = mongoose.model("Chat", chatSchema);
export default Chat;
