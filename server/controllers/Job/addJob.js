import Job from '../../models/Job.js';
import Company from '../../models/Company.js';
import User from '../../models/User.js';
import Notification from '../../models/Notification.js';
import { sendEmail } from '../../utils/sendEmail.js';
import { v4 as uuidv4 } from 'uuid';

const addJob = async (req, res) => {
    try {
        const { 
            jobTitle, 
            employmentType, 
            location, 
            salary,
            salaryMin,
            salaryMax,
            currency,
            openings,
            status,
            description, 
            requirements,
            experience,
            skills,
            applicationDeadline,
            applicationForm, 
            advancedQuestions,
            applicants 
        } = req.body;
        
        // Get employerId from authenticated user or request body
        const employerId = req.user?._id || req.body.employerId;
        
        // Validation
        if (!jobTitle || !employmentType || !location) {
            return res.status(400).json({
                success: false,
                error: 'Job title, employment type, and location are required'
            });
        }

        // Get company ID - either from request or from employer's company
        let companyId = req.body.companyId;
        
        if (!companyId && employerId) {
            // Try to find employer's company
            const company = await Company.findOne({ employerId });
            if (company) {
                companyId = company._id;
            } else {
                // Check if user has companyId
                const user = await User.findById(employerId);
                if (user && user.companyId) {
                    companyId = user.companyId;
                }
            }
        }

        if (!companyId) {
            return res.status(400).json({
                success: false,
                error: 'Company ID is required. Please create a company first.'
            });
        }

        const job = new Job({
            jobID: uuidv4(),
            jobTitle: jobTitle.trim(),
            companyId,
            employerId,
            employmentType,
            location: location.trim(),
            salary: salary || 'Not specified',
            salaryMin: salaryMin || null,
            salaryMax: salaryMax || null,
            currency: currency || 'INR',
            openings: openings || 1,
            status: status || 'published',
            description: description?.trim() || '',
            requirements: requirements?.trim() || '',
            experience: experience || 'Not specified',
            skills: skills || [],
            applicationDeadline: applicationDeadline || null,
            applicationForm: applicationForm || { question: [], answer: [] },
            advancedQuestions: advancedQuestions || [],
            applicants: applicants || [],
            isActive: true
        });

        const savedJob = await job.save();
        
        // Populate company info before sending response
        await savedJob.populate('companyId', 'companyName companyLogo connectedUsers');

        res.status(201).json({
            success: true,
            message: 'Job posted successfully',
            data: savedJob
        });

        // Non-blocking notification dispatch
        if (savedJob.status === 'published') {
            (async () => {
                try {
                    // Rate limit: last notification must be > 24 hours ago OR null
                    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                    
                    const candidates = await User.find({
                        role: 'candidate',
                        emailAlerts: true,
                        $or: [
                            { lastJobNotificationSentAt: { $lt: twentyFourHoursAgo } },
                            { lastJobNotificationSentAt: null },
                            { lastJobNotificationSentAt: { $exists: false } }
                        ]
                    });

                    const companyName = savedJob.companyId?.companyName || 'A new company';
                    const subject = `New Job Posting: ${savedJob.jobTitle} at ${companyName}`;
                    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
                    
                    for (const candidate of candidates) {
                        const messageHtml = `
                        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 20px auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05);">
                            <!-- Premium Header Banner -->
                            <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
                                <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #c7d2fe; margin-bottom: 8px;">NextHire Career Portal</div>
                                <h1 style="font-size: 24px; font-weight: 800; margin: 0; color: #ffffff; letter-spacing: -0.5px;">New Job Alert! 🚀</h1>
                            </div>
                            
                            <!-- Main Body -->
                            <div style="padding: 32px 24px; color: #334155; line-height: 1.6;">
                                <p style="font-size: 16px; font-weight: 700; color: #1e293b; margin-top: 0; margin-bottom: 12px;">Hello ${candidate.userName},</p>
                                
                                <p style="font-size: 14.5px; margin-bottom: 24px;">An exciting new job matching your profile has just been posted on NextHire! We think you might be a great candidate for this opportunity.</p>
                                
                                <!-- Premium Job Specification Card -->
                                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 24px 0; box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.02);">
                                    <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #4f46e5; margin-bottom: 8px;">Position Details</div>
                                    <h2 style="font-size: 20px; font-weight: 800; color: #1e293b; margin: 0 0 16px 0; line-height: 1.3;">${savedJob.jobTitle}</h2>
                                    
                                    <table style="width: 100%; border-collapse: collapse; font-size: 14.5px;">
                                        <tr>
                                            <td style="padding: 6px 0; color: #64748b; width: 100px; font-weight: 600;">Company</td>
                                            <td style="padding: 6px 0; color: #334155; font-weight: 700;">${companyName}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Location</td>
                                            <td style="padding: 6px 0; color: #334155;">📍 ${savedJob.location}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Job Type</td>
                                            <td style="padding: 6px 0; color: #334155;">💼 ${savedJob.employmentType}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Salary</td>
                                            <td style="padding: 6px 0; color: #16a34a; font-weight: 700;">💰 ${savedJob.salary}</td>
                                        </tr>
                                    </table>
                                </div>
                                
                                <!-- Action CTA -->
                                <div style="text-align: center; margin-top: 32px; margin-bottom: 12px;">
                                    <a href="${clientUrl}/current-job/${savedJob._id}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2), 0 2px 4px -1px rgba(79, 70, 229, 0.1); transition: all 0.2s ease;">
                                        View Job & Apply →
                                    </a>
                                </div>
                            </div>
                            
                            <!-- Footer -->
                            <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px; text-align: center; color: #64748b; font-size: 11px; line-height: 1.6;">
                                <p style="margin: 0 0 8px 0; font-weight: 600; color: #475569;">NextHire Inc. | Premium Career Connectivity</p>
                                <p style="margin: 0 0 8px 0;">You are receiving this because you enabled Email Alerts in your settings. You will receive a maximum of one alert per day.</p>
                                <p style="margin: 0;">If you'd like to adjust your notifications, please log in to your <a href="${clientUrl}/candidate/settings" style="color: #4f46e5; text-decoration: none;">Account Settings</a>.</p>
                            </div>
                        </div>
                        `;
                        
                        // Generate database notification
                        const newNotification = new Notification({
                            recipient: candidate._id,
                            message: `A new job posting "${savedJob.jobTitle}" at ${companyName} might interest you!`,
                            title: 'New Job Alert',
                            type: 'job_alert',
                            relatedId: savedJob._id
                        });
                        
                        await newNotification.save();
                        
                        // Emit live Web Socket Notification if candidate is online
                        if (global.onlineUsers && global.onlineUsers.has(candidate._id.toString())) {
                            const socketId = global.onlineUsers.get(candidate._id.toString());
                            global.io.to(socketId).emit('getNotification', newNotification);
                        }
                        
                        sendEmail(candidate.userEmail, subject, messageHtml);
                        
                        candidate.lastJobNotificationSentAt = new Date();
                        await candidate.save();
                    }

                    // ALSO Notify ALL connected/following users regardless of rate limits
                    if (savedJob.companyId?.connectedUsers?.length > 0) {
                        for (const connectedUserId of savedJob.companyId.connectedUsers) {
                            // Avoid duplicate notification if they already got one from the random candidates pool above
                            const alreadyNotified = candidates.some(c => c._id.toString() === connectedUserId.toString());
                            if (alreadyNotified) continue;

                            const newNotification = new Notification({
                                recipient: connectedUserId,
                                message: `New job posted by ${companyName}: ${savedJob.jobTitle} - ${savedJob.location}`,
                                title: 'New Job Alert',
                                type: 'job_alert',
                                relatedId: savedJob._id
                            });
                            
                            await newNotification.save();
                            
                            // Emit live Web Socket Notification if user is online
                            if (global.onlineUsers && global.onlineUsers.has(connectedUserId.toString())) {
                                const socketId = global.onlineUsers.get(connectedUserId.toString());
                                global.io.to(socketId).emit('getNotification', newNotification);
                            }
                        }
                    }
                } catch (notifyError) {
                    console.error("Job match notification error: ", notifyError);
                }
            })();
        }
    } catch (error) {
        console.error('Add job error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create job posting'
        });
    }
};

export { addJob };
