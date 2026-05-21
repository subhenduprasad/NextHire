import Post from '../models/Post.js';
import User from '../models/User.js';
import { createNotification } from '../utils/createNotification.js';

// Get all posts (feed)
export const getPosts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const totalPosts = await Post.countDocuments({ isHidden: { $ne: true } });
        const hasMore = skip + limit < totalPosts;

        const posts = await Post.find({ isHidden: { $ne: true } })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('userId', 'userName profilePhoto role companyId')
            .populate('comments.userId', 'userName profilePhoto role');
        
        const populatedPosts = await Post.populate(posts, {
            path: 'userId.companyId',
            select: 'companyName'
        });

        res.status(200).json({ success: true, posts: populatedPosts, hasMore });
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch posts' });
    }
};

// Get posts by a specific user or employer
export const getUserPosts = async (req, res) => {
    try {
        const { userId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const totalPosts = await Post.countDocuments({ userId });
        const hasMore = skip + limit < totalPosts;

        const posts = await Post.find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('userId', 'userName profilePhoto role companyId')
            .populate('comments.userId', 'userName profilePhoto role');
            
        const populatedPosts = await Post.populate(posts, {
            path: 'userId.companyId',
            select: 'companyName'
        });

        res.status(200).json({ success: true, posts: populatedPosts, hasMore });
    } catch (error) {
        console.error('Error fetching user posts:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch user posts' });
    }
};

// Create a post
export const createPost = async (req, res) => {
    try {
        const { userId, content, images, pdfs } = req.body;
        
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }

        const newPost = new Post({
            userId,
            content: content || "",
            images: images || [],
            pdfs: pdfs || []
        });

        const savedPost = await newPost.save();
        
        const populatedPost = await Post.findById(savedPost._id)
            .populate('userId', 'userName profilePhoto role companyId')
            .populate('comments.userId', 'userName profilePhoto role');
            
        const finalPost = await Post.populate(populatedPost, {
            path: 'userId.companyId',
            select: 'companyName'
        });

        if (global.io) {
            global.io.emit('postCreated', { post: finalPost });
        }

        res.status(201).json({ success: true, message: 'Post created successfully', post: finalPost });
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ success: false, message: 'Failed to create post' });
    }
};

// Like/Unlike a post
export const toggleLike = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        const isLiked = post.likes.some(uid => uid.toString() === userId.toString());
        if (isLiked) {
            post.likes = post.likes.filter(uid => uid.toString() !== userId.toString());
        } else {
            post.likes.push(userId);
        }

        await post.save();

        if (!isLiked) {
            const likingUser = await User.findById(userId);
            const postSnippet = post.content ? `"${post.content.substring(0, 30)}${post.content.length > 30 ? '...' : ''}"` : 'your post';
            await createNotification({
                recipient: post.userId,
                sender: userId,
                title: 'Liked your post',
                message: `${likingUser?.userName || 'Someone'} liked ${postSnippet}`,
                type: 'like',
                relatedId: post._id
            });
        }

        if (global.io) {
            global.io.emit('postLiked', { postId: id, likes: post.likes });
        }

        res.status(200).json({ success: true, likes: post.likes });
    } catch (error) {
        console.error('Error toggling like:', error);
        res.status(500).json({ success: false, message: 'Failed to toggle like' });
    }
};

// Comment on a post
export const addComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, text } = req.body;

        if (!text) {
            return res.status(400).json({ success: false, message: 'Comment text is required' });
        }

        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        const newComment = { userId, text };
        post.comments.push(newComment);
        await post.save();

        const commentingUser = await User.findById(userId);
        const postSnippet = post.content ? `"${post.content.substring(0, 30)}${post.content.length > 30 ? '...' : ''}"` : 'your post';
        await createNotification({
            recipient: post.userId,
            sender: userId,
            title: 'Commented on your post',
            message: `${commentingUser?.userName || 'Someone'} commented: "${text.substring(0, 40)}${text.length > 40 ? '...' : ''}" on ${postSnippet}`,
            type: 'comment',
            relatedId: post._id
        });

        const updatedPost = await Post.findById(id).populate('comments.userId', 'userName profilePhoto role');

        if (global.io) {
            global.io.emit('postCommented', { postId: id, comments: updatedPost.comments });
        }

        res.status(200).json({ success: true, comments: updatedPost.comments });
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ success: false, message: 'Failed to add comment' });
    }
};

// Delete a comment from a post
export const deleteComment = async (req, res) => {
    try {
        const { id, commentId } = req.params;
        const { userId } = req.body;

        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        const comment = post.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ success: false, message: 'Comment not found' });
        }

        // Allow deletion if the user is the comment author OR the post owner
        if (comment.userId.toString() !== userId && post.userId.toString() !== userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized to delete this comment' });
        }

        post.comments.pull(commentId);
        await post.save();

        const updatedPost = await Post.findById(id).populate('comments.userId', 'userName profilePhoto role');

        if (global.io) {
            global.io.emit('postCommented', { postId: id, comments: updatedPost.comments });
        }

        res.status(200).json({ success: true, comments: updatedPost.comments });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ success: false, message: 'Failed to delete comment' });
    }
};

