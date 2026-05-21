import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LoginContext } from '../components/ContextProvider/Context';
import PostCard from '../components/Feed/PostCard';
import { toast } from 'react-toastify';

export const SinglePost = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { loginData } = useContext(LoginContext);
    const [post, setPost] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchPost();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

    const fetchPost = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/posts/${id}`);
            const data = await response.json();
            
            if (response.ok && data.success) {
                setPost(data.post);
            } else {
                toast.error(data.message || 'Failed to fetch post');
                navigate('/feed'); // Redirect to feed if post not found
            }
        } catch (error) {
            console.error('Error fetching post:', error);
            toast.error('An error occurred while fetching the post');
            navigate('/feed');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePostUpdated = (data, action) => {
        if (action === 'delete') {
            navigate('/activity'); 
        } else if (action === 'update') {
            setPost(data);
        }
    };

    const handleBack = () => {
        if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);
        } else {
            navigate('/feed');
        }
    };

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-slate-900 pt-20 pb-12 transition-colors duration-300">
            <div className="max-w-3xl mx-auto px-4 md:px-0">
                {/* Header / Back Button */}
                <div className="mb-6 animate-slide-up flex items-center">
                    <button 
                        onClick={handleBack} 
                        className="flex items-center gap-2 text-neutral-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm border border-neutral-100 dark:border-slate-700/50"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span className="font-semibold text-sm">Back</span>
                    </button>
                    <h1 className="ml-4 text-xl font-bold text-neutral-800 dark:text-white">Post</h1>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="spinner border-t-primary w-10 h-10"></div>
                    </div>
                ) : post ? (
                    <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        <PostCard 
                            post={post}
                            onPostUpdated={handlePostUpdated}
                        />
                    </div>
                ) : null}
            </div>
        </div>
    );
};
