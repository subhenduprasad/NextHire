import nodemailer from 'nodemailer';
import dns from 'dns';
import dotenv from 'dotenv';
dotenv.config();

export const sendOtp = async (email, otp) => {
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
            port: 587,
            secure: false,
            auth: {
                user: process.env.SMTP_MAIL,
                pass: process.env.SMTP_PASS,
            },
            tls: {
                servername: 'smtp.gmail.com'
            }
        });

        let info = await transporter.sendMail({
            from: `"NextHire Inc." <${process.env.SMTP_MAIL}>`,
            to: email,
            subject: "Your OTP Verification Code",
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #2b6cb0; text-align: center;">OTP Verification</h2>
                <p style="font-size: 16px; color: #4a5568;">Your verification code is:</p>
                <div style="text-align: center; margin: 20px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2d3748; background-color: #edf2f7; padding: 10px 20px; border-radius: 4px; border: 1px solid #cbd5e0;">
                        ${otp}
                    </span>
                </div>
                <p style="font-size: 14px; color: #718096; text-align: center;">This code will expire in 5 minutes.</p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="font-size: 12px; color: #a0aec0; text-align: center;">If you didn't request this code, you can safely ignore this email.</p>
            </div>
            `,
        });

        console.log("=========================================");
        console.log(`OTP sent to ${email}: ${otp}`);
        console.log("Message sent: %s", info.messageId);
        console.log("=========================================");

        return true;
    } catch (error) {
        console.error("Error sending OTP email:", error);
        return false;
    }
};
