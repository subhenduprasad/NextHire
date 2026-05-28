import nodemailer from 'nodemailer';
import dns from 'dns';
import dotenv from 'dotenv';
dotenv.config();

export const sendEmail = async (email, subject, messageHtml) => {
    try {
        // 1. If RESEND_API_KEY is available, use Resend HTTP API (Never blocked on Render)
        if (process.env.RESEND_API_KEY) {
            console.log(`[Email] Sending via Resend API to ${email}...`);
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: 'NextHire <onboarding@resend.dev>',
                    to: email,
                    subject: subject,
                    html: messageHtml
                })
            });

            const data = await response.json();
            if (response.ok) {
                console.log(`[Email] Sent successfully via Resend to ${email} (ID: ${data.id})`);
                return true;
            } else {
                console.error("[Email] Resend API error:", data);
                // Fall through to SMTP if Resend fails
            }
        }

        // 2. Fallback to Gmail SMTP (Useful for local testing)
        console.log(`[Email] Falling back to Gmail SMTP for ${email}...`);
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

        console.log(`[Email] Sent successfully via SMTP to ${email}`);
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
};
