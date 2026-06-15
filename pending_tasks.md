# Hajia Slay Empire — Next-Steps Roadmap & Task Checklist

This document details the essential API configurations, completed brand milestones, and upcoming feature integrations required to transition the Hajia Slay Empire e-commerce platform into a fully functional, production-ready website.

---

## 1. Required API Keys and Environment Setup

To activate all database syncing, online payments, and cloud image hosting, configure the following keys inside your `.env` configuration file:

| Service | Key / Variable Name | Status / Description | Where to Retrieve |
| :--- | :--- | :--- | :--- |
| **Supabase** | `VITE_SUPABASE_URL` | Endpoint of your Supabase database. | Settings > API in Supabase console |
| **Supabase** | `VITE_SUPABASE_KEY` | Anonymous public API key (client-safe). | Settings > API in Supabase console |
| **Paystack** | `VITE_PAYSTACK_PUBLIC_KEY` | Public key used to initialize inline GHS Mobile Money payments. | Paystack Dashboard > Settings > API Keys |
| **Cloudinary** | `VITE_CLOUDINARY_CLOUD_NAME` | Cloud Name identifier for product image hosting assets. | Cloudinary Dashboard |
| **Cloudinary** | `VITE_CLOUDINARY_PRESET` | Unsigned upload preset for secure frontend uploads. | Cloudinary > Settings > Upload > Upload Presets |

---

## 2. Completed Milestones & Styling Passes

### A. Brand Aesthetics & Visuals
* [x] **Branded Luxury Favicon**: Replaced the default React/Vite favicon with a custom-generated rose-gold/crown gradient ribbon icon. Wired it into `index.html` and the dynamic title/favicon setter inside `slayempire.jsx`.
* [x] **Zero-Margin Product Card Layout**: Adjusted product card styles to `object-fit: cover` and centered positioning so images fill cards edge-to-edge. Changed card backgrounds to pure white `#ffffff` to blend product photos with white backdrops seamlessly.
* [x] **Portrait-Oriented Product Catalog Images**: Swapped all default product images (including S02) with 3:4 portrait crops from Unsplash to prevent awkward landscape squishing.
* [x] **PAID · PACKING Text Style**: Changed the status tag text color from pink to white for high contrast on `#111111` dark backgrounds.

---

## 3. Recommended Next-Phase Features (Roadmap)

### A. Secure Admin Authentication (Auth)
* **Goal**: Replace the current base64 local password comparison with proper session credentials.
* **Tasks**:
  - [ ] Integrate **Supabase Auth** (`supabase.auth.signInWithPassword`).
  - [ ] Secure the admin panel views by checking session expiration parameters instead of `localStorage` flags.

### B. Paystack Webhook Fulfillment Handler
* **Goal**: Prevent order loss if a customer closes their tab immediately after Paystack payment succeeds.
* **Tasks**:
  - [ ] Build a serverless **Supabase Edge Function** (`/payment-webhook`).
  - [ ] Register the webhook URL inside your Paystack Dashboard to listen for `charge.success` events.
  - [ ] Automatically update `status_payment = true` in the database upon webhook receipt.

### C. Catalog Pagination and Infinite Scroll
* **Goal**: Support up to ~500 products without causing UI lag or memory issues on mobile browsers.
* **Tasks**:
  - [ ] Modify storefront catalog select queries to fetch products in paginated blocks of 20.
  - [ ] Implement an intersection observer to trigger loading additional pages on scroll.

### D. Direct CDN Asset Storage
* **Goal**: Eliminate base64 raw string uploads which quickly exceed storage limits.
* **Tasks**:
  - [ ] Configure **Cloudinary** credentials in `.env` to enable clean cloud uploads.
  - [ ] (Alternative) Configure a public **Supabase Storage Bucket** named `product-images` and update the admin product form to upload to this bucket.

### E. Google Sheets Live Sync Configuration
* **Goal**: Enable importing bulk inventory directly from a published spreadsheet.
* **Tasks**:
  - [ ] Create a Google Sheet matching the product headers.
  - [ ] Publish the sheet as a CSV (File > Share > Publish to web > CSV).
  - [ ] Paste the CSV URL in the Admin Sync Settings panel inside the app.
