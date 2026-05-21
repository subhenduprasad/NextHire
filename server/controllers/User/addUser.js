import User from '../../models/User.js'
import uniqid from 'uniqid';
import bcrypt from 'bcryptjs';

const addUser = async (req, res) => {
    try {
        const {userName, userEmail, userPassword, gender, address, userType } = req.body;
        
        const salt = await bcrypt.genSalt(12);
        const hashPassword = await bcrypt.hash(userPassword, salt);

        const newUser = new User({
            userName,
            userEmail,
            userPassword: hashPassword,
            gender,
            address,
            userType
        });

        await newUser.save();

        res.status(201).json(newUser);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export {addUser};