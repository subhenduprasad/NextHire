import User from '../../models/User.js';
import { createNotification } from '../../utils/createNotification.js';

export const toggleFollow = async (req, res) => {
    try {
        const { currentUserId, targetUserId } = req.body;

        if (currentUserId === targetUserId) {
            return res.status(400).json({ success: false, message: "You cannot follow yourself." });
        }

        const currentUser = await User.findById(currentUserId);
        const targetUser = await User.findById(targetUserId);

        if (!currentUser || !targetUser) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const isFollowing = currentUser.following.includes(targetUserId);

        if (isFollowing) {
            // Unfollow
            currentUser.following = currentUser.following.filter(id => id.toString() !== targetUserId);
            targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUserId);
        } else {
            // Follow
            currentUser.following.push(targetUserId);
            targetUser.followers.push(currentUserId);
        }

        await currentUser.save();
        await targetUser.save();

        if (!isFollowing) {
            await createNotification({
                recipient: targetUserId,
                sender: currentUserId,
                title: 'New Follower',
                message: `${currentUser.userName} started following you`,
                type: 'follow',
                relatedId: currentUserId
            });
        }

        res.status(200).json({ 
            success: true, 
            message: isFollowing ? "Unfollowed successfully." : "Followed successfully.",
            isFollowing: !isFollowing,
            followersCount: targetUser.followers.length,
            currentUserFollowing: currentUser.following
        });

    } catch (error) {
        console.error("Error toggling follow:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
