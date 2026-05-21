import User from '../../models/User.js'

const updateUser = async (req, res) => {
    try {
        const {id} = req.params;
        const { userName, userEmail, gender, address, isAssigned, role } = req.body;

        const user = await User.findById(id);
        
        if(!user) {
            return res.status(404).json({ 
                success:false,
                message: "User not found" 
            });
        }
        
        // Update fields if provided
        if (userName !== undefined) user.userName = userName;
        if (userEmail !== undefined) {
            const formattedEmail = userEmail.toLowerCase().trim();
            const existingEmailUser = await User.findOne({ userEmail: formattedEmail });
            if (existingEmailUser && existingEmailUser._id.toString() !== id) {
                return res.status(400).json({ success: false, message: 'Email is already in use by another account' });
            }
            user.userEmail = formattedEmail;
        }
        if (gender !== undefined) user.gender = gender;
        if (req.body.bio !== undefined) user.bio = req.body.bio;
        if (req.body.skills !== undefined) user.skills = req.body.skills;
        if (req.body.preferredJobType !== undefined) user.preferredJobType = req.body.preferredJobType;
        if (typeof isAssigned !== 'undefined') user.isAssigned = isAssigned;
        if (role !== undefined) user.role = role;
        if (req.body.profilePhoto !== undefined) user.profilePhoto = req.body.profilePhoto;
        if (req.body.emailAlerts !== undefined) user.emailAlerts = req.body.emailAlerts;
        
        await user.save();
        res.status(200).json({success: true, message: "User updated successfully", data: user});
        
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

export {updateUser};