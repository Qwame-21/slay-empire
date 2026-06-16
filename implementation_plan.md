# Implementation Plan - Bug Fixes and Testing Enhancements

This plan outlines the fixes and optimizations for the issues identified during testing. The changes focus on improving database synchronization, resolving Chrome-specific session token failures, fixing UI/UX layout bugs, and streamlining promo management.

## Proposed Changes

### 1. Storefront & Admin Logic
#### [MODIFY] [slayempire.jsx](file:///Users/ellisqwameadams/Desktop/Slay%20Empire/src/slayempire.jsx)

- **Robust Supabase Request Handler (`supa._req`)**:
  - Add auto-retry functionality: if a request fails with HTTP 401 or 403 (Unauthorized/Forbidden) and a custom token is present, clear the token from local storage and retry the request using the `anon` public key. This resolves the Chrome-specific issue where stale or expired login tokens break database updates.

- **Password Verification (`verifyAdminPassword`)**:
  - Ensure the default password `"slay2025admin"` is always accepted as a hardcoded fallback, even if the local storage hash is missing or corrupted.
  - Simplify confirm/prompt flow so deleting products and reviews is quick and error-free.

- **Clear All Promos (`clearAll`)**:
  - Optimize the bulk clear functionality to perform a single Supabase PATCH request targeting `products?promo_active=eq.true` rather than making individual requests per product.

- **Bulk Promo Application (`applyBulk`)**:
  - Calculate discounts using `Math.max(p.originalPrice || 0, p.price || 0)` to guarantee that products with active promos are adjusted correctly based on their original price.

- **Storefront Order Placement & Momo Payments**:
  - Mark Mobile Money ("momo") orders placed by customers from the storefront as paid by default (`status: { payment: true, ... }`), allowing processing to succeed without requiring Paystack API checks for now.

- **Reviews (Testimonials) Safe Rendering**:
  - Prevent rendering crashes by safeguarding the `testimonials` array in `useTestimonials` and `AdminTestimonialsView`, ensuring it always defaults to an empty array `[]` if local storage or database returns non-array structures.
  - Wrap `AdminTestimonialsView` in an `<ErrorBoundary>` in the admin menu.

- **Product Modal Close Button**:
  - Replace the multiplication sign character `×` in the `ProductModal` close button with an SVG close icon. Explicitly style the font family, background, border, and z-index to guarantee consistent visibility across all browsers (including Chrome and Safari).

- **Danger Zone Database Queries**:
  - Verify that the query path for wiping database entries uses the correct PostgREST syntax (`id=is.not.null` or `id=not.is.null`).

### 2. Vite Config / Local Dev Proxy
#### [MODIFY] [vite.config.js](file:///Users/ellisqwameadams/Desktop/Slay%20Empire/vite.config.js)
- Ensure the local Cloudinary mock correctly extracts the folder prefix from URLs (e.g. `slay_products/image_id`) to successfully request deletion from the Cloudinary API.

---

## Verification Plan

### Automated Tests
- Run `npm run build` locally to verify that there are no compile-time errors in the updated `slayempire.jsx` and config files.

### Manual Verification
- **Clear & Apply Promos**: Apply a bulk promo of 20% to all products, verify it adjusts products with existing promos, then click "Clear All Promos" and check if all products revert to their original prices.
- **Order Status Processing**: Place a momo order from the storefront. Go to the admin panel, confirm it is marked "Paid", and toggle the "Packed", "Dispatched", and "Delivered" checkboxes. Verify status changes persist in the database.
- **Reviews View**: Navigate to the "Reviews" tab in the admin menu, verify it renders successfully, and add/delete reviews.
- **Close Button (X)**: Open a product modal and verify the close button is clearly visible on both mobile and desktop views.
- **Delete Product**: Delete a test product and verify the product is removed from the list and its associated image is deleted from Cloudinary.
