import { sendEmail } from '../utils/sendEmail.js';

/**
 * Handle contact form submission
 * Validates inputs and sends an email to subhenduhembram444@gmail.com
 */
export const handleContactSubmit = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // Basic validation
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'All fields (name, email, subject, message) are required.'
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid sender email address.'
            });
        }

        // Format HTML Email Body
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <div style="text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 20px;">
                    <h2 style="color: #1e3a8a; margin: 0; font-size: 24px;">New Support Request</h2>
                    <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 14px;">NextHire Career Portal</p>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h3 style="color: #374151; font-size: 16px; margin-bottom: 8px; border-bottom: 1px solid #f3f4f6; padding-bottom: 5px;">Sender Information</h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                        <tr>
                            <td style="padding: 6px 0; color: #6b7280; width: 100px; font-weight: bold;">Name:</td>
                            <td style="padding: 6px 0; color: #1f2937;">${name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; color: #6b7280; font-weight: bold;">Email:</td>
                            <td style="padding: 6px 0; color: #3b82f6;"><a href="mailto:${email}" style="color: #3b82f6; text-decoration: none;">${email}</a></td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; color: #6b7280; font-weight: bold;">Subject:</td>
                            <td style="padding: 6px 0; color: #1f2937; font-weight: bold;">${subject}</td>
                        </tr>
                    </table>
                </div>

                <div style="margin-bottom: 20px; background-color: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                    <h3 style="color: #374151; font-size: 15px; margin-top: 0; margin-bottom: 10px;">Message:</h3>
                    <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${message}</p>
                </div>

                <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; text-align: center; font-size: 12px; color: #9ca3af;">
                    <p style="margin: 0;">This email was sent automatically from NextHire contact form.</p>
                </div>
            </div>
        `;

        // Send Email using existing utility to subhenduhembram444@gmail.com
        const targetEmail = 'subhenduhembram444@gmail.com';
        const isSent = await sendEmail(targetEmail, `NextHire Contact: ${subject}`, emailHtml);

        if (!isSent) {
            return res.status(500).json({
                success: false,
                message: 'Failed to deliver support request. Please try again later.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Your message has been sent successfully! We will get back to you shortly.'
        });

    } catch (error) {
        console.error('Error handling contact form submission:', error);
        return res.status(500).json({
            success: false,
            message: 'An internal server error occurred while processing your request.'
        });
    }
};
