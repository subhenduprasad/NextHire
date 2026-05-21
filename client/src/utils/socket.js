import { io } from 'socket.io-client';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

let socket = null;

export const getSocket = (userId) => {
    if (!socket) {
        socket = io(API_BASE_URL);
        
        socket.on('connect', () => {
            if (userId) {
                socket.emit("addUser", userId);
            }
        });
        
        if (socket.connected && userId) {
            socket.emit("addUser", userId);
        }
    } else if (userId && socket.connected) {
        socket.emit("addUser", userId);
    }
    return socket;
};
