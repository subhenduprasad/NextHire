import User from '../models/User.js';
import Company from '../models/Company.js';
import { generateUniqueUserId } from './userIdGenerator.js';

export const backfillUserIds = async () => {
    try {
        console.log('⚡ Starting database backfill for missing userIds...');

        // 1. Backfill Users
        const usersToBackfill = await User.find({
            $or: [
                { userId: { $exists: false } },
                { userId: '' },
                { userId: null }
            ]
        });

        if (usersToBackfill.length > 0) {
            console.log(`👤 Found ${usersToBackfill.length} users requiring unique userIds. Migrating now...`);
            let userCount = 0;
            for (const user of usersToBackfill) {
                // Determine base name (prefer firstName, then userName)
                const baseName = user.firstName || user.userName || 'user';
                const uniqueId = await generateUniqueUserId(baseName, User, 'user');
                
                user.userId = uniqueId;
                await user.save();
                userCount++;
            }
            console.log(`✅ Successfully backfilled ${userCount} user accounts.`);
        } else {
            console.log('👤 All user accounts already have a valid userId.');
        }

        // 2. Backfill Companies
        const companiesToBackfill = await Company.find({
            $or: [
                { userId: { $exists: false } },
                { userId: '' },
                { userId: null }
            ]
        });

        if (companiesToBackfill.length > 0) {
            console.log(`🏢 Found ${companiesToBackfill.length} companies requiring unique userIds. Migrating now...`);
            let companyCount = 0;
            for (const company of companiesToBackfill) {
                // Determine base name (prefer shortName, then companyName)
                const baseName = company.shortName || company.companyName || 'company';
                const uniqueId = await generateUniqueUserId(baseName, Company, 'company');
                
                company.userId = uniqueId;
                await company.save();
                companyCount++;
            }
            console.log(`✅ Successfully backfilled ${companyCount} company accounts.`);
        } else {
            console.log('🏢 All company accounts already have a valid userId.');
        }

        console.log('🏁 Database backfill verification finished.');
    } catch (error) {
        console.error('❌ Error executing database backfill migration:', error);
    }
};
