import express from 'express';
import { getPosts, getUserPosts, createPost, toggleLike, addComment, deleteComment, deletePost, toggleSavePost, getLikedPosts, getSavedPosts, getCommentedPosts, getPostById, editPost, toggleHidePost } from '../controllers/postController.js';

const router = express.Router();

router.get('/', getPosts);
router.get('/user/:userId', getUserPosts);
router.get('/user/:userId/liked', getLikedPosts);
router.get('/user/:userId/saved', getSavedPosts);
router.get('/user/:userId/commented', getCommentedPosts);
router.get('/:id', getPostById);
router.post('/', createPost);
router.put('/:id', editPost);
router.put('/:id/like', toggleLike);
router.put('/:id/hide', toggleHidePost);
router.post('/:id/comment', addComment);
router.delete('/:id/comment/:commentId', deleteComment);
router.delete('/:id', deletePost);
router.put('/:id/save', toggleSavePost);

export default router;
