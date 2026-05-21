import Company from '../../models/Company.js';
import User from '../../models/User.js';
import { createNotification } from '../../utils/createNotification.js';

// Create a new company
export const createCompany = async (req, res) => {
    try {
        const { companyName, industry, location, description, website, employeeCount, foundedYear, companyLogo } = req.body;
        const employerId = req.user._id;

        // Check if employer already has a company
        const existingCompany = await Company.findOne({ employerId });
        if (existingCompany) {
            return res.status(400).json({ success: false, message: 'You already have a company registered' });
        }

        const company = new Company({
            companyName,
            industry,
            location,
            description,
            website,
            employeeCount,
            foundedYear,
            companyLogo,
            employerId
        });

        await company.save();

        // Update the employer's companyId
        await User.findByIdAndUpdate(employerId, { companyId: company._id });

        res.status(201).json({ success: true, data: company, message: 'Company created successfully' });
    } catch (error) {
        console.error('Error creating company:', error);
        res.status(500).json({ success: false, message: 'Failed to create company', error: error.message });
    }
};

// Get all companies
export const getAllCompanies = async (req, res) => {
    try {
        const { industry, location, search } = req.query;
        let query = { isActive: true };

        if (industry) query.industry = industry;
        if (location) query.location = { $regex: location, $options: 'i' };
        if (search) {
            query.$or = [
                { companyName: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const companies = await Company.find(query)
            .populate('employerId', 'userName userEmail')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: companies });
    } catch (error) {
        console.error('Error fetching companies:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch companies' });
    }
};

// Get company by ID
export const getCompanyById = async (req, res) => {
    try {
        const company = await Company.findById(req.params.id)
            .populate('employerId', 'userName userEmail')
            .populate('coordinators', 'userName userEmail')
            .populate('recruiters', 'userName userEmail');

        if (!company) {
            return res.status(404).json({ success: false, message: 'Company not found' });
        }

        res.status(200).json({ success: true, data: company });
    } catch (error) {
        console.error('Error fetching company:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch company' });
    }
};

// Get company by employer ID
export const getCompanyByEmployer = async (req, res) => {
    try {
        const company = await Company.findOne({ employerId: req.params.employerId });
        if (!company) {
            return res.status(404).json({ success: false, message: 'Company not found' });
        }
        res.status(200).json({ success: true, data: company });
    } catch (error) {
        console.error('Error fetching company:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch company' });
    }
};

// Update company
export const updateCompany = async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);
        
        if (!company) {
            return res.status(404).json({ success: false, message: 'Company not found' });
        }

        // Check if the user is the owner
        if (company.employerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this company' });
        }

        const updatedCompany = await Company.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );

        res.status(200).json({ success: true, data: updatedCompany, message: 'Company updated successfully' });
    } catch (error) {
        console.error('Error updating company:', error);
        res.status(500).json({ success: false, message: 'Failed to update company' });
    }
};

