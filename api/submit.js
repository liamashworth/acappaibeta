export default async function handler(req, res) {
  const allowedOrigin = "https://liamashworth.github.io";

  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Vary", "Origin");

  if (req.headers.origin !== allowedOrigin) {
    return res.status(403).json({ success: false });
  }

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false });
  }

  try {
    const payload = req.body;

    if (payload._honey) {
      return res.status(200).json({ success: true });
    }

    const response = await fetch(
      "https://formsubmit.co/ajax/" +
      encodeURIComponent(process.env.FORMSUBMIT_EMAIL),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      }
    );

    const result = await response.json();

    return res.status(response.status).json(result);

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Submission failed"
    });
  }
}
