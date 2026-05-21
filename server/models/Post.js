import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
}, { timestamps: true });

const PostSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, default: "" },
    images: { type: [String], default: [] },
    pdfs: {
        type: [{
            url: String,
            filename: String
        }],
        default: []
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [CommentSchema],
    isHidden: { type: Boolean, default: false }
}, { timestamps: true });

const Post = mongoose.model('Post', PostSchema);

export default Post;
