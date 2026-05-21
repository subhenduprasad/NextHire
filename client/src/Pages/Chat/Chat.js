import React, { useState, useEffect, useContext, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LoginContext } from '../../components/ContextProvider/Context';
import { io } from 'socket.io-client';
import { ChatList } from './ChatList';
import { ChatBox } from './ChatBox';

export const Chat = () => {
    const { loginData } = useContext(LoginContext);
    const [chats, setChats] = useState([]);
    const [currentChat, setCurrentChat] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [sendMessage, setSendMessage] = useState(null);
    const [receiveMessage, setReceiveMessage] = useState(null);
    const [typingUsers, setTypingUsers] = useState([]);
    const socket = useRef();
    const location = useLocation();
    const navigate = useNavigate();
    const hasAutoSelected = useRef(false);

    // Connect to Socket.io
    useEffect(() => {
        if (loginData?._id) {
            socket.current = io(process.env.REACT_APP_API_URL || 'http://localhost:8000');
            
            socket.current.on('connect', () => {
                socket.current.emit("addUser", loginData._id);
            });
            
            if (socket.current.connected) {
                socket.current.emit("addUser", loginData._id);
            }
            
            // We need the server to emit getUsers to update online status. Currently server doesn't emit getUsers.
            // For now onlineUsers will just be local or handled if we update index.js later.
        }
        return () => {
            if (socket.current) {
                socket.current.disconnect();
            }
        };
    }, [loginData]);

    // Send Message to socket
    useEffect(() => {
        if (sendMessage !== null && socket.current) {
            socket.current.emit('sendMessage', sendMessage);
            
            // Also move the chat to top of list
            setChats(prev => {
                const chatIndex = prev.findIndex(c => c._id === sendMessage.chatId);
                if (chatIndex === -1) return prev;
                const chat = {...prev[chatIndex]};
                chat.lastMessage = {
                    text: sendMessage.text,
                    senderId: sendMessage.senderId,
                    isRead: false
                };
                chat.updatedAt = new Date().toISOString();
                const newChats = [...prev];
                newChats.splice(chatIndex, 1);
                return [chat, ...newChats];
            });
        }
    }, [sendMessage]);

    // Receive Message from socket
    useEffect(() => {
        if (!socket.current) return;

        const fetchAndAddChat = async (senderId, messageData) => {
            try {
                const token = localStorage.getItem('usertoken');
                const res = await fetch(`${process.env.REACT_APP_API_URL}/api/chat/find/${senderId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const result = await res.json();
                if (result.success && result.data) {
                    const newChat = result.data;
                    // Ensure the lastMessage is set to the received message
                    newChat.lastMessage = {
                        text: messageData.text,
                        senderId: messageData.senderId,
                        isRead: false,
                        status: messageData.status || 'sent'
                    };
                    newChat.updatedAt = new Date().toISOString();
                    
                    setChats(prev => {
                        if (prev.some(c => c._id === newChat._id)) return prev;
                        return [newChat, ...prev];
                    });
                }
            } catch (error) {
                console.error("Error fetching new chat details:", error);
            }
        };

        const handleGetMessage = (data) => {
            setReceiveMessage(data);
            
            // If chat is not active, emit delivered
            if (!currentChat || currentChat._id !== data.chatId) {
                socket.current.emit('messageDelivered', { senderId: data.senderId, chatId: data.chatId, messageId: data._id });
            }

            // Move chat to top of list
            setChats(prev => {
                    const chatIndex = prev.findIndex(c => c._id === data.chatId);
                    if (chatIndex === -1) {
                        fetchAndAddChat(data.senderId, data);
                        return prev;
                    }
                    const chat = {...prev[chatIndex]};
                    chat.lastMessage = {
                        text: data.text,
                        senderId: data.senderId,
                        isRead: false
                    };
                    chat.updatedAt = new Date().toISOString();
                    const newChats = [...prev];
                    newChats.splice(chatIndex, 1);
                    return [chat, ...newChats];
                });
        };

        const handleStatusUpdate = ({ chatId, messageId, status }) => {
            // Update the local chats state
            setChats(prev => prev.map(c => {
                if (c._id === chatId && c.lastMessage) {
                    return { ...c, lastMessage: { ...c.lastMessage, status, isRead: status === 'seen' } };
                }
                return c;
            }));

            // Also update the currentChat if it is the one open
            if (currentChat && currentChat._id === chatId) {
                setCurrentChat(prev => ({
                    ...prev,
                    lastMessage: prev.lastMessage ? { ...prev.lastMessage, status, isRead: status === 'seen' } : prev.lastMessage
                }));
            }
        };

        const handleTyping = ({ senderId, chatId }) => {
            setTypingUsers(prev => {
                if (!prev.find(t => t.chatId === chatId && t.senderId === senderId)) {
                    return [...prev, { chatId, senderId }];
                }
                return prev;
            });
        };

        const handleStopTyping = ({ senderId, chatId }) => {
            setTypingUsers(prev => prev.filter(t => !(t.chatId === chatId && t.senderId === senderId)));
        };

        const handleConversationDeleted = (data) => {
            setChats(prev => prev.filter(c => c._id !== data.chatId));
            setCurrentChat(prev => prev?._id === data.chatId ? null : prev);
        };

        const handleChatHistoryCleared = (data) => {
            setChats(prev => prev.map(c => {
                if (c._id === data.chatId) {
                    return { ...c, lastMessage: null };
                }
                return c;
            }));
        };

        socket.current.on('getMessage', handleGetMessage);
        socket.current.on('messageStatusUpdate', handleStatusUpdate);
        socket.current.on('typing', handleTyping);
        socket.current.on('stopTyping', handleStopTyping);
        socket.current.on('conversationDeleted', handleConversationDeleted);
        socket.current.on('chatHistoryCleared', handleChatHistoryCleared);

        return () => {
            socket.current.off('getMessage', handleGetMessage);
            socket.current.off('messageStatusUpdate', handleStatusUpdate);
            socket.current.off('typing', handleTyping);
            socket.current.off('stopTyping', handleStopTyping);
            socket.current.off('conversationDeleted', handleConversationDeleted);
            socket.current.off('chatHistoryCleared', handleChatHistoryCleared);
        };
    }, [currentChat]);

    // Fetch user chats
    useEffect(() => {
        const getChats = async () => {
            try {
                const token = localStorage.getItem('usertoken');
                const res = await fetch(`${process.env.REACT_APP_API_URL}/api/chat`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const result = await res.json();
                if (result.success) {
                    setChats(result.data);
                }
            } catch (error) {
                console.log(error);
            }
        };
        if (loginData?._id) {
            getChats();
        }
    }, [loginData]);

    // Auto-select chat if passed from profile navigation
    useEffect(() => {
        if (!hasAutoSelected.current && chats.length > 0 && location.state?.chatId) {
            const targetChat = chats.find(c => c._id === location.state.chatId);
            if (targetChat) {
                setCurrentChat(targetChat);
                hasAutoSelected.current = true;
                // Clear the state so it doesn't auto-select on refresh if the user selects another chat
                navigate(location.pathname, { replace: true, state: {} });
            }
        }
    }, [chats, location.state?.chatId, navigate, location.pathname]);

    return (
        <div className="w-full h-[calc(100vh-64px)] md:h-[calc(100vh-80px)] bg-neutral-100 dark:bg-slate-900">
            <div className="bg-white dark:bg-slate-800 h-full flex overflow-hidden relative">
                
                {/* Left Side: Chat List */}
                <div className={`w-full md:w-1/3 border-r border-neutral-200 dark:border-slate-700 ${currentChat ? 'hidden md:block' : 'block'}`}>
                    <ChatList 
                        chats={chats} 
                        currentUserId={loginData?._id}
                        setCurrentChat={setCurrentChat}
                        onlineUsers={onlineUsers}
                        role={loginData?.role}
                        loginData={loginData}
                        onChatDeleted={(chatId) => {
                            setChats(prev => prev.filter(c => c._id !== chatId));
                            if (currentChat?._id === chatId) setCurrentChat(null);
                        }}
                        onChatCleared={(chatId) => {
                            setChats(prev => prev.map(c => c._id === chatId ? { ...c, lastMessage: null } : c));
                        }}
                    />
                </div>

                {/* Right Side: Chat Box */}
                <div className={`flex-1 flex flex-col ${!currentChat ? 'hidden md:flex' : 'flex'}`}>
                    <ChatBox 
                        chat={currentChat} 
                        currentUserId={loginData?._id}
                        setSendMessage={setSendMessage}
                        receiveMessage={receiveMessage}
                        setCurrentChat={setCurrentChat}
                        chatsLength={chats?.length}
                        role={loginData?.role}
                        socket={socket}
                        typingUsers={typingUsers}
                    />
                </div>

            </div>
        </div>
    );
};
