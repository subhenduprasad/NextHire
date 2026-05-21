import mongoose from 'mongoose';

const ApplicationSchema = new mongoose.Schema({
    jobID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Job'
    },
    candidateID:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    applicationStatus:{
        type: String,
        required: true,
        default: 'active'
    },
    resumePath: {
        type: String,
        default: null
    },
    applicationForm:[{
        question: { type: String},
        answer: { type: String}
    }],
    candidateFeedback:[{
        question: { type: String},
        answer: { type: String}
    }],
}, { timestamps: true });

const Application = mongoose.model('Application', ApplicationSchema);

export default Application;
