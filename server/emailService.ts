export async function sendOTPEmail(email: string, code: string): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY;
  
  if (!apiKey) {
    console.warn("⚠️ SENDGRID_API_KEY not configured");
    if (process.env.NODE_ENV === "production") {
      throw new Error("Email service not configured");
    }
    console.log(`ℹ️ Development mode - OTP code is: ${code}`);
    return;
  }

  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email }],
          },
        ],
        from: {
          email: "noreply@trendx.social",
          name: "Trendx",
        },
        subject: "Your Trendx Email Verification Code",
        content: [
          {
            type: "text/html",
            value: `
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
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`SendGrid error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    console.log(`✅ OTP sent to ${email} via SendGrid`);
  } catch (error) {
    console.error(`❌ Failed to send OTP email via SendGrid:`, error);
    if (process.env.NODE_ENV === "production") {
      throw error;
    }
    console.log(`ℹ️ Continuing in development mode - OTP code is: ${code}`);
  }
}
