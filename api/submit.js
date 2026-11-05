
export default async function handler(req, res) {
  const allowedOrigin = "https://acappaibeta.vercel.app";

  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Vary", "Origin");

  if (req.method === "OPTIONS") {
    if (req.headers.origin !== allowedOrigin) {
      return res.status(403).end();
    }
    return res.status(204).end();
  }

  if (req.headers.origin !== allowedOrigin) {
    return res.status(403).json({
      success: false,
      message: "Origin not allowed"
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  try {
    const email = process.env.FORMSUBMIT_EMAIL;

    if (!email) {
      console.error("FORMSUBMIT_EMAIL is missing");

      return res.status(500).json({
        success: false,
        message: "Email configuration is missing"
      });
    }

    const payload = req.body;

    if (!payload || typeof payload !== "object") {
      return res.status(400).json({
        success: false,
        message: "Invalid form data"
      });
    }

    if (payload._honey) {
      return res.status(200).json({ success: true });
    }

    payload._url = "https://acappaibeta.vercel.app/";

    const response = await fetch(
      "https://formsubmit.co/ajax/" + encodeURIComponent(email.trim()),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      }
    );

    const responseText = await response.text();

    console.log("FormSubmit status:", response.status);
    console.log("FormSubmit response:", responseText.slice(0, 1000));

    let result;

    try {
      result = JSON.parse(responseText);
    } catch {
      return res.status(502).json({
        success: false,
        message: "FormSubmit returned HTML instead of JSON",
        formsubmitStatus: response.status,
        formsubmitResponse: responseText.slice(0, 1000)
      });
    }

    return res.status(response.status).json(result);

  } catch (error) {
    console.error("Submission error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Submission failed"
    });
  }
}
