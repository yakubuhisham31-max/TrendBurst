import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "localhost",
  port: parseInt(process.env.SMTP_PORT || "1025"),
  secure: process.env.SMTP_SECURE === "true",
  auth: process.env.SMTP_USER
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      }
    : undefined,
});

export async function sendOTPEmail(email: string, code: string): Promise<void> {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@trendx.social",
      to: email,
      subject: "Your Trendx Email Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verify Your Email</h2>
          <p>Enter this code to verify your email address:</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center;">
            <h1 style="letter-spacing: 4px; color: #000;">${code}</h1>
          </div>
          <p style="color: #666;">This code expires in 10 minutes.</p>
          <p style="color: #999; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
        </div>
      `,
      text: `Your Trendx verification code is: ${code}\n\nThis code expires in 10 minutes.`,
    });
    console.log(`✅ OTP sent to ${email}`);
  } catch (error) {
    console.error(`⚠️  Failed to send OTP email (email service may not be configured):`, error);
    if (process.env.NODE_ENV === "production") {
      throw error;
    }
    console.log(`ℹ️  Continuing in development mode - OTP code is: ${code}`);
  }
}
