import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { LoginContext } from '../components/ContextProvider/Context';
import CreatePost from '../components/Feed/CreatePost';
import PostCard from '../components/Feed/PostCard';
import FeedSearchBar from '../components/Feed/FeedSearchBar';
import { toast, ToastContainer } from 'react-toastify';
import { getSocket } from '../utils/socket';

export const Feed = () => {
    const { loginData } = useContext(LoginContext);
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    
    // Pagination states
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const observer = useRef();

    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

    const getPhotoUrl = (path) => {
        if (!path) return '';
        return path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
    };

    const fetchPosts = async (currentPage) => {
        if (currentPage === 1) setIsLoading(true);
        else setIsFetchingMore(true);

        try {
            const res = await fetch(`${API_BASE_URL}/api/posts?page=${currentPage}&limit=10`);
            const data = await res.json();
            if (res.ok && data.success) {
                if (currentPage === 1) {
                    setPosts(data.posts);
                } else {
                    setPosts(prev => [...prev, ...data.posts]);
                }
                setHasMore(data.hasMore);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            toast.error("Failed to fetch feed.");
            console.error('Fetch feed error:', error);
        } finally {
            setIsLoading(false);
            setIsFetchingMore(false);
        }
    };

    useEffect(() => {
        fetchPosts(page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, API_BASE_URL]);

    // Real-time synchronization for Feed posts creation, editing, and deletion using Socket.io
    useEffect(() => {
        const socket = getSocket(loginData?._id);
        if (!socket) return;

        const handlePostCreatedEvent = (data) => {
            // Add the new post to the list if it doesn't already exist
            setPosts(prev => {
                if (prev.some(p => p._id?.toString() === data.post?._id?.toString())) return prev;
                return [data.post, ...prev];
            });
        };

        const handlePostEditedEvent = (data) => {
            setPosts(prev => prev.map(p => p._id === data.post._id ? data.post : p));
        };

        const handlePostDeletedEvent = (data) => {
            setPosts(prev => prev.filter(p => p._id !== data.postId));
        };

        socket.on('postCreated', handlePostCreatedEvent);
        socket.on('postEdited', handlePostEditedEvent);
        socket.on('postDeleted', handlePostDeletedEvent);

        return () => {
            socket.off('postCreated', handlePostCreatedEvent);
            socket.off('postEdited', handlePostEditedEvent);
            socket.off('postDeleted', handlePostDeletedEvent);
        };
    }, [loginData?._id]);

    const lastPostElementRef = useCallback(node => {
        if (isLoading || isFetchingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [isLoading, isFetchingMore, hasMore]);

    const handlePostCreated = (newPost) => {
        setPosts(prev => {
            if (prev.some(p => p._id?.toString() === newPost?._id?.toString())) return prev;
            return [newPost, ...prev];
        });
        setIsPostModalOpen(false);
    };

    const handlePostUpdated = (data, action) => {
        if (action === 'delete') {
            setPosts(prev => prev.filter(p => p._id !== data));
        } else if (action === 'update') {
            setPosts(prev => prev.map(p => p._id === data._id ? data : p));
        }
    };

    return (
        <div className="page-wrapper py-8">
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="max-w-2xl mx-auto md:px-0 px-4">
                {/* Global Search Bar */}
                <FeedSearchBar />
                
                {/* Create Post Trigger */}
                {loginData && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-neutral-200 dark:border-slate-700 mb-6">
                        <div className="flex gap-3">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-100 dark:bg-slate-700 shrink-0">
                                {loginData.profilePhoto ? (
                                    <img src={getPhotoUrl(loginData.profilePhoto)} alt="Avatar" className="w-full h-full object-cover" />
                                ) : loginData.companyId?.companyLogo ? (
                                    <img src={getPhotoUrl(loginData.companyId.companyLogo)} alt="Company Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center font-bold text-neutral-400">
                                        {loginData.userName?.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <button 
                                onClick={() => setIsPostModalOpen(true)}
                                className="flex-1 text-left px-5 py-3 bg-neutral-100 dark:bg-slate-700/50 hover:bg-neutral-200 dark:hover:bg-slate-700 transition-colors rounded-full text-neutral-500 dark:text-slate-400 border border-neutral-200 dark:border-slate-600 outline-none"
                            >
                                Start a post
                            </button>
                        </div>
                        <div className="flex justify-around mt-3 pt-3 border-t border-neutral-100 dark:border-slate-700/50">
                            <button onClick={() => setIsPostModalOpen(true)} className="flex items-center gap-2 px-3 py-2 text-neutral-600 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-700/50 rounded-xl font-medium transition-colors text-sm">
                                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                Media
                            </button>
                            <button onClick={() => setIsPostModalOpen(true)} className="flex items-center gap-2 px-3 py-2 text-neutral-600 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-700/50 rounded-xl font-medium transition-colors text-sm">
                                <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                Document
                            </button>
                        </div>
                    </div>
                )}

                {/* Create Post Modal Overlay */}
                {isPostModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                        <div className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                            <div className="flex justify-between items-center p-4 border-b border-neutral-100 dark:border-slate-700">
                                <h2 className="text-xl font-bold dark:text-white">Create a post</h2>
                                <button 
                                    onClick={() => setIsPostModalOpen(false)}
                                    className="p-2 hover:bg-neutral-100 dark:hover:bg-slate-700 rounded-full transition-colors text-neutral-500 border-none outline-none"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                                </button>
                            </div>
                            <div className="overflow-y-auto p-4 custom-scrollbar">
                                <CreatePost onPostCreated={handlePostCreated} />
                            </div>
                        </div>
                    </div>
                )}

                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <div className="spinner border-t-primary w-12 h-12 inline-block rounded-full border-4 border-solid border-r-transparent align-[-0.125em] animate-spin"></div>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="card p-12 flex flex-col items-center justify-center text-center bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-neutral-200 dark:border-slate-700">
                        <svg className="w-16 h-16 text-neutral-300 dark:text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15M9 11l3 3m0 0l3-3m-3 3V8" /></svg>
                        <h3 className="text-xl font-bold text-neutral-800 dark:text-slate-200 mb-2">No posts yet</h3>
                        <p className="text-neutral-500 dark:text-slate-400">Be the first to share an update or document with the community.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {posts.map((post, index) => {
                            if (posts.length === index + 1) {
                                return (
                                    <div ref={lastPostElementRef} key={post._id}>
                                        <PostCard post={post} onPostUpdated={handlePostUpdated} />
                                    </div>
                                );
                            } else {
                                return <PostCard key={post._id} post={post} onPostUpdated={handlePostUpdated} />;
                            }
                        })}
                        {isFetchingMore && (
                            <div className="flex justify-center p-4">
                                <div className="spinner border-t-primary w-8 h-8 inline-block rounded-full border-4 border-solid border-r-transparent align-[-0.125em] animate-spin"></div>
                            </div>
                        )}
                        {!hasMore && posts.length > 0 && (
                            <p className="text-center text-neutral-500 dark:text-slate-400 py-4">No more posts to load.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
