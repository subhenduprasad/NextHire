import React, { useState, useContext, useEffect } from 'react';
import { LoginContext } from '../components/ContextProvider/Context';
import { Link } from 'react-router-dom';

export const Activity = () => {
    const { loginData } = useContext(LoginContext);
    const [userPosts, setUserPosts] = useState([]);
    const [isLoadingPosts, setIsLoadingPosts] = useState(false);
    const [activeTab, setActiveTab] = useState('posts');

    useEffect(() => {
        const fetchUserPosts = async () => {
            if (!loginData?._id) return;
            setIsLoadingPosts(true);
            try {
                const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
                let endpoint = `${API_BASE_URL}/api/posts/user/${loginData._id}`;
                if (activeTab === 'liked') endpoint += '/liked';
                else if (activeTab === 'commented') endpoint += '/commented';
                else if (activeTab === 'saved') endpoint += '/saved';

                const response = await fetch(endpoint, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem("usertoken")}` }
                });
                const data = await response.json();
                if (response.ok && data.success) {
                    setUserPosts(data.posts);
                }
            } catch (error) {
                console.error("Error fetching user posts:", error);
            } finally {
                setIsLoadingPosts(false);
            }
        };
        fetchUserPosts();
    }, [loginData, activeTab]);

    const getThumbnail = (post) => {
        if (post.images && post.images.length > 0) {
            return (
                <img src={post.images[0]} alt="Post" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            );
        } else if (post.pdfs && post.pdfs.length > 0) {
            return (
                <div className="w-full h-full bg-red-50 dark:bg-red-900/20 flex flex-col items-center justify-center text-red-500 group-hover:scale-105 transition-transform duration-500">
                    <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 3v6h6" /></svg>
                    <span className="text-xs font-bold text-center px-2 truncate w-full">{post.pdfs[0].filename}</span>
                </div>
            );
        } else {
            return (
                <div className="w-full h-full bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-slate-800 dark:to-slate-700 p-4 flex items-center justify-center text-center group-hover:scale-105 transition-transform duration-500">
                    <p className="text-xs text-neutral-600 dark:text-slate-300 font-medium line-clamp-4">{post.content}</p>
                </div>
            );
        }
    };

    return (
        <div className="page-wrapper py-12 max-w-5xl mx-auto px-4 md:px-0">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <Link to="/profile" className="p-2 bg-white dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 hover:bg-neutral-100 dark:hover:bg-slate-700 rounded-full transition-colors shadow-sm">
                    <svg className="w-5 h-5 text-neutral-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </Link>
                <div className="bg-primary/10 text-primary p-2 rounded-xl">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" /></svg>
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-neutral-800 dark:text-white">My Activity</h1>
                    <p className="text-sm text-neutral-500 dark:text-slate-400">Manage your posts, likes, comments, and saves</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-6 border-b border-neutral-200 dark:border-slate-700/50 scrollbar-hide">
                <button 
                    onClick={() => setActiveTab('posts')} 
                    className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 ${activeTab === 'posts' ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-md' : 'bg-transparent text-neutral-600 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-800'}`}
                >
                    My Posts
                </button>
                <button 
                    onClick={() => setActiveTab('liked')} 
                    className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 flex items-center gap-2 ${activeTab === 'liked' ? 'bg-red-500 text-white shadow-md shadow-red-500/20' : 'bg-transparent text-neutral-600 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-800'}`}
                >
                    <svg className={`w-4 h-4 ${activeTab === 'liked' ? 'fill-white stroke-transparent' : 'fill-none stroke-neutral-600 dark:stroke-slate-300'}`} viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                    Liked
                </button>
                <button 
                    onClick={() => setActiveTab('commented')} 
                    className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 flex items-center gap-2 ${activeTab === 'commented' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'bg-transparent text-neutral-600 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-800'}`}
                >
                    <svg className={`w-4 h-4 ${activeTab === 'commented' ? 'stroke-white' : 'stroke-neutral-600 dark:stroke-slate-300'}`} fill="none" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                    Commented
                </button>
                <button 
                    onClick={() => setActiveTab('saved')} 
                    className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 flex items-center gap-2 ${activeTab === 'saved' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'bg-transparent text-neutral-600 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-800'}`}
                >
                    <svg className={`w-4 h-4 ${activeTab === 'saved' ? 'fill-white stroke-transparent' : 'fill-none stroke-neutral-600 dark:stroke-slate-300'}`} viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                    Saved
                </button>
            </div>

            {/* Grid View */}
            {isLoadingPosts ? (
                <div className="flex justify-center items-center py-20">
                    <div className="spinner border-t-primary w-8 h-8"></div>
                </div>
            ) : userPosts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 md:gap-4">
                    {userPosts.map(post => (
                        <Link 
                            key={post._id} 
                            to={`/post/${post._id}`}
                            className="group aspect-square rounded-xl md:rounded-2xl overflow-hidden relative border border-neutral-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800 hover:shadow-md transition-shadow cursor-pointer block"
                        >
                            {getThumbnail(post)}
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-6 text-white text-base font-bold">
                                <div className="flex items-center gap-2">
                                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                                    <span>{post.likes?.length || 0}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                                    <span>{post.comments?.length || 0}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-24 bg-white dark:bg-slate-800/80 rounded-2xl border border-neutral-100 dark:border-slate-700/50 shadow-soft">
                    <div className="w-20 h-20 bg-neutral-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-neutral-300 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    </div>
                    <h3 className="text-xl font-bold text-neutral-800 dark:text-white mb-2">
                        {activeTab === 'posts' ? 'No Posts Yet' : activeTab === 'liked' ? 'No Liked Posts' : activeTab === 'commented' ? 'No Commented Posts' : 'No Saved Posts'}
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-slate-400 max-w-sm mx-auto">
                        {activeTab === 'posts' ? "You haven't shared anything on your feed yet. Your new posts will appear here." 
                        : activeTab === 'liked' ? "You haven't liked any posts yet. Explore the feed to find interesting content."
                        : activeTab === 'commented' ? "You haven't commented on any posts yet. Join the conversation on the feed."
                        : "You haven't saved any posts yet. Bookmark posts to read them later."}
                    </p>
                    <Link to="/feed" className="inline-block mt-6 px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/20">
                        Go to Feed
                    </Link>
                </div>
            )}
        </div>
    );
};
