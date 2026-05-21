import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const secret = process.env.JWT_SECRET || "atsjwtkey";

const authenticate = async (req, res, next) => {
    try {
        // Get token from header or cookie
        let token = req.headers.authorization;
        
        // Check for Bearer token format
        if (token && token.startsWith('Bearer ')) {
            token = token.slice(7);
        } else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: "Access denied. No token provided." 
            });
        }
        
        const decoded = jwt.verify(token, secret);
        
        const user = await User.findById(decoded.userId).select('-userPassword');
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: "User not found" 
            });
        }
        
        req.token = token;
        req.userId = decoded.userId;
        req.user = user;

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: "Token expired. Please login again." 
            });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false, 
                message: "Invalid token" 
            });
        }
        return res.status(401).json({ 
            success: false, 
            message: "Authentication failed" 
        });
    }
};

// Role-based authorization middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: "Not authenticated" 
            });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: "Not authorized to access this resource" 
            });
        }
        next();
    };
};

export { authenticate, authorize };