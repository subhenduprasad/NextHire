import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { LoginContext } from '../../components/ContextProvider/Context';
import { toast } from 'react-toastify';
import { getSocket } from '../../utils/socket';

const timeAgo = (date) => {
    if (!date) return '';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
};

let pdfjsLoadingPromise = null;

const loadPdfJs = () => {
    if (window.pdfjsLib) {
        return Promise.resolve(window.pdfjsLib);
    }
    if (pdfjsLoadingPromise) {
        return pdfjsLoadingPromise;
    }

    pdfjsLoadingPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
        script.onload = () => {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
            resolve(window.pdfjsLib);
        };
        script.onerror = (err) => {
            pdfjsLoadingPromise = null;
            reject(err);
        };
        document.head.appendChild(script);
    });

    return pdfjsLoadingPromise;
};

const PDFPageRenderer = ({ url, pageNum, containerWidth, onLoadAspect }) => {
    const canvasRef = React.useRef(null);
    const [loading, setLoading] = useState(true);
    const [renderError, setRenderError] = useState(false);

    useEffect(() => {
        let isMounted = true;
        let pdfDoc = null;
        let renderTask = null;

        const renderPage = async () => {
            setLoading(true);
            setRenderError(false);
            try {
                const pdfjs = await loadPdfJs();
                const loadingTask = pdfjs.getDocument(url);
                pdfDoc = await loadingTask.promise;
                
                if (!isMounted) return;

                const page = await pdfDoc.getPage(pageNum);
                if (!isMounted) return;

                const unscaledViewport = page.getViewport({ scale: 1.0 });
                const aspect = unscaledViewport.height / unscaledViewport.width;
                if (onLoadAspect) {
                    onLoadAspect(aspect);
                }

                const canvas = canvasRef.current;
                if (!canvas) return;

                const context = canvas.getContext('2d');

                // Calculate scale using static maximum bounds to prevent re-rendering during dynamic height transition animations
                const maxContainerHeight = window.innerWidth < 768 ? 450 : 500;
                const parentHeight = Math.max(maxContainerHeight - 36, 200);
                const parentWidth = containerWidth || 500;

                let scale = parentHeight / unscaledViewport.height;
                const dpr = window.devicePixelRatio || 1;
                
                if (unscaledViewport.width * scale > parentWidth) {
                    scale = parentWidth / unscaledViewport.width;
                }

                if (!scale || scale <= 0) scale = 1.0;

                const viewport = page.getViewport({ scale: scale * dpr });
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                canvas.style.width = `${viewport.width / dpr}px`;
                canvas.style.height = `${viewport.height / dpr}px`;

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };

                renderTask = page.render(renderContext);
                await renderTask.promise;

                if (isMounted) {
                    setLoading(false);
                }
            } catch (err) {
                console.error("Error rendering PDF page:", err);
                if (isMounted) {
                    setRenderError(true);
                    setLoading(false);
                }
            }
        };

        // Delay slightly to allow parent measurements to compute accurately
        const timer = setTimeout(() => {
            renderPage();
        }, 30);

        return () => {
            isMounted = false;
            clearTimeout(timer);
            if (renderTask) {
                try {
                    renderTask.cancel();
                } catch (e) {}
            }
        };
    }, [url, pageNum, containerWidth]);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-950 relative p-2 select-none animate-fade-in">
            {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950/80 text-white z-10">
                    <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin mb-3"></div>
                    <span className="text-xs text-neutral-400 font-medium">Loading page {pageNum}...</span>
                </div>
            )}
            
            {renderError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950 text-white p-4 text-center">
                    <svg className="w-12 h-12 text-rose-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-sm font-semibold mb-1">Failed to load page</p>
                    <span className="text-xs text-neutral-400">Please try downloading the document.</span>
                </div>
            )}

            <div className="flex-1 w-full h-full flex items-center justify-center overflow-hidden">
                <canvas ref={canvasRef} className="shadow-2xl rounded bg-white max-w-full max-h-full object-contain" />
            </div>
        </div>
    );
};

