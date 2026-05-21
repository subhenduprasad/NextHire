import User from '../models/User.js';
import Company from '../models/Company.js';

export const globalSearch = async (req, res) => {
    try {
        const query = req.query.q;
        
        if (!query || query.trim() === '') {
            return res.status(200).json({ success: true, results: [] });
        }

        const regex = new RegExp(query, 'i');

        // Search Users (exclude employers since they show up under Companies)
        const users = await User.find({
            role: { $ne: 'employer' },
            $or: [
                { userName: regex },
                { userEmail: regex }
            ]
        }).select('_id userName userEmail role profilePhoto').limit(10);

        // Search Companies
        const companies = await Company.find({
            companyName: regex
        }).select('_id companyName industry companyLogo employerId').limit(10);

        // Standardize the output format
        const formattedUsers = users.map(u => ({
            id: u._id,
            name: u.userName,
            subtitle: u.role,
            photo: u.profilePhoto,
            type: 'user'
        }));

        const formattedCompanies = companies.map(c => ({
            id: c._id,
            name: c.companyName,
            subtitle: c.industry || 'Company',
            photo: c.companyLogo,
            employerId: c.employerId,
            type: 'company'
        }));

        const results = [...formattedUsers, ...formattedCompanies];

        // Give preference to users slightly
        res.status(200).json({ success: true, results });
    } catch (error) {
        console.error('Error in global search:', error);
        res.status(500).json({ success: false, message: 'Server error during search' });
    }
};
