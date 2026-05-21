import User from '../../models/User.js';
import Company from '../../models/Company.js';
import Job from '../../models/Job.js';
import Otp from '../../models/Otp.js';
import Application from '../../models/Application.js';
import Post from '../../models/Post.js';
import { sendEmail } from '../../utils/sendEmail.js';

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { userEmail, otp } = req.body;

        if (!userEmail || !otp) {
            return res.status(400).json({ success: false, message: "Email and OTP are required for account deletion" });
        }

        const emailLower = userEmail.toLowerCase().trim();

        // Verify OTP
        const validOtp = await Otp.findOne({ email: emailLower, otp });
        if (!validOtp) {
            return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
        }

        const user = await User.findById(id);
        if (!user || user.userEmail !== emailLower) {
            return res.status(404).json({ success: false, message: "User not found or email mismatch" });
        }

        // Cascade delete if user is Employer
        if (user.role === 'employer' && user.companyId) {
            const jobs = await Job.find({ companyId: user.companyId });
            const jobIds = jobs.map(j => j._id);
            await Application.deleteMany({ jobID: { $in: jobIds } });
            await Job.deleteMany({ companyId: user.companyId });
            await Company.findByIdAndDelete(user.companyId);
        }

        // Handle candidates removing references from Jobs and deleting their Applications
        if (user.role === 'candidate') {
            await Job.updateMany(
                { 'applicants.userId': user._id },
                { $pull: { applicants: { userId: user._id } } }
            );
            await Application.deleteMany({ candidateID: user._id });
        }

        // Remove all likes and comments made by this user from all posts
        await Post.updateMany(
            {},
            {
                $pull: {
                    likes: user._id,
                    comments: { userId: user._id }
                }
            }
        );

        await User.findByIdAndDelete(id);
        await Otp.deleteMany({ email: emailLower });

        // Send Goodbye Email
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #e53e3e; text-align: center;">Account Deleted</h2>
                <p style="font-size: 16px; color: #4a5568;">Hi ${user.userName},</p>
                <p style="font-size: 16px; color: #4a5568;">This email confirms that your account associated with <strong>${emailLower}</strong> has been permanently deleted from our platform along with all associated data.</p>
                <p style="font-size: 16px; color: #4a5568;">We're sorry to see you go. If you ever wish to return, you are welcome to create a new account.</p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="font-size: 12px; color: #a0aec0; text-align: center;">If you believe this was a mistake or your account was compromised, please contact our support team immediately.</p>
            </div>
        `;
        await sendEmail(emailLower, "Account Permanent Deletion Confirmation", emailHtml);

        res.status(200).json({ success: true, message: "Account explicitly deleted successfully" });
    } catch (error) {
        console.error("Delete user error:", error);
        res.status(500).json({ success: false, message: "Failed to delete user", error: error.message });
    }
};

export { deleteUser };