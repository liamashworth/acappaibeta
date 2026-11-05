export default async function handler(req, res) {
  const allowedOrigin = "https://acappaibeta.vercel.app";

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Vary", "Origin");

  // Check request origin
  if (req.headers.origin && req.headers.origin !== allowedOrigin) {
    return res.status(403).json({
      success: false,
      message: "Origin not allowed"
    });
  }

  // Handle browser preflight
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // Only accept POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  try {
    // Check environment variables
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM;
    const to = process.env.RESEND_TO;

    if (!apiKey || !from || !to) {
      console.error("Missing Resend environment variables");

      return res.status(500).json({
        success: false,
        message: "Email service is not configured"
      });
    }

    const payload = req.body || {};

    // Silently accept honeypot submissions
    if (payload._honey) {
      return res.status(200).json({ success: true });
    }

    // Build email content from submitted form fields
    const fields = Object.entries(payload)
      .filter(([key, value]) =>
        ![
          "_honey",
          "_subject",
          "_template",
          "_captcha",
          "_url"
        ].includes(key) &&
        value !== undefined &&
        value !== null &&
        value !== ""
      );

    const emailText = fields
      .map(([key, value]) => {
        const label = key
          .replace(/([A-Z])/g, " $1")
          .replace(/_/g, " ")
          .replace(/\b\w/g, char => char.toUpperCase());

        return `${label}: ${String(value)}`;
      })
      .join("\n\n");

    const subject =
      payload._subject || "New ACAPP.AI Beta Registration";

    // Include applicant email as reply-to, if provided
    const applicantEmail =
      typeof payload.email === "string" &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)
        ? payload.email
        : undefined;

    // Send email through Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text: emailText,
        ...(applicantEmail ? { reply_to: applicantEmail } : {})
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", result);

      return res.status(502).json({
        success: false,
        message: "Unable to send registration email"
      });
    }

    console.log("Registration email sent:", result.id);

    return res.status(200).json({
      success: true,
      message: "Registration submitted successfully"
    });

  } catch (error) {
    console.error("Submission error:", error);

    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred"
    });
  }
}
