import User from '../../models/User.js'

const updateUserByCandidate = async (req, res) => {
    try {
        const { jobID, candidateID, status } = req.body;

        // Find the user and add application
        const updatedUser = await User.findByIdAndUpdate(
            candidateID,
            { $push: { applications: { jobId: jobID, status: status } } },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ success: true, message: 'Application added to user', data: updatedUser });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update user' });
    }
}

export { updateUserByCandidate };