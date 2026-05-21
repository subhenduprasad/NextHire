import User from '../../models/User.js';

const getNetwork = async (req, res) => {
    try {
        const userId = req.params.id;
        
        const userNetwork = await User.findById(userId)
            .populate('followers', 'userName profilePhoto role')
            .populate('following', 'userName profilePhoto role')
            .populate('connectedCompanies', 'companyName companyLogo industry location');
            
        if (!userNetwork) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({ 
            success: true, 
            followers: userNetwork.followers,
            following: userNetwork.following,
            connectedCompanies: userNetwork.connectedCompanies
        });
    } catch (error) {
        console.error("Fetch Network Error:", error);
        res.status(500).json({ success: false, message: "Failed to get user network" });
    }
};

export { getNetwork };
