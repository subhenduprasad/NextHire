import mongoose from 'mongoose';

const JobSchema = new mongoose.Schema({
    jobID: {
        type: String,
        required: true
    },
    jobTitle: {
        type: String,
        required: true
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    employerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    employmentType: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    salary: {
        type: String,
        default: 'Not specified'
    },
    salaryMin: {
        type: Number,
        default: null
    },
    salaryMax: {
        type: Number,
        default: null
    },
    currency: {
        type: String,
        default: 'INR'
    },
    openings: {
        type: Number,
        default: 1
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'closed'],
        default: 'published'
    },
    experience: {
        type: String,
        default: 'Not specified'
    },
    skills: [{
        type: String
    }],
    description: {
        type: String,
        default: ''
    },
    requirements: {
        type: String,
        default: ''
    },
    applicationDeadline: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    },
    applicationForm:{
        question: [{ type: String}],
        answer: [{ type: String}]
    },
    advancedQuestions: [{
        questionType: { type: String, enum: ['yes_no', 'mcq', 'msq'], required: true },
        question: { type: String, required: true },
        options: [{ type: String }]
    }],
    applicants: [{
        applicant : {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'shortlist', 'rejected'],
            default: 'active'
        }
    }]
}, { timestamps: true });

const Job = mongoose.model('Job', JobSchema);

export default Job;
