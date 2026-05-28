import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

export const sendEmail = async (email, subject, messageHtml) => {
    try {
        let transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',   // explicit host instead of service:'gmail'
            port: 587,                // TLS port (465 was triggering IPv6 on Render)
            secure: false,            // use STARTTLS
            family: 4,               // ← force IPv4 (fixes Render ENETUNREACH IPv6 error)
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