// Add team member (coordinator/recruiter) to company
export const addTeamMember = async (req, res) => {
    try {
        const { userId, role } = req.body;
        const company = await Company.findById(req.params.id);

        if (!company) {
            return res.status(404).json({ success: false, message: 'Company not found' });
        }

        // Verify ownership
        if (company.employerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Update user's companyId and role
        await User.findByIdAndUpdate(userId, { companyId: company._id, role });

        // Add to appropriate array
        if (role === 'coordinator') {
            if (!company.coordinators.includes(userId)) {
                company.coordinators.push(userId);
            }
        } else if (role === 'recruiter') {
            if (!company.recruiters.includes(userId)) {
                company.recruiters.push(userId);
            }
        }

        await company.save();

        res.status(200).json({ success: true, data: company, message: 'Team member added successfully' });
    } catch (error) {
        console.error('Error adding team member:', error);
        res.status(500).json({ success: false, message: 'Failed to add team member' });
    }
};

// Remove team member from company
export const removeTeamMember = async (req, res) => {
    try {
        const { userId } = req.body;
        const company = await Company.findById(req.params.id);

        if (!company) {
            return res.status(404).json({ success: false, message: 'Company not found' });
        }

        // Verify ownership
        if (company.employerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Remove from arrays
        company.coordinators = company.coordinators.filter(id => id.toString() !== userId);
        company.recruiters = company.recruiters.filter(id => id.toString() !== userId);

        await company.save();

        // Update user's companyId to null
        await User.findByIdAndUpdate(userId, { companyId: null });

        res.status(200).json({ success: true, message: 'Team member removed successfully' });
    } catch (error) {
        console.error('Error removing team member:', error);
        res.status(500).json({ success: false, message: 'Failed to remove team member' });
    }
};

// Get my company (for logged-in user)
export const getMyCompany = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        if (!user.companyId) {
            // If employer, try to find company by employerId
            if (user.role === 'employer') {
                const company = await Company.findOne({ employerId: req.user._id });
                if (company) {
                    return res.status(200).json({ success: true, data: company });
                }
            }
            return res.status(404).json({ success: false, message: 'No company associated with your account' });
        }

        const company = await Company.findById(user.companyId)
            .populate('employerId', 'userName userEmail')
            .populate('coordinators', 'userName userEmail')
            .populate('recruiters', 'userName userEmail');

        res.status(200).json({ success: true, data: company });
    } catch (error) {
        console.error('Error fetching company:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch company' });
    }
};

// Toggle connect user to company
export const toggleConnectUser = async (req, res) => {
    try {
        const { id } = req.params; // Company ID
        const { userId } = req.body;

        const company = await Company.findById(id);
        const user = await User.findById(userId);

        if (!company || !user) {
            return res.status(404).json({ success: false, message: "Company or User not found." });
        }

        const isConnected = company.connectedUsers.includes(userId);

        if (isConnected) {
            company.connectedUsers = company.connectedUsers.filter(uid => uid.toString() !== userId);
            user.connectedCompanies = user.connectedCompanies.filter(cid => cid.toString() !== id);
        } else {
            company.connectedUsers.push(userId);
            user.connectedCompanies.push(id);
        }

        await company.save();
        await user.save();

        // Broadcast to Employer for real-time profile update
        if (company.employerId && global.onlineUsers && global.onlineUsers.has(company.employerId.toString())) {
            const socketIds = global.onlineUsers.get(company.employerId.toString());
            if (socketIds && socketIds.size > 0) {
                socketIds.forEach(socketId => {
                    global.io.to(socketId).emit('networkUpdate', {
                        companyId: company._id.toString(),
                        connectedUsers: company.connectedUsers
                    });
                });
            }
        }

        if (!isConnected) {
            await createNotification({
                recipient: company.employerId,
                sender: userId,
                title: 'New Connection Request/Link',
                message: `${user.userName} connected with your company, ${company.companyName}`,
                type: 'connection',
                relatedId: company._id
            });
        }

        res.status(200).json({ 
            success: true, 
            message: isConnected ? "Disconnected successfully." : "Connected successfully.",
            isConnected: !isConnected,
            connectionsCount: company.connectedUsers.length,
            currentUserConnectedCompanies: user.connectedCompanies
        });
    } catch (error) {
        console.error("Error toggling connect to company:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const getCompanyNetwork = async (req, res) => {
    try {
        const companyId = req.params.id;
        
        const companyNetwork = await Company.findById(companyId)
            .populate('connectedUsers', 'userName profilePhoto role email');
            
        if (!companyNetwork) {
            return res.status(404).json({ success: false, message: "Company not found" });
        }

        res.status(200).json({ 
            success: true, 
            connectedUsers: companyNetwork.connectedUsers
        });
    } catch (error) {
        console.error("Fetch Company Network Error:", error);
        res.status(500).json({ success: false, message: "Failed to get company network" });
    }
};
