import Application from '../../models/Application.js'

const getMyApplications = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const applications = await Application.find({ candidateID: userId })
            .populate({ path: 'jobID', model: 'Job' })
            .populate({ path: 'candidateID', model: 'User' });

        console.log(`getMyApplications: userId=${userId} -> applications=${applications.length}`);

        return res.status(200).json(applications);
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export { getMyApplications };
