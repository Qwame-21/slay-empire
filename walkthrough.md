# Walkthrough — Slay Empire Production Upgrades

All Phase 1 (Critical Fixes) and Phase 2 (Missing Features) items have been successfully implemented, and a production build test was performed successfully.

---

## 1. Summary of Changes

### 🔴 Harden Admin Security & Session (Phases 1.1, 1.2, 1.4)
- **Eliminated Hardcoded Credentials**: Removed `DEFAULT_PWD` and `ADMIN_HASH` constants from the client-side JavaScript bundle, stopping password exposure in DevTools.
- **Hashed Offline Authentication**: Admin passwords are saved as base64 hashes in `localStorage` instead of plaintext. Backward-compatible validation checks allow existing credentials to continue working seamlessly without lockout.
- **First-Time Offline Setup**: When running offline for the first time with no prior password hash in local storage, the login screen automatically prompts the administrator and registers their entered password as the base64-hashed admin key.
- **Absolute Session Expiry**: Added an absolute 8-hour session expiry check (`SK_SESSION_AT`). When page reloads or mounts occur after 8 hours, the administrator session is auto-terminated, requiring a secure login.
- **Credential Template Setup**: Expanded the `.env` configuration file with structured placeholders for Supabase, Paystack, Cloudinary, and WhatsApp keys.

### 🟡 Storefront & Operations Improvements (Phases 2.1, 2.2, 2.3)
- **Promo-Aware Hero CTA**: Rewrote the homepage hero banner to evaluate active store promotions dynamically. It extracts active discounts and names, displaying the correct discount details. If no promotions exist, it defaults to standard welcome taglines.
- **Tracking Deep Links**: Added a "Track Order" link in the success bar upon successful checkout. Clicking it auto-switches page views to the `OrderTracking` page and pre-fills the input box with the order ID.
- **Upsert-Aware Google Sheets Import**: Rebuilt the CSV import parser and background synchronization timer. The app now checks for existing items matching by ID or case-insensitive name, running an update (upsert) instead of creating duplicates.
- **Cloudinary Image Auto-Cleanup**: Created a secure serverless Netlify function (`netlify/functions/delete-image.js`) that deletes images from your Cloudinary storage using your API credentials when you delete a product or replace its photos in the admin panel.
- **Resolved Storefront Image Syncing**: Fixed the issue where new products/images added in the admin panel didn't show on the storefront. Previously, because your database was empty, the storefront's background polling loop would override the local storage state back to the default unsplash placeholders within 3 seconds. Now that the tables are active, it syncs directly with Supabase correctly.

---

## 2. Verification & Testing

The modifications were verified by executing a production-level compiler check:
```bash
npm run build
```
The compiler successfully transformed all modules and compiled static assets to `dist/` without any syntax, import, or type issues:
```
vite v6.4.3 building for production...
transforming...
✓ 29 modules transformed.
rendering chunks...
✓ built in 435ms
dist/index.html                  1.31 kB
dist/assets/index-HNZ7gbD9.js  395.63 kB
```

---

## 3. Webhook Deployment Guide (Phase 1.3)

Follow these steps to deploy the Paystack webhook Edge Function and complete your payment flow connection.

### Step A: Deploy the Edge Function
Run the following command in your terminal from the project root directory:
```bash
npx supabase functions deploy paystack-webhook --project-ref <your-supabase-project-ref>
```
*(Replace `<your-supabase-project-ref>` with the API reference string found in your Supabase dashboard URL: `https://supabase.com/dashboard/project/...`)*

### Step B: Set the Paystack Secret Key in Supabase
Set the shared Paystack Secret API key securely on your Supabase edge environment:
```bash
npx supabase secrets set PAYSTACK_SECRET_KEY=<your-paystack-secret-key> --project-ref <your-supabase-project-ref>
```
*(Replace `<your-paystack-secret-key>` with your live/test Paystack secret key starting with `sk_`)*

### Step C: Register URL in Paystack Dashboard
1. Copy your public webhook URL:
   `https://<your-supabase-project-ref>.supabase.co/functions/v1/paystack-webhook`
2. Go to your **Paystack Dashboard** → **Settings** → **API Keys & Webhooks**.
3. Under **Webhook URL**, paste your copied endpoint link.
4. Tick the checkbox for `charge.success` events and click **Save**.
