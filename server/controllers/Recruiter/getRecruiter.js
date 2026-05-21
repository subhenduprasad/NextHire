import Recruiter from '../../models/Recruiter.js'

const getRecruiter = async (req, res) => {
    try {
        const recID = req.params.id;
        const recruiter = await Recruiter.findById(recID);
        if (!recruiter) {
            return res.status(404).json({ success: false, message: 'Recruiter not found' });
        }
        res.status(200).json({ success: true, data: recruiter });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export {getRecruiter};