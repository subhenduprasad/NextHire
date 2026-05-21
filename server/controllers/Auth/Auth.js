import User from '../../models/User.js';
import Company from '../../models/Company.js';
import Otp from '../../models/Otp.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateUniqueUserId } from '../../utils/userIdGenerator.js';
import { sendOtp } from '../../utils/sendOtp.js';
import ImageKit from 'imagekit';

let imagekitInstance = null;
const getImageKit = () => {
    if (!imagekitInstance) {
        imagekitInstance = new ImageKit({
            publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
            privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
            urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
        });
    }
    return imagekitInstance;
};

const JWT_SECRET = process.env.JWT_SECRET || 'atsjwtkey';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '3d';

const generateToken = (userId) => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
};

export const sendRegisterOtp = async (req, res) => {
    try {
        const { userEmail } = req.body;

        if (!userEmail) {
            return res.status(400).json({ success: false, error: 'Email is required' });
        }

        const emailLower = userEmail.toLowerCase().trim();
        const existingUser = await User.findOne({ userEmail: emailLower });
        
        if (existingUser) {
            return res.status(400).json({ success: false, error: 'User already exists with this email' });
        }

        const otp = generateOTP();

        await Otp.deleteMany({ email: emailLower });

        const newOtp = new Otp({ email: emailLower, otp });
        await newOtp.save();

        const isSent = await sendOtp(emailLower, otp);
        if (!isSent) {
            return res.status(500).json({ success: false, error: 'Failed to send OTP email' });
        }

        res.status(200).json({ success: true, message: 'OTP sent successfully' });

    } catch (error) {
        console.error('Error sending register OTP:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

export const sendLoginOtp = async (req, res) => {
    try {
        const { userEmail, userPassword } = req.body;

        if (!userEmail || !userPassword) {
            return res.status(400).json({ success: false, error: 'Email and password are required' });
        }

        const emailLower = userEmail.toLowerCase().trim();
        const user = await User.findOne({ userEmail: emailLower });

        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(userPassword, user.userPassword);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const otp = generateOTP();

        // Delete any existing OTP for this email
        await Otp.deleteMany({ email: emailLower });

        // Save new OTP
        const newOtp = new Otp({ email: emailLower, otp });
        await newOtp.save();

        // Send OTP via email
        const isSent = await sendOtp(emailLower, otp);
        if (!isSent) {
            return res.status(500).json({ success: false, error: 'Failed to send OTP email' });
        }

        res.status(200).json({ success: true, message: 'OTP sent successfully' });

    } catch (error) {
        console.error('Error sending login OTP:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

export const sendPasswordResetOtp = async (req, res) => {
    try {
        const { userEmail } = req.body;

        if (!userEmail) {
            return res.status(400).json({ success: false, error: 'Email is required' });
        }

        const emailLower = userEmail.toLowerCase().trim();
        const user = await User.findOne({ userEmail: emailLower });

        if (!user) {
            return res.status(404).json({ success: false, error: 'No account found with this email' });
        }

        const otp = generateOTP();

        await Otp.deleteMany({ email: emailLower });

        const newOtp = new Otp({ email: emailLower, otp });
        await newOtp.save();

        const isSent = await sendOtp(emailLower, otp);
        if (!isSent) {
            return res.status(500).json({ success: false, error: 'Failed to send OTP email' });
        }

        res.status(200).json({ success: true, message: 'OTP sent successfully' });

    } catch (error) {
        console.error('Error sending password reset OTP:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

export const sendDeleteAccountOtp = async (req, res) => {
    try {
        const { userEmail } = req.body;

        if (!userEmail) {
            return res.status(400).json({ success: false, error: 'Email is required' });
        }

        const emailLower = userEmail.toLowerCase().trim();
        const user = await User.findOne({ userEmail: emailLower });

        if (!user) {
            return res.status(404).json({ success: false, error: 'User account not found' });
        }

        const otp = generateOTP();

        await Otp.deleteMany({ email: emailLower });

        const newOtp = new Otp({ email: emailLower, otp });
        await newOtp.save();

        const isSent = await sendOtp(emailLower, otp);
        if (!isSent) {
            return res.status(500).json({ success: false, error: 'Failed to send OTP email' });
        }

        res.status(200).json({ success: true, message: 'Account deletion OTP sent successfully' });

    } catch (error) {
        console.error('Error sending deletion OTP:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { userEmail, otp, newPassword } = req.body;

        if (!userEmail || !otp || !newPassword) {
            return res.status(400).json({ success: false, error: 'Email, OTP, and New Password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
        }

        const emailLower = userEmail.toLowerCase().trim();
        
        const validOtp = await Otp.findOne({ email: emailLower, otp });
        if (!validOtp) {
            return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
        }

        const user = await User.findOne({ userEmail: emailLower });
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.userPassword = hashedPassword;
        await user.save();

        await Otp.deleteMany({ email: emailLower });

        res.status(200).json({ success: true, message: 'Password reset successfully' });

    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

const register = async (req, res) => {
    try {
        const {
            // General & Person
            firstName,
            middleName,
            lastName,
            userEmail,
            userPassword,
            gender,
            phone,
            country,
            state,
            city,
            zipCode,
            role,
            bio,
            skills,
            
            // Employer
            companyName,
            shortName,
            contactMail,
            contactPhone,
            companyIndustry,
            companyWebsite,
            
            // Internal
            isAssigned = false,
            applications = [],
            otp
        } = req.body;

        if (!userEmail || !userPassword || !role || !otp) {
            return res.status(400).json({
                success: false,
                error: 'Please provide all required fields including OTP'
            });
        }

        if (role === 'employer') {
            if (!companyName || !shortName || !companyIndustry || !country || !state || !city || !zipCode) {
                return res.status(400).json({
                    success: false,
                    error: 'Please provide all required company details and full address'
                });
            }
        } else {
            if (!firstName || !lastName || !gender || !country || !state || !city || !zipCode) {
                return res.status(400).json({
                    success: false,
                    error: 'Please provide all required personal details and full address'
                });
            }
        }

        const emailLower = userEmail.toLowerCase().trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailLower)) {
            return res.status(400).json({
                success: false,
                error: 'Please provide a valid email address'
            });
        }

        if (userPassword.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 6 characters long'
            });
        }

        // Verify OTP
        const validOtp = await Otp.findOne({ email: emailLower, otp });
        if (!validOtp) {
            return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
        }

        const existingUser = await User.findOne({ userEmail: emailLower });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'User already exists with this email'
            });
        }

        const salt = await bcrypt.genSalt(12);
        const hashPassword = await bcrypt.hash(userPassword, salt);

        let finalProfilePhoto = "";
        let finalBannerPhoto = "";

        // Upload files if present
        if (req.files) {
            try {
                const ik = getImageKit();
                if (req.files['profilePhoto'] && req.files['profilePhoto'][0]) {
                    const file = req.files['profilePhoto'][0];
                    const response = await ik.upload({
                        file: file.buffer,
                        fileName: `profile-${Date.now()}-${file.originalname}`
                    });
                    finalProfilePhoto = response.url;
                }
                if (req.files['bannerPhoto'] && req.files['bannerPhoto'][0]) {
                    const file = req.files['bannerPhoto'][0];
                    const response = await ik.upload({
                        file: file.buffer,
                        fileName: `banner-${Date.now()}-${file.originalname}`
                    });
                    finalBannerPhoto = response.url;
                }
            } catch (uploadError) {
                console.error("Image upload failed:", uploadError);
                // Non-blocking failure, or we could block it
            }
        }

        const syntheticUserName = role === 'employer' 
            ? shortName 
            : [firstName, middleName, lastName].filter(Boolean).join(' ');

        // Generate unique userId for the new user account
        const userBaseName = firstName || syntheticUserName || 'user';
        const generatedUserId = await generateUniqueUserId(userBaseName, User, 'user');

        const newUser = new User({ 
            userId: generatedUserId,
            userName: syntheticUserName,
            firstName: firstName || "",
            middleName: middleName || "",
            lastName: lastName || "",
            userEmail: emailLower,
            userPassword: hashPassword,
            gender: gender || "N/A",
            phone: phone || "",
            profilePhoto: finalProfilePhoto,
            bannerPhoto: finalBannerPhoto,
            bio: bio || "",
            skills: skills || [],
            country: country || "",
            state: state || "",
            city: city || "",
            zipCode: zipCode || "",
            address: `${city || ''}, ${state || ''}, ${country || ''}`.replace(/^[,\s]+|[,\s]+$/g, '').replace(/,[,\s]*,/g, ','),
            role,
            isAssigned,
            applications
        });

        await newUser.save();

        if (role === 'employer' && companyName) {
            // Generate unique userId for the new company account
            const companyBaseName = shortName || companyName || 'company';
            const generatedCompanyUserId = await generateUniqueUserId(companyBaseName, Company, 'company');

            const company = new Company({
                userId: generatedCompanyUserId,
                companyName,
                shortName: shortName || "",
                contactEmail: contactMail || "",
                contactPhone: contactPhone || "",
                companyLogo: finalProfilePhoto,
                bannerPhoto: finalBannerPhoto,
                industry: companyIndustry || 'Technology',
                country: country || "",
                state: state || "",
                city: city || "",
                zipCode: zipCode || "",
                location: `${city || ''}, ${state || ''}, ${country || ''}`.replace(/^[,\s]+|[,\s]+$/g, '').replace(/,[,\s]*,/g, ','),
                description: bio || '',
                website: companyWebsite || '',
                employerId: newUser._id
            });
            await company.save();
            newUser.companyId = company._id;
            await newUser.save();
        }

        // Clean up OTP after successful registration
        await Otp.deleteMany({ email: emailLower });

        res.status(201).json({
            success: true,
            message: 'User registered successfully'
        });
    }
    catch (error) {
        console.error('Error registering user:', error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                error: 'Account already exists with this email address'
            });
        }
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
};

const login = async (req, res) => {
    try {
        const { userEmail, userPassword, otp } = req.body;

        if (!userEmail || !userPassword || !otp) {
            return res.status(400).json({
                success: false,
                error: 'Please provide email, password, and OTP'
            });
        }

        const emailLower = userEmail.toLowerCase().trim();
        const user = await User.findOne({ userEmail: emailLower });
        
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        const isPasswordValid = await bcrypt.compare(userPassword, user.userPassword);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Verify OTP
        const validOtp = await Otp.findOne({ email: emailLower, otp });
        if (!validOtp) {
            return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
        }

        // Clean up OTP after successful login
        await Otp.deleteMany({ email: emailLower });

        const token = generateToken(user._id);

        res.cookie('token', token, {
            maxAge: 3 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });

        // Fetch latest user data with companyId populated
        const freshUser = await User.findById(user._id).select('-userPassword').populate('companyId');

        res.status(200).json({
            success: true,
            message: "Login successful",
            user: freshUser,
            token
        });
    }
    catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

const logout = (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });
        res.status(200).json({
            success: true,
            message: "Logout successful"
        });
    } catch (error) {
        console.error('Error logging out user:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-userPassword').populate('companyId');
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        const newToken = generateToken(user._id);
        res.cookie('token', newToken, {
            maxAge: 3 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });

        res.status(200).json({
            success: true,
            data: user,
            token: newToken
        });
    } catch (error) {
        console.error('Error getting current user:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

export { register, login, logout, getCurrentUser };
