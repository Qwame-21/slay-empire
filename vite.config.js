import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import crypto from 'crypto';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'delete-image-mock',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url === '/api/delete-image' && req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk; });
              req.on('end', async () => {
                try {
                  const { imageUrl } = JSON.parse(body);
                  if (!imageUrl) {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'imageUrl is required' }));
                    return;
                  }

                  const cloudName = env.VITE_CLOUDINARY_CLOUD_NAME;
                  const apiKey = env.CLOUDINARY_API_KEY;
                  const apiSecret = env.CLOUDINARY_API_SECRET;

                  if (!cloudName || !apiKey || !apiSecret) {
                    console.error('Cloudinary credentials missing in .env (CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)');
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'Server misconfiguration: CLOUDINARY_API_KEY or CLOUDINARY_API_SECRET missing in local .env' }));
                    return;
                  }

                  // Extract public ID from Cloudinary URL
                  const regex = /\/upload\/(?:(?:[a-zA-Z]{1,2}|dpr)_[a-zA-Z0-9_.-]+(?:,(?:[a-zA-Z]{1,2}|dpr)_[a-zA-Z0-9_.-]+)*\/)*(?:v\d+\/)?([^\s?#]+)$/;
                  const match = imageUrl.split('?')[0].match(regex);
                  if (!match) {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'Invalid Cloudinary URL' }));
                    return;
                  }

                  let publicId = match[1];
                  const lastDot = publicId.lastIndexOf('.');
                  if (lastDot !== -1) {
                    publicId = publicId.substring(0, lastDot);
                  }

                  const timestamp = Math.floor(Date.now() / 1000);
                  const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
                  const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

                  // Make request to Cloudinary destruction API
                  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                      public_id: publicId,
                      timestamp: String(timestamp),
                      api_key: apiKey,
                      signature: signature,
                    }).toString(),
                  });

                  const result = await response.json();
                  if (result.result === 'ok') {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: true, publicId }));
                  } else {
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: result.result || 'Failed to delete image' }));
                  }
                } catch (error) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: error.message }));
                }
              });
            } else {
              next();
            }
          });
        }
      }
    ],
    appType: 'spa',
    server: {
      port: 5173,
    },
  };
});
