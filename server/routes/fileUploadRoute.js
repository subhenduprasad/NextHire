import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import User from '../models/User.js';
import Company from '../models/Company.js';
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

const router = express.Router();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const memoryStorage = multer.memoryStorage();

// File filter for resumes
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'), false);
    }
};

const uploadResume = multer({ 
    storage: memoryStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// File upload route - Resumes
router.post("/resume/:id", uploadResume.single("file"), async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ success: false, message: 'No file uploaded.' });
        }

        const ik = getImageKit();
        const ext = file.originalname.split('.').pop();
        const response = await ik.upload({
            file: file.buffer,
            fileName: `${req.params.id}.${ext}`,
            folder: '/resumes/',
            useUniqueFileName: false,
            overwriteFile: true
        });

        res.json({ 
            success: true, 
            message: 'File uploaded successfully',
            file: {
                filename: response.name,
                path: response.url,
                size: file.size
            }
        });
    } catch (error) {
        console.error('Error uploading resume:', error);
        res.status(500).json({ success: false, message: 'Failed to upload resume' });
    }
});

// Get resume by application ID
router.get("/resume/:id", async (req, res) => {
    const id = req.params.id;
    const ik = getImageKit();
    try {
        console.log("GET resume triggered for ID:", id);
        const files = await ik.listFiles({
            searchQuery: `name:"${id}"`,
            path: "/resumes/"
        });
        console.log("ImageKit listFiles result for GET:", files.length, "files found.");
        if (files && files.length > 0) {
            return res.redirect(files[0].url);
        }
        res.status(404).json({ success: false, message: 'Resume not found' });
    } catch (err) {
        console.error("Error fetching resume:", err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Check if resume exists and return URL (JSON)
router.get("/resume-url/:id", async (req, res) => {
    const id = req.params.id;
    const ik = getImageKit();
    try {
        console.log("GET resume-url triggered for ID:", id);
        const files = await ik.listFiles({
            searchQuery: `name:"${id}"`,
            path: "/resumes/"
        });
        if (files && files.length > 0) {
            return res.status(200).json({ success: true, url: files[0].url });
        }
        res.status(404).json({ success: false, message: 'Resume not found' });
    } catch (err) {
        console.error("Error checking resume URL:", err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Profile Photo Upload Setup
const profilePhotoFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'), false);
    }
};

const uploadProfilePhoto = multer({ 
    storage: memoryStorage,
    fileFilter: profilePhotoFilter,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB limit
    }
});

router.post("/profile-photo/:id", uploadProfilePhoto.single("photo"), async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ success: false, message: 'No photo uploaded.' });
        }
        
        const ik = getImageKit();
        const ext = file.originalname.split('.').pop();
        const response = await ik.upload({
            file: file.buffer,
            fileName: `profile-${req.params.id}-${Date.now()}.${ext}`,
            folder: '/profile_photos/'
        });
        
        const photoPath = response.url;
        
        // Update user's profilePhoto field
        const user = await User.findById(req.params.id);
        if(!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        user.profilePhoto = photoPath;
        await user.save();
        
        res.json({ 
            success: true, 
            message: 'Profile photo uploaded successfully',
            profilePhoto: photoPath
        });
    } catch (error) {
        console.error('Error uploading profile photo:', error);
        res.status(500).json({ success: false, message: 'Failed to upload photo' });
    }
});

// Banner Photo Upload Setup
router.post("/banner-photo/:id", uploadProfilePhoto.single("banner"), async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ success: false, message: 'No photo uploaded.' });
        }
        
        const ik = getImageKit();
        const ext = file.originalname.split('.').pop();
        const response = await ik.upload({
            file: file.buffer,
            fileName: `banner-${req.params.id}-${Date.now()}.${ext}`,
            folder: '/banner_photos/'
        });
        
        const photoPath = response.url;
        
        const user = await User.findById(req.params.id);
        if(!user) return res.status(404).json({ success: false, message: 'User not found' });
        
        user.bannerPhoto = photoPath;
        await user.save();
        
        if (user.companyId) {
            const company = await Company.findById(user.companyId);
            if (company) {
                company.bannerPhoto = photoPath;
                await company.save();
            }
        }

        res.json({ 
            success: true, 
            message: 'Banner photo uploaded successfully',
            bannerPhoto: photoPath
        });
    } catch (error) {
        console.error('Error uploading banner photo:', error);
        res.status(500).json({ success: false, message: 'Failed to upload banner' });
    }
});

const uploadGallery = multer({ 
    storage: memoryStorage,
    fileFilter: profilePhotoFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit per image
});

router.post("/company-gallery/:id", uploadGallery.array("photos", 10), async (req, res) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({ success: false, message: 'No photos uploaded.' });
        }

        const company = await Company.findById(req.params.id);
        if (!company) {
            return res.status(404).json({ success: false, message: 'Company not found' });
        }

        const ik = getImageKit();
        const uploadPromises = files.map(file => {
            return ik.upload({
                file: file.buffer,
                fileName: `gallery-${company._id}-${Date.now()}-${file.originalname}`,
                folder: '/company_gallery/'
            });
        });

        const uploadResults = await Promise.all(uploadPromises);
        const imageUrls = uploadResults.map(result => result.url);

        // Update company gallery array (append new photos)
        company.gallery = [...(company.gallery || []), ...imageUrls];
        await company.save();

        res.json({ 
            success: true, 
            message: 'Gallery photos uploaded successfully',
            gallery: company.gallery 
        });
    } catch (error) {
        console.error('Error uploading gallery photos:', error);
        res.status(500).json({ success: false, message: 'Failed to upload gallery photos' });
    }
});

router.delete("/company-gallery/:id", async (req, res) => {
    try {
        const { photoUrl } = req.body;
        const company = await Company.findById(req.params.id);
        if (!company) return res.status(404).json({ success: false, message: "Company not found" });

        company.gallery = company.gallery.filter(url => url !== photoUrl);
        await company.save();

        res.json({ success: true, message: "Photo removed", gallery: company.gallery });
    } catch (error) {
        console.error("Error removing gallery photo", error);
        res.status(500).json({ success: false, message: "Failed to remove photo" });
    }
});

const uploadPostAttachment = multer({
    storage: memoryStorage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

router.post("/post-media", uploadPostAttachment.array("media", 5), async (req, res) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({ success: false, message: 'No files uploaded.' });
        }

        const ik = getImageKit();
        const uploadedImages = [];
        const uploadedPdfs = [];

        for (const file of files) {
            const isPdf = file.mimetype === 'application/pdf';
            const isImage = file.mimetype.startsWith('image/');

            if (isPdf || isImage) {
                // Ensure specific folder based on file type
                const folderName = isPdf ? '/feed/pdf/' : '/feed/image/';
                const response = await ik.upload({
                    file: file.buffer,
                    fileName: `feed-${isPdf ? 'pdf' : 'img'}-${Date.now()}-${file.originalname}`,
                    folder: folderName
                });
                
                if (isPdf) {
                    uploadedPdfs.push({ url: response.url, filename: file.originalname });
                } else {
                    uploadedImages.push(response.url);
                }
            }
        }

        res.json({ success: true, images: uploadedImages, pdfs: uploadedPdfs });
    } catch (error) {
        console.error('Error uploading post media:', error);
        res.status(500).json({ success: false, message: 'Failed to upload media' });
    }
});

export default router;
