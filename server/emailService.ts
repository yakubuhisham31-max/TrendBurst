export async function sendWelcomeEmail(email: string, username: string): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  
  if (!apiKey) {
    console.warn("⚠️ BREVO_API_KEY not configured");
    return;
  }

  const fromEmail = process.env.SENDGRID_FROM_EMAIL || "noreply@trendx.social";

  try {
    console.log(`📧 Sending welcome email via Brevo to ${email}`);
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
        subject: "Welcome to Trendx!",
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #00d4ff;">Welcome to Trendx, ${username}!</h2>
            <p>Your account has been successfully created. You're now ready to:</p>
            <ul style="line-height: 1.8;">
              <li>Create and participate in viral trends</li>
              <li>Share your creative content</li>
              <li>Vote on trending posts</li>
              <li>Compete in real-time rankings</li>
            </ul>
            <p><a href="https://trendx.social" style="display: inline-block; background: #00d4ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Get Started on Trendx</a></p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">Questions? Check out our help center or reach out to support.</p>
          </div>
        `,
      }),
    });

    console.log(`📬 Brevo welcome email response status: ${response.status}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`❌ Brevo welcome email error:`, errorData);
      throw new Error(`Brevo error: ${response.status}`);
    }

    const responseData = await response.json();
    console.log(`✅ Welcome email sent to ${email}. Message ID:`, responseData.messageId);
  } catch (error) {
    console.error(`❌ Failed to send welcome email via Brevo:`, error);
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
