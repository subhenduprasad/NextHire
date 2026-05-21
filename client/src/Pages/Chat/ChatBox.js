import React, { useState, useEffect, useRef } from 'react';
import moment from 'moment';
import { FiSend, FiArrowLeft, FiMessageSquare } from 'react-icons/fi';
import { BsCheck, BsCheckAll } from 'react-icons/bs';
import { Link } from 'react-router-dom';

const LinkPreview = ({ url, messageText, isOnlyLink, isOwn, createdAt, status }) => {
    const [previewData, setPreviewData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchPreview = async () => {
            try {
                const token = localStorage.getItem('usertoken');
                const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/chat/og-preview?url=${encodeURIComponent(url)}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const result = await res.json();
                if (result.success && result.data && (result.data.ogTitle || result.data.twitterTitle)) {
                    setPreviewData(result.data);
                } else {
                    setError(true);
                }
            } catch (err) {
                console.error("Failed to fetch link preview", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchPreview();
    }, [url]);

    const renderText = () => (
        <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
            {messageText.split(/(https?:\/\/[^\s]+)/g).map((part, i) => {
                if (part.match(/(https?:\/\/[^\s]+)/)) {
                    const isInternal = part.includes(window.location.host);
                    const path = isInternal ? part.substring(part.indexOf(window.location.host) + window.location.host.length) : part;
                    if (isInternal) {
                        return <Link key={i} to={path} className={`underline ${isOwn ? 'text-white' : 'text-secondary-500'} hover:opacity-80`}>{part}</Link>;
                    }
                    return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className={`underline ${isOwn ? 'text-white' : 'text-secondary-500'} hover:opacity-80`}>{part}</a>;
                }
                return <span key={i}>{part}</span>;
            })}
        </p>
    );

    const renderTime = () => (
        <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${isOwn ? 'text-secondary-100' : 'text-neutral-400 dark:text-slate-400'} text-right`}>
            {moment(createdAt).format('LT')}
            {isOwn && (
                <span className={status === 'seen' ? 'text-blue-300' : 'text-secondary-100/70'}>
                    {status === 'sent' ? <BsCheck size={14} /> : <BsCheckAll size={14} className={status === 'seen' ? 'text-[#34B7F1]' : ''} />}
                </span>
            )}
        </div>
    );

    if (loading) {
        return (
            <div className="flex flex-col p-1 min-w-[200px]">
                <div className="w-full rounded-xl overflow-hidden bg-neutral-100/30 dark:bg-slate-800/30 animate-pulse h-32 mb-2"></div>
                {!isOnlyLink && <div className="px-2 pb-1">{renderText()}</div>}
                <div className="px-2 pb-1">{renderTime()}</div>
            </div>
        );
    }

    if (error || !previewData) {
        return (
            <div className="px-4 py-2 flex flex-col">
                {renderText()}
                {renderTime()}
            </div>
        );
    }

    const image = previewData.ogImage?.[0]?.url || previewData.twitterImage?.[0]?.url;
    const title = previewData.ogTitle || previewData.twitterTitle;
    const description = previewData.ogDescription || previewData.twitterDescription;

    const isInternal = url.includes(window.location.host);
    const path = isInternal ? url.substring(url.indexOf(window.location.host) + window.location.host.length) : url;
    
    let hostname = '';
    try { hostname = new URL(url).hostname; } catch (e) {}

    const Content = () => (
        <div className="flex flex-col w-full bg-white dark:bg-slate-800">
            {image && (
                <div className="w-full h-40 sm:h-48 overflow-hidden bg-neutral-200 dark:bg-slate-900 relative">
                    <img src={image} alt="Preview" className="w-full h-full object-cover" />
                    {/* Play button overlay if it's a video link */}
                    {(url.includes('youtu') || url.includes('vimeo')) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center pl-1 backdrop-blur-sm shadow-sm">
                                <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                            </div>
                        </div>
                    )}
                </div>
            )}
            <div className="p-3">
                <h4 className="font-semibold text-[14px] sm:text-[15px] line-clamp-1 text-neutral-900 dark:text-white">{title}</h4>
                {description && (
                    <p className="text-[12px] sm:text-[13px] mt-1 line-clamp-2 text-neutral-600 dark:text-slate-300">{description}</p>
                )}
                {hostname && (
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] sm:text-[11px] font-medium text-neutral-500 dark:text-slate-400">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                        {hostname}
                    </div>
                )}
            </div>
        </div>
    );

    const containerClasses = "block w-full overflow-hidden text-left hover:opacity-95 transition-opacity";

    return (
        <div className="flex flex-col w-[260px] sm:w-[320px] p-1">
            <div className="rounded-xl overflow-hidden shadow-sm border border-neutral-100 dark:border-slate-700/50">
                {isInternal ? (
                    <Link to={path} className={containerClasses}>
                        <Content />
                    </Link>
                ) : (
                    <a href={url} target="_blank" rel="noopener noreferrer" className={containerClasses}>
                        <Content />
                    </a>
                )}
            </div>
            
            {!isOnlyLink && (
                <div className="px-2 pt-2 pb-1">
                    {renderText()}
                </div>
            )}
            <div className={`px-2 pb-1 ${isOnlyLink ? 'pt-1' : ''}`}>{renderTime()}</div>
        </div>
    );
};

export const ChatBox = ({ chat, currentUserId, setSendMessage, receiveMessage, setCurrentChat, chatsLength, role, socket, typingUsers }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const scroll = useRef();
    const typingTimeoutRef = useRef(null);

    const handleInputTyping = (e) => {
        setNewMessage(e.target.value);
        if (socket?.current && chat) {
            const receiverUser = chat.members.find(m => m._id !== currentUserId) || chat.members[0];
            socket.current.emit('typing', {
                senderId: currentUserId,
                receiverId: receiverUser._id,
                chatId: chat._id
            });

            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                socket.current.emit('stopTyping', {
                    senderId: currentUserId,
                    receiverId: receiverUser._id,
                    chatId: chat._id
                });
            }, 2000);
        }
    };

    useEffect(() => {
        const fetchMessages = async () => {
            if (!chat) return;
            try {
                const token = localStorage.getItem('usertoken');
                const res = await fetch(`${process.env.REACT_APP_API_URL}/api/message/${chat._id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const result = await res.json();
                if (result.success) {
                    setMessages(result.data);
                }
            } catch (error) {
                console.log(error);
            }
        };
        fetchMessages();
    }, [chat]);

    // Mark messages as seen when chat is opened
    useEffect(() => {
        const markAsSeen = async () => {
            if (!chat) return;
            const hasUnseenMessages = messages.some(m => m.senderId !== currentUserId && m.status !== 'seen');
            if (hasUnseenMessages) {
                try {
                    const token = localStorage.getItem('usertoken');
                    await fetch(`${process.env.REACT_APP_API_URL}/api/message/status/${chat._id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ status: 'seen' })
                    });
                    
                    // Emit seen event for the socket
                    const otherUser = chat.members.find(m => m._id !== currentUserId);
                    if (socket?.current) {
                        socket.current.emit('messageSeen', { senderId: otherUser?._id, chatId: chat._id });
                    }
                    
                    // Update local message state
                    setMessages(prev => prev.map(m => 
                        m.senderId !== currentUserId ? { ...m, status: 'seen', isRead: true } : m
                    ));
                } catch (error) {
                    console.log("Error marking messages as seen", error);
                }
            }
        };
        markAsSeen();
    }, [chat, messages, currentUserId, socket]);

    useEffect(() => {
        if (receiveMessage !== null && receiveMessage.chatId === chat?._id) {
            setMessages(prev => {
                // Prevent duplicate messages if the same receiveMessage reference triggers multiple times
                if (prev.some(m => m._id === receiveMessage._id)) {
                    return prev;
                }
                return [...prev, receiveMessage];
            });
            
            // Mark the new incoming message as seen since we have the chat open
            if (receiveMessage.senderId !== currentUserId) {
                const markNewMessageSeen = async () => {
                    try {
                        const token = localStorage.getItem('usertoken');
                        await fetch(`${process.env.REACT_APP_API_URL}/api/message/status/${chat._id}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ status: 'seen' })
                        });
                        
                        if (socket?.current) {
                            socket.current.emit('messageSeen', { senderId: receiveMessage.senderId, chatId: chat._id, messageId: receiveMessage._id });
                        }
                        
                        setMessages(prev => prev.map(m => 
                            m._id === receiveMessage._id ? { ...m, status: 'seen', isRead: true } : m
                        ));
                    } catch (error) {
                        console.log("Error marking new message as seen", error);
                    }
                };
                markNewMessageSeen();
            }
        }
    }, [receiveMessage, chat, currentUserId, socket]);

    useEffect(() => {
        const currentSocket = socket?.current;
        if (currentSocket) {
            const handleMessageStatus = ({ chatId, messageId, status }) => {
                if (chat?._id === chatId) {
                    setMessages(prev => prev.map(m => {
                        // For 'seen', update all sent/delivered messages. For 'delivered', only update sent messages.
                        if (m.senderId === currentUserId) {
                            if (status === 'seen' || (status === 'delivered' && m.status === 'sent')) {
                                return { ...m, status, isRead: status === 'seen' };
                            }
                        }
                        return m;
                    }));
                }
            };

            const handleChatCleared = ({ chatId }) => {
                if (chat?._id === chatId) {
                    setMessages([]);
                }
            };
            
            currentSocket.on('messageStatusUpdate', handleMessageStatus);
            currentSocket.on('chatHistoryCleared', handleChatCleared);
            
            return () => {
                currentSocket.off('messageStatusUpdate', handleMessageStatus);
                currentSocket.off('chatHistoryCleared', handleChatCleared);
            };
        }
    }, [chat, socket, currentUserId]);

    useEffect(() => {
        scroll.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const messageObj = {
            senderId: currentUserId,
            text: newMessage,
            chatId: chat._id,
        };

        const receiverUser = chat.members.find(m => m._id !== currentUserId) || chat.members[0];
        const receiverId = receiverUser._id;

        // Send message to database first to get the _id
        try {
            const token = localStorage.getItem('usertoken');
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/message`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(messageObj)
            });
            const result = await res.json();
            if (result.success) {
                setMessages(prev => [...prev, result.data]);
                setNewMessage("");
                
                // Stop typing immediately
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                if (socket?.current) {
                    socket.current.emit('stopTyping', {
                        senderId: currentUserId,
                        receiverId,
                        chatId: chat._id
                    });
                }
                
                // Send the full saved message to socket server
                setSendMessage({ ...result.data, receiverId });
            }
        } catch (error) {
            console.log(error);
        }
    };

    if (!chat) {
        return (
            <div className="hidden md:flex flex-col flex-1 items-center justify-center bg-neutral-50 dark:bg-slate-900/50 p-8 text-center">
                <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-full shadow-sm flex items-center justify-center mb-6 border border-neutral-200 dark:border-slate-700">
                    <FiMessageSquare size={40} className="text-secondary opacity-80" />
                </div>
                <h2 className="text-2xl font-bold text-neutral-800 dark:text-white mb-3">
                    {chatsLength === 0 ? "Welcome to Messages" : "Your Messages"}
                </h2>
                <p className="text-neutral-500 dark:text-slate-400 max-w-md mb-8">
                    {chatsLength === 0 
                        ? `You don't have any active conversations yet. Connect with ${role === 'candidate' ? 'recruiters or companies' : 'candidates'} to start chatting.`
                        : "Select a conversation from the list on the left to start messaging."}
                </p>
                {chatsLength === 0 && (
                    <Link 
                        to={role === 'candidate' ? '/companies' : '/recruiter/review'} 
                        className="bg-secondary text-white px-8 py-3 rounded-full font-medium hover:bg-secondary-600 transition-colors shadow-sm"
                    >
                        Find People to Chat With
                    </Link>
                )}
            </div>
        );
    }

    const otherUser = chat.members.find(m => m && m._id !== currentUserId) || chat.members[0];

    const formatDateSeparator = (dateString) => {
        const date = moment(dateString);
        const today = moment().startOf('day');
        const yesterday = moment().subtract(1, 'days').startOf('day');
        
        if (date.isSame(today, 'd')) {
            return 'Today';
        } else if (date.isSame(yesterday, 'd')) {
            return 'Yesterday';
        } else if (date.isSame(today, 'year')) {
            return date.format('DD MMMM');
        } else {
            return date.format('DD MMM YYYY');
        }
    };

    return (
        <div className="flex flex-col flex-1 h-full bg-white dark:bg-slate-800 absolute md:relative inset-0 z-10 md:z-0">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <button 
                    onClick={() => setCurrentChat(null)}
                    className="md:hidden p-2 -ml-2 text-neutral-600 dark:text-slate-400 hover:bg-neutral-100 dark:hover:bg-slate-700 rounded-full"
                >
                    <FiArrowLeft size={24} />
                </button>
                <img 
                    src={
                        (otherUser?.role === 'employer' && otherUser?.companyId?.companyLogo)
                            ? (otherUser.companyId.companyLogo.startsWith('http') ? otherUser.companyId.companyLogo : `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${otherUser.companyId.companyLogo}`)
                            : (otherUser?.profilePhoto || "https://cdn-icons-png.flaticon.com/512/149/149071.png")
                    } 
                    alt="Profile" 
                    className={`w-10 h-10 object-cover border border-neutral-200 dark:border-slate-600 ${
                        otherUser?.role === 'employer' && otherUser?.companyId?.companyLogo ? 'rounded-md' : 'rounded-full'
                    }`}
                />
                <div>
                    <h3 className="font-bold text-neutral-900 dark:text-white">
                        {otherUser?.role === 'employer' && otherUser?.companyId?.companyName ? (
                            <span>
                                {otherUser.companyId.companyName}
                                <span className="text-xs font-normal text-neutral-500 dark:text-slate-400 ml-1.5">
                                    ({otherUser.firstName} {otherUser.lastName})
                                </span>
                            </span>
                        ) : (
                            `${otherUser?.firstName} ${otherUser?.lastName}`
                        )}
                    </h3>
                    <span className={`text-xs font-medium capitalize ${otherUser?.isDeleted ? 'text-rose-500 dark:text-rose-400' : 'text-secondary-600 dark:text-secondary-400'}`}>
                        {otherUser?.isDeleted ? 'Inactive' : (otherUser?.role === 'employer' && otherUser?.companyId?.companyName ? `Employer @ ${otherUser.companyId.companyName}` : otherUser?.role)}
                    </span>
                </div>
            </div>

            {/* Messages body */}
            <div className="flex-1 overflow-y-auto p-4 bg-neutral-50/50 dark:bg-slate-900/20 space-y-4">
                {messages.map((message, index) => {
                    const isOwn = message.senderId === currentUserId;
                    const urlRegex = /(https?:\/\/[^\s]+)/;
                    const match = message.text.match(urlRegex);
                    const hasLink = !!match;
                    const url = hasLink ? match[0] : null;
                    const isOnlyLink = hasLink && message.text.trim() === url;

                    let showDateSeparator = false;
                    if (index === 0) {
                        showDateSeparator = true;
                    } else {
                        const prevDate = moment(messages[index - 1].createdAt).startOf('day');
                        const currDate = moment(message.createdAt).startOf('day');
                        if (!currDate.isSame(prevDate)) {
                            showDateSeparator = true;
                        }
                    }

                    return (
                        <React.Fragment key={index}>
                            {showDateSeparator && (
                                <div className="flex justify-center my-4">
                                    <div className="bg-neutral-200/70 dark:bg-slate-700/60 text-neutral-600 dark:text-slate-300 text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm shadow-sm">
                                        {formatDateSeparator(message.createdAt)}
                                    </div>
                                </div>
                            )}
                            <div 
                                ref={scroll}
                                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl shadow-sm overflow-hidden flex flex-col ${
                                    isOwn 
                                        ? 'bg-secondary text-white rounded-br-sm' 
                                        : 'bg-white dark:bg-slate-700 text-neutral-800 dark:text-white border border-neutral-100 dark:border-slate-600 rounded-bl-sm'
                                }}`}>
                                    {hasLink ? (
                                        <LinkPreview url={url} messageText={message.text} isOnlyLink={isOnlyLink} isOwn={isOwn} createdAt={message.createdAt} status={message.status} />
                                    ) : (
                                        <div className="px-4 py-2 flex flex-col">
                                            <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{message.text}</p>
                                            <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${isOwn ? 'text-secondary-100' : 'text-neutral-400 dark:text-slate-400'} text-right`}>
                                                {moment(message.createdAt).format('LT')}
                                                {isOwn && (
                                                    <span className={message.status === 'seen' ? 'text-blue-300' : 'text-secondary-100/70'}>
                                                        {message.status === 'sent' ? <BsCheck size={14} /> : <BsCheckAll size={14} className={message.status === 'seen' ? 'text-[#34B7F1]' : ''} />}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </React.Fragment>
                    );
                })}

                {typingUsers?.some(t => t.chatId === chat._id && t.senderId === otherUser?._id) && (
                    <div ref={scroll} className="flex justify-start">
                        <div className="bg-white dark:bg-slate-700 text-neutral-500 border border-neutral-100 dark:border-slate-600 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-1.5 w-fit">
                            <span className="w-1.5 h-1.5 bg-neutral-400 dark:bg-slate-400 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-neutral-400 dark:bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                            <span className="w-1.5 h-1.5 bg-neutral-400 dark:bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input area */}
            {otherUser?.isDeleted ? (
                <div className="p-5 bg-rose-50/50 dark:bg-rose-950/20 border-t border-neutral-200 dark:border-slate-700 text-center text-sm font-semibold text-rose-500 dark:text-rose-400 flex items-center justify-center gap-2.5">
                    <svg className="w-5 h-5 text-rose-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    You cannot reply to this conversation because this account has been deleted.
                </div>
            ) : (
                <form onSubmit={handleSend} className="p-4 bg-white dark:bg-slate-800 border-t border-neutral-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <input 
                            type="text" 
                            value={newMessage}
                            onChange={handleInputTyping}
                            placeholder="Type a message..."
                            className="flex-1 bg-neutral-100 dark:bg-slate-700/50 text-neutral-800 dark:text-white rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-secondary/50 placeholder:text-neutral-400 dark:placeholder:text-slate-500"
                        />
                        <button 
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="w-12 h-12 flex items-center justify-center rounded-full bg-secondary text-white hover:bg-secondary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FiSend size={20} className="ml-1" />
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};
