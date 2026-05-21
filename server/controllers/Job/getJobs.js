import Job from '../../models/Job.js';
import Company from '../../models/Company.js';

const getJobs = async (req, res) => {
    try {
        // Support filtering
        const filter = { isActive: true };
        
        if (req.query.employmentType) {
            filter.employmentType = req.query.employmentType;
        }
        if (req.query.location) {
            filter.location = { $regex: req.query.location, $options: 'i' };
        }
        if (req.query.companyId) {
            filter.companyId = req.query.companyId;
        }
        if (req.query.search) {
            // First find companies matching the search term
            const matchingCompanies = await Company.find({ 
                companyName: { $regex: req.query.search, $options: 'i' } 
            }).select('_id');
            const companyIds = matchingCompanies.map(c => c._id);

            filter.$or = [
                { jobTitle: { $regex: req.query.search, $options: 'i' } },
                { description: { $regex: req.query.search, $options: 'i' } }
            ];

            if (companyIds.length > 0) {
                filter.$or.push({ companyId: { $in: companyIds } });
            }
        }

        const jobs = await Job.find(filter)
            .populate('companyId', 'companyName companyLogo industry location')
            .sort({ createdAt: -1 });

        // Return array directly for backward compatibility
        res.status(200).json(jobs);
    } catch (error) {
        console.error('Get jobs error:', error);
        res.status(500).json([]);
    }
};

// Get jobs by company (for employer/coordinator dashboard)
const getJobsByCompany = async (req, res) => {
    try {
        const { companyId } = req.params;

        // Auto-expire jobs whose deadline has passed
        const now = new Date();
        await Job.updateMany(
            { companyId, isActive: true, applicationDeadline: { $lt: now } },
            { $set: { isActive: false } }
        );
        
        const jobs = await Job.find({ companyId })
            .populate('companyId', 'companyName companyLogo')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: jobs });
    } catch (error) {
        console.error('Get jobs by company error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch jobs' });
    }
};

// Get jobs by employer
const getJobsByEmployer = async (req, res) => {
    try {
        const { employerId } = req.params;

        // Auto-expire jobs whose deadline has passed
        const now = new Date();
        await Job.updateMany(
            { employerId, isActive: true, applicationDeadline: { $lt: now } },
            { $set: { isActive: false } }
        );
        
        const jobs = await Job.find({ employerId })
            .populate('companyId', 'companyName companyLogo')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: jobs });
    } catch (error) {
        console.error('Get jobs by employer error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch jobs' });
    }
};

export { getJobs, getJobsByCompany, getJobsByEmployer };
