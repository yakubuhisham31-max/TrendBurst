export async function sendOTPEmail(email: string, code: string): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  
  if (!apiKey) {
    console.warn("⚠️ BREVO_API_KEY not configured");
    if (process.env.NODE_ENV === "production") {
      throw new Error("Email service not configured");
    }
    console.log(`ℹ️ Development mode - OTP code is: ${code}`);
    return;
  }

  // Use configured from address or default
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || "noreply@trendx.social";

  try {
    console.log(`📧 Sending OTP email via Brevo from ${fromEmail} to ${email}`);
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          email: fromEmail,
          name: "Trendx",
        },
        to: [
          {
            email: email,
          },
        ],
        subject: "Your Trendx Email Verification Code",
        htmlContent: `
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
      }),
    });

    console.log(`📬 Brevo API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`❌ Brevo error details:`, errorData);
      throw new Error(`Brevo error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const responseData = await response.json();
    console.log(`✅ OTP sent to ${email} via Brevo. Message ID:`, responseData.messageId);
  } catch (error) {
    console.error(`❌ Failed to send OTP email via Brevo:`, error);
    if (process.env.NODE_ENV === "production") {
      throw error;
    }
    console.log(`ℹ️ Continuing in development mode - OTP code is: ${code}`);
  }
}
