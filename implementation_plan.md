# Hajia Slay Empire — Full Production Upgrade Plan

## Overview

After a thorough read of the 3,471-line `slayempire.jsx` monolith, here is a precise, prioritised plan covering everything needed to get this app to a solid, production-ready state. The plan is split into **three phases**, ordered by impact vs. risk:

- **Phase 1 — Critical Fixes** (auth, security, payment reliability)
- **Phase 2 — Missing Features** (image storage, pagination, WhatsApp credentials)
- **Phase 3 — Architecture Cleanup** (component splitting, testing, deploy config)

---

## What's Already Done ✅

| Area | Status |
|------|--------|
| 4-step order stepper (UI + DB columns) | ✅ Complete |
| Admin note + estimated delivery | ✅ Complete |
| CSV export | ✅ Complete |
| Password-protected delete (via modal) | ✅ Complete |
| Bulk order select + delete | ✅ Complete |
| Duplicate order detection | ✅ Complete |
| WhatsApp fallback (wa.me link) | ✅ Complete |
| WhatsApp Cloud API integration (token-gated) | ✅ Complete |
| Paystack webhook Edge Function | ✅ Built & correct (HMAC-SHA512) |
| Shape converters (orderToRow / rowToOrder) | ✅ Complete with all 4 status fields |
| Supabase Auth (`signIn`, `updatePassword`) | ✅ Partially wired |
| Print receipt | ✅ Complete |
| Social proof ticker | ✅ Complete |
| Product CRUD (Cloudinary + base64 fallback) | ✅ Complete |
| RLS policies on all 4 tables | ✅ Complete |

---

## Open Questions / User Review Required

> [!IMPORTANT]
> **Supabase credentials**: The `.env` file still has placeholder values (`your-project-id.supabase.co`, `your-anon-public-key-here`). Without real credentials, the app runs in offline/localStorage mode only. All cloud features (order sync, admin Supabase Auth, product sync) require these to be filled in. Please have your Supabase URL and anon key ready.

> [!IMPORTANT]
> **Paystack public key**: `VITE_PAYSTACK_PUBLIC_KEY` is also absent from `.env`. The checkout will silently fall back to "Manual MoMo Transfer" mode. Add this to enable inline Paystack payment.

> [!IMPORTANT]
> **Webhook deployment**: The Edge Function at `supabase/functions/paystack-webhook/index.ts` is complete and correct. It needs to be deployed (`supabase functions deploy paystack-webhook`) and its URL registered in the Paystack Dashboard → Settings → Webhooks. It also needs `PAYSTACK_SECRET_KEY` set as a Supabase secret. Do you want me to walk through the full deploy steps?

> [!WARNING]
> **Admin password security**: The current admin login flow accepts either (a) Supabase email+password auth OR (b) the hardcoded `btoa("slay2025admin")` fallback. As long as `VITE_SUPABASE_KEY` is not set, (b) is the only path. Once you add credentials, Supabase Auth becomes the primary gate — the base64 fallback becomes a last-resort local override. We will tighten this by removing the plain-text `DEFAULT_PWD` constant from the JS bundle.

> [!NOTE]
> **WhatsApp Cloud API**: You currently need `VITE_WHATSAPP_ACCESS_TOKEN` and `VITE_WHATSAPP_PHONE_NUMBER_ID` in `.env`. Without them, the "Send Delivery Notification" button falls back to opening a pre-filled `wa.me` link. This fallback is functional. The Cloud API path requires an approved template only for outbound messages outside of a 24-hour customer-initiated window. I'll keep both paths and make it easy to switch.

> [!NOTE]
> **Hero copy**: The hero currently reads "Enjoy 50% off all products" — is this an active promotion or placeholder copy? Should it be dynamic (driven by the promo system) or fixed?

---

## Phase 1 — Critical Fixes (Do These First)

### 1.1 Populate `.env`

#### [MODIFY] [.env](file:///Users/ellisqwameadams/Desktop/Slay%20Empire/.env)

Add the following variables:
```
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_KEY=<your-anon-public-key>
VITE_PAYSTACK_PUBLIC_KEY=<your-paystack-public-key>
VITE_CLOUDINARY_CLOUD_NAME=<your-cloud-name>
VITE_CLOUDINARY_PRESET=<your-unsigned-preset>
VITE_WHATSAPP_ACCESS_TOKEN=<optional>
VITE_WHATSAPP_PHONE_NUMBER_ID=<optional>
PAYSTACK_SECRET_KEY=<only needed for Supabase Edge Function secret>
```

---

### 1.2 Harden Admin Auth

#### [MODIFY] [slayempire.jsx](file:///Users/ellisqwameadams/Desktop/Slay%20Empire/src/slayempire.jsx)

