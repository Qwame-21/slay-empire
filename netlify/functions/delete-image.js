const crypto = require("crypto");

exports.handler = async function (event, context) {
  // CORS Headers for client-side communication
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // Handle preflight options request
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "OK" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { imageUrl } = JSON.parse(event.body);
    if (!imageUrl) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "imageUrl is required" }),
      };
    }

    // Read keys securely from Netlify dashboard environment
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.error("Cloudinary credentials missing in Netlify settings");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Server misconfiguration: Cloudinary API keys not set in hosting dashboard." }),
      };
    }

    // Extract Cloudinary public ID from URL
    const regex = /\/upload\/(?:(?:[a-zA-Z]{1,2}|dpr)_[a-zA-Z0-9_.-]+(?:,(?:[a-zA-Z]{1,2}|dpr)_[a-zA-Z0-9_.-]+)*\/)*(?:v\d+\/)?([^\s?#]+)$/;
    const match = imageUrl.split("?")[0].match(regex);
    if (!match) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid Cloudinary URL" }),
      };
    }
    
    let publicId = match[1];
    const lastDot = publicId.lastIndexOf(".");
    if (lastDot !== -1) {
      publicId = publicId.substring(0, lastDot);
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash("sha1").update(stringToSign).digest("hex");

    // Call Cloudinary API using built-in fetch
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
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, publicId }),
      };
    } else {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: result.result || "Failed to delete image from Cloudinary" }),
      };
    }
  } catch (error) {
    console.error("Error in delete-image function:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
