import nodemailer from 'nodemailer';
import dns from 'dns';
import dotenv from 'dotenv';
dotenv.config();

export const sendEmail = async (email, subject, messageHtml) => {
    try {
        let host = 'smtp.gmail.com';
        try {
            const ips = await dns.promises.resolve4('smtp.gmail.com');
            if (ips && ips.length > 0) {
                host = ips[0];
                console.log(`[DNS] Resolved smtp.gmail.com to IPv4: ${host}`);
            }
        } catch (dnsError) {
            console.error("[DNS] Error resolving smtp.gmail.com to IPv4, falling back to hostname:", dnsError);
        }

        let transporter = nodemailer.createTransport({
            host: host,
            port: 465,
            secure: true,
            auth: {
                user: process.env.SMTP_MAIL,
                pass: process.env.SMTP_PASS,
            },
            tls: {
                servername: 'smtp.gmail.com'
            }
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
