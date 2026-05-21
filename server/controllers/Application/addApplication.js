import Application from '../../models/Application.js'
import User from '../../models/User.js';
import Job from '../../models/Job.js';
import Notification from '../../models/Notification.js';
import { sendEmail } from '../../utils/sendEmail.js';
import uniqid from 'uniqid';

const addApplication = async (req, res) => {
    const { _id, jobID, candidateID, applicationStatus, applicationForm, candidateFeedback, messageToCandidate } = req.body;

    try {
        // If _id is provided, try to update existing application
        if (_id) {
            const existingApplication = await Application.findById(_id);
            if (existingApplication) {
                const oldStatus = existingApplication.applicationStatus;
                
                if (jobID) existingApplication.jobID = jobID;
                if (candidateID) existingApplication.candidateID = candidateID;
                if (applicationStatus) existingApplication.applicationStatus = applicationStatus;
                if (applicationForm) existingApplication.applicationForm = applicationForm;
                if (candidateFeedback) existingApplication.candidateFeedback = candidateFeedback;

                await existingApplication.save();

                // Send email notification on status change (no await to prevent blocking)
                if (applicationStatus && applicationStatus !== oldStatus && (applicationStatus === 'shortlist' || applicationStatus === 'rejected')) {
                    try {
                        const candidate = await User.findById(existingApplication.candidateID || candidateID);
                        const job = await Job.findById(existingApplication.jobID || jobID).populate('companyId');
                        
                        if (candidate && candidate.userEmail && job) {
                            const statusText = applicationStatus === 'shortlist' ? 'Shortlisted' : 'Not Selected';
                            const companyName = job.companyId?.companyName || 'the employer';
                            const subject = applicationStatus === 'shortlist'
                                ? `Congratulations! You've been shortlisted for ${job.jobTitle} at ${companyName}`
                                : `Update on your application for ${job.jobTitle} at ${companyName}`;
                            
                            const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
                            let messageHtml = '';

                            if (applicationStatus === 'shortlist') {
                                messageHtml = `
                                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 20px auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05);">
                                    <!-- Premium Header Banner -->
                                    <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
                                        <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #c7d2fe; margin-bottom: 8px;">NextHire Career Portal</div>
                                        <h1 style="font-size: 26px; font-weight: 800; margin: 0; color: #ffffff; letter-spacing: -0.5px;">Congratulations! 🎉</h1>
                                    </div>
                                    
                                    <!-- Main Body -->
                                    <div style="padding: 32px 24px; color: #334155; line-height: 1.6;">
                                        <p style="font-size: 18px; font-weight: 700; color: #1e293b; margin-top: 0; margin-bottom: 16px;">Dear ${candidate.userName},</p>
                                        
                                        <p style="font-size: 15px; margin-bottom: 20px;">We have wonderful news regarding your application! The recruitment team at <strong>${companyName}</strong> has thoroughly reviewed your application for the <strong>${job.jobTitle}</strong> position and they are highly impressed with your credentials, skills, and background.</p>
                                        
                                        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
                                            <span style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #15803d; background-color: #dcfce7; padding: 4px 12px; border-radius: 9999px; display: inline-block; margin-bottom: 8px;">Application Status Update</span>
                                            <h2 style="font-size: 22px; font-weight: 800; color: #166534; margin: 0;">You've Been Shortlisted!</h2>
                                        </div>
                                        
                                        <p style="font-size: 15px; margin-bottom: 16px;">This is a significant milestone, and we are absolutely thrilled to support you through the next phases of your selection journey.</p>
                                        
                                        <!-- Next Steps Checklist -->
                                        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
                                            <h3 style="font-size: 16px; font-weight: 700; color: #1e293b; margin-top: 0; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">📋 What Happens Next?</h3>
                                            <ol style="margin: 0; padding-left: 20px; font-size: 14px; color: #475569;">
                                                <li style="margin-bottom: 8px;"><strong>Recruiter Contact:</strong> A representative from ${companyName} will reach out directly to schedule your primary evaluation or interview.</li>
                                                <li style="margin-bottom: 8px;"><strong>NextHire Dashboard:</strong> You can track live interview requests, check notification alerts, and reply to instant recruiter messages in your portal dashboard.</li>
                                                <li><strong>Preparation:</strong> Take this time to review the job requirements, polish your key accomplishments, and get ready to shine!</li>
                                            </ol>
                                        </div>
                                `;

                                if (messageToCandidate && messageToCandidate.trim() !== '') {
                                    messageHtml += `
                                        <!-- Message from Recruiter -->
                                        <div style="border-left: 4px solid #4f46e5; background-color: #eef2ff; padding: 18px; border-radius: 0 12px 12px 0; margin: 24px 0;">
                                            <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 800; color: #4f46e5; text-transform: uppercase; letter-spacing: 1px;">Message from the Recruiter:</p>
                                            <p style="color: #312e81; font-size: 14px; font-style: italic; margin: 0;">"${messageToCandidate.replace(/\n/g, '<br>')}"</p>
                                        </div>
                                    `;
                                }

                                messageHtml += `
                                        <!-- Action CTA -->
                                        <div style="text-align: center; margin-top: 32px; margin-bottom: 12px;">
                                            <a href="${clientUrl}/candidate/dashboard" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2), 0 2px 4px -1px rgba(79, 70, 229, 0.1); transition: all 0.2s ease;">
                                                Go to Dashboard →
                                            </a>
                                        </div>
                                    </div>
                                    
                                    <!-- Footer -->
                                    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px; text-align: center; color: #64748b; font-size: 12px; line-height: 1.5;">
                                        <p style="margin: 0 0 8px 0; font-weight: 600; color: #475569;">NextHire Inc. | Empowering Careers Everywhere</p>
                                        <p style="margin: 0;">If you have any questions or feedback, feel free to visit our support desk at <a href="${clientUrl}/contact" style="color: #4f46e5; text-decoration: none;">Contact Support</a>.</p>
                                    </div>
                                </div>
                                `;
                            } else {
                                messageHtml = `
                                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 20px auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05);">
                                    <!-- Elegant Header Banner -->
                                    <div style="background: linear-gradient(135deg, #475569 0%, #1e293b 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
                                        <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #cbd5e1; margin-bottom: 8px;">NextHire Career Portal</div>
                                        <h1 style="font-size: 24px; font-weight: 800; margin: 0; color: #ffffff; letter-spacing: -0.5px;">Thank You for Your Application</h1>
                                    </div>
                                    
                                    <!-- Main Body -->
                                    <div style="padding: 32px 24px; color: #334155; line-height: 1.6;">
                                        <p style="font-size: 18px; font-weight: 700; color: #1e293b; margin-top: 0; margin-bottom: 16px;">Dear ${candidate.userName},</p>
                                        
                                        <p style="font-size: 15px; margin-bottom: 20px;">We want to sincerely thank you for the time, energy, and effort you dedicated to applying for the <strong>${job.jobTitle}</strong> position at <strong>${companyName}</strong>.</p>
                                        
                                        <p style="font-size: 15px; margin-bottom: 24px;">While our recruitment team was deeply impressed by your credentials and professional journey, they have decided to move forward with other candidates whose profiles align more closely with their specific, highly specialized criteria for this individual role at this time.</p>
                                        
                                        <!-- Motivation Section -->
                                        <div style="background-color: #fcf8f2; border: 1px solid #fed7aa; border-radius: 12px; padding: 22px; margin: 24px 0;">
                                            <h3 style="font-size: 16px; font-weight: 700; color: #c2410c; margin-top: 0; margin-bottom: 8px;">✨ A Note of Motivation & Reassurance</h3>
                                            <p style="margin: 0; font-size: 14px; color: #7c2d12; line-height: 1.6;">
                                                Please remember that recruitment decisions are strictly a reflection of current, immediate job matches and <strong>never</strong> a reflection of your potential, value, or capability. 
                                                <br/><br/>
                                                Every application is a bold step forward in your career journey, a valuable learning milestone, and a clear testament to your ambition. The right door will open, and your unique skill set will find the perfect space where it can truly stand out and thrive. Stay positive, keep your head high, and stay confident—your next great opportunity is just around the corner!
                                            </p>
                                        </div>
                                        
                                        <!-- Quick Growth Actions -->
                                        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
                                            <h3 style="font-size: 15px; font-weight: 700; color: #1e293b; margin-top: 0; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">💡 Next Steps for Success:</h3>
                                            <ul style="margin: 0; padding-left: 20px; font-size: 13.5px; color: #475569;">
                                                <li style="margin-bottom: 8px;"><strong>Keep Profile Updated:</strong> Ensure your resume, certifications, and skills list are always up-to-date on NextHire.</li>
                                                <li style="margin-bottom: 8px;"><strong>Enable E-mail Alerts:</strong> Turn on job alerts in your Settings to receive instant alerts the very second matching roles are posted.</li>
                                                <li><strong>Keep Exploring:</strong> Explore thousands of other premium listings on our portal—new positions open daily.</li>
                                            </ul>
                                        </div>
                                `;

                                if (messageToCandidate && messageToCandidate.trim() !== '') {
                                    messageHtml += `
                                        <!-- Message from Recruiter -->
                                        <div style="border-left: 4px solid #64748b; background-color: #f1f5f9; padding: 18px; border-radius: 0 12px 12px 0; margin: 24px 0;">
                                            <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 1px;">Message from the Recruiter:</p>
                                            <p style="color: #334155; font-size: 14px; font-style: italic; margin: 0;">"${messageToCandidate.replace(/\n/g, '<br>')}"</p>
                                        </div>
                                    `;
                                }

                                messageHtml += `
                                        <!-- Action CTA -->
                                        <div style="text-align: center; margin-top: 32px; margin-bottom: 12px;">
                                            <a href="${clientUrl}/all-posted-jobs" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #475569 0%, #1e293b 100%); color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(71, 85, 105, 0.2), 0 2px 4px -1px rgba(71, 85, 105, 0.1); transition: all 0.2s ease;">
                                                Explore Other Openings →
                                            </a>
                                        </div>
                                    </div>
                                    
                                    <!-- Footer -->
                                    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px; text-align: center; color: #64748b; font-size: 12px; line-height: 1.5;">
                                        <p style="margin: 0 0 8px 0; font-weight: 600; color: #475569;">NextHire Inc. | Accompanying Your Career Journey Every Step of the Way</p>
                                        <p style="margin: 0;">If you have any questions or feedback, feel free to visit our support desk at <a href="${clientUrl}/contact" style="color: #475569; text-decoration: none;">Contact Support</a>.</p>
                                    </div>
                                </div>
                                `;
                            }
                            
                            // Generate database notification
                            const newNotification = new Notification({
                                recipient: candidate._id,
                                message: `Your application status for "${job.jobTitle}" at ${companyName} has been updated to: ${statusText}`,
                                title: 'Application Update',
                                type: 'application_update',
                                relatedId: existingApplication._id
                            });
                            
                            await newNotification.save();
                            
                            // Emit live Web Socket Notification if candidate is online
                            if (global.onlineUsers && global.onlineUsers.has(candidate._id.toString())) {
                                const socketId = global.onlineUsers.get(candidate._id.toString());
                                global.io.to(socketId).emit('getNotification', newNotification);
                            }
                            
                            sendEmail(candidate.userEmail, subject, messageHtml);
                        }
                    } catch (emailError) {
                        console.error('Failed to send status update email:', emailError);
                    }
                }

                return res.status(200).json({ success: true, message: "Application updated successfully", application: existingApplication });
            }
        }
        // Create new application if no _id or application not found
        const newApplication = new Application({
            jobID: jobID,
            candidateID: candidateID,
            applicationStatus: applicationStatus || 'pending',
            applicationForm,
            candidateFeedback
        });

        await newApplication.save();
        res.status(201).json({ success: true, message: "Application created successfully", application: newApplication });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export {addApplication};