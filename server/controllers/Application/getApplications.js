import Application from '../../models/Application.js'

const getApplications = async (req, res) => {
    try {

        // Populate job and candidate details
        const applications = await Application.find()
            .populate({
                path: 'jobID',
                model: 'Job',
            })
            .populate({
                path: 'candidateID',
                model: 'User',
            });
        res.status(200).json(applications);
        
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export {getApplications};