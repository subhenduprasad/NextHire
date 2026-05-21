import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/connectDB.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const httpServer = createServer(app);
const port = process.env.PORT || 8000;

connectDB();

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim())
  .concat(['http://localhost:3001', 'http://localhost:3002']);

const corsOptions = {
  origin: (origin, callback) => {
    
    if (!origin) return callback(null, true);
  
    if (
      allowedOrigins.includes(origin) ||
      /^https:\/\/nexthire(-[a-z0-9]+)?\.vercel\.app$/.test(origin) ||
      /^https:\/\/next-hire(-[a-z0-9]+)?\.vercel\.app$/.test(origin)
    ) {
      return callback(null, true);
    }
    return callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.use(cookieParser());

// === SOCKET CONFIGURATION ===
const io = new Server(httpServer, {
    cors: corsOptions,
    transports: ['websocket', 'polling']
});

global.io = io;
global.onlineUsers = new Map();

io.on('connection', (socket) => {
    socket.on('addUser', (userId) => {
        console.log('Socket addUser called for userId:', userId);
        if (!global.onlineUsers.has(userId)) {
            global.onlineUsers.set(userId, new Set());
        }
        global.onlineUsers.get(userId).add(socket.id);
        socket.userId = userId;
        console.log('Online users count:', global.onlineUsers.size);
    });

    socket.on('sendMessage', (data) => {
        console.log('Socket sendMessage received:', data);
        const { receiverId, ...message } = data;
        const receiverSocketIds = global.onlineUsers.get(receiverId);
        console.log(`Looking up receiverId: ${receiverId}, found socketIds:`, receiverSocketIds);
        if (receiverSocketIds && receiverSocketIds.size > 0) {
            receiverSocketIds.forEach(socketId => {
                console.log('Emitting getMessage to', socketId);
                io.to(socketId).emit('getMessage', message);
            });
        } else {
            console.log('Receiver is offline or not found in global.onlineUsers map.');
        }
    });

    socket.on('messageDelivered', ({ senderId, chatId, messageId }) => {
        const senderSocketIds = global.onlineUsers.get(senderId);
        if (senderSocketIds) {
            senderSocketIds.forEach(socketId => {
                io.to(socketId).emit('messageStatusUpdate', { chatId, messageId, status: 'delivered' });
            });
        }
    });

    socket.on('messageSeen', ({ senderId, chatId, messageId }) => {
        const senderSocketIds = global.onlineUsers.get(senderId);
        if (senderSocketIds) {
            senderSocketIds.forEach(socketId => {
                io.to(socketId).emit('messageStatusUpdate', { chatId, messageId, status: 'seen' });
            });
        }
    });

    socket.on('typing', ({ senderId, receiverId, chatId }) => {
        const receiverSocketIds = global.onlineUsers.get(receiverId);
        if (receiverSocketIds) {
            receiverSocketIds.forEach(socketId => {
                io.to(socketId).emit('typing', { senderId, chatId });
            });
        }
    });

    socket.on('stopTyping', ({ senderId, receiverId, chatId }) => {
        const receiverSocketIds = global.onlineUsers.get(receiverId);
        if (receiverSocketIds) {
            receiverSocketIds.forEach(socketId => {
                io.to(socketId).emit('stopTyping', { senderId, chatId });
            });
        }
    });

    socket.on('disconnect', () => {
        if (socket.userId && global.onlineUsers.has(socket.userId)) {
            const userSockets = global.onlineUsers.get(socket.userId);
            userSockets.delete(socket.id);
            if (userSockets.size === 0) {
                global.onlineUsers.delete(socket.userId);
            }
        } else {
            for (const [userId, sockets] of global.onlineUsers.entries()) {
                if (sockets.has(socket.id)) {
                    sockets.delete(socket.id);
                    if (sockets.size === 0) {
                        global.onlineUsers.delete(userId);
                    }
                }
            }
        }
    });
});


import jobRoutes from "./routes/jobRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import recruiterRoutes from "./routes/recruiterRoutes.js";
import fileUploadRoute from './routes/fileUploadRoute.js';
import Auth from './routes/Auth.js';
import companyRoutes from './routes/companyRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import postRoutes from './routes/postRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import supportRoutes from './routes/supportRoutes.js';

app.use("/api/jobs", jobRoutes);
app.use("/api/users", userRoutes);
app.use("/api/application", applicationRoutes);
app.use("/api/recruiter", recruiterRoutes);
app.use("/api/upload", fileUploadRoute);
app.use("/api/auth", Auth);
app.use("/api/company", companyRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/support", supportRoutes);

app.use("/jobs", jobRoutes);
app.use("/users", userRoutes);
app.use("/application", applicationRoutes);
app.use("/recruiter", recruiterRoutes);
app.use("/upload", fileUploadRoute);
app.use("/auth", Auth);
app.use("/company", companyRoutes);
app.use("/notifications", notificationRoutes);
app.use("/support", supportRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});

app.get("/", (req, res) => {
  res.json({ message: "Job Portal API", version: "2.0.0" });
});

app.use((req, res, next) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error"
  });
});

httpServer.listen(port, () => {
  console.log(`Job Portal Server is running on port ${port}`);
});