**Problem**: `DEFAULT_PWD = "slay2025admin"` is a plain-text constant in the client bundle. Anyone who opens DevTools can read it.

**Fix**:
- Remove `DEFAULT_PWD` constant entirely
- Remove `ADMIN_HASH` constant
- Admin login flow: when Supabase is connected → use `supa.signIn(email, pwd)` only. When offline → compare `btoa(pwd)` against a **user-set hash** stored in `localStorage` (set via Settings tab), never against a hardcoded value
- The Settings tab already has a "Change Password" form — wire it to save `btoa(newPwd)` to `localStorage(SK_PWD)` for the offline fallback path
- Add session expiry: store `slay_session_at` timestamp; if more than 8 hours have passed, auto-logout

**Specifically**:
- Lines 12–13: Remove `DEFAULT_PWD` and `ADMIN_HASH`
- Lines 91–104 (`verifyAdminPassword`): Update to use only stored hash, never hardcoded strings
- Lines 2438–2446 (`login` function): Remove fallback to `ADMIN_HASH`, only allow: (a) Supabase auth if ready, (b) stored-hash comparison if offline

---

### 1.3 Deploy Paystack Webhook Edge Function

The webhook at `supabase/functions/paystack-webhook/index.ts` is complete. The tasks are:

1. Run: `npx supabase functions deploy paystack-webhook --project-ref <your-project-ref>`
2. Run: `npx supabase secrets set PAYSTACK_SECRET_KEY=<your-paystack-secret-key> --project-ref <your-project-ref>`
3. Register the webhook URL (`https://<project-ref>.supabase.co/functions/v1/paystack-webhook`) in the Paystack Dashboard → Settings → Webhooks → add URL and tick `charge.success`

No code changes needed — the function is correct.

---

### 1.4 Fix Session Persistence After Page Reload

#### [MODIFY] [slayempire.jsx](file:///Users/ellisqwameadams/Desktop/Slay%20Empire/src/slayempire.jsx)

**Problem**: `adminLoggedIn` state is in-memory only. Refreshing the page logs the admin out even mid-session. This is especially jarring during Supabase auth.

**Fix**:
- Change `adminLoggedIn` from `useState(false)` to `useLocalStorage("slay_admin_session", false)`
- On login success: write `slay_admin_session = true` + `slay_session_at = Date.now()`
- On mount: check if `slay_session_at` is within 8 hours; if not, clear session
- On logout: clear both keys

---

## Phase 2 — Missing Features

### 2.1 Hero Copy — Make Dynamic

#### [MODIFY] [slayempire.jsx](file:///Users/ellisqwameadams/Desktop/Slay%20Empire/src/slayempire.jsx)

**Current**: Hero hardcodes "Enjoy 50% off all products" regardless of whether any promos are active.

**Fix**: Make the hero CTA dynamic:
- If `hasPromo` is true → show the actual promo text (product name + % off), pulled from the same logic as the `PromoBanner`
- If no promos → show the default "Premium Cosmetics & Beauty in Accra" copy with the shop CTA
- This removes the misleading promotion copy when no sale is running

---

### 2.2 Cloudinary / Supabase Storage Configuration

#### [MODIFY] [pending_tasks.md](file:///Users/ellisqwameadams/Desktop/Slay%20Empire/pending_tasks.md)

The upload flow in `ImageInput` and `ImageInputCompact` already tries Cloudinary first and falls back to base64. Once `VITE_CLOUDINARY_CLOUD_NAME` and `VITE_CLOUDINARY_PRESET` are in `.env`, images will automatically go to Cloudinary. No code changes needed — just credentials.

**Alternative**: Supabase Storage bucket `product-images` (public) — I can switch the upload target if preferred.

---

### 2.3 Catalog Pagination / Infinite Scroll

#### [MODIFY] [slayempire.jsx](file:///Users/ellisqwameadams/Desktop/Slay%20Empire/src/slayempire.jsx) — `ShopPage` + `useProducts`

**Current**: All products are fetched and rendered at once.

**Fix**:
- Add `?limit=20&offset=0` to the Supabase products GET query
- Track `page` state in `ShopPage`; load more on "Load More" button click (or IntersectionObserver)
- Keep the existing localStorage cache for the current page; merge pages as loaded

> [!NOTE]
> With 8 products currently, this isn't urgent. Recommend tackling when product count exceeds ~40.

---

### 2.4 Order Tracking via URL Hash (Deep Link)

#### [MODIFY] [slayempire.jsx](file:///Users/ellisqwameadams/Desktop/Slay%20Empire/src/slayempire.jsx) — `OrderTracking`

**Current**: Customers must manually type their order ID into the tracking page.

**Fix**: On order success, the confirmation bar already shows the order ID. We can add a "Track Order" link in the success bar that navigates to `/track?id=<order-id>` and pre-fills the search field. This is a small UX win that closes the loop for customers.