// Delete post
export const deletePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        if (post.userId.toString() !== userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized to delete this post' });
        }

        await Post.findByIdAndDelete(id);

        if (global.io) {
            global.io.emit('postDeleted', { postId: id });
        }

        res.status(200).json({ success: true, message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ success: false, message: 'Failed to delete post' });
    }
};

// Toggle Save post
export const toggleSavePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const postIndex = user.savedPosts.findIndex(postId => postId.toString() === id);
        
        let isSaved;
        if (postIndex > -1) {
            user.savedPosts.splice(postIndex, 1);
            isSaved = false;
        } else {
            user.savedPosts.push(id);
            isSaved = true;
        }

        await user.save();
        res.status(200).json({ success: true, savedPosts: user.savedPosts, isSaved });
    } catch (error) {
        console.error('Error toggling save post:', error);
        res.status(500).json({ success: false, message: 'Failed to toggle save post' });
    }
};

// Get liked posts by user
export const getLikedPosts = async (req, res) => {
    try {
        const { userId } = req.params;
        const posts = await Post.find({ likes: userId })
            .sort({ createdAt: -1 })
            .populate('userId', 'userName profilePhoto role companyId')
            .populate('comments.userId', 'userName profilePhoto role');
            
        const populatedPosts = await Post.populate(posts, {
            path: 'userId.companyId',
            select: 'companyName'
        });

        res.status(200).json({ success: true, posts: populatedPosts });
    } catch (error) {
        console.error('Error fetching liked posts:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch liked posts' });
    }
};

// Get commented posts by user
export const getCommentedPosts = async (req, res) => {
    try {
        const { userId } = req.params;
        const posts = await Post.find({ 'comments.userId': userId })
            .sort({ createdAt: -1 })
            .populate('userId', 'userName profilePhoto role companyId')
            .populate('comments.userId', 'userName profilePhoto role');
            
        const populatedPosts = await Post.populate(posts, {
            path: 'userId.companyId',
            select: 'companyName'
        });

        res.status(200).json({ success: true, posts: populatedPosts });
    } catch (error) {
        console.error('Error fetching commented posts:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch commented posts' });
    }
};

// Get saved posts by user
export const getSavedPosts = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const posts = await Post.find({ _id: { $in: user.savedPosts } })
            .sort({ createdAt: -1 })
            .populate('userId', 'userName profilePhoto role companyId')
            .populate('comments.userId', 'userName profilePhoto role');
            
        const populatedPosts = await Post.populate(posts, {
            path: 'userId.companyId',
            select: 'companyName'
        });

        res.status(200).json({ success: true, posts: populatedPosts });
    } catch (error) {
        console.error('Error fetching saved posts:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch saved posts' });
    }
};

// Get single post by ID
export const getPostById = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await Post.findById(id)
            .populate('userId', 'userName profilePhoto role companyId')
            .populate('comments.userId', 'userName profilePhoto role');
            
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        const populatedPost = await Post.populate(post, {
            path: 'userId.companyId',
            select: 'companyName'
        });

        res.status(200).json({ success: true, post: populatedPost });
    } catch (error) {
        console.error('Error fetching post by id:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch post' });
    }
};

// Edit post
export const editPost = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, content } = req.body;

        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        if (post.userId.toString() !== userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized to edit this post' });
        }

        post.content = content;
        await post.save();

        const populatedPost = await Post.findById(post._id)
            .populate('userId', 'userName profilePhoto role companyId')
            .populate('comments.userId', 'userName profilePhoto role');
            
        const finalPost = await Post.populate(populatedPost, {
            path: 'userId.companyId',
            select: 'companyName'
        });

        if (global.io) {
            global.io.emit('postEdited', { post: finalPost });
        }

        res.status(200).json({ success: true, message: 'Post updated successfully', post: finalPost });
    } catch (error) {
        console.error('Error editing post:', error);
        res.status(500).json({ success: false, message: 'Failed to edit post' });
    }
};

// Toggle Hide post
export const toggleHidePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        if (post.userId.toString() !== userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized to hide this post' });
        }

        post.isHidden = !post.isHidden;
        await post.save();

        res.status(200).json({ success: true, message: post.isHidden ? 'Post hidden successfully' : 'Post unhidden successfully', isHidden: post.isHidden });
    } catch (error) {
        console.error('Error hiding post:', error);
        res.status(500).json({ success: false, message: 'Failed to hide post' });
    }
};
