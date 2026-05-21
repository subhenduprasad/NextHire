import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { Link } from 'react-router-dom';
import { FiMessageSquare, FiSearch } from 'react-icons/fi';
import { BsCheck, BsCheckAll } from 'react-icons/bs';

export const ChatList = ({ chats, currentUserId, setCurrentChat, onlineUsers, role, loginData, onChatDeleted, onChatCleared }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [contextMenu, setContextMenu] = useState(null); // { x: 0, y: 0, chat: chat }

    useEffect(() => {
        const handleWindowClick = () => {
            setContextMenu(null);
        };
        window.addEventListener('click', handleWindowClick);
        return () => {
            window.removeEventListener('click', handleWindowClick);
        };
    }, []);

    const handleContextMenu = (e, chat) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            chat
        });
    };

    const handleDeleteConversation = async (chatId) => {
        if (!window.confirm("Are you sure you want to permanently delete this conversation and all its messages? This action cannot be undone.")) return;
        try {
            const token = localStorage.getItem('usertoken');
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/chat/${chatId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data.success) {
                if (onChatDeleted) onChatDeleted(chatId);
            } else {
                alert(data.error || "Failed to delete conversation.");
            }
        } catch (err) {
            console.error("Delete conversation error:", err);
            alert("An error occurred while deleting the conversation.");
        }
    };

    const handleClearChatHistory = async (chatId) => {
        if (!window.confirm("Are you sure you want to clear all chat messages in this conversation? This action cannot be undone.")) return;
        try {
            const token = localStorage.getItem('usertoken');
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/chat/${chatId}/clear`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data.success) {
                if (onChatCleared) onChatCleared(chatId);
            } else {
                alert(data.error || "Failed to clear chat history.");
            }
        } catch (err) {
            console.error("Clear chat history error:", err);
            alert("An error occurred while clearing the chat history.");
        }
    };

    useEffect(() => {
        if (searchQuery.trim().length > 0) {
            setIsSearching(true);
            const fetchUsers = async () => {
                try {
                    const res = await fetch(`${process.env.REACT_APP_API_URL}/api/search?q=${searchQuery}`);
                    const data = await res.json();
                    
                    if (data.success) {
                        const filteredResults = data.results.filter(item => {
                            if (item.id === currentUserId) return false;
                            
                            // If it's a user, only show if they are in following or followers
                            if (item.type === 'user') {
                                const isFollowing = loginData?.following?.includes(item.id);
                                const isFollower = loginData?.followers?.includes(item.id);
                                return isFollowing || isFollower;
                            }
                            
                            // If it's a company, always show
                            return true;
                        });
                        
                        setSearchResults(filteredResults);
                    }
                } catch (err) {
                    console.log(err);
                } finally {
                    setIsSearching(false);
                }
            };
            
            const timer = setTimeout(() => {
                fetchUsers();
            }, 500);
            return () => clearTimeout(timer);
        } else {
            setSearchResults([]);
        }
    }, [searchQuery, currentUserId]);

    const startNewChat = async (user) => {
        try {
            const receiverId = user.type === 'company' ? user.employerId : user.id;
            
            if (!receiverId) {
                console.error("No valid receiver ID found for this selection");
                return;
            }

            const token = localStorage.getItem('usertoken');
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ receiverId })
            });
            const result = await res.json();
            if (result.success) {
                // Return the full chat object to open it
                setCurrentChat(result.data);
                setSearchQuery('');
            }
        } catch (error) {
            console.log("Error starting chat", error);
        }
    };

    const searchLower = searchQuery.toLowerCase();
    const filteredChats = chats?.filter(chat => {
        const otherUser = chat.members.find(m => m && m._id !== currentUserId);
        if (!otherUser) return false;
        if (!searchQuery) return true;
        return (
            (otherUser.firstName || '').toLowerCase().includes(searchLower) ||
            (otherUser.lastName || '').toLowerCase().includes(searchLower) ||
            (otherUser.userName || '').toLowerCase().includes(searchLower)
        );
    });

    const chatUserIds = new Set(chats?.map(chat => chat.members.find(m => m && m._id !== currentUserId)?._id).filter(Boolean) || []);
    const newUsers = searchResults.filter(u => {
        if (u.type === 'company' && u.employerId) {
            return !chatUserIds.has(u.employerId);
        }
        return !chatUserIds.has(u.id);
    });

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-800 w-full">
            <div className="p-4 border-b border-neutral-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Messages</h2>
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Search chats or users..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-neutral-100 dark:bg-slate-700 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-600 rounded-full text-sm outline-none transition-all dark:text-white placeholder-neutral-500 dark:placeholder-slate-400"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                        <FiSearch size={16} />
                    </div>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto">
                {searchQuery && filteredChats?.length > 0 && (
                    <div className="px-4 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                        Recent Chats
                    </div>
                )}
                {filteredChats?.map((chat) => {
                    const otherUser = chat.members.find(m => m && m._id !== currentUserId);
                    if (!otherUser) return null;
                    
                    return (
                        <div 
                            key={chat._id}
                            onClick={() => setCurrentChat(chat)}
                            onContextMenu={(e) => handleContextMenu(e, chat)}
                            className="flex items-center gap-3 p-4 hover:bg-neutral-50 dark:hover:bg-slate-700/50 cursor-pointer border-b border-neutral-100 dark:border-slate-700/50 transition-colors relative"
                        >
                            <div className="relative">
                                <img 
                                    src={
                                        (otherUser.role === 'employer' && otherUser.companyId?.companyLogo)
                                            ? (otherUser.companyId.companyLogo.startsWith('http') ? otherUser.companyId.companyLogo : `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${otherUser.companyId.companyLogo}`)
                                            : (otherUser.profilePhoto || "https://cdn-icons-png.flaticon.com/512/149/149071.png")
                                    } 
                                    alt="Profile" 
                                    className={`w-12 h-12 object-cover border border-neutral-200 dark:border-slate-600 ${
                                        otherUser.role === 'employer' && otherUser.companyId?.companyLogo ? 'rounded-md' : 'rounded-full'
                                    }`}
                                />
                                {onlineUsers?.some(user => user.userId === otherUser._id) && (
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="font-semibold text-neutral-900 dark:text-white truncate">
                                        {otherUser.role === 'employer' && otherUser.companyId?.companyName ? (
                                            <span>
                                                {otherUser.companyId.companyName}
                                                <span className="text-xs font-normal text-neutral-500 dark:text-slate-400 ml-1.5">
                                                    ({otherUser.firstName} {otherUser.lastName})
                                                </span>
                                            </span>
                                        ) : (
                                            `${otherUser.firstName} ${otherUser.lastName}`
                                        )}
                                    </h3>
                                    {chat.updatedAt && (
                                        <span className="text-xs text-neutral-500 dark:text-slate-400 whitespace-nowrap ml-2">
                                            {moment(chat.updatedAt).fromNow()}
                                        </span>
                                    )}
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-sm text-neutral-500 dark:text-slate-400 truncate flex items-center gap-1">
                                        {chat.lastMessage?.senderId === currentUserId && (
                                            <span className={chat.lastMessage.status === 'seen' ? 'text-blue-300' : 'text-neutral-400'}>
                                                {(!chat.lastMessage.status || chat.lastMessage.status === 'sent') ? <BsCheck size={16} /> : <BsCheckAll size={16} className={chat.lastMessage.status === 'seen' ? 'text-[#34B7F1]' : ''} />}
                                            </span>
                                        )}
                                        <span className="truncate">{chat.lastMessage?.text || "Started a conversation"}</span>
                                    </p>
                                    {chat.lastMessage && chat.lastMessage.senderId !== currentUserId && !chat.lastMessage.isRead && (
                                        <div className="w-2.5 h-2.5 bg-secondary rounded-full flex-shrink-0"></div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
                
                {searchQuery && newUsers.length > 0 && (
                    <>
                        <div className="px-4 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider mt-2 border-t border-neutral-100 dark:border-slate-700/50 pt-3">
                            Other Users
                        </div>
                        {newUsers.map(user => (
                            <div 
                                key={user.id}
                                onClick={() => startNewChat(user)}
                                className="flex items-center gap-3 p-4 hover:bg-neutral-50 dark:hover:bg-slate-700/50 cursor-pointer border-b border-neutral-100 dark:border-slate-700/50 transition-colors"
                            >
                                <div className="relative">
                                    <img 
                                        src={user.photo || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                                        alt="Profile" 
                                        className={`w-12 h-12 object-cover border border-neutral-200 dark:border-slate-600 ${user.type === 'company' ? 'rounded-md' : 'rounded-full'}`}
                                    />
                                    {user.type === 'user' && onlineUsers?.some(ou => ou.userId === user.id) && (
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="font-semibold text-neutral-900 dark:text-white truncate">
                                            {user.name}
                                        </h3>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm text-neutral-500 dark:text-slate-400 truncate flex items-center gap-1">
                                            {user.subtitle}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </>
                )}

                {searchQuery && filteredChats?.length === 0 && newUsers.length === 0 && !isSearching && (
                    <div className="flex flex-col items-center justify-center p-6 text-center mt-4">
                        <p className="text-neutral-500 dark:text-slate-400 text-sm">
                            No users or chats found matching "{searchQuery}"
                        </p>
                    </div>
                )}
                
                {!searchQuery && chats?.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center mt-10">
                        <div className="w-16 h-16 bg-secondary/10 text-secondary rounded-full flex items-center justify-center mb-4">
                            <FiMessageSquare size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-neutral-800 dark:text-white mb-2">No messages yet</h3>
                        <p className="text-neutral-500 dark:text-slate-400 text-sm mb-6">
                            Start connecting with {role === 'candidate' ? 'companies and recruiters' : 'candidates'} to start a conversation.
                        </p>
                        <Link 
                            to={role === 'candidate' ? '/companies' : '/recruiter/review'} 
                            className="bg-secondary text-white px-6 py-2 rounded-full font-medium hover:bg-secondary-600 transition-colors"
                        >
                            Explore Connections
                        </Link>
                    </div>
                )}
            </div>

            {/* Custom Premium Context Menu */}
            {contextMenu && (
                <div 
                    style={{ 
                        position: 'fixed', 
                        top: `${contextMenu.y}px`, 
                        left: `${contextMenu.x}px`,
                        zIndex: 1000
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-56 rounded-xl border border-white/20 dark:border-slate-700/30 bg-white/75 dark:bg-slate-800/85 backdrop-blur-xl shadow-xl overflow-hidden py-1.5 animate-fade-in transition-all duration-200"
                >
                    <div className="px-4 py-2 border-b border-neutral-100 dark:border-slate-700/40 text-xs font-semibold text-neutral-400 dark:text-slate-400 uppercase tracking-wider">
                        Conversation Options
                    </div>
                    <button 
                        onClick={() => {
                            handleClearChatHistory(contextMenu.chat._id);
                            setContextMenu(null);
                        }} 
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-neutral-700 dark:text-slate-200 hover:bg-neutral-100/70 dark:hover:bg-slate-700/60 text-left transition-colors"
                    >
                        <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Clear Chat History
                    </button>
                    <button 
                        onClick={() => {
                            handleDeleteConversation(contextMenu.chat._id);
                            setContextMenu(null);
                        }} 
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 text-left transition-colors"
                    >
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Delete Conversation
                    </button>
                    <div className="border-t border-neutral-100 dark:border-slate-700/40 my-1"></div>
                    <button 
                        onClick={() => setContextMenu(null)} 
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-500 hover:bg-neutral-100/70 dark:hover:bg-slate-700/60 text-left transition-colors"
                    >
                        <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
};