---

### 2.5 Google Sheets Sync (Bulk Inventory Import)

Per `pending_tasks.md` — the Settings tab already has a Google Sheets URL field. The logic to fetch CSV and parse it into products needs to be wired up:

#### [MODIFY] [slayempire.jsx](file:///Users/ellisqwameadams/Desktop/Slay%20Empire/src/slayempire.jsx) — `AdminSettingsView`

- Read the CSV URL from `SK_SHEETS` localStorage key
- Fetch the CSV, parse rows into the product shape
- Upsert via `supa.updateProduct` / `supa.insertProduct` for each row
- Show progress + error summary

---

## Phase 3 — Architecture Cleanup

### 3.1 Component Splitting

The 3,471-line monolith is technically functional but unmaintainable at this size. Recommended split (no behaviour changes, just file extraction):

```
src/
  slayempire.jsx          ← Root App + CSS + constants (~300 lines)
  hooks/
    useLocalStorage.js
    useProducts.js
    useOrders.js
    useTestimonials.js
  lib/
    supabase.js           ← supa object
    paystack.js           ← loadPaystackScript + openPaystackCheckout
    cloudinary.js         ← uploadToCloudinary + compressImage
    formatters.js         ← GHS, ago, genCode
  components/
    Icon.jsx
    StarRating.jsx
    OrderStepper.jsx
    ProductCard.jsx
    ProductModal.jsx
    CartDrawer.jsx
    SearchOverlay.jsx
    SocialProof.jsx
    TestimonialSection.jsx
  pages/
    HomePage.jsx
    ShopPage.jsx
    AboutPage.jsx
    OrderTracking.jsx
    FaqPage.jsx
    PrivacyPage.jsx
  admin/
    AdminApp.jsx
    AdminOrdersView.jsx
    OrderCard.jsx
    AdminProductsView.jsx
    AdminTestimonialsView.jsx
    InsightsView.jsx
    AdminSettingsView.jsx
    AdminCustomers.jsx
```

> [!NOTE]
> This is a pure refactor with no behaviour change. I recommend doing this **after** Phase 1 and 2 so you have a working production build first.

---

### 3.2 TypeScript Migration (Optional)

Add `tsconfig.json` + rename files to `.tsx`. Low priority — the codebase is readable as-is without TS.

### 3.3 Test Coverage (Optional)

Add Vitest + React Testing Library. Start with:
- `useOrders` hook unit tests (status cascade logic)
- `isDuplicateOrder` pure function tests
- `CartDrawer` integration test (add/remove/checkout flow)

---

## Verification Plan

### After Phase 1
1. `npm run dev` — no console errors
2. Login with placeholder password (offline mode) — should use stored hash only, no hardcoded string
3. Login with Supabase credentials (once `.env` is filled) — uses `supa.signIn`
4. Place a Paystack order → verify `status_payment` flips to `true` in Supabase (webhook)
5. Reload admin panel → verify session persists (no logout on refresh)

### After Phase 2
6. Upload a product image → verify it lands in Cloudinary (if credentials set) or degrades to base64
7. Open Order Tracking → navigate from success bar link → auto-populate the order ID
8. Send WhatsApp notification → verify `wa.me` fallback or Cloud API send depending on env vars

### After Phase 3
9. `npm run build` → no build errors, bundle size visibly smaller per-chunk
10. All existing functionality works identically

---

## Suggested Order of Execution

| Step | Task | Effort | Security Risk & Vulnerability Level / Impact |
|------|------|--------|----------------------------------------------|
| 1 | Fill in `.env` with real credentials | 5 min | 🔴 Critical (Required to unlock all integrations) |
| 2 | Harden admin auth (remove hardcoded pwd) | 30 min | 🔴 Critical Security Vulnerability (Prevents admin credentials disclosure in client bundle) |
| 3 | Deploy webhook + register in Paystack | 15 min | 🔴 Critical Security Risk (Ensures payment verification is done server-side via signature verification, preventing client-side bypass) |
| 4 | Fix session persistence + 8h expiry | 20 min | 🟡 Medium Security Risk (Prevents stale session hijacking / unauthorized physical access) |
| 5 | Google Sheets import wiring | 45 min | 🟡 Medium Security Risk (Requires input validation/sanitization to prevent catalogue data injection) |
| 6 | Fix hero CTA to be promo-aware | 20 min | 🟢 Low (UX / Brand Credibility) |
| 7 | Order tracking deep link from success bar | 15 min | 🟢 Low (Storefront UX Improvement) |
| 8 | Catalog pagination | 1 hr | 🟢 Low (Scale / Future-proofing) |
| 9 | Component splitting | 3–4 hr | 🟢 Low (Refactoring / Maintainability) |

