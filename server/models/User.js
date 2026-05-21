import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    userId: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    userName:{
        type: String,
        required: true
    },
    userEmail: {
        type: String,
        required: true,
        unique: true
    },
    userPassword: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    profilePhoto: {
        type: String,
        default: ""
    },
    bannerPhoto: {
        type: String,
        default: ""
    },
    bio: {
        type: String,
        default: ""
    },
    skills: {
        type: [String],
        default: []
    },
    preferredJobType: {
        type: String,
        enum: ["Full-time", "Part-time", "Contract", "Internship", "Freelance", ""],
        default: ""
    },
    firstName: {
        type: String,
        default: ""
    },
    middleName: {
        type: String,
        default: ""
    },
    lastName: {
        type: String,
        default: ""
    },
    phone: {
        type: String,
        default: ""
    },
    address: {
        type: String,
        default: ""
    },
    country: {
        type: String,
        default: ""
    },
    state: {
        type: String,
        default: ""
    },
    city: {
        type: String,
        default: ""
    },
    zipCode: {
        type: String,
        default: ""
    },
    role: {
        type: String,
        required: true,
        enum: ["employer", "coordinator", "recruiter", "candidate"],
        default: "candidate"
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        default: null
    },
    isAssigned: {
        type: Boolean,
        default: false
    },
    applications: [{
        jobId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Job',
            required: true
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'shortlist', 'rejected'],
            default: 'active'
        }
    }],
    emailAlerts: {
        type: Boolean,
        default: true
    },
    lastJobNotificationSentAt: {
        type: Date,
        default: null
    },
    savedPosts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }],
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    connectedCompanies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    }]
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

export default User;