const PostCard = ({ post, onPostUpdated }) => {
    const { loginData } = useContext(LoginContext);
    const [isLiked, setIsLiked] = useState(post.likes.some(id => id?.toString() === loginData?._id?.toString()));
    const [likesCount, setLikesCount] = useState(post.likes.length);
    const [isSaved, setIsSaved] = useState(loginData?.savedPosts?.includes(post._id));
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState(post.comments);
    const [isPostingComment, setIsPostingComment] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content || '');
    const [isHidden, setIsHidden] = useState(post.isHidden || false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [pdfPageCounts, setPdfPageCounts] = useState({});
    const carouselRef = React.useRef(null);
    const [carouselWidth, setCarouselWidth] = useState(500);
    const [slideAspects, setSlideAspects] = useState({});

    // Define slides first to avoid TDZ (Temporal Dead Zone) issues in subsequent hooks and calculations
    const slides = [
        ...(post.images || []).map(img => ({ type: 'image', url: img })),
        ...(post.pdfs || []).flatMap(pdf => {
            const numPages = pdfPageCounts[pdf.url] || 1;
            const pages = [];
            for (let i = 1; i <= numPages; i++) {
                pages.push({
                    type: 'pdf',
                    url: pdf.url,
                    filename: pdf.filename,
                    pageNum: i,
                    totalPages: numPages
                });
            }
            return pages;
        })
    ];

    // Observe container width to compute correct sizing ratios
    useEffect(() => {
        if (!carouselRef.current) return;
        
        const updateWidth = () => {
            if (carouselRef.current) {
                setCarouselWidth(carouselRef.current.offsetWidth || 500);
            }
        };

        updateWidth();
        window.addEventListener('resize', updateWidth);
        const timer = setTimeout(updateWidth, 100);

        return () => {
            window.removeEventListener('resize', updateWidth);
            clearTimeout(timer);
        };
    }, [slides.length]);

    const getActiveAspect = () => {
        if (slideAspects[activeIndex] !== undefined) {
            return slideAspects[activeIndex];
        }
        const activeSlide = slides[activeIndex];
        if (activeSlide) {
            if (activeSlide.type === 'pdf') return 1.41;
            return 0.6;
        }
        return 0.75;
    };

    const maxContainerHeight = window.innerWidth < 768 ? 450 : 500;
    const activeAspect = getActiveAspect();
    const desiredHeight = carouselWidth * activeAspect;
    const currentHeight = Math.min(desiredHeight, maxContainerHeight);

    useEffect(() => {
        if (!post.pdfs || post.pdfs.length === 0) return;

        let isMounted = true;
        const loadCounts = async () => {
            try {
                const pdfjs = await loadPdfJs();
                const counts = {};
                for (const pdf of post.pdfs) {
                    try {
                        const loadingTask = pdfjs.getDocument(pdf.url);
                        const pdfDoc = await loadingTask.promise;
                        counts[pdf.url] = pdfDoc.numPages;
                    } catch (err) {
                        console.error("Error loading PDF for page count:", err);
                        counts[pdf.url] = 1;
                    }
                }
                if (isMounted) {
                    setPdfPageCounts(counts);
                }
            } catch (err) {
                console.error("Failed to load PDFJS:", err);
            }
        };

        loadCounts();
        return () => {
            isMounted = false;
        };
    }, [post.pdfs]);

    // Reactively synchronize local states when the post prop or loginData changes
    useEffect(() => {
        const userHasLiked = post.likes.some(id => id?.toString() === loginData?._id?.toString());
        setIsLiked(userHasLiked);
        setLikesCount(post.likes.length);
        setIsSaved(loginData?.savedPosts?.includes(post._id));
        setComments(post.comments);
    }, [post, loginData]);

    // Real-time synchronization using Socket.io
    useEffect(() => {
        const socket = getSocket(loginData?._id);
        if (!socket) return;

        const handlePostLiked = (data) => {
            if (data.postId === post._id) {
                setLikesCount(data.likes.length);
                const userHasLiked = data.likes.some(id => id?.toString() === loginData?._id?.toString());
                setIsLiked(userHasLiked);
            }
        };

        const handlePostCommented = (data) => {
            if (data.postId === post._id) {
                setComments(data.comments);
            }
        };

        socket.on('postLiked', handlePostLiked);
        socket.on('postCommented', handlePostCommented);

        return () => {
            socket.off('postLiked', handlePostLiked);
            socket.off('postCommented', handlePostCommented);
        };
    }, [post._id, loginData?._id]);

    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    const isOwner = !!loginData?._id && !!(post.userId?._id || post.userId) && (loginData._id.toString() === (post.userId._id || post.userId).toString());
    const postUserId = post.userId?._id || post.userId;
    const postProfileLink = postUserId ? (postUserId === loginData?._id ? '/profile' : `/profile/${postUserId}`) : null;



    const getProfilePic = (user) => {
        if (!user?.profilePhoto) return null;
        return user.profilePhoto.startsWith('http') ? user.profilePhoto : `${API_BASE_URL}${user.profilePhoto}`;
    };

    const handleLike = async () => {
        if (!loginData) return toast.error("Please login to like posts.");

        const prevLiked = isLiked;
        const prevCount = likesCount;

        setIsLiked(!isLiked);
        setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);

        try {
            const res = await fetch(`${API_BASE_URL}/api/posts/${post._id}/like`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: loginData._id })
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message);
            }
        } catch (error) {
            setIsLiked(prevLiked);
            setLikesCount(prevCount);
            console.error('Like error:', error);
        }
    };

    const handleSave = async () => {
        if (!loginData) return toast.error("Please login to save posts.");

        const prevSaved = isSaved;
        setIsSaved(!isSaved);

        try {
            const res = await fetch(`${API_BASE_URL}/api/posts/${post._id}/save`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: loginData._id })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                toast.success(data.isSaved ? "Post saved!" : "Post removed from saved.");
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            setIsSaved(prevSaved);
            console.error('Save error:', error);
        }
    };

    const handleShare = () => {
        const url_to_copy = `${window.location.origin}/post/${post._id}`;
        navigator.clipboard.writeText(url_to_copy).then(() => {
            toast.success("Link copied to clipboard!");
        });
    };

    const handleComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        setIsPostingComment(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/posts/${post._id}/comment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: loginData._id, text: commentText })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setComments(data.comments);
                setCommentText('');
            } else {
                throw new Error(data.message || 'Failed to comment');
            }
        } catch (error) {
            toast.error("Failed to post comment.");
            console.error('Comment error:', error);
        } finally {
            setIsPostingComment(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm("Are you sure you want to delete this comment?")) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/posts/${post._id}/comment/${commentId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: loginData._id })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setComments(data.comments);
                toast.success("Comment deleted successfully");
            } else {
                throw new Error(data.message || 'Failed to delete comment');
            }
        } catch (error) {
            toast.error(error.message || "Failed to delete comment.");
            console.error('Delete comment error:', error);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this post?")) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/posts/${post._id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: loginData._id })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success("Post deleted successfully");
                if (onPostUpdated) onPostUpdated(post._id, 'delete');
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            toast.error("Failed to delete post.");
            console.error('Delete error:', error);
        }
    };

    const handleHide = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/posts/${post._id}/hide`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: loginData._id })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setIsHidden(data.isHidden);
                toast.success(data.message);
                if (onPostUpdated) onPostUpdated(post._id, 'hide');
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            toast.error("Failed to toggle visibility.");
            console.error('Hide error:', error);
        }
        setIsMenuOpen(false);
    };

    const handleEditSave = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/posts/${post._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: loginData._id, content: editContent })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setIsEditing(false);
                post.content = editContent; 
                toast.success("Post updated successfully");
                if (onPostUpdated) onPostUpdated(data.post, 'update');
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            toast.error("Failed to update post.");
            console.error('Edit error:', error);
        }
    };

    if (isHidden && !isOwner) return null;

    return (
        <div className="card mb-6 border border-white/60 dark:border-slate-700/50 shadow-soft bg-white/70 dark:bg-slate-800/80 backdrop-blur-xl">
            {/* Header */}
            <div className="p-5 flex justify-between items-start">
                <div className="flex gap-3">
                    <div className="flex-shrink-0">
                        {(() => {
                            const avatar = getProfilePic(post.userId) ? (
                                <img src={getProfilePic(post.userId)} alt="Profile" className="w-12 h-12 rounded-full object-cover border border-neutral-200 dark:border-slate-600 shadow-sm" />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-white font-bold text-lg">
                                    {(post.userId?.userName || 'Deleted Account').charAt(0).toUpperCase()}
                                </div>
                            );
                            return postProfileLink ? (
                                <Link to={postProfileLink} className="block">{avatar}</Link>
                            ) : avatar;
                        })()}
                    </div>
                    <div>
                        <h4 className="font-bold text-neutral-800 dark:text-slate-100 flex items-center gap-2">
                            {postProfileLink ? (
                                <Link to={postProfileLink} className="no-underline text-neutral-800 dark:text-slate-100">
                                    {post.userId?.userName || 'Deleted Account'}
                                </Link>
                            ) : (
                                post.userId?.userName || 'Deleted Account'
                            )}
                            {post.userId?.companyId && (
                                <span className="text-xs text-neutral-500 font-medium px-2 py-0.5 bg-neutral-100 dark:bg-slate-700/50 rounded-full border border-neutral-200 dark:border-slate-600">
                                    {post.userId.companyId.companyName}
                                </span>
                            )}
                        </h4>
                        <p className="text-xs text-neutral-500 dark:text-slate-400 capitalize">
                            {post.userId ? post.userId.role : 'Inactive'} • {timeAgo(post.createdAt)} 
                            {isHidden && <span className="ml-2 text-rose-500 font-semibold border border-rose-500 px-1 rounded text-[10px]">Hidden</span>}
                        </p>
                    </div>
                </div>
                
                {isOwner && (
                    <div className="relative">
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 hover:bg-neutral-100 dark:hover:bg-slate-700 rounded-full transition-colors text-neutral-500 dark:text-slate-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/></svg>
                        </button>
                        {isMenuOpen && (
                            <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-neutral-100 dark:border-slate-700 overflow-hidden z-10 animate-fade-in">
                                <button onClick={() => { setIsEditing(true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-neutral-700 dark:text-slate-300 hover:bg-neutral-50 dark:hover:bg-slate-700/50">Edit Post</button>
                                <button onClick={handleHide} className="w-full text-left px-4 py-2 text-sm text-neutral-700 dark:text-slate-300 hover:bg-neutral-50 dark:hover:bg-slate-700/50">{isHidden ? 'Unhide Post' : 'Hide Post'}</button>
                                <button onClick={handleDelete} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">Delete Post</button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Content */}
            {isEditing ? (
                <div className="px-5 pb-3">
                    <textarea 
                        value={editContent} 
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full p-3 border border-neutral-200 dark:border-slate-600 rounded-xl bg-neutral-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm dark:text-slate-200"
                        rows="3"
                    ></textarea>
                    <div className="flex justify-end gap-2 mt-2">
                        <button onClick={() => setIsEditing(false)} className="px-4 py-1.5 rounded-lg text-sm font-semibold text-neutral-500 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                        <button onClick={handleEditSave} className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary/90 transition-colors">Save</button>
                    </div>
                </div>
            ) : (
                post.content && (
                    <div className="px-5 pb-3">
                        <p className="text-neutral-700 dark:text-slate-300 whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>
                    </div>
                )
            )}

            {/* Unified Media Slider/Carousel (Instagram-Style) */}
            {slides.length > 0 && (
                <div 
                    ref={carouselRef}
                    className="relative w-full bg-neutral-950 flex flex-col justify-between overflow-hidden group/carousel border-y border-neutral-100 dark:border-slate-800 transition-all duration-300 ease-in-out"
                    style={{ height: `${currentHeight}px` }}
                >
                    {/* Slides Track */}
                    <div className="flex-1 w-full h-full relative overflow-hidden">
                        <div 
                            className="flex h-full w-full transition-transform duration-300 ease-out animate-fade-in"
                            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
                        >
                            {slides.map((slide, index) => (
                                <div key={index} className="w-full h-full flex-shrink-0 relative flex items-center justify-center bg-neutral-950">
                                    {slide.type === 'image' ? (
                                        <img 
                                            ref={(el) => {
                                                if (el && el.complete && el.naturalWidth && el.naturalHeight) {
                                                    const aspect = el.naturalHeight / el.naturalWidth;
                                                    setSlideAspects(prev => {
                                                        if (prev[index] === aspect) return prev;
                                                        return {
                                                            ...prev,
                                                            [index]: aspect
                                                        };
                                                    });
                                                }
                                            }}
                                            src={slide.url} 
                                            alt={`Slide ${index}`} 
                                            className="w-full h-full object-contain" 
                                            onLoad={(e) => {
                                                const { naturalWidth, naturalHeight } = e.target;
                                                if (naturalWidth && naturalHeight) {
                                                    const aspect = naturalHeight / naturalWidth;
                                                    setSlideAspects(prev => {
                                                        if (prev[index] === aspect) return prev;
                                                        return {
                                                            ...prev,
                                                            [index]: aspect
                                                        };
                                                    });
                                                }
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full relative overflow-hidden">
                                            <PDFPageRenderer
                                                url={slide.url}
                                                pageNum={slide.pageNum}
                                                containerWidth={carouselWidth}
                                                onLoadAspect={(aspect) => {
                                                    setSlideAspects(prev => ({
                                                        ...prev,
                                                        [index]: aspect
                                                    }));
                                                }}
                                            />
                                            {/* Light transparent corner download button for PDF */}
                                            <a
                                                href={slide.url}
                                                download={slide.filename}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="absolute top-3 right-3 p-2.5 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white rounded-full transition-all shadow-md flex items-center justify-center group/btn z-20 animate-fade-in"
                                                title="Download PDF"
                                            >
                                                <svg className="w-5 h-5 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                            </a>
                                            {/* Gradient overlay at bottom showing the filename and page number */}
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-10 flex items-center justify-between pointer-events-none z-10">
                                                <span className="text-white text-xs font-semibold truncate drop-shadow pr-20">{slide.filename ? slide.filename.replace(/\.pdf$/i, '') : ''}</span>
                                                <span className="text-white/60 text-[10px] uppercase tracking-wider pr-2 shrink-0">Page {slide.pageNum} of {slide.totalPages}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Navigation Chevrons */}
                    {slides.length > 1 && (
                        <>
                            {activeIndex > 0 && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setActiveIndex(activeIndex - 1); }}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white rounded-full transition-all shadow-md z-20 opacity-0 group-hover/carousel:opacity-100 focus:opacity-100"
                                    aria-label="Previous Slide"
                                >
                                    <svg className="w-5 h-5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                            )}
                            {activeIndex < slides.length - 1 && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setActiveIndex(activeIndex + 1); }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white rounded-full transition-all shadow-md z-20 opacity-0 group-hover/carousel:opacity-100 focus:opacity-100"
                                    aria-label="Next Slide"
                                >
                                    <svg className="w-5 h-5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            )}
                        </>
                    )}

                    {/* Instagram-style Dot Indicators */}
                    {slides.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1.5 z-20 bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
                            {slides.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={(e) => { e.stopPropagation(); setActiveIndex(i); }}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                        activeIndex === i ? 'bg-white w-4' : 'bg-white/40 hover:bg-white/60 w-1.5'
                                    }`}
                                    aria-label={`Go to slide ${i + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Interaction Stats */}
            <div className="px-5 py-3 border-b border-neutral-100 dark:border-slate-700/50 flex justify-between items-center">
                <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
                    {likesCount > 0 && (
                        <div className="flex items-center gap-1">
                            <div className="bg-red-100 dark:bg-red-900/30 text-red-500 p-1 rounded-full"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg></div>
                            <span>{likesCount} {likesCount === 1 ? 'Like' : 'Likes'}</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3 text-xs text-neutral-500 font-medium">
                    {comments.length > 0 && <span>{comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}</span>}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="px-2 py-1 flex items-center justify-between">
                <button onClick={handleLike} className={`flex-1 flex justify-center items-center gap-1 sm:gap-2 py-3 rounded-lg text-sm font-semibold transition-colors ${isLiked ? 'text-red-500' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-slate-800 dark:text-slate-400'}`}>
                    <svg className={`w-5 h-5 ${isLiked ? 'fill-current' : 'fill-none'}`} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                    <span className="hidden sm:inline">Like</span>
                </button>
                <button onClick={() => setShowComments(!showComments)} className="flex-1 flex justify-center items-center gap-1 sm:gap-2 py-3 rounded-lg text-sm font-semibold text-neutral-500 hover:bg-neutral-100 dark:hover:bg-slate-800 dark:text-slate-400 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    <span className="hidden sm:inline">Comment</span>
                </button>
                <button onClick={handleShare} className="flex-1 flex justify-center items-center gap-1 sm:gap-2 py-3 rounded-lg text-sm font-semibold text-neutral-500 hover:bg-neutral-100 dark:hover:bg-slate-800 dark:text-slate-400 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                    <span className="hidden sm:inline">Share</span>
                </button>
                <button onClick={handleSave} className={`flex-1 flex justify-center items-center gap-1 sm:gap-2 py-3 rounded-lg text-sm font-semibold transition-colors ${isSaved ? 'text-secondary' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-slate-800 dark:text-slate-400'}`}>
                    <svg className={`w-5 h-5 ${isSaved ? 'fill-current' : 'fill-none'}`} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                    <span className="hidden sm:inline">Save</span>
                </button>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="px-5 py-4 border-t border-neutral-100 dark:border-slate-700/50 bg-neutral-50/50 dark:bg-slate-900/30 rounded-b-xl">
                    {/* Add Comment */}
                    <div className="flex gap-3 mb-6">
                        <div className="flex-shrink-0">
                            {getProfilePic(loginData) ? (
                                <img src={getProfilePic(loginData)} alt="Profile" className="w-10 h-10 rounded-full object-cover shadow-sm" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-white font-bold text-sm">
                                    {loginData?.userName?.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <form onSubmit={handleComment} className="flex-1 flex bg-white dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 rounded-full overflow-hidden focus-within:ring-2 focus-within:ring-secondary/50 focus-within:border-secondary transition-all">
                            <input 
                                type="text" 
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Write a comment..."
                                className="flex-1 bg-transparent px-4 py-2 text-sm text-neutral-800 dark:text-slate-200 focus:outline-none"
                            />
                            <button 
                                type="submit" 
                                disabled={isPostingComment || !commentText.trim()}
                                className="px-4 text-secondary hover:bg-secondary/10 font-semibold text-sm disabled:opacity-50 transition-colors"
                            >
                                {isPostingComment ? '...' : 'Post'}
                            </button>
                        </form>
                    </div>

                    {/* Comment List */}
                    <div className="space-y-4">
                        {comments.length === 0 ? (
                            <p className="text-center text-xs text-neutral-500 py-2">No comments yet. Be the first to comment!</p>
                        ) : (
                            (() => {
                                const authorId = (post.userId?._id || post.userId || '').toString();
                                const sortedComments = [...comments].sort((a, b) => {
                                    const aUser = (a.userId?._id || a.userId || '').toString();
                                    const bUser = (b.userId?._id || b.userId || '').toString();
                                    const aIsAuthor = aUser === authorId;
                                    const bIsAuthor = bUser === authorId;
                                    if (aIsAuthor && !bIsAuthor) return -1;
                                    if (!aIsAuthor && bIsAuthor) return 1;
                                    return 0;
                                });

                                return sortedComments.map((comment, i) => {
                                    const commentUserId = comment.userId?._id || comment.userId;
                                    const commentProfileLink = commentUserId ? (commentUserId === loginData?._id ? '/profile' : `/profile/${commentUserId}`) : null;
                                    const isCommentAuthor = commentUserId && commentUserId.toString() === authorId;

                                    const avatar = getProfilePic(comment.userId) ? (
                                        <img src={getProfilePic(comment.userId)} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-neutral-100 dark:border-slate-700" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-slate-700 flex items-center justify-center text-neutral-500 dark:text-slate-400 font-bold text-xs uppercase">
                                            {(comment.userId?.userName || 'Deleted Account').charAt(0).toUpperCase()}
                                        </div>
                                    );

                                    return (
                                        <div key={i} className="flex gap-3 animate-fade-in">
                                            <div className="flex-shrink-0">
                                                {commentProfileLink ? (
                                                    <Link to={commentProfileLink} className="block">{avatar}</Link>
                                                ) : avatar}
                                            </div>
                                            <div className="flex-1">
                                                <div className="relative group/comment bg-white dark:bg-slate-800 border border-neutral-100 dark:border-slate-700 p-3 rounded-2xl rounded-tl-sm inline-block max-w-[90%] shadow-sm transition-all duration-200 hover:shadow">
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap pr-6">
                                                        {commentProfileLink ? (
                                                            <Link to={commentProfileLink} className="font-bold text-sm text-neutral-800 dark:text-slate-200 no-underline">
                                                                {comment.userId?.userName || 'Deleted Account'}
                                                            </Link>
                                                        ) : (
                                                            <span className="font-bold text-sm text-neutral-800 dark:text-slate-200">{comment.userId?.userName || 'Deleted Account'}</span>
                                                        )}
                                                        {isCommentAuthor && (
                                                            <span className="text-[9px] text-secondary dark:text-primary font-extrabold px-1.5 py-0.5 bg-secondary/10 dark:bg-primary/20 border border-secondary/20 dark:border-primary/25 rounded-md uppercase tracking-wider select-none scale-95 origin-left">
                                                                Author
                                                            </span>
                                                        )}
                                                        <span className="text-[10px] text-neutral-400">{timeAgo(comment.createdAt)}</span>
                                                    </div>
                                                    <p className="text-sm text-neutral-700 dark:text-slate-300 whitespace-pre-wrap pr-6">{comment.text}</p>
                                                    
                                                    {/* Absolute Hover Trash button for comment deletion */}
                                                    {(commentUserId?.toString() === loginData?._id?.toString() || isOwner) && (
                                                        <button 
                                                            onClick={() => handleDeleteComment(comment._id)}
                                                            className="absolute -right-8 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover:text-red-500 rounded-full hover:bg-neutral-100 dark:hover:bg-slate-700/50 opacity-0 group-hover/comment:opacity-100 focus:opacity-100 transition-all duration-200"
                                                            title="Delete Comment"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                });
                            })()
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PostCard;
