import mongoose from 'mongoose';

const CompanySchema = new mongoose.Schema({
    userId: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    companyName: {
        type: String,
        required: true,
        trim: true
    },
    companyLogo: {
        type: String,
        default: ''
    },
    bannerPhoto: {
        type: String,
        default: ''
    },
    shortName: {
        type: String,
        default: ''
    },
    contactEmail: {
        type: String,
        default: ''
    },
    contactPhone: {
        type: String,
        default: ''
    },
    industry: {
        type: String,
        required: true
    },
    website: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: ''
    },
    location: {
        type: String,
        default: ''
    },
    country: {
        type: String,
        default: ''
    },
    state: {
        type: String,
        default: ''
    },
    city: {
        type: String,
        default: ''
    },
    zipCode: {
        type: String,
        default: ''
    },
    socialLinks: {
        linkedin: { type: String, default: '' },
        twitter: { type: String, default: '' }
    },
    techStack: {
        type: [String],
        default: []
    },
    benefits: {
        type: [String],
        default: []
    },
    gallery: {
        type: [String],
        default: []
    },
    missionVision: {
        type: String,
        default: ''
    },
    awards: {
        type: [String],
        default: []
    },
    keyPeople: [{
        name: { type: String, required: true },
        role: { type: String, required: true },
        linkedIn: { type: String, default: '' }
    }],
    employeeCount: {
        type: String,
        enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'],
        default: '1-10'
    },
    foundedYear: {
        type: Number
    },
    employerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    coordinators: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    recruiters: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    connectedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, { timestamps: true });

const Company = mongoose.model('Company', CompanySchema);

export default Company;
