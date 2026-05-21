import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { LoginContext } from '../components/ContextProvider/Context';
import { toast, ToastContainer } from 'react-toastify';
import NetworkModal from '../components/NetworkModal';
import PostCard from '../components/Feed/PostCard';
import { ShareModal } from '../components/ShareModal';

export const PublicProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { loginData, updateUser } = useContext(LoginContext);
    
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);
    
    // User Posts
    const [userPosts, setUserPosts] = useState([]);
    const [isLoadingPosts, setIsLoadingPosts] = useState(false);
    
    // Network Modal State
    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', type: '', dataList: [] });
    // View Mode State for posts
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

    // Share Modal State
    const [isShareOpen, setIsShareOpen] = useState(false);

    // Dynamic metadata updates for profile sharing
    useEffect(() => {
        if (!user) return;

        // Save original metadata to restore when component unmounts
        const originalTitle = document.title;
        const metaTags = {
            'description': document.querySelector('meta[name="description"]')?.getAttribute('content'),
            'og:title': document.querySelector('meta[property="og:title"]')?.getAttribute('content'),
            'og:description': document.querySelector('meta[property="og:description"]')?.getAttribute('content'),
            'og:image': document.querySelector('meta[property="og:image"]')?.getAttribute('content'),
            'og:url': document.querySelector('meta[property="og:url"]')?.getAttribute('content'),
            'twitter:title': document.querySelector('meta[name="twitter:title"]')?.getAttribute('content'),
            'twitter:description': document.querySelector('meta[name="twitter:description"]')?.getAttribute('content'),
            'twitter:image': document.querySelector('meta[name="twitter:image"]')?.getAttribute('content'),
            'twitter:url': document.querySelector('meta[name="twitter:url"]')?.getAttribute('content'),
        };

        const title = `${user.userName} | Candidate Profile - NextHire`;
        const desc = `NextHire Candidate Profile - ${user.userName}`;
        const ogImage = `${window.location.origin}/NextHire.png`;
        const currentUrl = window.location.href;

        // Set new metadata
        document.title = title;

        const setOrUpdateMeta = (attribute, value, isProperty = false) => {
            if (!value) return;
            const selector = isProperty ? `meta[property="${attribute}"]` : `meta[name="${attribute}"]`;
            let el = document.querySelector(selector);
            if (!el) {
                el = document.createElement('meta');
                if (isProperty) {
                    el.setAttribute('property', attribute);
                } else {
                    el.setAttribute('name', attribute);
                }
                document.head.appendChild(el);
            }
            el.setAttribute('content', value);
        };

        setOrUpdateMeta('description', desc);
        setOrUpdateMeta('og:title', title, true);
        setOrUpdateMeta('og:description', desc, true);
        setOrUpdateMeta('og:image', ogImage, true);
        setOrUpdateMeta('og:url', currentUrl, true);
        
        // Twitter Card Specifics
        setOrUpdateMeta('twitter:card', 'summary_large_image');
        setOrUpdateMeta('twitter:title', title);
        setOrUpdateMeta('twitter:description', desc);
        setOrUpdateMeta('twitter:image', ogImage);
        setOrUpdateMeta('twitter:url', currentUrl);

        // Cleanup function to restore original tags on unmount
        return () => {
            document.title = originalTitle;
            const restoreMeta = (attribute, value, isProperty = false) => {
                const selector = isProperty ? `meta[property="${attribute}"]` : `meta[name="${attribute}"]`;
                const el = document.querySelector(selector);
                if (el) {
                    if (value) {
                        el.setAttribute('content', value);
                    } else {
                        el.remove();
                    }
                }
            };
            restoreMeta('description', metaTags['description']);
            restoreMeta('og:title', metaTags['og:title'], true);
            restoreMeta('og:description', metaTags['og:description'], true);
            restoreMeta('og:image', metaTags['og:image'], true);
            restoreMeta('og:url', metaTags['og:url'], true);
            restoreMeta('twitter:title', metaTags['twitter:title']);
            restoreMeta('twitter:description', metaTags['twitter:description']);
            restoreMeta('twitter:image', metaTags['twitter:image']);
            restoreMeta('twitter:url', metaTags['twitter:url']);
        };
    }, [user]);

    // Fetch user details
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/users/user/${id}`);
                const result = await response.json();
                
                if (result && result._id) {
                    setUser(result);
                    
                    // Check follow status
                    if (result.followers) {
                        setFollowersCount(result.followers.length);
                        if (loginData && result.followers.includes(loginData._id)) {
                            setIsFollowing(true);
                        }
                    }
                } else {
                    toast.error("User not found");
                }
            } catch (error) {
                console.error("Error fetching user:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) fetchUser();
    }, [id, loginData]);

    // Fetch Posts
    useEffect(() => {
        const fetchUserPosts = async () => {
            if (!id) return;
            setIsLoadingPosts(true);
            try {
                const response = await fetch(`${API_BASE_URL}/api/posts/user/${id}`, {
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
    }, [id]);

    const handleFollow = async () => {
        if (!loginData || !user) {
            toast.warning("Please login to follow");
            return;
        }

        try {
            const endpoint = `${API_BASE_URL}/api/users/user/${user._id}/follow`;
            const response = await fetch(endpoint, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    'Authorization': `Bearer ${localStorage.getItem("usertoken")}`
                },
                body: JSON.stringify({ currentUserId: loginData._id, targetUserId: user._id })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setIsFollowing(data.isFollowing);
                setFollowersCount(data.isFollowing ? followersCount + 1 : followersCount - 1);
                
                // Real-time sync to the context so My Profile reflects it instantly without refresh
                if (data.currentUserFollowing && typeof updateUser === 'function') {
                    updateUser({ following: data.currentUserFollowing });
                }
            } else {
                toast.error(data.message || "Failed to update follow status.");
            }
        } catch (error) {
            console.error("Follow error:", error);
            toast.error("An error occurred.");
        }
    };
    const handleMessage = async () => {
        if (!loginData || !user) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('usertoken')}`
                },
                body: JSON.stringify({ receiverId: user._id })
            });
            const result = await res.json();
            if (res.ok && result.success) {
                navigate('/chat', { state: { chatId: result.data._id } });
            } else {
                toast.error("Failed to start conversation");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        }
    };


    const openNetworkModal = async (type, title) => {
        if (!user) return;
        setModalConfig({ isOpen: true, title, type, dataList: [] });
        try {
            const endpoint = `${API_BASE_URL}/api/users/user/${user._id}/network`;
            const response = await fetch(endpoint);
            const data = await response.json();
            
            if (response.ok && data.success) {
                let list = [];
                if (type === 'followers') list = data.followers || [];
                else if (type === 'following') list = data.following || [];
                setModalConfig({ isOpen: true, title, type, dataList: list });
            } else {
                toast.error("Failed to load network data.");
                setModalConfig(prev => ({ ...prev, isOpen: false }));
            }
        } catch (error) {
            console.error(error);
            toast.error("Error loading network data.");
            setModalConfig(prev => ({ ...prev, isOpen: false }));
        }
    };

    const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
    const getPhotoUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `${API_BASE_URL}${path}`;
    };

    const getThumbnail = (post) => {
        if (post.images && post.images.length > 0) {
            return (
                <div className="w-full h-full relative overflow-hidden">
                    <img src={getPhotoUrl(post.images[0])} alt="Post" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    {post.images.length > 1 && (
                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 z-10">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                            <span>{post.images.length}</span>
                        </div>
                    )}
                </div>
            );
        } else if (post.pdfs && post.pdfs.length > 0) {
            return (
                <div className="w-full h-full bg-gradient-to-br from-rose-500/10 to-orange-500/10 dark:from-rose-950/20 dark:to-orange-950/20 flex flex-col items-center justify-center p-4 border border-rose-100/50 dark:border-rose-900/30 group-hover:scale-105 transition-transform duration-500">
                    <div className="w-14 h-14 bg-rose-500/10 dark:bg-rose-500/20 rounded-2xl flex items-center justify-center text-rose-500 mb-3 shadow-sm border border-rose-500/20">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v6h6" /></svg>
                    </div>
                    <span className="text-xs font-bold text-neutral-800 dark:text-slate-200 text-center px-2 truncate w-full max-w-[140px]">{post.pdfs[0].filename}</span>
                    <span className="text-[10px] text-rose-500 font-bold uppercase mt-1 tracking-wider bg-rose-500/10 px-2 py-0.5 rounded-full">PDF Document</span>
                </div>
            );
        } else {
            return (
                <div className="w-full h-full bg-gradient-to-br from-primary-500/10 via-purple-500/10 to-secondary-500/10 dark:from-primary-950/20 dark:via-purple-950/20 dark:to-secondary-950/20 p-6 flex flex-col justify-between group-hover:scale-105 transition-transform duration-500">
                    <div className="text-primary-500/30 dark:text-primary-400/20 self-start">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.154c-2.41 1.002-3.996 3.638-3.996 5.849h3.999v10h-9.999z" /></svg>
                    </div>
                    <p className="text-xs text-neutral-700 dark:text-slate-200 font-semibold leading-relaxed line-clamp-5 my-auto text-left italic">
                        "{post.content}"
                    </p>
                    <span className="text-[9px] text-neutral-400 dark:text-slate-500 self-end font-medium">Text Post</span>
                </div>
            );
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-neutral-50 dark:bg-slate-900">
                <div className="spinner border-t-primary w-12 h-12"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-neutral-50 dark:bg-slate-900 px-4">
                <div className="bg-white dark:bg-slate-800 shadow-xl border border-neutral-100 dark:border-slate-700 p-8 max-w-md w-full text-center rounded-3xl backdrop-blur-md bg-opacity-80 dark:bg-opacity-80 transition-all duration-300">
                    <div className="w-20 h-20 rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center mx-auto mb-6 text-rose-500 dark:text-rose-400">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" className="animate-[spin_20s_linear_infinite]" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            <line x1="4" y1="20" x2="20" y2="4" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-neutral-800 dark:text-white mb-3">Account Deleted or Inactive</h2>
                    <p className="text-neutral-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
                        This profile is no longer accessible. The user has either permanently deleted their account or it has become inactive.
                    </p>
                    <button 
                        onClick={() => navigate('/feed')}
                        className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-secondary-400 via-primary-500 to-secondary-600 text-white font-bold tracking-wide shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                    >
                        Back to Feed
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-slate-900 pb-12">
            <ToastContainer position="top-right" autoClose={3000} />
            <NetworkModal 
                isOpen={modalConfig.isOpen} 
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })} 
                title={modalConfig.title} 
                dataList={modalConfig.dataList} 
                type={modalConfig.type} 
            />

            {/* Profile Header */}
            <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-neutral-200 dark:border-slate-700">
                <div className="h-48 relative bg-gradient-to-r from-secondary-400 via-primary-500 to-secondary-600 bg-cover bg-center" style={{ backgroundImage: user.bannerPhoto ? `url("${getPhotoUrl(user.bannerPhoto)}")` : undefined }}>
                    <button 
                        onClick={() => navigate('/feed')}
                        className="absolute top-6 left-6 md:left-8 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm transition-all"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div className="absolute -bottom-16 left-8 md:left-24">
                        <div className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-800 bg-white shadow-lg overflow-hidden flex items-center justify-center">
                            {user.profilePhoto ? (
                                <img src={getPhotoUrl(user.profilePhoto)} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-4xl text-neutral-300 font-bold">{user.userName?.charAt(0)}</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 pb-8 flex flex-col md:flex-row justify-between items-start md:items-end md:ml-16">
                    <div>
                        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-1">{user.userName}</h1>
                        <p className="text-lg text-neutral-500 dark:text-slate-400 mb-2 capitalize">{user.role}</p>
                        {user.userId && (
                            <div className="mb-3 flex items-center gap-2">
                                <span 
                                    onClick={() => {
                                        navigator.clipboard.writeText(user.userId);
                                        toast.success(`Copied ID: ${user.userId}`);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-50/50 hover:bg-primary-100/60 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 border border-primary-100/50 dark:border-slate-700/50 text-xs font-semibold text-primary dark:text-primary-400 rounded-lg cursor-pointer transition-all duration-300 shadow-sm hover:scale-[1.02] active:scale-[0.98] select-none group"
                                    title="Click to copy User ID"
                                >
                                    <span className="text-[10px] text-primary-400 dark:text-primary-500 font-bold font-mono">@</span>
                                    <span className="font-mono tracking-wide">{user.userId}</span>
                                    <svg 
                                        className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-all duration-300" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                    </svg>
                                </span>
                            </div>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-slate-300">
                            {user.address && (
                                <span className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    {user.address}
                                </span>
                            )}
                            
                            <div className="flex gap-4 cursor-pointer">
                                <span onClick={() => openNetworkModal('followers', 'Followers')} className="hover:text-primary hover:underline">
                                    <strong>{followersCount}</strong> Followers
                                </span>
                                <span onClick={() => openNetworkModal('following', 'Following')} className="hover:text-primary hover:underline">
                                    <strong>{user.following?.length || 0}</strong> Following
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
                        <button 
                            onClick={() => setIsShareOpen(true)}
                            className="px-6 py-2 rounded-full font-bold shadow-md transition-all bg-white dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 hover:bg-neutral-50 dark:hover:bg-slate-750 text-neutral-700 dark:text-slate-200 flex items-center gap-2 active:scale-95 cursor-pointer"
                        >
                            <svg className="w-5 h-5 text-neutral-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                            Share Profile
                        </button>

                        {loginData && loginData._id !== user._id && (
                            <>
                                {isFollowing && (
                                    <button 
                                        onClick={handleMessage}
                                        className="px-6 py-2 rounded-full font-bold shadow-md transition-colors bg-secondary hover:bg-secondary-600 text-white flex items-center gap-2 active:scale-95 cursor-pointer"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                                        Message
                                    </button>
                                )}
                                <button 
                                    onClick={handleFollow}
                                    className={`px-6 py-2 rounded-full font-bold shadow-md transition-colors active:scale-95 cursor-pointer ${
                                        isFollowing 
                                            ? 'bg-neutral-100 dark:bg-slate-700 text-neutral-600 dark:text-slate-300' 
                                            : 'bg-primary hover:bg-primary-600 text-white'
                                    }`}
                                >
                                    {isFollowing ? 'Following' : 'Follow'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Body */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Side Info */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-neutral-100 dark:border-slate-700">
                        <h2 className="text-xl font-bold mb-4 dark:text-white">About</h2>
                        <p className="text-neutral-600 dark:text-slate-300 text-sm whitespace-pre-line">
                            {user.bio || "No biography provided."}
                        </p>
                    </div>

                    {user.skills && user.skills.length > 0 && (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-neutral-100 dark:border-slate-700">
                            <h2 className="text-xl font-bold mb-4 dark:text-white">Skills</h2>
                            <div className="flex flex-wrap gap-2">
                                {user.skills.map((skill, index) => (
                                    <span key={index} className="px-3 py-1 bg-neutral-100 dark:bg-slate-700 dark:text-slate-300 rounded-full text-sm font-medium">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Side Posts */}
                <div className="lg:col-span-2">
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 text-primary p-2 rounded-xl">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" /></svg>
                            </div>
                            <h2 className="text-xl font-bold text-neutral-800 dark:text-white">Recent Activity</h2>
                        </div>

                        {/* Elegant Toggle Switcher */}
                        {userPosts.length > 0 && (
                            <div className="flex bg-neutral-100/80 dark:bg-slate-800/80 p-1 rounded-xl border border-neutral-200/50 dark:border-slate-700/60 backdrop-blur-sm shadow-sm transition-all duration-300">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all duration-300 ${
                                        viewMode === 'grid'
                                            ? 'bg-white dark:bg-slate-700 text-primary dark:text-white shadow-sm'
                                            : 'text-neutral-500 dark:text-slate-400 hover:text-neutral-800 dark:hover:text-white'
                                    }`}
                                    title="Grid View"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                        <rect x="3" y="3" width="7" height="7" rx="1.5" />
                                        <rect x="14" y="3" width="7" height="7" rx="1.5" />
                                        <rect x="14" y="14" width="7" height="7" rx="1.5" />
                                        <rect x="3" y="14" width="7" height="7" rx="1.5" />
                                    </svg>
                                    <span>Grid</span>
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all duration-300 ${
                                        viewMode === 'list'
                                            ? 'bg-white dark:bg-slate-700 text-primary dark:text-white shadow-sm'
                                            : 'text-neutral-500 dark:text-slate-400 hover:text-neutral-800 dark:hover:text-white'
                                    }`}
                                    title="List View"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                        <line x1="8" y1="6" x2="21" y2="6" />
                                        <line x1="8" y1="12" x2="21" y2="12" />
                                        <line x1="8" y1="18" x2="21" y2="18" />
                                        <line x1="3" y1="6" x2="3.01" y2="6" strokeWidth="3" strokeLinecap="round" />
                                        <line x1="3" y1="12" x2="3.01" y2="12" strokeWidth="3" strokeLinecap="round" />
                                        <line x1="3" y1="18" x2="3.01" y2="18" strokeWidth="3" strokeLinecap="round" />
                                    </svg>
                                    <span>List</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {isLoadingPosts ? (
                        <div className="flex justify-center py-12">
                            <div className="spinner border-t-primary w-8 h-8"></div>
                        </div>
                    ) : userPosts.length > 0 ? (
                        viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
                                {userPosts.map(post => (
                                    <Link 
                                        key={post._id} 
                                        to={`/post/${post._id}`}
                                        className="group aspect-square rounded-2xl overflow-hidden relative border border-neutral-200 dark:border-slate-800/80 shadow-sm bg-white dark:bg-slate-800/60 backdrop-blur-sm hover:shadow-md hover:scale-[1.01] hover:border-primary-500/30 dark:hover:border-primary-400/30 transition-all duration-300 cursor-pointer block"
                                    >
                                        {getThumbnail(post)}
                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-6 text-white text-base font-bold backdrop-blur-sm">
                                            <div className="flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                                <svg className="w-5 h-5 fill-rose-500 text-rose-500" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>
                                                <span>{post.likes?.length || 0}</span>
                                            </div>
                                            <div className="flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 delay-[50ms]">
                                                <svg className="w-5 h-5 fill-sky-400 text-sky-400" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                                                <span>{post.comments?.length || 0}</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-6 animate-fadeIn">
                                {userPosts.map(post => (
                                    <PostCard 
                                        key={post._id} 
                                        post={post} 
                                        currentUserId={loginData?._id}
                                        onPostUpdated={(data, action) => {
                                            if (action === 'delete') {
                                                setUserPosts(posts => posts.filter(p => p._id !== data));
                                            } else if (action === 'update') {
                                                setUserPosts(posts => posts.map(p => p._id === data._id ? data : p));
                                            }
                                        }}
                                    />
                                ))}
                            </div>
                        )
                    ) : (
                        <div className="text-center py-16 bg-white dark:bg-slate-800/80 rounded-2xl border border-neutral-100 dark:border-slate-700/50 shadow-soft">
                            <div className="w-20 h-20 bg-neutral-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-10 h-10 text-neutral-300 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </div>
                            <h3 className="text-lg font-bold text-neutral-800 dark:text-white mb-2">No Posts Yet</h3>
                            <p className="text-sm text-neutral-500 dark:text-slate-400">
                                This user hasn't posted anything to their feed yet.
                            </p>
                        </div>
                    )}
                </div>
            </div>
            <ShareModal 
                isOpen={isShareOpen} 
                onClose={() => setIsShareOpen(false)} 
                shareUrl={window.location.href} 
                userName={user.userName} 
            />
        </div>
    );
};
