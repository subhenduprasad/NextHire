import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

export const sendEmail = async (email, subject, messageHtml) => {
    try {
        let transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.SMTP_MAIL,
                pass: process.env.SMTP_PASS,
            },
        });

        let info = await transporter.sendMail({
            from: process.env.SMTP_HOST || process.env.SMTP_MAIL,
            to: email,
            subject: subject,
            html: messageHtml,
        });

        console.log(`Email sent to ${email} - Subject: ${subject}`);
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
};
