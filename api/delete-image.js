const crypto = require("crypto");

module.exports = async function (req, res) {
  // CORS Headers for client communication
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).send("OK");
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ error: "imageUrl is required" });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.error("Cloudinary credentials missing in environment variables");
      return res.status(500).json({ error: "Server misconfiguration: Cloudinary keys not set." });
    }

    // Extract Cloudinary public ID from URL
    const regex = /\/upload\/(?:(?:[a-zA-Z]{1,2}|dpr)_[a-zA-Z0-9_.-]+(?:,(?:[a-zA-Z]{1,2}|dpr)_[a-zA-Z0-9_.-]+)*\/)*(?:v\d+\/)?([^\s?#]+)$/;
    const match = imageUrl.split("?")[0].match(regex);
    if (!match) {
      return res.status(400).json({ error: "Invalid Cloudinary URL" });
    }
    
    let publicId = match[1];
    const lastDot = publicId.lastIndexOf(".");
    if (lastDot !== -1) {
      publicId = publicId.substring(0, lastDot);
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash("sha1").update(stringToSign).digest("hex");

    // Call Cloudinary API
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        public_id: publicId,
        timestamp: String(timestamp),
        api_key: apiKey,
        signature: signature,
      }).toString(),
    });

    const result = await response.json();
    if (result.result === "ok") {
      return res.status(200).json({ success: true, publicId });
    } else {
      return res.status(500).json({ error: result.result || "Failed to delete image" });
    }
  } catch (error) {
    console.error("Error in delete-image function:", error);
    return res.status(500).json({ error: error.message });
  }
};
