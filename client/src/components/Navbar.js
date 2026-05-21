import React, { useState, useEffect, useContext, useRef } from 'react'
import { Outlet, NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import logoURL from '../assets/img/logo.jpeg'
import { LoginContext } from './ContextProvider/Context'
import { io } from 'socket.io-client'

const employerNavItems = [
    { label: 'Home', path: '/' },
    { label: 'Feed', path: '/feed' },
    { label: 'Dashboard', path: '/employer/dashboard' },
    { label: 'Team', path: '/team' },
    { label: 'Messages', path: '/chat' },
];
const coordinatorNavItems = [
    { label: 'Home', path: '/' },
    { label: 'Feed', path: '/feed' },
    { label: 'Dashboard', path: '/coordinator/review' },
    { label: 'Candidates', path: '/shortlist' },
    { label: 'Messages', path: '/chat' }
];
const recruiterNavItems = [
    { label: 'Home', path: '/' },
    { label: 'Feed', path: '/feed' },
    { label: 'Dashboard', path: '/recruiter/review' },
    { label: 'Messages', path: '/chat' }
];
const candidateNavItems = [
    { label: 'Home', path: '/' },
    { label: 'Feed', path: '/feed' },
    { label: 'All Jobs', path: '/all-posted-jobs' },
    { label: 'My Applications', path: `/my-jobs` },
    { label: 'Messages', path: '/chat' }
];

export const Navbar = () => {
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    const { loginData, logout, updateUser } = useContext(LoginContext);
    const location = useLocation();
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);

    const [navItems, setNavItems] = useState([
        { label: 'Home', path: '/' },
        { label: 'Feed', path: '/feed' },
        { label: 'All Jobs', path: '/all-posted-jobs' },
    ]);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [unreadMessageCount, setUnreadMessageCount] = useState(0);
    
    const dropdownRef = useRef(null);
    const notifDropdownRef = useRef(null);
    const socket = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
            if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target)) {
                setIsNotificationOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (loginData) {
            const role = loginData.role;
            if (role === "employer") {
                setNavItems(employerNavItems)
            } else if (role === "coordinator") {
                setNavItems(coordinatorNavItems)
            } else if (role === "recruiter") {
                setNavItems(recruiterNavItems)
            } else if (role === "candidate") {
                setNavItems(candidateNavItems)
            }
        } else {
            setNavItems([
                { label: 'Home', path: '/' },
                { label: 'Feed', path: '/feed' },
                { label: 'All Jobs', path: '/all-posted-jobs' },
            ]);
            if (socket.current) {
                socket.current.disconnect();
            }
        }
    }, [loginData]);

    useEffect(() => {
        if (loginData && loginData._id) {
            socket.current = io(API_BASE_URL);
            
            socket.current.on('connect', () => {
                socket.current.emit("addUser", loginData._id);
            });
            
            if (socket.current.connected) {
                socket.current.emit("addUser", loginData._id);
            }

            socket.current.on('getNotification', (notification) => {
                setNotifications(prev => [notification, ...prev]);
                setUnreadCount(prev => prev + 1);
            });

            socket.current.on('networkUpdate', (data) => {
                if (loginData?.role === 'employer' && loginData?.companyId && loginData.companyId._id.toString() === data.companyId.toString()) {
                    updateUser({ 
                        companyId: { 
                            ...loginData.companyId, 
                            connectedUsers: data.connectedUsers 
                        } 
                    });
                }
            });

            socket.current.on('getMessage', (message) => {
                // When a new message arrives, wait a bit for ChatBox to potentially mark it as seen
                // if the user is currently looking at it, then refetch the count.
                setTimeout(fetchUnreadMessageCount, 500);
            });
            
            fetch(`${API_BASE_URL}/notifications/${loginData._id}`)
                .then(res => res.json())
                .then(res => {
                    if (res.success) {
                        setNotifications(res.data);
                        setUnreadCount(res.data.filter(n => !n.isRead).length);
                    }
                })
                .catch(err => console.error(err));

            fetchUnreadMessageCount();

            return () => {
                socket.current.disconnect();
            };
        }
    }, [loginData]);

    const markAsRead = async (id) => {
        try {
            await fetch(`${API_BASE_URL}/notifications/${id}/read`, { method: 'PUT' });
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error(err);
        }
    };
    
    const markAllAsRead = async () => {
        try {
            await fetch(`${API_BASE_URL}/notifications/read-all/user`, { 
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: loginData._id })
            });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error(err);
        }
    };

    const deleteNotification = async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/notifications/${id}`, { method: 'DELETE' });
            const res = await response.json();
            if (res.success) {
                const targetNote = notifications.find(n => n._id === id);
                if (targetNote && !targetNote.isRead) {
                    setUnreadCount(prev => Math.max(0, prev - 1));
                }
                setNotifications(prev => prev.filter(n => n._id !== id));
            }
        } catch (err) {
            console.error('Error deleting notification:', err);
        }
    };

    const clearAllNotifications = async () => {
        if (!loginData?._id) return;
        try {
            const response = await fetch(`${API_BASE_URL}/notifications/clear/user/${loginData._id}`, { method: 'DELETE' });
            const res = await response.json();
            if (res.success) {
                setNotifications([]);
                setUnreadCount(0);
            }
        } catch (err) {
            console.error('Error clearing notifications:', err);
        }
    };


    const fetchUnreadMessageCount = async () => {
        if (!loginData?._id) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/chat/unread-count`, {
                headers: {
                    'Authorization': localStorage.getItem("usertoken")
                }
            });
            const data = await res.json();
            if (data.success) {
                setUnreadMessageCount(data.data);
            }
        } catch (err) {
            console.error('Error fetching unread message count:', err);
        }
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    const handleNotifClick = async (note) => {
        if (!note.isRead) {
            await markAsRead(note._id);
        }
        setIsNotificationOpen(false);

        if (note.type === 'job_alert' && note.relatedId) {
            navigate(`/current-job/${note.relatedId}`);
        } else if (note.type === 'application_update' && note.relatedId) {
            navigate('/my-jobs');
        } else if ((note.type === 'like' || note.type === 'comment') && note.relatedId) {
            navigate(`/post/${note.relatedId}`);
        } else if (note.type === 'follow' && (note.sender?._id || note.sender)) {
            navigate(`/profile/${note.sender?._id || note.sender}`);
        } else if (note.type === 'connection' && note.relatedId) {
            navigate(`/company/${note.relatedId}`);
        }
    };

    const renderNotificationIcon = (note) => {
        const hasSender = !!note.sender;
        const senderPhoto = note.sender?.profilePhoto;
        const senderName = note.sender?.userName || 'Someone';

        if (hasSender) {
            let badgeBg = 'bg-neutral-500';
            let badgeIcon = null;

            if (note.type === 'like') {
                badgeBg = 'bg-rose-500';
                badgeIcon = (
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                );
            } else if (note.type === 'comment') {
                badgeBg = 'bg-indigo-500';
                badgeIcon = (
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" clipRule="evenodd" />
                    </svg>
                );
            } else if (note.type === 'follow') {
                badgeBg = 'bg-emerald-500';
                badgeIcon = (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                    </svg>
                );
            } else if (note.type === 'connection') {
                badgeBg = 'bg-cyan-500';
                badgeIcon = (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21" />
                    </svg>
                );
            }

            return (
                <div className="relative flex-shrink-0">
                    {senderPhoto ? (
                        <img 
                            src={senderPhoto.startsWith('http') ? senderPhoto : `${API_BASE_URL}${senderPhoto}`} 
                            alt={senderName} 
                            className="w-10 h-10 rounded-full object-cover shadow-sm ring-2 ring-white/80 dark:ring-slate-800/80" 
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-secondary-700 flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white/80 dark:ring-slate-800/80">
                            {senderName.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-sm text-white ${badgeBg}`}>
                        {badgeIcon}
                    </div>
                </div>
            );
        }

        let iconBg = 'bg-neutral-100 dark:bg-slate-700/50';
        let mainIcon = null;

        if (note.type === 'job_alert') {
            iconBg = 'bg-amber-100 dark:bg-amber-950/40';
            mainIcon = (
                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 .621-.504 1.125-1.125 1.125H4.875c-.621 0-1.125-.504-1.125-1.125v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706" />
                </svg>
            );
        } else if (note.type === 'application_update') {
            iconBg = 'bg-blue-100 dark:bg-blue-950/40';
            mainIcon = (
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            );
        } else {
            iconBg = 'bg-violet-100 dark:bg-violet-950/40';
            mainIcon = (
                <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0" />
                </svg>
            );
        }

        return (
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                {mainIcon}
            </div>
        );
    };

    useEffect(() => {
        setIsMenuOpen(false);
        setIsProfileOpen(false);
        // Refetch message count when location changes (e.g. leaving the chat page)
        if (loginData?._id) {
            fetchUnreadMessageCount();
        }
    }, [location]);

    const logoutHandler = () => {
        logout();
        setIsProfileOpen(false);
        navigate('/');
    }

    const getRoleBadgeColor = (role) => {
        switch(role) {
            case 'employer': return 'bg-purple-100 text-purple-700';
            case 'coordinator': return 'bg-blue-100 text-blue-700';
            case 'recruiter': return 'bg-amber-100 text-amber-700';
            case 'candidate': return 'bg-green-100 text-green-700';
            default: return 'bg-neutral-100 text-neutral-700';
        }
    };

    return (
        <>
            <div className={`sticky top-0 z-50 w-full transition-all duration-500 ${scrolled ? 'pt-2 md:pt-4 px-2 md:px-4 lg:px-8' : ''}`}>
                <header className={`transition-all duration-700 mx-auto relative ${
                    scrolled 
                        ? `bg-white/5 dark:bg-slate-900/40 backdrop-blur-[40px] backdrop-saturate-[200%] shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-white/20 dark:border-slate-700/50 max-w-6xl ${isMenuOpen ? 'rounded-2xl' : 'rounded-full'}` 
                        : 'bg-white/40 dark:bg-slate-900/60 backdrop-blur-xl border-b border-white/40 dark:border-slate-800/80 max-w-full'
                }`}>
                    <div className={`relative z-10 ${scrolled ? 'px-4 sm:px-6 lg:px-10' : 'container-custom'}`}>
                        <nav className='flex justify-between items-center h-16 md:h-20 transition-all'>
                            {/* Logo */}
                            <NavLink to='/' className='flex items-center gap-2 md:gap-3 group'>
                                <div className='relative'>
                                    <div className="absolute inset-0 bg-secondary/20 blur-md rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <img 
                                        src={logoURL} 
                                        className="relative w-10 h-10 md:w-11 md:h-11 rounded-xl object-cover ring-[1.5px] ring-neutral-200 shadow-sm group-hover:ring-secondary/50 group-hover:shadow-md transition-all duration-300" 
                                        alt="NextHire Logo" 
                                    />
                                </div>
                                <div className='hidden sm:block'>
                                    <span className='font-extrabold text-xl md:text-2xl tracking-tight text-primary dark:text-white'>
                                        Next<span className='text-secondary'>Hire</span>
                                    </span>
                                    <p className='text-[10px] font-semibold text-neutral-400 uppercase tracking-widest -mt-0.5 hidden md:block transition-colors group-hover:text-secondary-500'>
                                        Career Portal
                                    </p>
                                </div>
                            </NavLink>

                        {/* Desktop Navigation */}
                        <ul className="hidden lg:flex items-center gap-1">
                            {navItems.map(({ label, path }) => (
                                <li key={path}>
                                    <NavLink
                                        to={path}
                                        className={({ isActive }) => `
                                            px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300
                                            ${isActive 
                                                ? 'bg-secondary/5 text-secondary-700 dark:text-secondary-400 shadow-sm border border-secondary/10' 
                                                : 'text-neutral-500 dark:text-slate-300 hover:text-primary dark:hover:text-white hover:bg-neutral-50/80 dark:hover:bg-slate-800/80 border border-transparent hover:border-neutral-100 dark:hover:border-slate-700'
                                            }
                                        `}
                                    >
                                        {label}
                                    </NavLink>
                                </li>
                            ))}
                        </ul>

                        {/* Right Section */}
                        <div className='flex items-center gap-3'>
                            {localStorage.getItem("usertoken") ? (
                                <div className='flex items-center gap-1 sm:gap-3'>
                                    {/* Notification Bell */}
                                    <div className='relative' ref={notifDropdownRef}>
                                        <button 
                                            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                                            className='relative p-2 text-neutral-500 hover:text-neutral-700 dark:text-slate-300 dark:hover:text-white transition-colors rounded-full hover:bg-neutral-100 dark:hover:bg-slate-800'
                                        >
                                            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                            </svg>
                                            {unreadCount > 0 && (
                                                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 md:w-3 md:h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
                                            )}
                                        </button>

                                        {/* Notification Dropdown */}
                                        {isNotificationOpen && (
                                            <div className='absolute -right-20 sm:right-0 top-full mt-2 w-[calc(100vw-32px)] sm:w-96 max-w-[360px] sm:max-w-none max-h-[480px] bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-neutral-100/80 dark:border-slate-700/80 py-2.5 z-50 flex flex-col animate-slide-down overflow-hidden'>
                                                <div className='px-5 py-3.5 border-b border-neutral-100/80 dark:border-slate-700/80 flex justify-between items-center bg-transparent sticky top-0 z-10'>
                                                    <h3 className='font-bold text-base text-neutral-900 dark:text-slate-100 flex items-center gap-2'>
                                                        Notifications
                                                        {unreadCount > 0 && (
                                                            <span className='px-2 py-0.5 text-xs font-semibold bg-secondary/10 text-secondary rounded-full'>
                                                                {unreadCount} new
                                                            </span>
                                                        )}
                                                    </h3>
                                                    <div className="flex items-center gap-3">
                                                        {unreadCount > 0 && (
                                                             <button 
                                                                 onClick={markAllAsRead}
                                                                 className='text-xs font-bold text-secondary hover:text-secondary-600 dark:text-secondary-400 dark:hover:text-secondary-300 transition-colors flex items-center gap-1'
                                                             >
                                                                 Mark all read
                                                             </button>
                                                         )}
                                                         {notifications.length > 0 && (
                                                             <>
                                                                 {unreadCount > 0 && <span className="w-1 h-3 border-l border-neutral-200 dark:border-slate-700"></span>}
                                                                 <button 
                                                                     onClick={clearAllNotifications}
                                                                     className='text-xs font-bold text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors flex items-center gap-1'
                                                                 >
                                                                     Clear all
                                                                 </button>
                                                             </>
                                                         )}
                                                    </div>
                                                 </div>
                                                 <div className='overflow-y-auto divide-y divide-neutral-100/50 dark:divide-slate-700/30 w-full max-h-[380px] custom-scrollbar'>
                                                     {notifications.length === 0 ? (
                                                         <div className='px-5 py-10 text-center flex flex-col items-center justify-center text-neutral-500 dark:text-slate-400 text-sm'>
                                                             <div className='w-12 h-12 rounded-full bg-neutral-100 dark:bg-slate-700/40 flex items-center justify-center mb-3 text-neutral-400 dark:text-slate-500'>
                                                                 <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                                                     <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a3 3 0 11-5.714 0" />
                                                                 </svg>
                                                             </div>
                                                             <p className='font-medium'>No notifications yet</p>
                                                             <p className='text-xs text-neutral-400 dark:text-slate-500 mt-1 max-w-[200px]'>We'll keep you posted when things happen!</p>
                                                         </div>
                                                     ) : (
                                                         notifications.map(note => (
                                                             <div 
                                                                 key={note._id} 
                                                                 className={`px-5 py-4 flex gap-3 hover:bg-neutral-50/80 dark:hover:bg-slate-700/40 transition-all duration-200 cursor-pointer relative group ${!note.isRead ? 'bg-secondary/[0.03] dark:bg-secondary/[0.05]' : ''}`}
                                                                 onClick={() => handleNotifClick(note)}
                                                             >
                                                                 {renderNotificationIcon(note)}
                                                                 <div className='flex-1 min-w-0 pr-6'>
                                                                     <p className='text-sm font-semibold text-neutral-900 dark:text-slate-200 group-hover:text-secondary dark:group-hover:text-secondary-400 transition-colors leading-snug'>
                                                                         {note.title}
                                                                     </p>
                                                                     <p className='text-xs text-neutral-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed'>
                                                                         {note.message}
                                                                     </p>
                                                                     <div className='flex items-center gap-2 mt-2'>
                                                                         <span className='text-[10px] font-medium text-neutral-400 dark:text-slate-500'>
                                                                             {formatTime(note.createdAt)}
                                                                         </span>
                                                                         {!note.isRead && (
                                                                             <>
                                                                                 <span className='w-1 h-1 rounded-full bg-neutral-300 dark:bg-slate-600'></span>
                                                                                 <span className='text-[10px] font-bold text-secondary dark:text-secondary-400'>
                                                                                     New
                                                                                 </span>
                                                                             </>
                                                                         )}
                                                                     </div>
                                                                 </div>
                                                                 <div className='absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center'>
                                                                     {!note.isRead && (
                                                                         <span className='w-2 h-2 rounded-full bg-secondary animate-pulse group-hover:hidden'></span>
                                                                     )}
                                                                     <button
                                                                         onClick={(e) => {
                                                                             e.stopPropagation();
                                                                             e.preventDefault();
                                                                             deleteNotification(note._id);
                                                                         }}
                                                                         className='opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-neutral-400 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 hover:bg-neutral-100 dark:hover:bg-slate-700/60 transition-all duration-200'
                                                                         title="Delete notification"
                                                                     >
                                                                         <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                                             <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                         </svg>
                                                                     </button>
                                                                 </div>
                                                             </div>
                                                         ))
                                                     )}
                                                 </div>
                                             </div>
                                         )}
                                    </div>

                                    {/* Profile Dropdown logic */}
                                    <div className='relative ml-1 sm:ml-2' ref={dropdownRef}>
                                        <button 
                                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                                            className={`flex items-center gap-2 sm:gap-3 p-1 sm:p-2 rounded-xl transition-colors ${
                                                isProfileOpen 
                                                    ? 'bg-neutral-100 dark:bg-slate-800/80 shadow-inner' 
                                                    : 'hover:bg-neutral-100 dark:hover:bg-slate-800/50'
                                            }`}
                                        >
                                            <div className='hidden md:block text-right'>
                                                <p className='text-sm font-semibold text-neutral-800 dark:text-slate-100'>
                                                    {loginData?.userName || 'User'}
                                                </p>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(loginData?.role)}`}>
                                                {loginData?.role?.charAt(0).toUpperCase() + loginData?.role?.slice(1)}
                                            </span>
                                        </div>
                                        {loginData?.profilePhoto ? (
                                            <img src={loginData.profilePhoto.startsWith('http') ? loginData.profilePhoto : `${API_BASE_URL}${loginData.profilePhoto}`} alt="Profile" className="w-10 h-10 rounded-full object-cover shadow-sm ring-2 ring-white/50" />
                                        ) : (
                                            <div className='w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-secondary-700 flex items-center justify-center text-white font-bold shadow-sm ring-2 ring-white/50'>
                                                {loginData?.userName?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                        )}
                                        <svg className={`w-4 h-4 text-neutral-400 transition-transform hidden md:block ${isProfileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {/* Profile Dropdown */}
                                    {isProfileOpen && (
                                        <div className='absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-strong dark:shadow-black/50 border border-neutral-100 dark:border-slate-700 py-2 z-50 animate-slide-down'>
                                                <div className='px-4 py-3 border-b border-neutral-100 dark:border-slate-700'>
                                                    <p className='font-semibold text-neutral-800 dark:text-slate-100'>{loginData?.userName}</p>
                                                    <p className='text-sm text-neutral-500 dark:text-slate-400 truncate'>{loginData?.userEmail}</p>
                                                </div>
                                                <div className='py-2'>
                                                    <Link 
                                                        to='/profile' 
                                                        onClick={() => setIsProfileOpen(false)}
                                                        className='flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 dark:text-slate-300 hover:bg-neutral-50 dark:hover:bg-slate-700/50 transition-colors'
                                                    >
                                                        <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                        Profile
                                                    </Link>
                                                    <Link 
                                                        to='/settings' 
                                                        onClick={() => setIsProfileOpen(false)}
                                                        className='flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 dark:text-slate-300 hover:bg-neutral-50 dark:hover:bg-slate-700/50 transition-colors'
                                                    >
                                                        <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                        Settings
                                                    </Link>
                                                    {loginData?.role === 'employer' && (
                                                        <Link 
                                                            to='/employer/dashboard' 
                                                            className='flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 dark:text-slate-300 hover:bg-neutral-50 dark:hover:bg-slate-700/50 transition-colors'
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                                            </svg>
                                                            Dashboard
                                                        </Link>
                                                    )}
                                                    {loginData?.role === 'candidate' && (
                                                        <Link 
                                                            to='/my-jobs' 
                                                            className='flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 dark:text-slate-300 hover:bg-neutral-50 dark:hover:bg-slate-700/50 transition-colors'
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                            </svg>
                                                            My Applications
                                                        </Link>
                                                    )}
                                                </div>
                                                <div className='border-t border-neutral-100 dark:border-slate-700 pt-2'>
                                                    <button 
                                                        onClick={logoutHandler}
                                                        className='flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left'
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                        </svg>
                                                        Sign out
                                                    </button>
                                                </div>
                                            </div>
                                    )}
                                    </div>
                                </div>
                            ) : (
                                <div className='hidden md:flex items-center gap-3'>
                                    <Link 
                                        to="/login" 
                                        className='px-5 py-2.5 text-sm font-semibold text-neutral-700 dark:text-slate-200 hover:text-neutral-900 dark:hover:text-white transition-colors'
                                    >
                                        Sign in
                                    </Link>
                                    <Link 
                                        to="/signup" 
                                        className='btn-secondary btn-sm'
                                    >
                                        Get Started
                                    </Link>
                                </div>
                            )}

                            {/* Mobile Menu Button */}
                            <button 
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className={`lg:hidden p-2 rounded-lg transition-colors ${
                                    isMenuOpen 
                                        ? 'bg-neutral-100 dark:bg-slate-800' 
                                        : 'hover:bg-neutral-100 dark:hover:bg-slate-800/50'
                                }`}
                                aria-label="Toggle menu"
                            >
                                {isMenuOpen ? (
                                    <svg className="w-6 h-6 text-neutral-700 dark:text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                ) : (
                                    <svg className="w-6 h-6 text-neutral-700 dark:text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </nav>

                    {/* Mobile Menu */}
                    {isMenuOpen && (
                        <div className='lg:hidden border-t border-neutral-100 py-4 animate-slide-down'>
                            <ul className='space-y-1'>
                                {navItems.map(({ label, path }) => (
                                    <li key={path}>
                                        <NavLink
                                            to={path}
                                            className={({ isActive }) => `
                                                block px-4 py-3 rounded-xl text-sm font-medium transition-all
                                                ${isActive 
                                                    ? 'bg-secondary/10 text-secondary-700' 
                                                    : 'text-neutral-600 hover:bg-neutral-100'
                                                }
                                            `}
                                        >
                                            <div className="flex items-center gap-2">
                                                {label}
                                                {label === 'Messages' && unreadMessageCount > 0 && (
                                                    <span className="flex items-center justify-center bg-red-500 text-white text-[10px] font-bold h-4 w-4 rounded-full">
                                                        {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                                                    </span>
                                                )}
                                            </div>
                                        </NavLink>
                                    </li>
                                ))}
                            </ul>
                            
                            {!localStorage.getItem("usertoken") && (
                                <div className='mt-4 pt-4 border-t border-neutral-100 space-y-2'>
                                    <Link 
                                        to="/login" 
                                        className='block w-full text-center px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors'
                                    >
                                        Sign in
                                    </Link>
                                    <Link 
                                        to="/signup" 
                                        className='block w-full btn-secondary text-center'
                                    >
                                        Get Started
                                    </Link>
                                </div>
                            )}

                            {localStorage.getItem("usertoken") && (
                                <div className='mt-4 pt-4 border-t border-neutral-100'>
                                    <button 
                                        onClick={logoutHandler}
                                        className='w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl text-left flex items-center gap-3'
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    </div>
                </header>
            </div>

            <main className='flex-1'>
                <Outlet />
            </main>
        </>
    )
}
