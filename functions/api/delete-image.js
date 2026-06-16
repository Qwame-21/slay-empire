export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS Headers for client communication
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  try {
    const { imageUrl } = await request.json();
    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "imageUrl is required" }), {
        status: 400,
        headers,
      });
    }

    // Cloudflare environment variables
    const cloudName = env.CLOUDINARY_CLOUD_NAME || env.VITE_CLOUDINARY_CLOUD_NAME;
    const apiKey = env.CLOUDINARY_API_KEY;
    const apiSecret = env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.error("Cloudinary credentials missing in environment variables");
      return new Response(
        JSON.stringify({ error: "Server misconfiguration: Cloudinary keys not set." }),
        { status: 500, headers }
      );
    }

    // Extract Cloudinary public ID from URL
    const regex = /\/upload\/(?:(?:[a-zA-Z]{1,2}|dpr)_[a-zA-Z0-9_.-]+(?:,(?:[a-zA-Z]{1,2}|dpr)_[a-zA-Z0-9_.-]+)*\/)*(?:v\d+\/)?([^\s?#]+)$/;
    const match = imageUrl.split("?")[0].match(regex);
    if (!match) {
      return new Response(JSON.stringify({ error: "Invalid Cloudinary URL" }), {
        status: 400,
        headers,
      });
    }
    
    let publicId = match[1];
    const lastDot = publicId.lastIndexOf(".");
    if (lastDot !== -1) {
      publicId = publicId.substring(0, lastDot);
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;

    // Standard Web Crypto SHA-1 signature (native to Workers)
    const encoder = new TextEncoder();
    const data = encoder.encode(stringToSign);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

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
      return new Response(JSON.stringify({ success: true, publicId }), {
        status: 200,
        headers,
      });
    } else {
      return new Response(
        JSON.stringify({ error: result.result || "Failed to delete image" }),
        { status: 500, headers }
      );
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers,
    });
  }
}

// Handle preflight options requests
export async function onRequestOptions() {
  return new Response("OK", {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
  });
}
