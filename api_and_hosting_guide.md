# 🏰 Hajia Slay Empire — Full Setup Guide
### API Keys · Domain Name · Hosting

> **Your progress so far:** ✅ Supabase is now connected. Read each section below in order.

---

## ✅ STAGE 1 — Supabase (COMPLETE)

Your Supabase database is now **connected and live** in your [.env](file:///Users/ellisqwameadams/Desktop/Slay%20Empire/.env) file.

| What was set | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://eksgpzcdasftmpcqrmwv.supabase.co` |
| `VITE_SUPABASE_KEY` | Your anon JWT key (connected ✅) |

### 🔜 What you still need to do inside Supabase

Your app expects 4 database tables to exist. If you haven't created them yet, do this:

**Step 1 — Open your Supabase project**
1. Go to **[supabase.com](https://supabase.com)** and sign in.
2. Click on your project (the one with ref `eksgpzcdasftmpcqrmwv`).

**Step 2 — Open the SQL Editor**
1. In the left sidebar, click **"SQL Editor"** (looks like a database icon with `< >`).
2. Click **"New query"** (the `+` button at the top).

**Step 3 — Create the tables**
Copy and paste the SQL below, then click **"Run"** (the green play button):

```sql
-- Products table
create table if not exists products (
  id text primary key,
  name text not null,
  brand text,
  category text,
  subcategory text,
  price numeric not null,
  original_price numeric,
  notes text,
  extra text,
  image text,
  secondary_image text,
  bestseller boolean default false,
  is_trending boolean default false,
  gender text default 'women',
  stock integer default 0,
  low_stock_threshold integer default 3,
  promo_active boolean default false,
  promo_price numeric,
  created_at timestamptz default now()
);

-- Orders table
create table if not exists orders (
  id text primary key,
  purchase_code text,
  timestamp_ms bigint,
  customer_name text,
  customer_phone text,
  customer_email text,
  customer_country text default 'Ghana',
  street_address text,
  apartment text,
  city text,
  postal_code text,
  customer_notes text,
  items jsonb,
  total numeric,
  staff_order boolean default false,
  payment_method text default 'momo',
  momo_ref text,
  paystack_ref text,
  status_payment boolean default false,
  status_packaged boolean default false,
  status_dispatched boolean default false,
  status_delivered boolean default false,
  status_payment_at bigint,
  status_packaged_at bigint,
  status_dispatched_at bigint,
  status_delivered_at bigint,
  admin_note text,
  estimated_delivery text,
  created_at timestamptz default now()
);

-- Customers table
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  phone text unique not null,
  name text,
  email text,
  total_orders integer default 0,
  total_spent numeric default 0,
  last_order_at timestamptz,
  created_at timestamptz default now()
);

-- Testimonials table
create table if not exists slay_testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  handle text,
  review text not null,
  rating integer default 5,
  approved boolean default true,
  created_at timestamptz default now()
);
```

**Step 4 — Disable Row Level Security (for now)**
Still in the SQL Editor, run this second query to allow your app to read/write:

```sql
alter table products disable row level security;
alter table orders disable row level security;
alter table customers disable row level security;
alter table slay_testimonials disable row level security;
```

> **Why?** Row Level Security (RLS) by default blocks all access. Once you add proper user authentication later, you can turn it back on with proper rules.

**Step 5 — Restart your dev server**
In your terminal:
- Press `Ctrl + C` to stop the server
- Type `npm run dev` and press Enter
- Your app will now read/write real data to Supabase 🎉

**How to verify it's working:**
Open your app → go to the Admin panel → add a test product. Then go back to Supabase → **Table Editor** → click `products` — you should see your product appear there.

---

## 🔜 STAGE 2 — Paystack (GHS Payments)

**What it does:** Lets customers pay with Mobile Money, Visa, and Mastercard at checkout.

### Step-by-step (beginner-friendly)

**Step 1 — Create your Paystack account**
1. Go to **[paystack.com](https://paystack.com)**
2. Click **"Create a free account"**
3. Fill in your details:
   - Business name: `Hajia Slay Empire`
   - Country: **Ghana**
   - Email and phone number
4. Verify your email (check your inbox for a confirmation link)

**Step 2 — Complete business verification (for live payments)**
1. After logging in, look for a **"Complete your profile"** or **"Go Live"** banner at the top
2. Click it and provide:
   - Business registration details or individual ID
   - Bank account for receiving funds (GCB, Ecobank, MTN MoMo, etc.)
3. This takes 1–3 business days for Paystack to review

> 💡 **You can test immediately with `pk_test_` keys** — no real money charged. Switch to `pk_live_` after verification.

**Step 3 — Get your Public Key**
1. Inside Paystack Dashboard, click **Settings** (gear icon, usually top-right or left sidebar)
2. Click **API Keys & Webhooks**
3. You'll see two keys:
   - **Test Public Key** → starts with `pk_test_`  ← use this while building
   - **Live Public Key** → starts with `pk_live_`  ← use this when you go live
4. Click the **copy** icon next to the key you want

**Step 4 — Paste into your .env file**
Open [.env](file:///Users/ellisqwameadams/Desktop/Slay%20Empire/.env) and replace the placeholder:
```env
VITE_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Step 5 — Restart dev server**
`Ctrl+C` → `npm run dev`

**How to test:** Add a product to cart → go to checkout → pay with any test card number `4084084084084081`, expiry `01/26`, CVV `408`.

---

## 🔜 STAGE 3 — Cloudinary (Product Images)

**What it does:** Stores your product photos in the cloud so they load fast everywhere. Without this, product images you upload in the admin panel are stored as huge base64 strings in the database.

### Step-by-step

**Step 1 — Create a free Cloudinary account**
1. Go to **[cloudinary.com](https://cloudinary.com)**
2. Click **"Sign Up For Free"**
3. Fill in your name, email, and password
4. Choose **"Personal"** plan (it's free — gives you 25GB storage)

**Step 2 — Find your Cloud Name**
1. After signing in, you land on the **Dashboard**
2. At the very top of the page you'll see a box that says **"Cloud Name"** followed by a short word/phrase like `dxabcde12`
3. Copy that value — that's your `VITE_CLOUDINARY_CLOUD_NAME`

**Step 3 — Create an Upload Preset** *(this is the most important step)*
1. In the top-right corner, click your **username/profile icon**
2. Click **"Settings"** from the dropdown
3. On the Settings page, click the **"Upload"** tab (it's in the horizontal menu)
4. Scroll down until you see **"Upload presets"**
5. Click **"Add upload preset"**
6. Fill in:
   - **Preset name:** type `slay_products` (or any name you like)
   - **Signing Mode:** change this to **"Unsigned"** ← very important!
7. Click **"Save"** (blue button at the top-right)
8. Copy the preset name you used

**Step 4 — Paste into .env**
```env
VITE_CLOUDINARY_CLOUD_NAME=dxabcde12
VITE_CLOUDINARY_PRESET=slay_products
```

**Step 5 — Restart dev server**
`Ctrl+C` → `npm run dev`

**How to test:** In the Admin panel, add a new product and upload an image. If Cloudinary is set up correctly, the image will upload to cloud storage and appear instantly.

---

## 🔜 STAGE 4 — WhatsApp Cloud API (Order Alerts)

**What it does:** Sends you and customers an automatic WhatsApp message when an order is placed.

> This stage is **optional** — your app works fine without it, orders just won't send WhatsApp notifications automatically.

### Step-by-step

**Step 1 — Create a Meta Developer Account**
1. Go to **[developers.facebook.com](https://developers.facebook.com)**
2. Click **"Get Started"** and log in with your Facebook account
3. Accept the developer terms

**Step 2 — Create a new App**
1. Click **"My Apps"** in the top-right
2. Click **"Create App"**
3. Choose **"Business"** as the app type
4. Name it something like `SlayEmpireOrders`
5. Click **"Create App"**

**Step 3 — Add WhatsApp to your app**
1. On the app dashboard, scroll down to find **"WhatsApp"** in the list of products
2. Click **"Set up"** next to WhatsApp
3. This takes you to the WhatsApp API Setup page

**Step 4 — Get your credentials**
On the WhatsApp API Setup page you'll see:
- **Temporary Access Token** → a very long text starting with `EAA...` — this is your `VITE_WHATSAPP_ACCESS_TOKEN`
- **Phone Number ID** → a long number below "From" — this is your `VITE_WHATSAPP_PHONE_NUMBER_ID`

**Step 5 — Paste into .env**
```env
VITE_WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxx
VITE_WHATSAPP_PHONE_NUMBER_ID=123456789012345
```

> ⚠️ **Important:** The temporary token expires in **24 hours**. For permanent use, go to your Meta Business Manager → System Users → generate a permanent token. This requires a verified Meta Business account.

---

## 🌐 STAGE 5 — Getting Your Domain Name

**What it is:** Your website's address (e.g. `hajiaslayempire.com`). Without this, your site lives on a random URL like `random-words.netlify.app`.

### Step-by-step (using Namecheap — best value)

**Step 1 — Search for a domain**
1. Go to **[namecheap.com](https://namecheap.com)**
2. In the search bar, type the name you want, e.g.:
   - `hajiaslayempire.com`
   - `slayempiregh.com`
   - `hajiaslayshop.com`
3. Click **"Search"**

**Step 2 — Choose a domain**
- `.com` domains cost about **$10–15/year** — this is the most trusted
- `.shop` or `.store` cost about **$5–10/year** — also good for e-commerce
- If your first choice is taken, Namecheap suggests alternatives

**Step 3 — Add to cart and purchase**
1. Click **"Add to cart"** next to your chosen domain
2. Click **"View Cart"**
3. **Uncheck** "WhoisGuard Protection" if they offer to add it (it's free anyway for most domains)
4. Click **"Confirm Order"**
5. Create an account or log in, then complete payment

**Step 4 — You now own the domain!**
You'll receive a confirmation email. The domain is yours for 1 year — set a reminder to renew it before it expires.

---

## 🚀 STAGE 6 — Hosting Your Website (Professional Setup)

**What this means:** Right now your site only runs on your laptop. Hosting puts it on the internet so anyone in the world can visit it.

### Using Netlify (free, professional, perfect for this app)

#### Step A — Build your app for production

In your terminal (make sure you're in the project folder):
```bash
npm run build
```
This creates a `dist/` folder with the final website files. Takes about 30 seconds.

#### Step B — Create a free Netlify account
1. Go to **[app.netlify.com](https://app.netlify.com)**
2. Click **"Sign up"** → choose **"Sign up with GitHub"** (recommended) or email

#### Step C — Connect your project via GitHub *(Professional method)*

> This method means every time you save changes to GitHub, your live website updates automatically.

**First — push your project to GitHub:**
1. Go to **[github.com](https://github.com)** and create a free account if you don't have one
2. Click the **"+"** icon → **"New repository"**
3. Name it `slay-empire` → click **"Create repository"**
4. GitHub will show you commands. Open your terminal and run:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/slay-empire.git
git push -u origin main
```
*(Replace `YOUR_USERNAME` with your actual GitHub username)*

**Then — connect to Netlify:**
1. In Netlify, click **"Add new site"** → **"Import an existing project"**
2. Choose **"GitHub"** → authorize Netlify to access GitHub
3. Select your `slay-empire` repository
4. Set these build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Click **"Deploy site"**

#### Step D — Add your secret keys to Netlify

> ⚠️ **Critical step:** Your `.env` file must NOT be uploaded to GitHub (it contains secret keys). Instead, you add the keys directly inside Netlify.

1. In Netlify → your site → click **"Site configuration"**
2. In the left menu, click **"Environment variables"**
3. Click **"Add a variable"** for each key:

| Key | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://eksgpzcdasftmpcqrmwv.supabase.co` |
| `VITE_SUPABASE_KEY` | *(your full JWT anon key)* |
| `VITE_PAYSTACK_PUBLIC_KEY` | *(your Paystack live key)* |
| `VITE_CLOUDINARY_CLOUD_NAME` | *(your cloud name)* |
| `VITE_CLOUDINARY_PRESET` | *(your preset name)* |

4. After adding all variables, go to **"Deploys"** → click **"Trigger deploy"** → **"Deploy site"**

#### Step E — Connect your custom domain

1. In Netlify → your site → click **"Domain management"**
2. Click **"Add a domain"**
3. Type your domain (e.g. `hajiaslayempire.com`) → click **"Verify"** → **"Add domain"**
4. Netlify will show you either:
   - **Option A: Nameservers** (recommended) — 4 addresses like `dns1.p01.nsone.net`
   - **Option B: DNS records** — an A record and CNAME record

**Update DNS at Namecheap (using Option A — Nameservers):**
1. Log into **Namecheap** → click **"Domain List"** in the left menu
2. Click **"Manage"** next to your domain
3. Find **"Nameservers"** section
4. Change the dropdown from **"Namecheap BasicDNS"** to **"Custom DNS"**
5. Enter the 4 nameserver addresses that Netlify gave you
6. Click the green checkmark to save

**Wait 10–60 minutes** for the change to spread across the internet (sometimes up to 24 hours).

#### Step F — Free SSL / HTTPS (automatic)

Once your domain is connected, Netlify automatically:
- Issues a **free SSL certificate** (the 🔒 padlock in the browser)
- Forces all visitors to the secure `https://` version
- Renews the certificate automatically — you never pay for this

---

## 📋 Master Checklist

```
SUPABASE
[x] URL and anon key added to .env ← DONE!
[ ] Run the SQL to create the 4 tables in Supabase SQL Editor
[ ] Disable RLS with the second SQL query
[ ] Restart dev server → test that products save to Supabase

PAYSTACK
[ ] Create Paystack account at paystack.com
[ ] Copy test public key (pk_test_...) → paste into .env
[ ] Restart dev server → test checkout with test card 4084084084084081
[ ] After verification: swap to live key (pk_live_...)

CLOUDINARY
[x] Create/use existing account at cloudinary.com
[x] Copy Cloud Name from dashboard → paste into .env (dccf0ffxr)
[x] Create Unsigned upload preset named slay_products
[x] Copy preset name → paste into .env
[ ] Restart dev server → test uploading a product image (restart required)

WHATSAPP (optional)
[ ] Create Meta developer account
[ ] Create app → add WhatsApp product
[ ] Copy Access Token + Phone Number ID → paste into .env

DOMAIN NAME
[ ] Go to namecheap.com and search for your domain
[ ] Purchase your preferred .com domain (~$10-15/yr)

HOSTING (Netlify)
[ ] Run: npm run build
[ ] Create Netlify account → connect GitHub repo
[ ] Add all .env keys as environment variables in Netlify
[ ] Deploy the site
[ ] Add your custom domain in Netlify domain settings
[ ] Update nameservers at Namecheap with Netlify's DNS
[ ] Wait for DNS propagation (10 min – 24 hrs)
[ ] Verify HTTPS padlock appears → site is live! 🎉
```

---

> **Next immediate step:** Run the SQL in Supabase to create your database tables, then restart the dev server and test that the app saves products to Supabase correctly.
