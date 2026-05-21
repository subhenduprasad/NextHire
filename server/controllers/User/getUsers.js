import User from '../../models/User.js'

const getUsers = async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};
        
        if (search) {
            const regex = new RegExp(search, 'i');
            query = {
                $or: [
                    { userName: regex },
                    { firstName: regex },
                    { lastName: regex }
                ]
            };
        }
        
        const users = await User.find(query).select('_id firstName lastName userName userEmail profilePhoto role companyId');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Failed to get user" });
    }
};

export {getUsers};