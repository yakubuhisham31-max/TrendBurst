export async function sendVerificationBadgeEmail(email: string, username: string): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  
  if (!apiKey) {
    console.warn("⚠️ BREVO_API_KEY not configured");
    return;
  }

  const fromEmail = process.env.SENDGRID_FROM_EMAIL || "noreply@trendx.social";

  try {
    console.log(`📧 Sending verification badge email via Brevo to ${email}`);
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
        subject: "You're Now Verified on Trendx",
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #00d4ff;">Congratulations, ${username}!</h2>
            <p>You've been verified on Trendx. Your profile now displays a verification badge.</p>
            <p>This recognizes your credibility and influence in the Trendx community.</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">Thank you for being part of the Trendx community!</p>
          </div>
        `,
      }),
    });

    console.log(`📬 Brevo verification badge email response status: ${response.status}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`❌ Brevo verification badge email error:`, errorData);
      throw new Error(`Brevo error: ${response.status}`);
    }

    const responseData = await response.json();
    console.log(`✅ Verification badge email sent to ${email}. Message ID:`, responseData.messageId);
  } catch (error) {
    console.error(`❌ Failed to send verification badge email via Brevo:`, error);
  }
}

export async function sendAccountVerifiedEmail(email: string, username: string): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  
  if (!apiKey) {
    console.warn("⚠️ BREVO_API_KEY not configured");
    return;
  }

  const fromEmail = process.env.SENDGRID_FROM_EMAIL || "noreply@trendx.social";

  try {
    console.log(`📧 Sending account verified email via Brevo to ${email}`);
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
        subject: "Your Trendx Account is Verified",
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #00d4ff;">Account Verified</h2>
            <p>Hi ${username},</p>
            <p>Your Trendx account has been successfully verified. You can now access all features.</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't create this account, please contact support.</p>
          </div>
        `,
      }),
    });

    console.log(`📬 Brevo verified account email response status: ${response.status}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`❌ Brevo verified account email error:`, errorData);
      throw new Error(`Brevo error: ${response.status}`);
    }

    const responseData = await response.json();
    console.log(`✅ Account verified email sent to ${email}. Message ID:`, responseData.messageId);
  } catch (error) {
    console.error(`❌ Failed to send account verified email via Brevo:`, error);
  }
}

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
