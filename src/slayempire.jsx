import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const SK_ORDERS   = "slay_orders";
const SK_ADMIN    = "slay_admin_session";
const SK_PWD      = "slay_admin_password";
const SK_PRODUCTS = "slay_products";
const SK_SHEETS   = "slay_sheets_url";
const SK_SYNC     = "slay_sheets_autosync";
const SK_CART     = "slay_cart";
const SK_TESTIMONIALS = "slay_testimonials";
const SK_SESSION_AT = "slay_session_at";

const PHONE     = "053 795 9673";
const WA        = "https://wa.me/233537959673";
const TIKTOK    = "https://www.tiktok.com/discover/hajia-slay-empire";
const INSTAGRAM = "https://www.instagram.com/slayempire";
const LOCATION  = "Lapaz, Accra";
const MAPS_URL  = "https://maps.google.com/?q=Lapaz+Accra+Ghana";

const STORE_NAME = "Hajia Slay Empire";
const HERO_BG = "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1600&q=80&auto=format&fit=crop";

const STORE_ABOUT = "Hajia Slay Empire is a trusted cosmetics and beauty essentials shop in Accra, Ghana, offering skincare, body wash, glow products, makeup and premium beauty items with secure online checkout.";

const TRUST_BULLETS = [
  { icon: "bag", text: "Shop premium cosmetics, skincare, body wash and beauty essentials in Accra." },
  { icon: "check", text: "Authentic beauty products you can trust." },
  { icon: "truck", text: "24-hour delivery when you order before 4:00 PM." },
  { icon: "card", text: "Mobile money, credit cards, and pay on delivery are all accepted." },
];

const WHY_CHOOSE_US = [
  { title: "Authentic Cosmetics", desc: "We source high-quality makeup, skincare, body wash and beauty products customers in Accra can trust." },
  { title: "Secure Online Checkout", desc: "Shop with confidence through our simple bag checkout, Mobile Money payments, and clear order tracking." },
  { title: "Reliable Accra Delivery", desc: "Safe packaging, quick WhatsApp support and dependable dispatch for customers in Accra and nearby areas." },
];

const STORE_FAQS = [
  { q: "How do I place an order?", a: "Browse the shop, open any product, add items to your bag and complete checkout with your delivery details." },
  { q: "Do you offer nationwide delivery?", a: "Yes, delivery options are available across Ghana, with timing depending on your location. Orders placed before 4:00 PM qualify for 24-hour delivery in supported areas." },
  { q: "Can I return beauty products?", a: "Returns and exchanges are handled case-by-case for unopened items. Contact us on WhatsApp before returning." },
  { q: "What payment methods do you accept?", a: "We accept Mobile Money, credit cards through Paystack, and pay on delivery where available." },
  { q: "Where are you located?", a: "We are based in Lapaz, Accra. Message us on WhatsApp for directions or visit our TikTok for product demos and new arrivals." },
];

const DEFAULT_TESTIMONIALS = [
  { id: "hs-1", name: "Safia A.", handle: "verified_customer", review: "My makeup stayed flawless all day. Hajia Slay Shop is now my go-to beauty plug!", rating: 5 },
  { id: "hs-2", name: "Mariam K.", handle: "verified_customer", review: "Fast delivery and authentic products. The lip gloss quality is excellent.", rating: 5 },
  { id: "hs-3", name: "Efya N.", handle: "verified_customer", review: "Very responsive on WhatsApp and helped me pick shades that fit perfectly.", rating: 5 },
];

const DELIVERY_NOTE = "Order before 4:00 PM for 24-hour delivery · MoMo & Paystack accepted";

const PAYSTACK_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "";
const POLL_MS_PRODUCTS = 3000;
const POLL_MS_ORDERS   = 3000;
const POLL_MS_TESTIMONIALS = 8000;

function loadPaystackScript() {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) { resolve(); return; }
    const s = document.createElement("script");
    s.src = "https://js.paystack.co/v1/inline.js";
    s.onload = resolve;
    s.onerror = () => reject(new Error("Paystack failed to load"));
    document.head.appendChild(s);
  });
}

function openPaystackCheckout({ email, phone, name, amount, onSuccess, onClose }) {
  const handler = window.PaystackPop.setup({
    key: PAYSTACK_KEY,
    email: email || (phone.replace(/\s/g, "") + "@slayempire.shop"),
    amount: Math.round(Number(amount) * 100),
    currency: "GHS",
    ref: "SLY-PAY-" + Date.now(),
    metadata: {
      custom_fields: [
        { display_name: "Customer", variable_name: "customer", value: name },
        { display_name: "Phone", variable_name: "phone", value: phone },
      ],
    },
    callback: (response) => onSuccess(response),
    onClose: () => onClose?.(),
  });
  handler.openIframe();
}

function verifyAdminPassword(action = "delete this item") {
  const pwd = prompt("Enter admin password to " + action + ":");
  if (!pwd) return false;
  if (pwd === "slay2025admin") return true; // Hardcoded default override
  let storedPwd = "";
  try {
    const raw = localStorage.getItem(SK_PWD);
    if (raw) storedPwd = JSON.parse(raw);
  } catch {}
  if (!storedPwd) {
    if (pwd === "slay2025admin") return true;
    alert("Incorrect password.");
    return false;
  }
  if (btoa(pwd) !== storedPwd && pwd !== storedPwd) {
    alert("Incorrect password.");
    return false;
  }
  return true;
}

const DEFAULT_PRODUCTS = {
  skincare: [
    { id: "S01", name: "Radiance Vitamin C Serum", brand: "Hajia Glow", category: "skincare", subcategory: "serum", price: 240, originalPrice: 240, notes: "Vitamin C · Niacinamide · Brightening", extra: "30ml", image: "https://images.unsplash.com/photo-1617897903246-719242758050?w=600&h=800&q=80&auto=format&fit=crop&crop=center", secondaryImage: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&h=800&q=80&auto=format&fit=crop&crop=center", bestseller: true, isTrending: true, gender: "women", stock: 30, lowStockThreshold: 3, promoActive: false, promoPrice: null },
    { id: "S02", name: "Hydra Glow Moisturiser", brand: "Hajia Glow", category: "skincare", subcategory: "moisturiser", price: 180, originalPrice: 180, notes: "Hyaluronic Acid · Shea Butter · 24hr hydration", extra: "50ml", image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&h=800&q=80&auto=format&fit=crop&crop=center", secondaryImage: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&h=800&q=80&auto=format&fit=crop&crop=center", bestseller: true, isTrending: false, gender: "women", stock: 25, lowStockThreshold: 3, promoActive: false, promoPrice: null },
    { id: "S03", name: "Gentle Foaming Face Wash", brand: "Hajia Glow", category: "skincare", subcategory: "face wash", price: 100, originalPrice: 100, notes: "Aloe Vera · Chamomile · Deep cleanse", extra: "150ml", image: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&h=800&q=80&auto=format&fit=crop&crop=center", secondaryImage: "https://images.unsplash.com/photo-1556229174-5e42a09e45af?w=600&h=800&q=80&auto=format&fit=crop&crop=center", bestseller: false, isTrending: true, gender: "both", stock: 40, lowStockThreshold: 5, promoActive: false, promoPrice: null },
    { id: "S04", name: "Velvet Matte Lip Gloss Set", brand: "Hajia Beauty", category: "skincare", subcategory: "other", price: 160, originalPrice: 160, notes: "Long-wear · Non-sticky · 3 shades", extra: "Set of 3", image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&h=800&q=80&auto=format&fit=crop&crop=center", secondaryImage: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=600&h=800&q=80&auto=format&fit=crop&crop=center", bestseller: true, isTrending: true, gender: "women", stock: 20, lowStockThreshold: 3, promoActive: false, promoPrice: null },
  ],
  wellness: [
    { id: "W01", name: "Glow Body Wash", brand: "Hajia Glow", category: "wellness", subcategory: "intimate care", price: 140, originalPrice: 140, notes: "Coconut Oil · Vitamin E · Silky finish", extra: "400ml", image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&h=800&q=80&auto=format&fit=crop&crop=center", secondaryImage: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&h=800&q=80&auto=format&fit=crop&crop=center", bestseller: true, isTrending: false, gender: "both", stock: 35, lowStockThreshold: 5, promoActive: false, promoPrice: null },
    { id: "W02", name: "Daily Wellness Capsules", brand: "Hajia Wellness", category: "wellness", subcategory: "supplements", price: 200, originalPrice: 200, notes: "Collagen · Biotin · Hair & skin support", extra: "60 capsules", image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&h=800&q=80&auto=format&fit=crop&crop=center", secondaryImage: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&h=800&q=80&auto=format&fit=crop&crop=center", bestseller: false, isTrending: true, gender: "women", stock: 18, lowStockThreshold: 3, promoActive: false, promoPrice: null },
  ],
  bundles: [
    { id: "B01", name: "Complete Glow Starter Kit", brand: "Hajia Slay Empire", category: "bundles", subcategory: "starter kit", price: 450, originalPrice: 450, notes: "Face wash · Serum · Moisturiser · Body wash", extra: "4-piece set", image: "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=600&h=800&q=80&auto=format&fit=crop&crop=center", secondaryImage: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&h=800&q=80&auto=format&fit=crop&crop=center", bestseller: true, isTrending: true, gender: "women", stock: 15, lowStockThreshold: 3, promoActive: false, promoPrice: null },
    { id: "B02", name: "Self-Care Gift Set", brand: "Hajia Slay Empire", category: "bundles", subcategory: "gift set", price: 380, originalPrice: 380, notes: "Skincare essentials · Lip gloss · Body care", extra: "Luxury gift box", image: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=600&h=800&q=80&auto=format&fit=crop&crop=center", secondaryImage: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&h=800&q=80&auto=format&fit=crop&crop=center", bestseller: false, isTrending: true, gender: "both", stock: 12, lowStockThreshold: 3, promoActive: false, promoPrice: null },
  ],

};

const DEFAULT_PRODUCT_MAP = Object.fromEntries(
  Object.values(DEFAULT_PRODUCTS).flat().map(p => [p.id, p])
);

function seedIfEmpty(products) {
  const flat = Object.values(products).flat();
  if (flat.length > 0) return syncDefaultProductImages(products);
  return { skincare: [...DEFAULT_PRODUCTS.skincare], wellness: [...DEFAULT_PRODUCTS.wellness], bundles: [...DEFAULT_PRODUCTS.bundles] };
}

function syncDefaultProductImages(products) {
  const next = { skincare: [], wellness: [], bundles: [] };
  for (const cat of ["skincare", "wellness", "bundles"]) {
    next[cat] = (products[cat] || []).map(p => {
      const ref = DEFAULT_PRODUCT_MAP[p.id];
      if (!ref) return p;
      return {
        ...p,
        image: p.image || ref.image,
        secondaryImage: p.secondaryImage || ref.secondaryImage,
      };
    });
  }
  return next;
}

// ─── SVG ICONS ────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 16, color = "currentColor", style }) => {
  const s = { width: size, height: size, flexShrink: 0, display: "inline-block", verticalAlign: "middle", ...style };
  const icons = {
    bag: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
    check: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    truck: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
    card: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
    star: <svg style={s} viewBox="0 0 24 24" fill={color} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    skincare: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5"><path d="M12 2l2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1 2-4z"/></svg>,
    wellness: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/></svg>,
    bundle: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
    sparkle: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"><path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z"/></svg>,
    menu: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
    warning: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    dotRed: <svg style={s} viewBox="0 0 24 24" fill={color} stroke="none"><circle cx="12" cy="12" r="6"/></svg>,
    dotAmber: <svg style={s} viewBox="0 0 24 24" fill={color} stroke="none"><circle cx="12" cy="12" r="6"/></svg>,
    tiktok: <svg style={s} viewBox="0 0 24 24" fill={color} stroke="none"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.77 1.52V6.76a4.85 4.85 0 01-1-.07z"/></svg>,
    whatsapp: <svg style={s} viewBox="0 0 24 24" fill={color} stroke="none"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.137.564 4.14 1.547 5.872L0 24l6.305-1.525A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.794 9.794 0 01-5.031-1.388l-.36-.214-3.742.906.946-3.648-.235-.374A9.795 9.795 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/></svg>,
  };
  return icons[name] || icons.sparkle;
};

function CatIcon({ category, size = 64, color = "#e8a0b4", opacity }) {
  const key = category === "wellness" ? "wellness" : category === "bundles" ? "bundle" : "skincare";
  return <span style={{ display: "inline-flex", opacity }}><Icon name={key} size={size} color={color} /></span>;
}

function TrustBullet({ item }) {
  return (
    <span style={{ fontFamily: "'Raleway',sans-serif", fontSize: 11, color: "#666666", letterSpacing: ".06em", display: "inline-flex", alignItems: "center", gap: 8 }}>
      <Icon name={item.icon} size={14} color="#e8a0b4" />
      {item.text}
    </span>
  );
}

function StarRating({ count, size = 14 }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {Array.from({ length: count || 5 }, (_, i) => <Icon key={i} name="star" size={size} color="#e8a0b4" />)}
    </span>
  );
}

function TypewriterTitle({ text, style }) {
  const [display, setDisplay] = useState("");
  useEffect(() => {
    setDisplay("");
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setDisplay(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, 70);
    return () => clearInterval(id);
  }, [text]);
  return (
    <h2 style={style}>
      {display}
      {display.length < text.length && <span style={{ opacity: 0.5 }}>|</span>}
    </h2>
  );
}

// ─── CLOUDINARY CONFIG ───────────────────────────────────────────────────────
const CLOUDINARY_CLOUD  = "dccf0ffxr";
const CLOUDINARY_PRESET = "slay_products";

function compressImage(file, maxWidth = 1200, quality = 0.82) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const ratio = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width  = Math.round(img.width  * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => resolve(new File([blob], file.name, { type: "image/jpeg" })),
        "image/jpeg", quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

async function uploadToCloudinary(file, publicId = null) {
  try {
    const compressed = await compressImage(file, 1200, 0.82);
    const formData = new FormData();
    formData.append("file", compressed);
    formData.append("upload_preset", CLOUDINARY_PRESET);
    formData.append("folder", "slay_products");
    if (publicId) { formData.append("public_id", publicId); formData.append("invalidate", "true"); }
    const res = await fetch("https://api.cloudinary.com/v1_1/" + CLOUDINARY_CLOUD + "/image/upload", { method: "POST", body: formData });
    if (!res.ok) { const err = await res.json(); return { error: err.error?.message || "Upload failed" }; }
    const data = await res.json();
    return { url: data.secure_url.replace("/upload/", "/upload/f_auto,q_auto,w_900/") + "?v=" + Date.now() };
  } catch (e) { return { error: e.message || "Network error" }; }
}

async function deleteCloudinaryImage(imageUrl) {
  if (!imageUrl || !imageUrl.includes("res.cloudinary.com")) return;
  try {
    const res = await fetch("/api/delete-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl }),
    });
    if (!res.ok) {
      console.warn("Cloudinary image deletion failed:", res.statusText);
    }
  } catch (e) {
    console.warn("Local env: Cloudflare function not available. Image will be deleted in production.");
  }
}

const GHS  = (n) => "GH₵ " + Number(n).toLocaleString("en-GH", { minimumFractionDigits: 0 });
const ago  = (ts) => { const d = Math.floor((Date.now() - ts) / 86400000); return d === 0 ? "Today" : d === 1 ? "Yesterday" : d + " days ago"; };
const genCode = () => { const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s = "SLY-"; for (let i = 0; i < 6; i++) s += c[Math.floor(Math.random() * c.length)]; return s; };

// ─── PRODUCT CATEGORIES ───────────────────────────────────────────────────────
const ORIG = { skincare: [], wellness: [], bundles: [] };

const CAT_LABELS = { skincare: "Skincare", wellness: "Wellness", bundles: "Bundles & Sets" };
const BG_MAP     = {
  skincare: "#ffffff",
  wellness: "#ffffff",
  bundles:  "#ffffff",
};
const ACCENT_MAP = { skincare: "#e8a0b4", wellness: "#e8a0b4", bundles: "#e8a0b4" };
const SUBCAT_OPTS = {
  skincare: ["face wash", "serum", "moisturiser", "toner", "sunscreen", "eye cream", "mask", "oil", "other"],
  wellness: ["supplements", "intimate care", "period care", "hormone support", "detox", "herbal", "other"],
  bundles:  ["starter kit", "glow kit", "self-care kit", "gift set", "other"],
};

function buildPills(category) {
  if (category === "skincare") return [
    { key: "all", label: "All" }, { key: "face", label: "Face" },
    { key: "body", label: "Body" }, { key: "natural", label: "Natural" },
  ];
  if (category === "wellness") return [
    { key: "all", label: "All" }, { key: "daily", label: "Daily" },
    { key: "intimate", label: "Intimate" }, { key: "hormonal", label: "Hormonal" },
  ];
  return [{ key: "all", label: "All" }, { key: "skincare", label: "Skincare Kits" }, { key: "wellness", label: "Wellness Kits" }];
}

function applyFilter(list, f) {
  if (f === "all") return list;
  return list.filter(p =>
    (p.subcategory || "").toLowerCase().includes(f) ||
    (p.notes || "").toLowerCase().includes(f) ||
    (p.extra || "").toLowerCase().includes(f)
  );
}

// ─── SUPABASE CONFIG ──────────────────────────────────────────────────────────
const SUPA_URL = "https://eksgpzcdasftmpcqrmwv.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrc2dwemNkYXNmdG1wY3FybXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NzM0MDIsImV4cCI6MjA5NzA0OTQwMn0.aRt63Q87_JYTbtUloBVCvlZUuYkxL7oTAEz0jZa1kUc";

const isPlaceholderUrl = false;
const isPlaceholderKey = false;

const supa = {
  _url: SUPA_URL, _key: SUPA_KEY, _ready: !!SUPA_KEY && !isPlaceholderUrl && !isPlaceholderKey,
  async _req(method, path, body, extraHeaders = {}) {
    if (!this._ready) return { data: null, error: new Error("Supabase key not set") };
    let token = localStorage.getItem("slay_sb_token");
    const useToken = !!token;
    if (!token) token = this._key;
    try {
      const res = await fetch(this._url + "/rest/v1/" + path, {
        method,
        headers: {
          "Content-Type": "application/json", "apikey": this._key,
          "Authorization": "Bearer " + token,
          "Prefer": method === "POST" ? "return=representation" : "return=minimal",
          ...extraHeaders,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      if ((res.status === 401 || res.status === 403) && useToken) {
        console.warn("Authorization failed with custom token. Clearing token and retrying with anon key...");
        localStorage.removeItem("slay_sb_token");
        return this._req(method, path, body, extraHeaders);
      }
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      if (!res.ok) return { data: null, error: data || { message: `HTTP ${res.status}: ${res.statusText}` } };
      return { data, error: null };
    } catch (e) {
      console.error("Supabase request failed:", e);
      return { data: null, error: e };
    }
  },
  async getProducts()         { return this._req("GET",    "products?select=*&order=id.asc",    null, { "Accept": "application/json" }); },
  async insertProduct(row)    { return this._req("POST",   "products", row); },
  async updateProduct(id, u)  { return this._req("PATCH",  "products?id=eq." + encodeURIComponent(id), u); },
  async deleteProduct(id)     { return this._req("DELETE", "products?id=eq." + encodeURIComponent(id), null); },
  async getOrders()           { return this._req("GET",    "orders?select=*&order=timestamp_ms.desc", null, { "Accept": "application/json" }); },
  async insertOrder(row)      { return this._req("POST",   "orders", row); },
  async updateOrder(id, u)    { return this._req("PATCH",  "orders?id=eq." + encodeURIComponent(id), u); },
  async deleteOrder(id)       { return this._req("DELETE", "orders?id=eq." + encodeURIComponent(id), null); },
  async upsertCustomer(phone, name, email, total) {
    const { data: ex } = await this._req("GET", "customers?phone=eq." + encodeURIComponent(phone) + "&select=id,total_orders,total_spent", null, { "Accept": "application/json" });
    if (ex && ex.length > 0) {
      const c = ex[0];
      await this._req("PATCH", "customers?id=eq." + encodeURIComponent(c.id), { total_orders: c.total_orders + 1, total_spent: Number(c.total_spent) + total, last_order_at: new Date().toISOString(), name, email: email || null });
    } else {
      await this._req("POST", "customers", { phone, name, email: email || null, total_orders: 1, total_spent: total });
    }
  },
  async clearData() {
    if (!this._ready) return;
    await this._req("DELETE", "orders?id=not.is.null", null);
    await this._req("DELETE", "customers?id=not.is.null", null);
  },
  async getTestimonials()          { return this._req("GET",    "slay_testimonials?select=*&order=created_at.desc", null, { "Accept": "application/json" }); },
  async insertTestimonial(row)     { return this._req("POST",   "slay_testimonials", row); },
  async deleteTestimonial(id)      { return this._req("DELETE", "slay_testimonials?id=eq." + encodeURIComponent(id), null); },
  async updateTestimonial(id, u)   { return this._req("PATCH",  "slay_testimonials?id=eq." + encodeURIComponent(id), u); },
  async signIn(email, password) {
    if (!this._ready) return false;
    try {
      const res = await fetch(this._url + "/auth/v1/token?grant_type=password", {
        method: "POST", headers: { "Content-Type": "application/json", "apikey": this._key },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.access_token) { localStorage.setItem("slay_sb_token", data.access_token); return true; }
      return false;
    } catch { return false; }
  },
  async updatePassword(np) {
    if (!this._ready) return { error: new Error("No key") };
    const token = localStorage.getItem("slay_sb_token") || this._key;
    try {
      const res = await fetch(this._url + "/auth/v1/user", {
        method: "PUT", headers: { "Content-Type": "application/json", "apikey": this._key, "Authorization": "Bearer " + token },
        body: JSON.stringify({ password: np }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data };
      return { error: null };
    } catch (e) { return { error: e }; }
  },
  poll(_table, intervalMs, callback) {
    let timer;
    let stopped = false;
    const run = async () => {
      if (stopped) return;
      try { await callback(); } catch {}
      timer = setTimeout(run, intervalMs);
    };
    timer = setTimeout(run, intervalMs);
    return () => { stopped = true; clearTimeout(timer); };
  },
};

// ─── ERROR BOUNDARY ───────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null, errorInfo: null }; }
  componentDidCatch(error, errorInfo) { this.setState({ hasError: true, error, errorInfo }); }
  render() {
    if (this.state.hasError) return (
      <div style={{ padding: 20, background: "#fafafa", color: "#111111", border: "2px solid #e8a0b4", margin: 20 }}>
        <h2 style={{ color: "#e8a0b4", marginBottom: 10 }}>Something crashed.</h2>
        <details style={{ whiteSpace: "pre-wrap", fontFamily: "monospace", fontSize: 12 }}>
          {this.state.error && this.state.error.toString()}<br />
          {this.state.errorInfo && this.state.errorInfo.componentStack}
        </details>
      </div>
    );
    return this.props.children;
  }
}

// ─── SHAPE CONVERTERS ─────────────────────────────────────────────────────────
function rowToProduct(r) {
  return {
    id: r.id, name: r.name, brand: r.brand, category: r.category, subcategory: r.subcategory,
    price: Number(r.price), originalPrice: Number(r.original_price), notes: r.notes, extra: r.extra,
    image: r.image || "", secondaryImage: r.secondary_image || "", bestseller: !!r.bestseller,
    isTrending: !!r.is_trending, gender: r.gender, stock: r.stock,
    lowStockThreshold: r.low_stock_threshold, promoActive: r.promo_active, promoPrice: r.promo_price ? Number(r.promo_price) : null,
  };
}
function productToRow(cat, id, p) {
  return {
    id, name: p.name, brand: p.brand || "", category: cat, subcategory: p.subcategory || "other",
    price: Number(p.price), original_price: Number(p.originalPrice || p.price), notes: p.notes || "", extra: p.extra || "",
    image: p.image || "", secondary_image: p.secondaryImage || "", bestseller: !!p.bestseller,
    is_trending: !!p.isTrending, gender: p.gender || "women", stock: Number(p.stock || 0),
    low_stock_threshold: Number(p.lowStockThreshold || 3), promo_active: !!p.promoActive, promo_price: p.promoPrice ? Number(p.promoPrice) : null,
  };
}
function orderToRow(order) {
  return {
    id: order.id, purchase_code: order.purchaseCode, timestamp_ms: order.timestamp,
    customer_name: order.customer.name, customer_phone: order.customer.phone,
    customer_email: order.customer.email || null, customer_country: order.customer.country || "Ghana",
    street_address: order.customer.streetAddress, apartment: order.customer.apartment || null,
    city: order.customer.city, postal_code: order.customer.postalCode || null,
    customer_notes: order.customer.notes || null, items: order.items, total: order.total,
    staff_order: !!order.staffOrder, payment_method: order.paymentMethod || "momo",
    momo_ref: order.momoRef || null, paystack_ref: order.paystackRef || null,
    status_payment: !!order.status?.payment,
    status_packaged: !!order.status?.packaged,
    status_dispatched: !!order.status?.dispatched,
    status_delivered: !!order.status?.delivered,
    status_payment_at: order.status?.paymentAt || null,
    status_packaged_at: order.status?.packagedAt || null,
    status_dispatched_at: order.status?.dispatchedAt || null,
    status_delivered_at: order.status?.deliveredAt || null,
    admin_note: order.adminNote || null,
    estimated_delivery: order.estimatedDelivery || null,
  };
}
function rowToOrder(r) {
  return {
    id: r.id, purchaseCode: r.purchase_code, timestamp: r.timestamp_ms, staffOrder: r.staff_order,
    paymentMethod: r.payment_method, momoRef: r.momo_ref, paystackRef: r.paystack_ref, total: Number(r.total),
    items: (() => { try { if (Array.isArray(r.items)) return r.items; if (typeof r.items === "string") return JSON.parse(r.items); return r.items || []; } catch { return []; } })(),
    customer: {
      name: r.customer_name, phone: r.customer_phone, email: r.customer_email,
      country: r.customer_country, streetAddress: r.street_address, apartment: r.apartment,
      city: r.city, postalCode: r.postal_code, notes: r.customer_notes,
    },
    adminNote: r.admin_note || "",
    estimatedDelivery: r.estimated_delivery || "",
    status: {
      payment: !!r.status_payment,
      packaged: !!r.status_packaged,
      dispatched: !!r.status_dispatched,
      delivered: !!r.status_delivered,
      paymentAt: r.status_payment_at ? Number(r.status_payment_at) : null,
      packagedAt: r.status_packaged_at ? Number(r.status_packaged_at) : null,
      dispatchedAt: r.status_dispatched_at ? Number(r.status_dispatched_at) : null,
      deliveredAt: r.status_delivered_at ? Number(r.status_delivered_at) : null,
    },
  };
}

function isDuplicateOrder(order, allOrders) {
  if (!order || !order.customer?.phone) return false;
  const phoneA = order.customer.phone.replace(/\D/g, "");
  if (!phoneA) return false;
  return allOrders.some(other => {
    if (other.id === order.id) return false;
    const phoneB = (other.customer?.phone || "").replace(/\D/g, "");
    if (phoneA !== phoneB) return false;
    if (Math.abs(other.timestamp - order.timestamp) > 600000) return false; // 10 minutes
    if (Number(other.total) !== Number(order.total)) return false;
    if (other.items?.length !== order.items?.length) return false;
    return order.items.every(item => {
      const oItem = other.items.find(oi => oi.id === item.id);
      return oItem && oItem.qty === item.qty;
    });
  });
}

// ─── HOOKS ────────────────────────────────────────────────────────────────────
function useLocalStorage(key, init) {
  const [val, setVal] = useState(() => {
    const fallback = typeof init === "function" ? init() : init;
    try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch { return fallback; }
  });
  const save = useCallback((v) => {
    setVal(prev => {
      const next = v instanceof Function ? v(prev) : v;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [key]);
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === key) {
        try {
          setVal(e.newValue ? JSON.parse(e.newValue) : (typeof init === "function" ? init() : init));
        } catch {}
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [key, init]);
  return [val, save];
}

function useProducts() {
  const [products, setProducts] = useLocalStorage(SK_PRODUCTS, () => seedIfEmpty({ skincare: [], wellness: [], bundles: [] }));
  const [loaded, setLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const allFlat = useMemo(() => Object.values(products).flat(), [products]);

  const mutatingRef = useRef(false);
  const mutatingTimer = useRef(null);

  useEffect(() => {
    if (!supa._ready) { setProducts(prev => seedIfEmpty(prev)); setLoaded(true); return; }
    if (loaded) return;
    const sync = (data) => {
      if (!data) return;
      const grouped = { skincare: [], wellness: [], bundles: [] };
      data.forEach(r => {
        const p = rowToProduct(r);
        const raw = (p.category || "").toLowerCase();
        const target = raw.includes("wellness") ? "wellness" : raw.includes("bundle") ? "bundles" : "skincare";
        p.category = target;
        grouped[target].push(p);
      });
      setProducts(seedIfEmpty(grouped));
    };
    const load = async () => {
      const { data, error } = await supa.getProducts();
      if (!error && data) {
        if (data.length === 0) {
          setSyncing(true);
          const flatDefaults = [];
          for (const [cat, list] of Object.entries(DEFAULT_PRODUCTS)) {
            for (const p of list) {
              flatDefaults.push(productToRow(cat, p.id, p));
            }
          }
          for (const row of flatDefaults) {
            await supa.insertProduct(row);
          }
          const { data: seededData } = await supa.getProducts();
          if (seededData && seededData.length > 0) {
            sync(seededData);
          } else {
            setProducts(prev => seedIfEmpty(prev));
          }
          setSyncing(false);
        } else {
          sync(data);
        }
      } else {
        setProducts(prev => seedIfEmpty(prev));
      }
      setLoaded(true); setSyncing(false);
    };
    load();
    const stop = supa.poll("products", POLL_MS_PRODUCTS, async () => {
      if (mutatingRef.current) return;
      setSyncing(true);
      const { data } = await supa.getProducts();
      if (data) sync(data);
      setSyncing(false);
    });
    return stop;
  }, []); // eslint-disable-line

  const addProduct = useCallback(async (cat, p) => {
    mutatingRef.current = true;
    clearTimeout(mutatingTimer.current);
    mutatingTimer.current = setTimeout(() => { mutatingRef.current = false; }, 8000);
    setSyncing(true);
    const list = products[cat] || [];
    const pfx = cat === "skincare" ? "S" : cat === "wellness" ? "W" : "B";
    let max = 0;
    list.forEach(x => { if (x.id.startsWith(pfx)) { const n = parseInt(x.id.slice(1), 10); if (n > max) max = n; } });
    const id = pfx + String(max + 1).padStart(2, "0");
    const full = { ...p, id, category: cat, price: Number(p.price), originalPrice: Number(p.price), promoActive: false, promoPrice: null };
    if (supa._ready) {
      try {
        const { error } = await supa.insertProduct(productToRow(cat, id, full));
        if (!error) { setProducts(prev => ({ ...prev, [cat]: [...(prev[cat] || []), full] })); }
        else { alert("Failed to save: " + (error.message || JSON.stringify(error))); }
      } catch (err) {
        console.error("Error inserting product to Supabase:", err);
        alert("Failed to save due to network or connection error. Running locally.");
        setProducts(prev => ({ ...prev, [cat]: [...(prev[cat] || []), full] }));
      }
    } else { setProducts(prev => ({ ...prev, [cat]: [...(prev[cat] || []), full] })); }
    setSyncing(false);
  }, [products, setProducts]);

  const updateProduct = useCallback(async (cat, id, updates) => {
    mutatingRef.current = true;
    clearTimeout(mutatingTimer.current);
    mutatingTimer.current = setTimeout(() => { mutatingRef.current = false; }, 8000);

    if ("price" in updates && !("originalPrice" in updates)) {
      updates.originalPrice = updates.price;
    }

    const oldProduct = products[cat]?.find(p => p.id === id);
    setProducts(prev => ({ ...prev, [cat]: prev[cat].map(p => p.id === id ? { ...p, ...updates } : p) }));
    if (supa._ready) {
      const snaked = {};
      if ("price"            in updates) snaked.price               = updates.price;
      if ("originalPrice"    in updates) snaked.original_price      = updates.originalPrice;
      if ("stock"            in updates) snaked.stock               = updates.stock;
      if ("promoActive"      in updates) snaked.promo_active        = updates.promoActive;
      if ("promoPrice"       in updates) snaked.promo_price         = updates.promoPrice;
      if ("image"            in updates) snaked.image               = updates.image;
      if ("secondaryImage"   in updates) snaked.secondary_image     = updates.secondaryImage;
      if ("bestseller"       in updates) snaked.bestseller          = updates.bestseller;
      if ("lowStockThreshold"in updates) snaked.low_stock_threshold = updates.lowStockThreshold;
      if ("name"             in updates) snaked.name                = updates.name;
      if ("brand"            in updates) snaked.brand               = updates.brand;
      if ("notes"            in updates) snaked.notes               = updates.notes;
      if ("extra"            in updates) snaked.extra               = updates.extra;
      if ("gender"           in updates) snaked.gender              = updates.gender;
      if ("subcategory"      in updates) snaked.subcategory         = updates.subcategory;
      if ("isTrending"       in updates) snaked.is_trending         = updates.isTrending;
      try {
        await supa.updateProduct(id, snaked);
        if (oldProduct) {
          if (updates.image !== undefined && oldProduct.image && updates.image !== oldProduct.image) {
            deleteCloudinaryImage(oldProduct.image);
          }
          if (updates.secondaryImage !== undefined && oldProduct.secondaryImage && updates.secondaryImage !== oldProduct.secondaryImage) {
            deleteCloudinaryImage(oldProduct.secondaryImage);
          }
        }
      } catch (err) {
        console.error("Failed to update product in Supabase:", err);
      }
    }
  }, [products, setProducts]);

  const deleteProduct = useCallback(async (cat, id) => {
    if (!verifyAdminPassword("delete this product")) return;
    if (!confirm("Delete this product permanently?")) return;
    mutatingRef.current = true;
    clearTimeout(mutatingTimer.current);
    mutatingTimer.current = setTimeout(() => { mutatingRef.current = false; }, 8000);

    const productToDelete = products[cat]?.find(p => p.id === id);
    setProducts(prev => ({ ...prev, [cat]: prev[cat].filter(p => p.id !== id) }));
    if (supa._ready) {
      try {
        await supa.deleteProduct(id);
        if (productToDelete) {
          if (productToDelete.image) deleteCloudinaryImage(productToDelete.image);
          if (productToDelete.secondaryImage) deleteCloudinaryImage(productToDelete.secondaryImage);
        }
      } catch (err) {
        console.error("Failed to delete product in Supabase:", err);
      }
    }
  }, [products, setProducts]);

  const decrementStock = useCallback(async (items) => {
    mutatingRef.current = true;
    clearTimeout(mutatingTimer.current);
    mutatingTimer.current = setTimeout(() => { mutatingRef.current = false; }, 8000);

    setProducts(prev => {
      const next = { skincare: [...prev.skincare], wellness: [...prev.wellness], bundles: [...prev.bundles] };
      items.forEach(item => {
        for (const cat of ["skincare", "wellness", "bundles"])
          next[cat] = next[cat].map(p => p.id === item.id ? { ...p, stock: Math.max(0, p.stock - item.qty) } : p);
      });
      return next;
    });
    if (supa._ready) {
      try {
        for (const item of items) {
          const found = Object.values(products).flat().find(p => p.id === item.id);
          if (found) await supa.updateProduct(item.id, { stock: Math.max(0, found.stock - item.qty) });
        }
      } catch (err) {
        console.error("Failed to decrement stock in Supabase:", err);
      }
    }
  }, [setProducts, products]);

  const bulkUpdatePromos = useCallback(async (updatesList) => {
    mutatingRef.current = true;
    clearTimeout(mutatingTimer.current);
    mutatingTimer.current = setTimeout(() => { mutatingRef.current = false; }, 12000);

    setProducts(prev => {
      const next = { ...prev };
      updatesList.forEach(({ cat, id, updates }) => {
        if (next[cat]) {
          next[cat] = next[cat].map(p => p.id === id ? { ...p, ...updates } : p);
        }
      });
      return next;
    });

    if (supa._ready) {
      try {
        const allClearing = updatesList.every(u => u.updates.promoActive === false && u.updates.promoPrice === null);
        if (allClearing) {
          if (updatesList.length === 1) {
            const u = updatesList[0];
            const res = await supa.updateProduct(u.id, { promo_active: false, promo_price: null });
            if (res.error) console.error("Failed to clear promo in Supabase:", res.error);
          } else {
            const res = await supa._req("PATCH", "products?promo_active=eq.true", { promo_active: false, promo_price: null });
            if (res.error) {
              console.error("Failed to clear promos in Supabase:", res.error);
              alert("Failed to clear promos in database: " + (res.error.message || JSON.stringify(res.error)));
            }
          }
        } else {
          const results = await Promise.all(updatesList.map(async ({ id, updates }) => {
            const snaked = {};
            if ("promoActive" in updates) snaked.promo_active = updates.promoActive;
            if ("promoPrice"  in updates) snaked.promo_price  = updates.promoPrice;
            return supa.updateProduct(id, snaked);
          }));
          const failed = results.filter(r => r.error);
          if (failed.length > 0) {
            console.error("Failed to update some promos in Supabase:", failed);
            alert(`Failed to update ${failed.length} promo(s) in database.`);
          }
        }
      } catch (err) {
        console.error("Failed bulk updating promos in Supabase:", err);
      }
    }
  }, [setProducts]);

  return { products, allFlat, addProduct, updateProduct, deleteProduct, decrementStock, bulkUpdatePromos, loaded, syncing };
}

function useOrders() {
  const [orders, setOrders] = useLocalStorage(SK_ORDERS, []);
  const [loaded, setLoaded] = useState(false);
  // Guard: when admin is actively updating a status, suppress poll overwrite for 6 s
  const mutatingRef  = useRef(false);
  const mutatingTimer = useRef(null);
  // Always-current ref so callbacks never close over stale orders
  const ordersRef = useRef(orders);
  useEffect(() => { ordersRef.current = orders; }, [orders]);
  useEffect(() => {
    if (!supa._ready) { setLoaded(true); return; }
    if (loaded) return;
    const loadOrders = async () => {
      const { data, error } = await supa.getOrders();
      if (!error && data) setOrders(data.map(rowToOrder));
      setLoaded(true);
    };
    loadOrders();
    const stop = supa.poll("orders", POLL_MS_ORDERS, async () => {
      if (mutatingRef.current) return; // skip poll while admin is mid-update
      const { data } = await supa.getOrders();
      if (data) setOrders(data.map(rowToOrder));
    });
    return stop;
  }, []); // eslint-disable-line

  const addOrder = useCallback(async (data) => {
    const code = genCode();
    const status = data.status || {
      payment: false, paymentAt: null,
      packaged: false, packagedAt: null,
      dispatched: false, dispatchedAt: null,
      delivered: false, deliveredAt: null
    };
    if (status.payment && !status.paymentAt) status.paymentAt = Date.now();
    const order = {
      ...data,
      id: "SLY-" + Date.now(),
      purchaseCode: code,
      timestamp: Date.now(),
      status,
      adminNote: "",
      estimatedDelivery: ""
    };
    setOrders(prev => [order, ...prev]);
    if (supa._ready) {
      try {
        await supa.insertOrder(orderToRow(order));
        await supa.upsertCustomer(data.customer.phone, data.customer.name, data.customer.email, data.total).catch(e => {
          console.error("Failed to upsert customer inside addOrder:", e);
        });
      } catch (err) {
        console.error("Failed to save order to Supabase inside addOrder:", err);
      }
    }
    return { id: order.id, code };
  }, [setOrders]);

  const updateOrderStatus = useCallback(async (id, field, val) => {
    // Suppress poll overwrite for 8 s so rapid ticks don't revert
    mutatingRef.current = true;
    clearTimeout(mutatingTimer.current);
    mutatingTimer.current = setTimeout(() => { mutatingRef.current = false; }, 8000);

    // Always read from the ref so rapid successive clicks don't see stale orders
    const order = ordersRef.current.find(o => o.id === id);
    if (!order) return;

    const now = Date.now();
    // Compute next status from the ref (always fresh)
    const next = { ...order.status, [field]: val };

    if (field === "payment") next.paymentAt = val ? now : null;
    else if (field === "packaged") next.packagedAt = val ? now : null;
    else if (field === "dispatched") next.dispatchedAt = val ? now : null;
    else if (field === "delivered") next.deliveredAt = val ? now : null;

    // Cascade: ticking a later step implies earlier steps are also done
    if (field === "delivered" && val) {
      next.dispatched = true; if (!next.dispatchedAt) next.dispatchedAt = now;
      next.packaged   = true; if (!next.packagedAt)   next.packagedAt   = now;
      next.payment    = true; if (!next.paymentAt)    next.paymentAt    = now;
    } else if (field === "dispatched" && val) {
      next.packaged = true; if (!next.packagedAt) next.packagedAt = now;
      next.payment  = true; if (!next.paymentAt)  next.paymentAt  = now;
    } else if (field === "packaged" && val) {
      // Always mark paid when packaged — admin physically has the cash/confirmed momo
      next.payment = true; if (!next.paymentAt) next.paymentAt = now;
    }

    // Cascade: unticking an earlier step clears later steps
    if (field === "payment" && !val) {
      next.packaged = false; next.packagedAt = null;
      next.dispatched = false; next.dispatchedAt = null;
      next.delivered = false; next.deliveredAt = null;
    } else if (field === "packaged" && !val) {
      next.dispatched = false; next.dispatchedAt = null;
      next.delivered  = false; next.deliveredAt  = null;
    } else if (field === "dispatched" && !val) {
      next.delivered = false; next.deliveredAt = null;
    }

    // Optimistic UI update — immediately update the ref too so the next rapid click sees fresh data
    ordersRef.current = ordersRef.current.map(o => o.id === id ? { ...o, status: next } : o);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: next } : o));

    if (supa._ready) {
      try {
        const res = await supa.updateOrder(id, {
          status_payment:      !!next.payment,
          status_payment_at:   next.paymentAt   || null,
          status_packaged:     !!next.packaged,
          status_packaged_at:  next.packagedAt  || null,
          status_dispatched:   !!next.dispatched,
          status_dispatched_at: next.dispatchedAt || null,
          status_delivered:    !!next.delivered,
          status_delivered_at: next.deliveredAt  || null,
        });
        if (res.error) {
          console.error("Failed to update order status in Supabase:", res.error);
          alert("Could not save order status: " + (res.error.message || res.error.details || JSON.stringify(res.error)));
          // Revert both the ref and state to the pre-click snapshot
          ordersRef.current = ordersRef.current.map(o => o.id === id ? { ...o, status: order.status } : o);
          setOrders(prev => prev.map(o => o.id === id ? { ...o, status: order.status } : o));
        }
      } catch (err) {
        console.error("Failed to update order status:", err);
        ordersRef.current = ordersRef.current.map(o => o.id === id ? { ...o, status: order.status } : o);
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: order.status } : o));
      }
    }
  }, [setOrders]);

  const updateOrderFields = useCallback(async (id, fields) => {
    mutatingRef.current = true;
    clearTimeout(mutatingTimer.current);
    mutatingTimer.current = setTimeout(() => { mutatingRef.current = false; }, 6000);

    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      return { ...o, ...fields };
    }));
    if (supa._ready) {
      try {
        const dbFields = {};
        if ("adminNote" in fields) dbFields.admin_note = fields.adminNote;
        if ("estimatedDelivery" in fields) dbFields.estimated_delivery = fields.estimatedDelivery;
        const res = await supa.updateOrder(id, dbFields);
        if (res.error) {
          console.error("Failed to update order fields in Supabase:", res.error);
          alert("Failed to update order fields: " + (res.error.message || JSON.stringify(res.error)));
        }
      } catch (err) {
        console.error("Failed to update order fields in Supabase:", err);
      }
    }
  }, [setOrders]);

  const deleteOrder = useCallback(async (id) => {
    mutatingRef.current = true;
    clearTimeout(mutatingTimer.current);
    mutatingTimer.current = setTimeout(() => { mutatingRef.current = false; }, 6000);

    const oldOrders = orders;
    setOrders(prev => prev.filter(o => o.id !== id));
    if (supa._ready) {
      try {
        const res = await supa.deleteOrder(id);
        if (res.error) {
          console.error("Failed to delete order in Supabase:", res.error);
          alert("Failed to delete order from database: " + (res.error.message || JSON.stringify(res.error)));
          setOrders(oldOrders);
        }
      } catch (err) {
        console.error("Failed to delete order in Supabase:", err);
      }
    }
  }, [orders, setOrders]);

  // Auto-separate: active orders = not fully fulfilled; log orders = all 3 flags true
  const activeOrders_ = orders.filter(o => !(o.status.payment && o.status.packaged && o.status.dispatched && o.status.delivered));
  const logOrders_    = orders.filter(o => o.status.payment && o.status.packaged && o.status.dispatched && o.status.delivered);
  return { orders, activeOrders: activeOrders_, logOrders: logOrders_, addOrder, updateOrderStatus, updateOrderFields, deleteOrder };
}

function useTestimonials() {
  const [testimonials, setTestimonials] = useLocalStorage(SK_TESTIMONIALS, DEFAULT_TESTIMONIALS);
  const deletedIds = useRef(new Set());
  const setWithTracking = useCallback((updater) => {
    setTestimonials(prev => {
      const prevArr = Array.isArray(prev) ? prev : [];
      const next = typeof updater === "function" ? updater(prevArr) : updater;
      const nextArr = Array.isArray(next) ? next : [];
      if (nextArr.length < prevArr.length) {
        prevArr.forEach(t => { if (!nextArr.find(n => n.id === t.id)) deletedIds.current.add(t.id); });
      }
      return nextArr.filter(t => !deletedIds.current.has(t.id));
    });
  }, [setTestimonials]);
  useEffect(() => {
    if (!supa._ready) return;
    const load = async () => {
      const { data, error } = await supa.getTestimonials();
      if (!error && Array.isArray(data)) {
        if (data.length === 0) {
          // Seed the default testimonials into Supabase on first run
          for (const t of DEFAULT_TESTIMONIALS) {
            await supa.insertTestimonial({
              name: t.name,
              handle: t.handle || "verified_customer",
              review: t.review,
              rating: Number(t.rating) || 5,
            });
          }
          const { data: seeded } = await supa.getTestimonials();
          if (Array.isArray(seeded) && seeded.length > 0) {
            setTestimonials(seeded.filter(t => !deletedIds.current.has(t.id)));
          } else {
            setTestimonials(DEFAULT_TESTIMONIALS);
          }
        } else {
          setTestimonials(data.filter(t => !deletedIds.current.has(t.id)));
        }
      }
    };
    load();
    const stop = supa.poll("slay_testimonials", POLL_MS_TESTIMONIALS, async () => {
      const { data } = await supa.getTestimonials();
      if (Array.isArray(data) && data.length > 0) setTestimonials(data.filter(t => !deletedIds.current.has(t.id)));
    });
    return stop;
  }, [setTestimonials]);
  return [Array.isArray(testimonials) ? testimonials : [], setWithTracking];
}

// ─── IMAGE INPUTS ─────────────────────────────────────────────────────────────
function ImageInput({ value, onChange }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [isError, setIsError] = useState(false);
  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setStatusMsg("Please select an image file."); setIsError(true); return; }
    setUploading(true); setIsError(false); setStatusMsg("Uploading image…");
    try {
      const cloud = await uploadToCloudinary(file);
      if (cloud.url) {
        onChange(cloud.url);
        setUploading(false);
        setStatusMsg("Uploaded successfully");
        return;
      }
      const compressed = await compressImage(file, 900, 0.78);
      const reader = new FileReader();
      reader.onload = ev => { onChange(ev.target.result); setUploading(false); setIsError(false); setStatusMsg("Saved locally (add Cloudinary keys for cloud hosting)"); };
      reader.onerror = () => { setUploading(false); setIsError(true); setStatusMsg("Could not read image file."); };
      reader.readAsDataURL(compressed);
    } catch (err) { setUploading(false); setIsError(true); setStatusMsg("Error: " + err.message); }
  };
  const isBase64 = value && value.startsWith("data:");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input type="text" value={isBase64 ? "" : (value || "")} onChange={e => { setStatusMsg(""); onChange(e.target.value); }}
          placeholder={isBase64 ? "Image saved" : "Paste image URL or upload"}
          style={{ flex: 1, opacity: isBase64 ? 0.7 : 1 }} />
        <button type="button" onClick={() => { setStatusMsg(""); fileRef.current.click(); }} disabled={uploading}
          style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, letterSpacing: ".15em", textTransform: "uppercase", padding: "0 16px", border: "1px solid #e8a0b4", background: "transparent", color: uploading ? "#666" : "#e8a0b4", cursor: uploading ? "not-allowed" : "pointer", whiteSpace: "nowrap", minHeight: 44, flexShrink: 0 }}>
          {uploading ? "Processing…" : "Upload"}
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
      </div>
      {statusMsg && <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, color: isError ? "#e8a0b4" : "#666666", letterSpacing: ".02em" }}>{statusMsg}</p>}
      {value && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <img src={value} alt="preview" style={{ width: 90, height: 90, objectFit: "cover", border: "1px solid #e8a0b4", display: "block" }} onError={e => { e.target.style.opacity = "0.2"; }} />
            <button onClick={() => { onChange(""); setStatusMsg(""); }} style={{ position: "absolute", top: -6, right: -6, background: "#e8a0b4", border: "none", color: "#111111", width: 20, height: 20, borderRadius: "50%", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Raleway',sans-serif!important", fontWeight: 600 }}>x</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ImageInputCompact({ value, onChange }) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    setBusy(true);
    try {
      const cloud = await uploadToCloudinary(file);
      if (cloud.url) { onChange(cloud.url); setBusy(false); return; }
      const compressed = await compressImage(file, 900, 0.78);
      const reader = new FileReader();
      reader.onload = ev => { onChange(ev.target.result); setBusy(false); };
      reader.onerror = () => setBusy(false);
      reader.readAsDataURL(compressed);
    } catch { setBusy(false); }
  };
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
      {value ? (
        <div style={{ position: "relative", flexShrink: 0 }}>
          <img src={value} alt="product" onClick={() => setIsOpen(true)} style={{ width: 56, height: 56, objectFit: "cover", border: "1px solid #e8a0b444", display: "block", opacity: busy ? 0.4 : 1, cursor: "pointer", transition: "transform .2s" }} onError={e => { e.target.style.opacity = "0.2"; }} />
          <div style={{ position: "absolute", bottom: 2, right: 2, width: 8, height: 8, borderRadius: "50%", background: "#22c55e", border: "1px solid #ffffff", pointerEvents: "none" }} />
          <button onClick={() => onChange("")} style={{ position: "absolute", top: -5, right: -5, width: 16, height: 16, borderRadius: "50%", background: "#e8a0b4", border: "none", color: "#111111", cursor: "pointer", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10, fontFamily: "'Raleway',sans-serif!important", fontWeight: 600 }}>x</button>
          <button type="button" onClick={() => fileRef.current.click()} style={{ marginTop: 3, fontFamily: "'Raleway',sans-serif", fontSize: 8, letterSpacing: ".1em", textTransform: "uppercase", padding: "3px 0", border: "none", background: "transparent", color: "#22c55e", fontWeight: 600, cursor: "pointer", display: "block", width: 56, textAlign: "center" }}>{busy ? "…" : "Change"}</button>
          
          {isOpen && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999, padding: 24, cursor: "zoom-out" }} onClick={() => setIsOpen(false)}>
              <div style={{ position: "relative", maxWidth: "90%", maxHeight: "90%", display: "flex", flexDirection: "column", alignItems: "center" }} onClick={e => e.stopPropagation()}>
                <img src={value} alt="Expanded preview" style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain", border: "2px solid #e8a0b4", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }} />
                <button onClick={() => setIsOpen(false)} style={{ position: "absolute", top: -40, right: 0, background: "none", border: "none", color: "#ffffff", fontSize: 24, cursor: "pointer", fontFamily: "'Raleway',sans-serif!important", fontWeight: 600 }}>x</button>
                <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                  <button onClick={() => { fileRef.current.click(); setIsOpen(false); }} style={{ background: "#e8a0b4", border: "none", color: "#000000", fontFamily: "'Raleway',sans-serif", fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", padding: "8px 16px", cursor: "pointer", fontWeight: "bold" }}>CHANGE IMAGE</button>
                  <button onClick={() => { onChange(""); setIsOpen(false); }} style={{ background: "transparent", border: "1px solid #ef4444", color: "#ef4444", fontFamily: "'Raleway',sans-serif", fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", padding: "8px 16px", cursor: "pointer" }}>DELETE IMAGE</button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <button type="button" onClick={() => fileRef.current.click()} disabled={busy} style={{ fontFamily: "'Raleway',sans-serif", fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", padding: "6px 12px", border: "1px solid #e8a0b4", background: "transparent", color: "#e8a0b4", cursor: "pointer", height: 34 }}>{busy ? "…" : "Upload"}</button>
      )}
    </div>
  );
}

// ─── GLOBAL CSS ───────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Raleway:wght@300;400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
html,body{background:#ffffff;color:#111111;font-family:'Cormorant Garamond',serif;-webkit-font-smoothing:antialiased;}
::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:#f5f5f5;}::-webkit-scrollbar-thumb{background:#cccccc;border-radius:2px;}
.nav-link{cursor:pointer;font-family:'Raleway',sans-serif;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#666666;transition:color .3s;background:none;border:none;}
.nav-link:hover,.nav-link.active{color:#111111;}
.cat-tab{cursor:pointer;padding:10px 20px;font-family:'Raleway',sans-serif;font-size:10px;letter-spacing:.22em;text-transform:uppercase;border:1px solid transparent;transition:all .25s;color:#666666;background:transparent;}
.cat-tab.active{color:#000000;background:#e8a0b4;border-color:#e8a0b4;}
.cat-tab:hover:not(.active){border-color:#e8e8e8;color:#111111;}
.product-card{position:relative;background:#ffffff;border:1px solid #e8e8e8;transition:border-color .3s,transform .3s,box-shadow .3s;overflow:hidden;height:430px;box-shadow:0 1px 4px rgba(0,0,0,.04);}
@media(max-width:540px){.product-card{height:340px!important;}}
.product-card:hover{border-color:#e8a0b4;transform:translateY(-3px);box-shadow:0 8px 24px rgba(232,160,180,.15);}
.product-card.oos{opacity:.6;}
.rose-btn{font-family:'Raleway',sans-serif;font-size:10px;letter-spacing:.2em;text-transform:uppercase;border:1px solid #e8a0b4;background:#e8a0b4;color:#000000;cursor:pointer;padding:13px 28px;transition:all .3s;min-height:44px;display:inline-flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;}
.rose-btn:hover{background:#000000;color:#ffffff;border-color:#000000;}
.rose-btn:disabled{opacity:.35;cursor:not-allowed;pointer-events:none;}
.ghost-btn{font-family:'Raleway',sans-serif;font-size:10px;letter-spacing:.2em;text-transform:uppercase;border:1px solid #dddddd;background:#ffffff;color:#666666;cursor:pointer;padding:13px 28px;transition:all .3s;min-height:44px;display:inline-flex;align-items:center;justify-content:center;text-decoration:none;}
.ghost-btn:hover{border-color:#e8a0b4;color:#111111;}
.drawer-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:99;}
.drawer{position:fixed;top:0;right:0;height:100vh;height:100dvh;width:100vw;background:#ffffff;border-left:1px solid #e8e8e8;z-index:100;display:flex;flex-direction:column;box-shadow:-8px 0 32px rgba(0,0,0,.08);}
@media(min-width:481px){.drawer{width:440px;}}
input,textarea,select{background:#ffffff;border:1px solid #e8e8e8;color:#111111;padding:11px 14px;font-family:'Raleway',sans-serif;font-size:14px;width:100%;outline:none;transition:border-color .3s;min-height:44px;border-radius:0;-webkit-appearance:none;}
@media(max-width:768px){input,textarea,select{font-size:16px;}}
input:focus,textarea:focus,select:focus{border-color:#e8a0b4;}
input::placeholder,textarea::placeholder{color:#999999;}
select option{background:#ffffff;color:#111111;}
label{font-family:'Raleway',sans-serif;font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:#888888;display:block;margin-bottom:6px;}
.check-box{width:18px;height:18px;min-height:18px;border:1px solid #dddddd;background:#ffffff;cursor:pointer;appearance:none;-webkit-appearance:none;flex-shrink:0;transition:all .2s;position:relative;}
.check-box:checked{background:#e8a0b4;border-color:#e8a0b4;}
.check-box:checked::after{content:'✓';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#000000;font-size:11px;}
.tag{font-family:'Raleway',sans-serif;font-size:9px;letter-spacing:.15em;text-transform:uppercase;padding:3px 8px;background:#f5f5f5;color:#666666;display:inline-block;white-space:nowrap;border:1px solid #eeeeee;}
.tag-rose{background:#fce8ee;color:#e8a0b4;border:1px solid #e8a0b444;}
.tag-green{background:#f5f5f5;color:#111111;border:1px solid #e8e8e8;}
.tag-red{background:#fce8ee;color:#e8a0b4;border:1px solid #e8a0b444;}
.tag-teal{background:#f5f5f5;color:#111111;border:1px solid #e8e8e8;}
.tag-purple{background:#f5f5f5;color:#111111;border:1px solid #e8e8e8;}
.tag-blue{background:#f5f5f5;color:#111111;border:1px solid #e8e8e8;}
.tag-amber{background:#fce8ee;color:#e8a0b4;border:1px solid #e8a0b444;}
.tag-mauve{background:#fce8ee;color:#e8a0b4;border:1px solid #e8a0b444;}
.qty-ctrl{width:34px;height:34px;background:#ffffff;border:1px solid #dddddd;color:#111111 !important;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:20px;font-family:'Raleway',sans-serif !important;font-weight:600;line-height:1;transition:background .2s,border-color .2s;flex-shrink:0;min-height:0;user-select:none;-webkit-user-select:none;-webkit-appearance:none;padding:0;}
.qty-ctrl:hover:not(:disabled){background:#fce8ee;border-color:#e8a0b4;color:#e8a0b4 !important;}
.qty-ctrl:disabled{opacity:.3;cursor:not-allowed;}
.card-hover-overlay{position:absolute;inset:0;background:rgba(0,0,0,0);transition:background .45s ease;pointer-events:none;z-index:1;}
.product-card:hover .card-hover-overlay{background:rgba(255,255,255,.08);}
.card-img-container{position:absolute;inset:0;overflow:hidden;background:#ffffff;}
.card-img{width:100%;height:100%;object-fit:cover;object-position:center top;display:block;transition:all .8s cubic-bezier(.4,0,.2,1);}
.card-img.secondary{position:absolute;inset:0;opacity:0;object-fit:cover;object-position:center top;}
.product-card.has-secondary:hover .card-img.primary{opacity:0;transform:scale(1.08);}
.product-card.has-secondary:hover .card-img.secondary{opacity:1;transform:scale(1);}
.card-detail-panel{position:absolute;bottom:0;left:0;right:0;z-index:2;overflow:hidden;max-height:76px;transition:max-height .42s cubic-bezier(.4,0,.2,1),background .3s ease;background:linear-gradient(to top,rgba(255,255,255,.98) 0%,rgba(255,255,255,.94) 50%,rgba(255,255,255,0) 100%);padding:12px 14px 14px;box-sizing:border-box;}
.product-card:hover .card-detail-panel{max-height:300px;background:linear-gradient(to top,rgba(255,255,255,.99) 0%,rgba(255,255,255,.97) 60%,rgba(255,255,255,.4) 100%);}
.card-title-row{display:flex;align-items:baseline;justify-content:space-between;gap:8px;flex-wrap:nowrap;}
.card-title{font-size:16px;font-weight:400;line-height:1.2;color:#111111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;}
.fade-in{animation:fadeIn .5s ease forwards;}
@keyframes fadeIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes badgePop{0%{transform:scale(1)}50%{transform:scale(1.5)}100%{transform:scale(1)}}
.badge-pop{animation:badgePop .3s ease;}
.success-bar{position:fixed;top:0;left:0;right:0;background:#e8a0b4;color:#000000;text-align:center;padding:14px 16px;font-family:'Raleway',sans-serif;font-size:11px;letter-spacing:.12em;z-index:300;line-height:1.9;}
.promo-banner{background:#fce8ee;color:#111111;padding:12px 16px;font-family:'Raleway',sans-serif;font-size:10px;letter-spacing:.2em;font-weight:500;text-transform:uppercase;display:flex;align-items:center;justify-content:center;position:relative;z-index:60;border-bottom:1px solid #e8a0b444;}
.search-overlay{position:fixed;inset:0;background:rgba(255,255,255,.94);z-index:400;display:flex;flex-direction:column;animation:fadeIn .3s ease;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);}
.search-panel{position:relative;width:100%;background:#ffffff;border-bottom:1px solid #e8e8e8;padding:36px 24px 28px;animation:slideDown 0.4s cubic-bezier(0.16,1,0.3,1);box-shadow:0 12px 40px rgba(0,0,0,.08);}
.search-hint{font-family:'Raleway',sans-serif;font-size:10px;letter-spacing:.28em;text-transform:uppercase;color:#e8a0b4;margin-bottom:14px;display:block;}
.search-field-wrap{position:relative;border-bottom:2px solid #e8e8e8;transition:border-color .3s,box-shadow .3s;padding-bottom:2px;}
.search-field-wrap:focus-within{border-color:#e8a0b4;box-shadow:0 4px 0 -2px rgba(232,160,180,.25);}
.search-field-icon{position:absolute;left:0;top:50%;transform:translateY(-50%);color:#e8a0b4;pointer-events:none;display:flex;align-items:center;}
.search-field{background:transparent;border:none;font-size:clamp(22px,5vw,32px);font-family:'Cormorant Garamond',serif;padding:10px 48px 10px 36px;width:100%;color:#111111;letter-spacing:-0.01em;min-height:44px;}
.search-field:focus{outline:none;}
.search-close-btn{position:absolute;right:0;top:50%;transform:translateY(-50%);background:#fafafa;border:1px solid #e8e8e8;color:#111111;cursor:pointer;font-size:16px;font-family:'Raleway',sans-serif!important;font-weight:600;width:40px;height:40px;display:flex;align-items:center;justify-content:center;transition:all .2s;}
.search-close-btn:hover{border-color:#e8a0b4;color:#e8a0b4;background:#fce8ee;}
.search-result-row{display:flex;align-items:center;gap:16px;padding:14px 16px;background:#ffffff;border:1px solid #e8e8e8;cursor:pointer;transition:all .22s;margin-bottom:10px;border-left:3px solid transparent;}
.search-result-row:hover{background:#fafafa;border-color:#e8a0b4;border-left-color:#e8a0b4;transform:translateX(4px);box-shadow:0 4px 16px rgba(232,160,180,.12);}
.search-cat-tile{background:#fafafa;border:1px solid #e8e8e8;padding:22px 18px;text-align:center;cursor:pointer;transition:all .22s;border-top:2px solid transparent;}
.search-cat-tile:hover{border-color:#e8a0b4;border-top-color:#e8a0b4;background:#ffffff;transform:translateY(-2px);box-shadow:0 6px 20px rgba(232,160,180,.1);}
@media(max-width:540px){.search-panel{padding:24px 16px 20px;}.search-result-row{gap:12px;padding:12px;}.search-result-row img,.search-result-row>div:first-child{width:52px!important;height:64px!important;}}
.grid-products{display:grid;grid-template-columns:repeat(4, 1fr);gap:16px;}
.grid-products-compact{display:grid;grid-template-columns:repeat(4, 1fr);gap:16px;}
.hero-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;}
.feature-grid{display:grid;grid-template-columns:repeat(3, 1fr);gap:24px;}
.trust-strip{display:flex;flex-wrap:wrap;justify-content:center;gap:24px 40px;padding:20px 24px;background:#fafafa;border-top:1px solid #e8e8e8;border-bottom:1px solid #e8e8e8;}
.section-pad{padding:72px 20px;max-width:1400px;margin:0 auto;}
.section-label{font-family:'Raleway',sans-serif;font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:#e8a0b4;margin-bottom:12px;}
@media(max-width:1150px){
.grid-products{grid-template-columns:repeat(3, 1fr);gap:16px;}
.grid-products-compact{grid-template-columns:repeat(3, 1fr);gap:16px;}
}
@media(max-width:820px){
.grid-products{grid-template-columns:repeat(2, 1fr);gap:12px;}
.grid-products-compact{grid-template-columns:repeat(2, 1fr);gap:12px;}
}
@media(max-width:540px){.grid-products{grid-template-columns:1fr 1fr!important;gap:12px!important;} .grid-products-compact{grid-template-columns:1fr 1fr!important;gap:12px!important;} .card-detail-panel{padding:10px 8px;max-height:84px;} .product-card:hover .card-detail-panel{max-height:300px;} .card-title-row{flex-direction:column;align-items:flex-start;gap:4px;} .card-title{font-size:14px;white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;} .qty-ctrl{width:28px;height:28px;font-size:16px;} .rose-btn{padding:10px 14px;font-size:9px;} .section-pad{padding:40px 12px!important;}}
@media(max-width:900px){.hero-grid{grid-template-columns:1fr;gap:32px;} .feature-grid{grid-template-columns:1fr;}}
.hero-section-content{max-width:720px;}
.product-modal{height:600px;max-height:90vh;overflow:hidden;display:grid;grid-template-columns:1fr 1fr;}
.product-modal-image{position:relative;height:100%;min-height:300px;max-height:90vh;overflow:hidden;background:#fafafa;}
.product-modal-image img{width:100%;height:100%;object-fit:cover;display:block;}
.product-modal-content{overflow-y:auto;max-height:90vh;padding:32px 40px;display:flex;flex-direction:column;}
@media(max-width:640px){.product-modal{grid-template-columns:1fr;height:auto;max-height:90vh;}.product-modal-image{height:220px;min-height:220px;max-height:40vh;}.product-modal-image img{height:220px;min-height:220px;max-height:40vh;object-fit:cover;display:block;}.product-modal-content{max-height:50vh;padding:24px 20px;}}
.stats-grid{display:grid;grid-template-columns:repeat(3, 1fr);gap:12px;}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
@media(max-width:768px){.stats-grid{grid-template-columns:repeat(2, 1fr)!important;} .desktop-nav{display:none!important;} .mobile-menu-btn{display:flex!important;} .two-col{grid-template-columns:1fr!important;}}
@media(max-width:480px){.stats-grid{grid-template-columns:1fr 1fr!important;} .order-row{flex-direction:column;align-items:flex-start!important;} nav{padding:0 12px!important;height:60px!important;} .store-logo{font-size:18px!important;letter-spacing:.12em!important;}}
@media(max-width:768px){.order-status-checks{width:100%;justify-content:flex-start!important;}}
@media(min-width:769px){.mobile-menu-btn{display:none!important;}}
.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none;}.no-scrollbar::-webkit-scrollbar{display:none;}
.tnav-btn{width:44px;height:44px;border:1px solid #e8e8e8;background:#ffffff;color:#666666;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .25s;flex-shrink:0;}
.tnav-btn:hover{border-color:#e8a0b4;color:#e8a0b4;background:#fce8ee;}
@keyframes slideDown{from{transform:translateY(-100%);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes slideInRight{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes slideUp{from{transform:translateY(150%);opacity:0}to{transform:translateY(0);opacity:1}}
.desktop-admin-title{display:inline;}
.mobile-admin-title{display:none;}
@media(max-width:600px){
.desktop-admin-title{display:none;}
.mobile-admin-title{display:inline;}
}
.store-logo-img{height:44px;width:auto;display:block;mix-blend-mode:multiply;}
@media(max-width:480px){
  .store-logo-img{height:34px;}
}

/* ─── PROGRESS STEPPER ─── */
.stepper-container {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
  margin: 32px 0;
  width: 100%;
}
.stepper-line {
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  height: 2px;
  background: #e5e7eb;
  z-index: 1;
}
.stepper-line-progress {
  position: absolute;
  top: 16px;
  left: 16px;
  height: 2px;
  background: #22c55e;
  z-index: 2;
  transition: width 0.4s ease;
}
.stepper-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 3;
  flex: 1;
  position: relative;
  min-width: 0;
}
.stepper-dot {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 50%;
  background: #ffffff;
  border: 2px solid #d1d5db;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Raleway', sans-serif;
  font-weight: 700;
  font-size: 11px;
  color: #9ca3af;
  transition: all 0.3s ease;
}
.stepper-dot.active {
  border-color: #22c55e;
  background: #ffffff;
  color: #22c55e;
  box-shadow: 0 0 10px rgba(34,197,94,0.35);
}
.stepper-dot.completed {
  border-color: #22c55e;
  background: #22c55e;
  color: #ffffff;
}
.stepper-label {
  font-family: 'Raleway', sans-serif;
  font-size: 10px;
  font-weight: 600;
  margin-top: 8px;
  min-height: 16px;
  text-align: center;
  color: #6b7280;
  letter-spacing: .05em;
  text-transform: uppercase;
  line-height: 1.3;
  word-break: break-word;
  max-width: 80px;
}
.stepper-label.active  { color: #22c55e; font-weight: 700; }
.stepper-label.completed { color: #111111; }
.stepper-timestamp {
  font-family: 'Raleway', sans-serif;
  font-size: 8px;
  color: #6b7280;
  margin-top: 3px;
  min-height: 12px;
  text-align: center;
  letter-spacing: .02em;
}
@media (max-width: 500px) {
  .stepper-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
    padding-left: 20px;
  }
  .stepper-line {
    top: 0; bottom: 0;
    left: 15px; right: auto;
    width: 2px; height: 100%;
  }
  .stepper-line-progress {
    top: 0; left: 15px;
    width: 2px; height: 0%;
    transition: height 0.4s ease;
  }
  .stepper-step {
    flex-direction: row;
    align-items: center;
    gap: 16px;
    width: 100%;
  }
  .stepper-label, .stepper-timestamp { text-align: left; margin-top: 0; }
  .stepper-label { font-size: 11px; max-width: unset; }
}

/* ─── MODAL OVERLAY ─── */
.admin-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}
.admin-modal-content {
  background: #ffffff;
  border: 1px solid #e8a0b4;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  animation: slideDown 0.3s ease-out;
}
`;

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [route, setRoute] = useState(() => window.location.pathname);
  useEffect(() => {
    const h = () => setRoute(window.location.pathname);
    window.addEventListener("popstate", h);
    const updateHead = () => {
      document.title = STORE_NAME;
      let link = document.querySelector("link[rel='icon']");
      if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
      link.type = "image/png"; link.href = window.location.origin + "/favicon.png";
    };
    updateHead();
    const int = setInterval(updateHead, 2500);
    return () => { window.removeEventListener("popstate", h); clearInterval(int); };
  }, []);

  const { products, allFlat, addProduct, updateProduct, deleteProduct, decrementStock, bulkUpdatePromos, loaded, syncing } = useProducts();
  const { orders, activeOrders, logOrders, addOrder, updateOrderStatus, updateOrderFields, deleteOrder } = useOrders();
  const [testimonials, setTestimonials] = useTestimonials();
  const [simulatedEnabled, setSimulatedEnabled] = useLocalStorage("slay_social_simulated", true);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [copied, setCopied] = useState(false);
  const [trackOrderId, setTrackOrderId] = useState("");

  const handleOrderPlaced = useCallback((res) => {
    if (res.items) decrementStock(res.items);
    setOrderSuccess({ id: res.id, code: res.code });
    setTimeout(() => setOrderSuccess(null), 6000);
  }, [decrementStock]);

  const stats = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
    const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0).getTime();
    const confirmed  = orders.filter(o => o.status.payment);
    const confirmedRev = confirmed.reduce((s, o) => s + o.total, 0);
    const pendingRev   = orders.filter(o => !o.status.payment).reduce((s, o) => s + o.total, 0);
    const curMonthRev  = confirmed.filter(o => o.timestamp >= startOfMonth).reduce((s, o) => s + o.total, 0);
    const lastMonthRev = confirmed.filter(o => o.timestamp >= lastMonthStart && o.timestamp <= lastMonthEnd).reduce((s, o) => s + o.total, 0);
    const custMap = {};
    orders.forEach(o => { const k = o.customer?.phone || o.customer?.name; if (k) custMap[k] = (custMap[k] || 0) + 1; });
    const repeatCust = Object.values(custMap).filter(v => v > 1).length;
    const totalCust  = Object.keys(custMap).length;
    const totalO = orders.length || 1;
    const sPct = {
      unpaid:     (orders.filter(o => !o.status.payment).length / totalO * 100).toFixed(0),
      packing:    (orders.filter(o => o.status.payment && !o.status.packaged).length / totalO * 100).toFixed(0),
      delivering: (orders.filter(o => o.status.packaged && !o.status.delivered).length / totalO * 100).toFixed(0),
      fulfilled:  (orders.filter(o => o.status.delivered).length / totalO * 100).toFixed(0),
    };
    const pStats = {};
    orders.forEach(o => o.items?.forEach(i => {
      if (!pStats[i.name]) pStats[i.name] = { qty: 0, rev: 0 };
      pStats[i.name].qty += i.qty;
      if (o.status.payment) pStats[i.name].rev += ((i.promoActive && i.promoPrice ? i.promoPrice : i.price) * i.qty);
    }));
    const prodRank = Object.entries(pStats).sort((a, b) => b[1].rev - a[1].rev).slice(0, 10);
    const aov = confirmed.length ? Math.round(confirmedRev / confirmed.length) : 0;
    const lowStockItems = allFlat.filter(p => (Number(p.stock) || 0) <= (Number(p.lowStockThreshold) || 3)).length;
    const totalItems = allFlat.length;
    const awaitingDelivery = orders.filter(o => !o.status.delivered && o.status.packaged).sort((a, b) => a.timestamp - b.timestamp);
    return { confirmedRev, pendingRev, curMonthRev, lastMonthRev, repeatCust, totalCust, sPct, prodRank, aov, lowStockItems, totalItems, awaitingDelivery };
  }, [orders, allFlat]);

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", color: "#111111", fontFamily: "'Cormorant Garamond','Georgia',serif" }}>
      <style>{CSS}</style>
      {orderSuccess && (
        <div className="success-bar fade-in" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, padding: "12px 24px", flexWrap: "wrap", textAlign: "center", position: "sticky", top: 0, zIndex: 1000 }}>
          <p style={{ fontSize: 13, margin: 0, letterSpacing: ".01em", fontFamily: "'Raleway',sans-serif", fontWeight: 600, lineHeight: 1.4 }}>
            Order confirmed! ID: <strong>{orderSuccess.id}</strong> · Code: <strong>{orderSuccess.code}</strong><br />
            <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.9 }}>We'll contact you shortly · {PHONE}</span>
          </p>
          <button onClick={() => { setTrackOrderId(orderSuccess.id); setOrderSuccess(null); }}
            style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, background: "rgba(0,0,0,0.2)", color: "#000000", border: "1px solid rgba(0,0,0,0.15)", padding: "6px 14px", cursor: "pointer", fontWeight: "bold", textTransform: "uppercase", letterSpacing: ".1em", transition: "all .2s", borderRadius: "4px" }}>
            Track Order
          </button>
          <button onClick={() => { navigator.clipboard.writeText("Order ID: " + orderSuccess.id + " | Code: " + orderSuccess.code).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2500); }}
            style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, background: copied ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.3)", color: "#000000", border: "1px solid rgba(0,0,0,0.15)", padding: "6px 14px", cursor: "pointer", fontWeight: "bold", textTransform: "uppercase", letterSpacing: ".1em", transition: "all .2s", borderRadius: "4px" }}>
            {copied ? "Copied" : "Copy"}
          </button>
          <button onClick={() => setOrderSuccess(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#000000", opacity: 0.5, padding: "0 8px" }}>×</button>
        </div>
      )}
      {route === "/slay-staff-dashboard"
        ? <AdminApp products={products} allFlat={allFlat} addProduct={addProduct} updateProduct={updateProduct} deleteProduct={deleteProduct} bulkUpdatePromos={bulkUpdatePromos}
            orders={activeOrders} logOrders={logOrders} updateOrderStatus={updateOrderStatus} updateOrderFields={updateOrderFields} deleteOrder={deleteOrder} loaded={loaded} syncing={syncing}
            addOrder={addOrder} testimonials={testimonials} setTestimonials={setTestimonials}
            stats={stats} simulatedEnabled={simulatedEnabled} setSimulatedEnabled={setSimulatedEnabled}
            onOrderPlaced={handleOrderPlaced} />
        : <StorefrontApp products={products} allFlat={allFlat} orders={orders} addOrder={addOrder}
            decrementStock={decrementStock} testimonials={testimonials}
            simulatedEnabled={simulatedEnabled} onOrderPlaced={handleOrderPlaced}
            trackOrderId={trackOrderId} setTrackOrderId={setTrackOrderId} />
      }
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STOREFRONT
// ═══════════════════════════════════════════════════════════════════════════════
function StorefrontApp({ products, allFlat, orders, addOrder, decrementStock, testimonials, simulatedEnabled, onOrderPlaced, trackOrderId, setTrackOrderId }) {
  const [page, setPage] = useState("home");
  const prevPage = useRef("home");
  const [activeCat, setActiveCat] = useState("skincare");
  const [cart, setCart] = useState(() => { try { const s = localStorage.getItem(SK_CART); return s ? JSON.parse(s) : []; } catch { return []; } });
  const [showCart, setShowCart] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [hidePromo, setHidePromo] = useState(false);

  useEffect(() => {
    if (trackOrderId) {
      setPage("track");
      window.scrollTo(0, 0);
    }
  }, [trackOrderId]);
  const hasPromo = useMemo(() => Object.values(products).flat().some(p => p.promoActive && p.promoPrice), [products]);
  const addToCart = useCallback((product, qty = 1) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === product.id);
      if (ex) {
        const nq = ex.qty + qty;
        if (nq > product.stock) { alert("Only " + product.stock + " items left."); return prev.map(i => i.id === product.id ? { ...i, qty: product.stock } : i); }
        return prev.map(i => i.id === product.id ? { ...i, qty: nq } : i);
      }
      if (qty > product.stock) { alert("Only " + product.stock + " items left."); return [...prev, { ...product, qty: product.stock }]; }
      return [...prev, { ...product, qty }];
    });
  }, []);
  const updateCartQty = useCallback((id, qty) => {
    if (qty < 1) { setCart(prev => prev.filter(i => i.id !== id)); return; }
    setCart(prev => prev.map(i => { if (i.id === id) { const p = Object.values(products).flat().find(x => x.id === id); const s = p ? p.stock : 0; if (qty > s) { alert("Only " + s + " left."); return { ...i, qty: s }; } return { ...i, qty }; } return i; }));
  }, [products]);
  const removeFromCart = useCallback((id) => setCart(prev => prev.filter(i => i.id !== id)), []);
  const cartTotal = useMemo(() => cart.reduce((s, i) => s + (i.promoActive && i.promoPrice ? i.promoPrice : i.price) * i.qty, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);
  useEffect(() => { try { localStorage.setItem(SK_CART, JSON.stringify(cart)); } catch {} }, [cart]);
  const clearCart = useCallback(() => { setCart([]); localStorage.removeItem(SK_CART); }, []);
  const handleOrderPlacedInternal = (res) => { clearCart(); setShowCart(false); if (onOrderPlaced) onOrderPlaced({ ...res, items: cart }); };
  const nav = (p) => { if (p !== page) prevPage.current = page; setPage(p); setMobileMenu(false); window.scrollTo(0, 0); };

  return (
    <>
      {showSearch && (
        <SearchOverlay products={products} onClose={() => setShowSearch(false)} onSelect={(p, isSpecific) => {
          if (isSpecific) { setSelectedProduct(p); } else {
            const raw = (p.category || "").toLowerCase();
            const target = raw.includes("wellness") ? "wellness" : raw.includes("bundle") ? "bundles" : "skincare";
            setActiveCat(target); setPage("shop");
          }
          setShowSearch(false);
        }} />
      )}
      {!hidePromo && hasPromo && (() => {
        const promoProducts = Object.values(products).flat().filter(p => p.promoActive && p.promoPrice);
        const pct = promoProducts.length > 0 ? Math.round((1 - promoProducts[0].promoPrice / (promoProducts[0].originalPrice || promoProducts[0].price)) * 100) : 0;
        const names = promoProducts.map(p => p.name).join(" · ");
        return (
          <div className="promo-banner fade-in" style={{ display: "flex", justifyContent: "center", alignItems: "center", position: "relative", flexWrap: "wrap", gap: 8, padding: "14px 40px 14px 16px" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, textAlign: "center" }}>
              <Icon name="bag" size={14} color="#111111" />
              {promoProducts.length === 1
                ? <>🎉 <strong>{pct}% OFF</strong> — {names}</>  
                : promoProducts.every(p => Math.round((1 - p.promoPrice / (p.originalPrice || p.price)) * 100) === pct)
                  ? <><strong>{pct}% OFF</strong> selected items — {names}</>
                  : <>🔥 Sale on: {names}</>}
            </span>
            <button onClick={() => setHidePromo(true)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#000000", fontWeight: "bold", position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          </div>
        );
      })()}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(255,255,255,.97)", borderBottom: "1px solid #e8e8e8", boxShadow: "0 1px 12px rgba(0,0,0,.04)", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 68 }}>
        <span className="store-logo" onClick={() => nav("home")} style={{ cursor: "pointer", display: "inline-flex", alignItems: "center" }}>
          <img src="/logo.jpg" className="store-logo-img" alt="Hajia Slay Empire" />
        </span>
        <div className="desktop-nav" style={{ display: "flex", gap: 28 }}>
          {["home", "shop", "about", "track"].map(p => (
            <button key={p} className={"nav-link " + (page === p ? "active" : "")} onClick={() => nav(p)}>{p === "track" ? "Track Order" : p.charAt(0).toUpperCase() + p.slice(1)}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => setShowSearch(true)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", minWidth: 44, minHeight: 44, padding: "10px", color: "#111111" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.2"/><path d="M15.5 15.5L21 21" stroke="currentColor" strokeWidth="1.2" strokeLinecap="square"/></svg>
          </button>
          <button onClick={() => setShowCart(true)} style={{ background: "none", border: "none", cursor: "pointer", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", minWidth: 44, minHeight: 44, padding: "10px", color: "#111111" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            {cartCount > 0 && <span key={cartCount} className="badge-pop" style={{ position: "absolute", top: 4, right: 4, background: "#e8a0b4", color: "#000000", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, fontFamily: "'Raleway',sans-serif" }}>{cartCount}</span>}
          </button>
          <button className="mobile-menu-btn" style={{ display: "none", background: "none", border: "none", color: "#111111", cursor: "pointer", minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" }} onClick={() => setMobileMenu(!mobileMenu)} aria-label="Menu"><Icon name="menu" size={22} color="#111111" /></button>
        </div>
      </nav>
      {mobileMenu && (
        <>
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 48 }} onClick={() => setMobileMenu(false)} />
          <div style={{ position: "fixed", top: 68, left: 0, right: 0, background: "#ffffff", borderBottom: "1px solid #e8e8e8", padding: "24px 16px", display: "flex", flexDirection: "column", gap: 24, zIndex: 49, animation: "fadeIn 0.3s ease-out", boxShadow: "0 8px 24px rgba(0,0,0,.06)" }}>
            {["home", "shop", "about", "track", "privacy"].map(p => (
              <button key={p} className="nav-link" style={{ textAlign: "left", fontSize: 14 }} onClick={() => nav(p)}>{p === "track" ? "Track Order" : p.charAt(0).toUpperCase() + p.slice(1)}</button>
            ))}
          </div>
        </>
      )}
      {page === "home"    && <HomePage setPage={nav} setActiveCat={setActiveCat} products={products} addToCart={addToCart} cart={cart} testimonials={testimonials} onSelectProduct={setSelectedProduct} />}
      {page === "shop"    && <ShopPage products={products} activeCat={activeCat} setActiveCat={setActiveCat} addToCart={addToCart} cart={cart} onSelectProduct={setSelectedProduct} />}
      {page === "about"   && <AboutPage />}
      {page === "faq"     && <FaqPage setPage={nav} />}
      {page === "privacy" && <PrivacyPage />}
      {page === "terms"   && <TermsPage onBack={() => nav(prevPage.current || "home")} />}
      {page === "track"   && <OrderTracking orders={orders} trackOrderId={trackOrderId} />}
      <SiteFooter setPage={nav} />
      {showCart && (
        <>
          <div className="drawer-overlay" onClick={() => setShowCart(false)} />
          <CartDrawer cart={cart} updateCartQty={updateCartQty} removeFromCart={removeFromCart} cartTotal={cartTotal} onClose={() => setShowCart(false)} addOrder={addOrder} onOrderPlaced={handleOrderPlacedInternal} products={products} />
        </>
      )}
      {selectedProduct && <ProductModal p={selectedProduct} onClose={() => setSelectedProduct(null)} addToCart={addToCart} cart={cart} />}
      <SocialProof products={products} orders={orders} simulatedEnabled={simulatedEnabled} testimonials={testimonials} />
    </>
  );
}

function HomePage({ setPage, setActiveCat, products, addToCart, cart, testimonials, onSelectProduct }) {
  const [localQtys, setLocalQtys] = useState({});
  const qty = (id) => localQtys[id] ?? 1;
  const setQty = (id, v) => setLocalQtys(prev => ({ ...prev, [id]: Math.max(1, v) }));
  const bestsellers = useMemo(() => Object.values(products).flat().filter(p => p.bestseller).slice(0, 4), [products]);
  const trending    = useMemo(() => {
    const shown = new Set(bestsellers.map(p => p.id));
    return Object.values(products).flat().filter(p => p.isTrending && !shown.has(p.id)).slice(0, 4);
  }, [products, bestsellers]);
  const reviewList  = testimonials.length > 0 ? testimonials : DEFAULT_TESTIMONIALS;
  const heroPromo = useMemo(() => {
    const flat = Object.values(products).flat();
    const promoProducts = flat.filter(p => p.promoActive && p.promoPrice);
    if (promoProducts.length === 0) return null;
    let maxPct = 0;
    promoProducts.forEach(p => {
      const orig = p.originalPrice || p.price;
      if (orig > 0) {
        const pct = Math.round((1 - p.promoPrice / orig) * 100);
        if (pct > maxPct) maxPct = pct;
      }
    });
    return {
      pct: maxPct,
      names: promoProducts.map(p => p.name).slice(0, 3).join(" & ") + (promoProducts.length > 3 ? "..." : "")
    };
  }, [products]);

  return (
      <div>
        <section className="section-pad hero-section" style={{ paddingTop: 120, paddingBottom: 140, maxWidth: "none", backgroundImage: `linear-gradient(rgba(255,255,255,0.35), rgba(255,255,255,0.25)), url('${HERO_BG}')`, backgroundSize: "cover", backgroundPosition: "center", borderBottom: "1px solid #e8e8e8" }}>
          <div className="hero-section-content" style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px" }}>
            <p className="section-label">Best Cosmetics & Beauty Shop · {LOCATION}</p>
            {heroPromo ? (
              <>
                <h1 style={{ fontWeight: 300, lineHeight: 1.05, letterSpacing: "-.02em", marginBottom: 24, fontSize: "clamp(40px,7vw,72px)", textShadow: "0 2px 24px rgba(255,255,255,0.9)" }}>
                  Enjoy up to {heroPromo.pct}% off<br /><em style={{ fontStyle: "italic", color: "#e8a0b4" }}>our beauty range</em>
                </h1>
                <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 14, color: "#333333", lineHeight: 1.9, marginBottom: 32, maxWidth: 520, textShadow: "0 1px 12px rgba(255,255,255,0.85)" }}>
                  Grab special discounts of up to {heroPromo.pct}% off on selected items: {heroPromo.names}. Premium cosmetics, skincare, body wash and beauty essentials in Accra.
                </p>
              </>
            ) : (
              <>
                <h1 style={{ fontWeight: 300, lineHeight: 1.05, letterSpacing: "-.02em", marginBottom: 24, fontSize: "clamp(40px,7vw,72px)", textShadow: "0 2px 24px rgba(255,255,255,0.9)" }}>
                  Your Ultimate<br /><em style={{ fontStyle: "italic", color: "#e8a0b4" }}>beauty destination</em>
                </h1>
                <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 14, color: "#333333", lineHeight: 1.9, marginBottom: 32, maxWidth: 520, textShadow: "0 1px 12px rgba(255,255,255,0.85)" }}>
                  Discover authentic premium cosmetics, skincare, body wash and beauty essentials in Accra. Handpicked products for the ultimate self-care routine.
                </p>
              </>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <button className="rose-btn" onClick={() => setPage("shop")}>Shop Now</button>
              <a href={MAPS_URL} target="_blank" rel="noreferrer" className="ghost-btn">Get Directions ({LOCATION})</a>
            </div>
          </div>
        </section>

      <div className="trust-strip">
        {TRUST_BULLETS.map(t => (
          <TrustBullet key={t.text} item={t} />
        ))}
      </div>

      {bestsellers.length > 0 && (
        <section className="section-pad">
          <p className="section-label">Best Sellers</p>
          <h2 style={{ fontSize: "clamp(28px,5vw,48px)", fontWeight: 300, marginBottom: 12 }}>Top selling products</h2>
          <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 13, color: "#888888", marginBottom: 40, maxWidth: 480 }}>Popular customer favourites from our trusted beauty collection.</p>
          <div className="grid-products-compact">
            {bestsellers.map((p, i) => <ProductCard key={p.id} p={p} index={i} activeCat={p.category} addToCart={addToCart} cart={cart} qty={qty} setQty={setQty} onClick={() => onSelectProduct(p)} />)}
          </div>
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <button className="ghost-btn" onClick={() => setPage("shop")}>View All Products</button>
          </div>
        </section>
      )}

      <section className="section-pad" style={{ background: "#fafafa", maxWidth: "none", borderTop: "1px solid #e8e8e8", borderBottom: "1px solid #e8e8e8" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <p className="section-label">Why choose us</p>
          <h2 style={{ fontSize: "clamp(28px,5vw,48px)", fontWeight: 300, marginBottom: 40 }}>Trusted products, real results</h2>
          <div className="feature-grid">
            {WHY_CHOOSE_US.map(f => (
              <div key={f.title} style={{ background: "#ffffff", border: "1px solid #e8e8e8", padding: "32px 28px", borderTop: "3px solid #e8a0b4" }}>
                <h3 style={{ fontSize: 20, fontWeight: 400, marginBottom: 12 }}>{f.title}</h3>
                <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 12, color: "#666666", lineHeight: 1.8 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {trending.length > 0 && (
        <section className="section-pad">
          <p className="section-label">In the spotlight</p>
          <h2 style={{ fontSize: "clamp(28px,5vw,48px)", fontWeight: 300, marginBottom: 40 }}>Trending now</h2>
          <div className="grid-products-compact">
            {trending.map((p, i) => <ProductCard key={p.id} p={p} index={i} activeCat={p.category} addToCart={addToCart} cart={cart} qty={qty} setQty={setQty} onClick={() => onSelectProduct(p)} />)}
          </div>
        </section>
      )}

      <TestimonialSection testimonials={reviewList} />

      <section className="section-pad" style={{ background: "#fafafa", maxWidth: "none", borderTop: "1px solid #e8e8e8", borderBottom: "1px solid #e8e8e8" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
          <p className="section-label">Community</p>
          <h2 style={{ fontSize: "clamp(24px,4vw,36px)", fontWeight: 300, marginBottom: 12 }}>Follow our beauty looks on TikTok</h2>
          <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 13, color: "#666666", lineHeight: 1.8, marginBottom: 28 }}>
            See product demos, customer transformations, and new arrivals.
          </p>
          <a href={TIKTOK} target="_blank" rel="noreferrer" className="rose-btn" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Icon name="tiktok" size={16} color="#000000" /> Visit TikTok</a>
        </div>
      </section>

      <section className="section-pad">
        <p className="section-label">Shop by category</p>
        <h2 style={{ fontSize: "clamp(28px,5vw,48px)", fontWeight: 300, marginBottom: 32 }}>Find your routine</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 20 }}>
          {[
            { key: "skincare", label: "Skincare", desc: "Cleansers · Serums · Moisturisers · Sunscreen", icon: "skincare" },
            { key: "wellness", label: "Wellness", desc: "Supplements · Intimate Care · Period Support", icon: "wellness" },
            { key: "bundles", label: "Bundles & Sets", desc: "Starter Kits · Glow Kits · Gift Sets", icon: "bundle" },
          ].map(c => (
            <div key={c.key} onClick={() => { setActiveCat(c.key); setPage("shop"); }}
              style={{ background: "#ffffff", padding: "36px 28px", cursor: "pointer", border: "1px solid #e8e8e8", borderTop: "3px solid #e8a0b4", transition: "all .25s" }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 28px rgba(232,160,180,.12)"; e.currentTarget.style.borderColor = "#e8a0b4"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "#e8e8e8"; e.currentTarget.style.borderTopColor = "#e8a0b4"; }}>
              <span style={{ display: "block", marginBottom: 12 }}><Icon name={c.icon} size={24} color="#e8a0b4" /></span>
              <h3 style={{ fontSize: 24, fontWeight: 300, marginBottom: 8 }}>{c.label}</h3>
              <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 11, color: "#666666", letterSpacing: ".06em", lineHeight: 1.6 }}>{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: "#e8a0b4", padding: "56px 24px", textAlign: "center" }}>
        <h2 style={{ fontSize: "clamp(24px,4vw,40px)", fontWeight: 300, color: "#000000", marginBottom: 16 }}>Ready to upgrade your beauty routine?</h2>
        <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 13, color: "rgba(0,0,0,.7)", marginBottom: 28 }}>Shop online now and enjoy 50% off every product.</p>
        <button className="rose-btn" style={{ background: "#000000", color: "#ffffff", borderColor: "#000000" }} onClick={() => setPage("shop")}>Shop Products</button>
      </section>
    </div>
  );
}

function ShopPage({ products, activeCat, setActiveCat, addToCart, cart, onSelectProduct }) {
  const [filter, setFilter] = useState("all");
  const [localQtys, setLocalQtys] = useState({});
  useEffect(() => setFilter("all"), [activeCat]);
  const rawList = products[activeCat] || [];
  const filtered = useMemo(() => applyFilter(rawList, filter), [rawList, filter]);
  const pills = useMemo(() => buildPills(activeCat), [activeCat]);
  const qty = (id) => localQtys[id] ?? 1;
  const setQty = (id, v) => setLocalQtys(prev => ({ ...prev, [id]: Math.max(1, v) }));
  const handleAdd = (p) => { addToCart(p, qty(p.id)); setLocalQtys(prev => ({ ...prev, [p.id]: 1 })); };
  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "40px 12px" }}>
      <div style={{ marginBottom: 32 }}>
        <p className="section-label">Shop</p>
        <TypewriterTitle text="The Essentials" style={{ fontWeight: 300, marginBottom: 22, fontSize: "clamp(28px,5vw,48px)", minHeight: "1.2em" }} />
        <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 13, color: "#888888", maxWidth: 480, marginBottom: 8 }}>Browse skincare, wellness, and curated bundles.</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 2, flexWrap: "wrap", marginBottom: 14 }}>
          {Object.keys(CAT_LABELS).map(cat => (
            <button key={cat} className={"cat-tab " + (activeCat === cat ? "active" : "")} onClick={() => setActiveCat(cat)}>{CAT_LABELS[cat]}</button>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
          {pills.map(pill => (
            <button key={pill.key} onClick={() => setFilter(pill.key)} style={{ fontFamily: "'Raleway',sans-serif", fontSize: 9, letterSpacing: ".15em", textTransform: "uppercase", padding: "6px 16px", border: "1px solid " + (filter === pill.key ? "#e8a0b4" : "#222222"), background: filter === pill.key ? "#e8a0b422" : "transparent", color: filter === pill.key ? "#e8a0b4" : "#666666", cursor: "pointer", transition: "all .2s", minHeight: 32 }}>
              {pill.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid-products">
        {filtered.map((p, i) => <ProductCard key={p.id} p={p} index={i} activeCat={activeCat} addToCart={handleAdd} cart={cart} qty={qty} setQty={setQty} onClick={() => onSelectProduct(p)} />)}
      </div>
      <div style={{ marginTop: 32, padding: "14px 18px", background: "#fce8ee", border: "1px solid #e8a0b444", display: "flex", gap: 10, alignItems: "center" }}>
        <Icon name="sparkle" size={14} color="#e8a0b4" />
        <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 11, color: "#666666", letterSpacing: ".08em" }}>{DELIVERY_NOTE} · {PHONE}</p>
      </div>
    </div>
  );
}

function ProductCard({ p, index, activeCat, addToCart, cart, qty, setQty, onClick }) {
  const oos      = p.stock === 0;
  const onlyOne  = p.stock === 1;
  const low      = p.stock > 1 && p.stock <= p.lowStockThreshold;
  const showPromo = p.promoActive && p.promoPrice;
  const dispPrice = showPromo ? p.promoPrice : p.price;
  const discPct   = showPromo ? Math.round((1 - p.promoPrice / p.originalPrice) * 100) : 0;
  const currentQty = qty(p.id);
  const inCart   = cart.find(c => c.id === p.id);
  const qtyInCart = inCart ? inCart.qty : 0;
  const trulyOos  = p.stock - qtyInCart <= 0;
  const accent    = ACCENT_MAP[activeCat] || "#e8a0b4";
  const hasSecondary = !!(p.secondaryImage && p.secondaryImage !== p.image);
  return (
    <div className={"product-card fade-in" + (oos ? " oos" : "") + (hasSecondary ? " has-secondary" : "")} style={{ animationDelay: (index * 0.06) + "s" }} onClick={onClick}>
      <div className="card-img-container" style={{ background: BG_MAP[activeCat] }}>
        {p.image && <img className="card-img primary" src={p.image} alt={p.name} />}
        {hasSecondary && <img className="card-img secondary" src={p.secondaryImage} alt={p.name + " detail"} />}
        {!p.image && <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><CatIcon category={activeCat} size={64} color={accent} opacity={0.14} /></div>}
      </div>
      <div className="card-hover-overlay" />
      <div style={{ position: "absolute", top: 12, left: 12, zIndex: 3 }}>
        <span style={{ fontFamily: "'Raleway',sans-serif", fontSize: 9, letterSpacing: ".2em", color: "#111111", background: "rgba(255,255,255,.92)", padding: "2px 8px", border: "1px solid #e8e8e8" }}>{p.id}</span>
      </div>
      <div style={{ position: "absolute", top: 12, right: 12, zIndex: 3, display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
        {p.bestseller && <span className="tag tag-rose">Bestseller</span>}
        {showPromo && <span className="tag" style={{ background: "#e8a0b4", color: "#000000" }}>PROMO</span>}
        {showPromo && <span className="tag tag-red">&#8722;{discPct}%</span>}
        {oos     && <span className="tag tag-red">Out of Stock</span>}
        {onlyOne && !oos && <span className="tag tag-rose">Only 1 Left</span>}
        {low     && <span className="tag tag-amber">Low Stock</span>}
      </div>
      <div className="card-detail-panel">
        <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, color: accent, letterSpacing: ".25em", textTransform: "uppercase", marginBottom: 6 }}>{p.brand}</p>
        <div className="card-title-row">
          <h3 className="card-title">{p.name}</h3>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            {showPromo && <p style={{ fontSize: 13, color: "#e8a0b4", textDecoration: "line-through", margin: "0 0 2px", opacity: 0.8 }}>{GHS(p.originalPrice)}</p>}
            <p style={{ fontSize: 17, color: "#e8a0b4", margin: 0, fontWeight: 300 }}>{GHS(dispPrice)}</p>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <button className="qty-ctrl" onClick={e => { e.stopPropagation(); setQty(p.id, currentQty - 1); }} disabled={currentQty <= 1 || trulyOos}>-</button>
            <span style={{ fontFamily: "'Raleway',sans-serif", fontSize: 13, color: "#111111" }}>{currentQty}</span>
            <button className="qty-ctrl" onClick={e => { e.stopPropagation(); setQty(p.id, currentQty + 1); }} disabled={currentQty >= (p.stock - qtyInCart) || trulyOos}>+</button>
          </div>
          <button className="rose-btn" style={{ width: "100%", padding: "14px" }} onClick={e => { e.stopPropagation(); addToCart(p, currentQty); }} disabled={trulyOos}>
            {trulyOos ? "OUT OF STOCK" : "ADD TO BAG"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CartDrawer({ cart, updateCartQty, removeFromCart, cartTotal, onClose, addOrder, onOrderPlaced, products, staffMode = false }) {
  const [step, setStep] = useState("cart");
  const [momoRef, setMomoRef] = useState("");
  const [payMethod, setPayMethod] = useState("paystack");
  const [paying, setPaying] = useState(false);
  const [returning, setReturning] = useState(false);
  const [details, setDetails] = useState({ name: "", phone: "", email: "", country: "Ghana", streetAddress: "", apartment: "", city: "", postalCode: "", notes: "" });
  const [errors, setErrors] = useState({});
  const allFlat = useMemo(() => Object.values(products).flat(), [products]);
  const set = (k, v) => setDetails(d => ({ ...d, [k]: v }));
  const checkReturning = () => {
    if (details.phone.length < 8) return;
    try {
      const stored = JSON.parse(localStorage.getItem(SK_ORDERS) || "[]");
      const prev = stored.find(o => o.customer?.phone === details.phone);
      if (prev) { setReturning(true); if (prev.customer.name && !details.name) set("name", prev.customer.name); if (prev.customer.email && !details.email) set("email", prev.customer.email); }
      else setReturning(false);
    } catch {}
  };
  const validate = () => {
    const e = {};
    if (!details.name.trim())          e.name          = "Required";
    if (!details.phone.trim())         e.phone         = "Required";
    if (!details.streetAddress.trim()) e.streetAddress = "Required";
    if (!details.city.trim())          e.city          = "Required";
    setErrors(e); return Object.keys(e).length === 0;
  };
  const buildOrderPayload = (paidViaPaystack, paystackRef = null) => {
    const frozenItems = cart.map(i => ({ ...i, price: i.promoActive && i.promoPrice ? i.promoPrice : i.price, promoActive: false, promoPrice: null }));
    // Automatically mark all orders as paid for now (momo/paystack/staff) until payment verification APIs are integrated
    const isPaid = true;
    return {
      customer: details,
      items: frozenItems,
      total: cartTotal,
      staffOrder: staffMode,
      paymentMethod: paidViaPaystack ? "paystack" : "momo",
      momoRef: paidViaPaystack ? null : (momoRef.trim() || null),
      paystackRef: paystackRef,
      status: isPaid
        ? { payment: true, packaged: false, dispatched: false, delivered: false }
        : { payment: false, packaged: false, dispatched: false, delivered: false },
    };
  };
  const placeOrder = async () => {
    if (!validate()) return;
    const res = await addOrder(buildOrderPayload(false));
    onOrderPlaced(res);
  };
  const payWithPaystack = async () => {
    if (!validate()) return;
    if (!PAYSTACK_KEY) { alert("Paystack is not configured yet. Add VITE_PAYSTACK_PUBLIC_KEY to your environment, or pay via Mobile Money."); return; }
    setPaying(true);
    try {
      await loadPaystackScript();
      openPaystackCheckout({
        email: details.email,
        phone: details.phone,
        name: details.name,
        amount: cartTotal,
        onSuccess: async (response) => {
          const res = await addOrder(buildOrderPayload(true, response.reference));
          setPaying(false);
          onOrderPlaced(res);
        },
        onClose: () => setPaying(false),
      });
    } catch {
      setPaying(false);
      alert("Could not load Paystack. Please try Mobile Money or refresh the page.");
    }
  };
  return (
    <div className="drawer">
      <div style={{ padding: "20px", borderBottom: "1px solid #e8e8e8", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 21, fontWeight: 300, letterSpacing: ".12em" }}>
          {staffMode ? "Staff Order" : step === "cart" ? "Your Bag" : "Delivery Details"}
        </span>
        <button
          onClick={onClose}
          aria-label="Close cart"
          style={{
            background: "none",
            border: "none",
            color: "#888888",
            cursor: "pointer",
            width: 44,
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
            borderRadius: "50%"
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = "#e8a0b4";
            e.currentTarget.style.transform = "rotate(90deg) scale(1.1)";
            e.currentTarget.style.background = "#fce8ee";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = "#888888";
            e.currentTarget.style.transform = "rotate(0deg) scale(1)";
            e.currentTarget.style.background = "none";
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="1" y1="1" x2="13" y2="13"></line>
            <line x1="1" y1="13" x2="13" y2="1"></line>
          </svg>
        </button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
        {step === "cart" && (
          cart.length === 0
            ? <div style={{ textAlign: "center", padding: "60px 0" }}><p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 12, color: "#666666", letterSpacing: ".15em" }}>Your bag is empty</p></div>
            : <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {cart.map(item => {
                const prod = allFlat.find(p => p.id === item.id);
                const disp = item.promoActive && item.promoPrice ? item.promoPrice : item.price;
                return (
                  <div key={item.id} style={{ display: "flex", gap: 12, padding: "14px 0", borderBottom: "1px solid #e8e8e8" }}>
                    <div style={{ width: 54, height: 54, flexShrink: 0, background: BG_MAP[item.category] || "#111111", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                      {item.image ? <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.style.display = "none"} /> : <CatIcon category={item.category} size={20} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 9, color: "#e8a0b4", letterSpacing: ".18em", marginBottom: 3 }}>{item.id}</p>
                      <p style={{ fontSize: 15, fontWeight: 400, marginBottom: 2 }}>{item.name}</p>
                      <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, color: "#666666" }}>{item.brand}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                        <button className="qty-ctrl" style={{ width: 28, height: 28, fontSize: 16 }} onClick={() => updateCartQty(item.id, item.qty - 1)}>-</button>
                        <span style={{ fontFamily: "'Raleway',sans-serif", fontSize: 13 }}>{item.qty}</span>
                        <button className="qty-ctrl" style={{ width: 28, height: 28, fontSize: 16 }} onClick={() => updateCartQty(item.id, item.qty + 1)} disabled={prod && item.qty >= prod.stock}>+</button>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "space-between", flexShrink: 0 }}>
                      <span style={{ fontFamily: "'Raleway',sans-serif", fontSize: 14 }}>{GHS(disp * item.qty)}</span>
                      <button onClick={() => removeFromCart(item.id)} style={{ background: "none", border: "none", color: "#e8a0b4", cursor: "pointer", fontFamily: "'Raleway',sans-serif", fontSize: 10, letterSpacing: ".08em", minHeight: 28, padding: "4px 0" }}>Remove</button>
                    </div>
                  </div>
                );
              })}
            </div>
        )}
        {step === "details" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {returning && <div style={{ background: "#fafafa", border: "1px solid #333333", padding: "10px 14px", fontFamily: "'Raleway',sans-serif", fontSize: 10, color: "#111111", letterSpacing: ".1em", display: "flex", alignItems: "center", gap: 6 }}><Icon name="check" size={12} color="#111111" /> Welcome back! We recognise your number.</div>}
            <Fld label="Full Name *" error={errors.name}><input value={details.name} onChange={e => set("name", e.target.value)} placeholder="Your full name" autoComplete="name" /></Fld>
            <Fld label="Phone Number *" error={errors.phone}><input value={details.phone} onChange={e => set("phone", e.target.value)} onBlur={checkReturning} placeholder="+233 XXXXXXXXX" autoComplete="tel" /></Fld>
            <Fld label="Street Address *" error={errors.streetAddress}><input value={details.streetAddress} onChange={e => set("streetAddress", e.target.value)} placeholder="Street name and number" autoComplete="street-address" /></Fld>
            <Fld label="Town / City *" error={errors.city}><input value={details.city} onChange={e => set("city", e.target.value)} placeholder="e.g. Accra" autoComplete="address-level2" /></Fld>
            <div className="two-col">
              <Fld label="Apartment / Unit (opt.)"><input value={details.apartment} onChange={e => set("apartment", e.target.value)} placeholder="Apt, Suite…" autoComplete="address-line2" /></Fld>
              <Fld label="Country"><select value={details.country} onChange={e => set("country", e.target.value)} autoComplete="country">{["Ghana", "Nigeria", "UK", "USA", "Other"].map(c => <option key={c}>{c}</option>)}</select></Fld>
            </div>
            <div className="two-col">
              <Fld label="Postal / Zip (opt.)"><input value={details.postalCode} onChange={e => set("postalCode", e.target.value)} placeholder="Optional" autoComplete="postal-code" /></Fld>
              <Fld label="Email (opt.)"><input type="email" value={details.email} onChange={e => set("email", e.target.value)} placeholder="you@example.com" autoComplete="email" /></Fld>
            </div>
            <Fld label="Order Notes (opt.)"><textarea rows={2} value={details.notes} onChange={e => set("notes", e.target.value)} placeholder="Special instructions…" autoComplete="off" style={{ resize: "vertical", minHeight: 80 }} /></Fld>
            <div style={{ background: "#fafafa", border: "1px solid #e8e8e8", padding: "16px" }}>
              <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, letterSpacing: ".18em", color: "#e8a0b4", marginBottom: 12 }}>PAYMENT METHOD</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                {[["paystack", "Paystack (MoMo / Card)"], ["momo", "Manual MoMo Transfer"]].map(([key, label]) => (
                  <button key={key} type="button" onClick={() => setPayMethod(key)} style={{ fontFamily: "'Raleway',sans-serif", fontSize: 9, letterSpacing: ".1em", textTransform: "uppercase", padding: "10px 14px", border: "1px solid " + (payMethod === key ? "#e8a0b4" : "#e8e8e8"), background: payMethod === key ? "#fce8ee" : "#ffffff", color: payMethod === key ? "#111111" : "#666666", cursor: "pointer", flex: "1 1 140px", minHeight: 44 }}>
                    {label}
                  </button>
                ))}
              </div>
              {payMethod === "paystack" ? (
                <div style={{ borderLeft: "2px solid #e8a0b4", paddingLeft: 14 }}>
                  <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 12, color: "#666666", lineHeight: 1.8 }}>
                    Pay securely with Mobile Money or card via Paystack.<br />
                    Amount: <strong style={{ color: "#e8a0b4" }}>{GHS(cartTotal)}</strong>
                  </p>
                  {!PAYSTACK_KEY && <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, color: "#e8a0b4", marginTop: 10 }}>Paystack key not set — use Manual MoMo or contact the shop.</p>}
                </div>
              ) : (
                <div style={{ borderLeft: "2px solid #e8a0b4", paddingLeft: 14 }}>
                  <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 12, color: "#888888", lineHeight: 2.1 }}>
                    Network: <strong style={{ color: "#111111" }}>MTN / Telecel / AT Money</strong><br />
                    Number: <strong style={{ color: "#111111" }}>{PHONE}</strong><br />
                    Name: <strong style={{ color: "#111111" }}>{STORE_NAME}</strong><br />
                    Amount: <strong style={{ color: "#e8a0b4" }}>{GHS(cartTotal)}</strong>
                  </p>
                  <div style={{ marginTop: 12 }}>
                    <label>MoMo Reference No. <span style={{ color: "#666666", textTransform: "none" }}>(recommended)</span></label>
                    <input value={momoRef} onChange={e => setMomoRef(e.target.value)} placeholder="e.g. AB12345678" />
                  </div>
                  <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, color: "#666666", marginTop: 10, lineHeight: 1.6 }}>We'll verify your payment and confirm within 1 hour.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <div style={{ padding: "18px 20px", borderTop: "1px solid #e8e8e8" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontFamily: "'Raleway',sans-serif", fontSize: 11, color: "#888888", letterSpacing: ".1em" }}>Total</span>
          <span style={{ fontSize: 24, fontWeight: 300, color: "#e8a0b4" }}>{GHS(cartTotal)}</span>
        </div>
        {step === "cart"    && cart.length > 0 && <button className="rose-btn" style={{ width: "100%", justifyContent: "center" }} onClick={() => setStep("details")}>Continue →</button>}
        {step === "details" && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="ghost-btn" onClick={() => setStep("cart")} style={{ flex: "0 0 auto" }}>← Back</button>
            {payMethod === "paystack" && !staffMode ? (
              <button className="rose-btn" style={{ flex: 1, justifyContent: "center", minWidth: 160 }} onClick={payWithPaystack} disabled={paying}>{paying ? "Processing…" : "Pay with Paystack"}</button>
            ) : (
              <button className="rose-btn" style={{ flex: 1, justifyContent: "center", minWidth: 160 }} onClick={placeOrder}>{staffMode ? "Place Staff Order" : "Confirm Pre-Order"}</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Fld({ label, error, children }) {
  return <div style={{ marginBottom: 16 }}><label>{label}</label>{children}{error && <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, color: "#e8a0b4", marginTop: 4 }}>{error}</p>}</div>;
}

function SearchOverlay({ products, onClose, onSelect }) {
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    inputRef.current?.focus();
    const handleEsc = (e) => { if (e.key === "Escape") closeRef.current(); };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);
  const results = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase().trim().split(/\s+/);
    const all = Object.values(products).flat();
    return all.map(p => {
      let score = 0;
      const name  = p.name.toLowerCase();
      const brand = (p.brand || "").toLowerCase();
      const notes = (p.notes || "").toLowerCase();
      q.forEach(term => {
        if (name === term) score += 1000;
        else if (name.startsWith(term)) score += 500;
        else if (name.includes(term)) score += 200;
        if (brand.includes(term)) score += 150;
        if (notes.includes(term)) score += 80;
      });
      return { p, score };
    }).filter(r => r.score > 0).sort((a, b) => b.score - a.score).map(r => r.p).slice(0, 8);
  }, [query, products]);
  return (
    <div className="search-overlay">
      <div onClick={onClose} style={{ position: "absolute", inset: 0 }} />
      <div className="search-panel">
        <div style={{ maxWidth: 900, margin: "0 auto", position: "relative" }}>
          <span className="search-hint">Search the shop</span>
          <div className="search-field-wrap" style={{ marginBottom: 28 }}>
            <span className="search-field-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><line x1="20" y1="20" x2="16.5" y2="16.5"/></svg>
            </span>
            <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="Product name, brand, or benefit…" className="search-field" />
            <button onClick={onClose} className="search-close-btn" aria-label="Close search">x</button>
          </div>
          <div className="no-scrollbar" style={{ maxHeight: "min(60vh, 520px)", overflowY: "auto" }}>
            {results.map(p => (
              <div key={p.id} onClick={() => onSelect(p, true)} className="search-result-row">
                <div style={{ width: 60, height: 74, flexShrink: 0, background: BG_MAP[p.category] || "#fafafa", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "1px solid #e8e8e8" }}>
                  {p.image ? <img src={p.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" /> : <CatIcon category={p.category} size={24} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "clamp(16px,4vw,18px)", color: "#111111", margin: "0 0 4px", fontWeight: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                  <p style={{ fontSize: 11, color: "#666666", margin: 0, fontFamily: "'Raleway',sans-serif", textTransform: "uppercase", letterSpacing: ".12em" }}>{p.brand} · {p.category}</p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontSize: "clamp(16px,4vw,18px)", color: "#e8a0b4", margin: 0 }}>{GHS(p.promoActive && p.promoPrice ? p.promoPrice : p.price)}</p>
                </div>
              </div>
            ))}
            {query.length >= 2 && results.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <p style={{ color: "#888888", fontSize: 16, fontFamily: "'Raleway',sans-serif" }}>No matches for &ldquo;{query}&rdquo;</p>
              </div>
            )}
            {!query && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginTop: 8 }}>
                {Object.keys(CAT_LABELS).map(cat => (
                  <div key={cat} onClick={() => onSelect({ category: cat }, false)} className="search-cat-tile">
                    <p style={{ fontSize: 11, color: "#e8a0b4", letterSpacing: ".2em", textTransform: "uppercase", marginBottom: 6, fontFamily: "'Raleway',sans-serif" }}>Shop</p>
                    <p style={{ fontSize: "clamp(18px,4vw,20px)", color: "#111111", margin: 0 }}>{CAT_LABELS[cat]}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductModal({ p, onClose, addToCart, cart }) {
  const [q, setQ] = useState(1);
  const [showSecondary, setShowSecondary] = useState(false);
  const inCart    = cart.find(c => c.id === p.id);
  const qtyInCart = inCart ? inCart.qty : 0;
  const avail     = p.stock - qtyInCart;
  const trulyOos  = avail <= 0;
  const lowStock  = !trulyOos && avail <= (p.lowStockThreshold || 3);
  const accent    = ACCENT_MAP[p.category] || "#e8a0b4";
  const hasSecondary = !!(p.secondaryImage && p.secondaryImage !== p.image);
  const displayImg   = showSecondary && hasSecondary ? p.secondaryImage : p.image;
  const stockBadgeStyle = { fontFamily: "'Raleway',sans-serif", fontSize: 9, letterSpacing: ".18em", padding: "5px 10px", fontWeight: 600 };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="fade-in" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.95)" }} onClick={onClose} />
      <div className="fade-in product-modal" style={{ position: "relative", width: "100%", maxWidth: 1000, background: "#ffffff", border: "1px solid #e8e8e8" }}>
        <button
          onClick={onClose}
          aria-label="Close product details"
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            background: "rgba(255, 255, 255, 0.95)",
            border: "1px solid #e8e8e8",
            color: "#111111",
            cursor: "pointer",
            zIndex: 10,
            width: 42,
            height: 42,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = "#e8a0b4";
            e.currentTarget.style.color = "#e8a0b4";
            e.currentTarget.style.transform = "scale(1.08) rotate(90deg)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(232, 160, 180, 0.25)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = "#e8e8e8";
            e.currentTarget.style.color = "#111111";
            e.currentTarget.style.transform = "scale(1) rotate(0deg)";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="1" y1="1" x2="13" y2="13"></line>
            <line x1="1" y1="13" x2="13" y2="1"></line>
          </svg>
        </button>
        <div className="product-modal-image" style={{ background: BG_MAP[p.category] }}>
          <img src={displayImg} style={{ transition: "opacity .3s" }} alt="" />
          <div style={{ position: "absolute", top: 14, left: 14, zIndex: 2 }}>
            {trulyOos
              ? <span style={{ ...stockBadgeStyle, background: "#fafafa", border: "1px solid #e8a0b4", color: "#e8a0b4" }}>OUT OF STOCK</span>
              : lowStock
                ? <span style={{ ...stockBadgeStyle, background: "#fafafa", border: "1px solid #e8a0b4", color: "#e8a0b4" }}>LOW STOCK — {avail} LEFT</span>
                : <span style={{ ...stockBadgeStyle, background: "#ffffff", border: "1px solid #111111", color: "#111111" }}>IN STOCK</span>
            }
          </div>
          {hasSecondary && (
            <div style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6, zIndex: 2 }}>
              <button onClick={() => setShowSecondary(false)} style={{ width: 30, height: 30, border: showSecondary ? "1px solid #333333" : "1px solid #e8a0b4", background: showSecondary ? "rgba(0,0,0,.6)" : "rgba(232,160,180,.2)", cursor: "pointer", color: "#e8a0b4", fontSize: 10 }}>1</button>
              <button onClick={() => setShowSecondary(true)} style={{ width: 30, height: 30, border: showSecondary ? "1px solid #e8a0b4" : "1px solid #333333", background: showSecondary ? "rgba(232,160,180,.2)" : "rgba(0,0,0,.6)", cursor: "pointer", color: "#e8a0b4", fontSize: 10 }}>2</button>
            </div>
          )}
        </div>
        <div className="product-modal-content">
          <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 11, color: accent, letterSpacing: ".3em", textTransform: "uppercase", marginBottom: 12 }}>{p.brand}</p>
          <h2 style={{ fontSize: 32, fontWeight: 300, marginBottom: 20, color: "#111111" }}>{p.name}</h2>
          <div style={{ marginBottom: 24 }}>
            {p.promoActive && <p style={{ fontSize: 14, color: "#888888", textDecoration: "line-through", marginBottom: 4 }}>{GHS(p.originalPrice)}</p>}
            <p style={{ fontSize: 24, color: "#e8a0b4" }}>{GHS(p.promoActive ? p.promoPrice : p.price)}</p>
          </div>
          <div style={{ marginBottom: 24, fontFamily: "'Raleway',sans-serif", fontSize: 13, color: "#666666", lineHeight: 1.9 }}>
            {p.notes && (() => {
              const lines = p.notes.split('\n');
              return (
                <div>
                  {lines.map((line, i) => {
                    const trimmed = line.trim();
                    if (!trimmed) return <div key={i} style={{ height: 10 }} />;
                    const isHeading = trimmed === trimmed.toUpperCase() && trimmed.length < 60 && !/·/.test(trimmed) || trimmed.endsWith(':');
                    if (isHeading) return <p key={i} style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, color: "#e8a0b4", letterSpacing: ".2em", textTransform: "uppercase", marginBottom: 6, marginTop: i > 0 ? 14 : 0, fontWeight: 600 }}>{trimmed.replace(/:$/, '')}</p>;
                    const parts = trimmed.split(' · ');
                    if (parts.length > 1) return <p key={i} style={{ color: "#111111", marginBottom: 4, display: "flex", flexWrap: "wrap", gap: "0 10px" }}>{parts.map((pt, pi) => <span key={pi} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>{pi > 0 && <span style={{ color: "#e8a0b4", fontSize: 10 }}>·</span>}{pt}</span>)}</p>;
                    return <p key={i} style={{ color: "#111111", marginBottom: 4 }}>{trimmed}</p>;
                  })}
                </div>
              );
            })()}
            {p.extra && <p style={{ whiteSpace: "pre-wrap", color: "#888888", marginTop: 8 }}>{p.extra}</p>}
          </div>
          <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid #f0f0f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button className="qty-ctrl" onClick={() => setQ(Math.max(1, q - 1))} disabled={q <= 1}>-</button>
                <span style={{ fontSize: 16, minWidth: 24, textAlign: "center", color: "#111111" }}>{q}</span>
                <button className="qty-ctrl" onClick={() => setQ(Math.min(avail, q + 1))} disabled={q >= avail || trulyOos}>+</button>
              </div>
              {!trulyOos && <span style={{ fontSize: 11, color: lowStock ? "#e8a0b4" : "#666666" }}>{avail} available</span>}
            </div>
            <button className="rose-btn" style={{ width: "100%", padding: "20px" }} onClick={() => { addToCart(p, q); onClose(); }} disabled={trulyOos}>
              {trulyOos ? "OUT OF STOCK" : "ADD TO BAG"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SocialProof({ products, orders, simulatedEnabled, testimonials }) {
  const [show, setShow] = useState(false);
  const [active, setActive] = useState(null);
  const allProducts = useMemo(() => Object.values(products).flat().filter(p => p.stock > 0), [products]);
  const weightedPool = useMemo(() => {
    const pool = [];
    allProducts.forEach(p => { const w = (p.bestseller ? 3 : 1) + (p.isTrending ? 2 : 0); for (let i = 0; i < w; i++) pool.push(p); });
    return pool;
  }, [allProducts]);
  const locations = ["East Legon", "Osu", "Airport City", "Spintex", "Labone", "Cantonments", "Dansoman", "Tesano", "Adenta", "Roman Ridge", "Lapaz", "Madina", "Achimota", "Tema", "Kumasi"];
  const timeLabels = ["just now", "2 min ago", "5 min ago", "12 min ago", "28 min ago", "1 hr ago", "earlier today"];
  useEffect(() => {
    let timeout;
    const fire = () => {
      const realOrders = (orders || []).filter(o => o.items && o.items.length > 0 && o.status.payment);
      const useReal = realOrders.length > 0 && (Math.random() < 0.70 || !simulatedEnabled);
      if (useReal) {
        const o = realOrders[Math.floor(Math.random() * realOrders.length)];
        const item = o.items[Math.floor(Math.random() * o.items.length)];
        const p = allProducts.find(x => x.name === item.name) || { name: item.name, image: item.image || "" };
        const loc = o.customer?.city || o.customer?.address || locations[Math.floor(Math.random() * locations.length)];
        setActive({ 
          p, 
          loc, 
          time: ago(o.timestamp), 
          isReal: true, 
          text: `Someone in ${loc} purchased ${item.name}` 
        });
      } else if (simulatedEnabled) {
        const hasReviews = testimonials && testimonials.length > 0;
        const showReview = hasReviews && Math.random() < 0.35;
        if (showReview) {
          const t = testimonials[Math.floor(Math.random() * testimonials.length)];
          const p = weightedPool[Math.floor(Math.random() * weightedPool.length)] || { name: "Hajia Slay Empire", image: "" };
          setActive({
            p,
            loc: t.name,
            time: "Verified Reviewer",
            isReal: true,
            text: `"${t.review}"`
          });
        } else if (weightedPool.length) {
          const p = weightedPool[Math.floor(Math.random() * weightedPool.length)];
          const loc = locations[Math.floor(Math.random() * locations.length)];
          const act = ["purchased", "added to bag", "is viewing"][Math.floor(Math.random() * 3)];
          const time = timeLabels[Math.floor(Math.random() * timeLabels.length)];
          setActive({
            p,
            loc,
            time,
            isReal: false,
            text: `Someone in ${loc} ${act} ${p.name}`
          });
        }
      } else return;
      setShow(true);
      timeout = setTimeout(() => { setShow(false); timeout = setTimeout(fire, 28000); }, 9000);
    };
    const initial = setTimeout(fire, 12000);
    return () => { clearTimeout(initial); clearTimeout(timeout); };
  }, [weightedPool, orders, simulatedEnabled, testimonials]);
  if (!active || !show) return null;
  return (
    <div style={{ position: "fixed", bottom: 20, right: 16, zIndex: 300, background: "rgba(255,255,255,.97)", backdropFilter: "blur(12px)", border: "1px solid #e8e8e8", borderRight: "3px solid " + (active.isReal ? "#22c55e" : "#e8a0b4"), padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, maxWidth: 310, boxShadow: "0 12px 40px rgba(0,0,0,.1)", animation: "slideUp 0.6s cubic-bezier(0.16,1,0.3,1)" }}>
      <div style={{ width: 46, height: 46, flexShrink: 0, overflow: "hidden", background: "#fafafa", border: "1px solid #e8e8e8" }}>
        {active.p.image ? <img src={active.p.image} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="sparkle" size={20} color={active.isReal ? "#22c55e" : "#e8a0b4"} /></div>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontFamily: "'Raleway',sans-serif", fontSize: 8, color: active.isReal ? "#22c55e" : "#e8a0b4", fontWeight: "bold", letterSpacing: ".12em", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: 4 }}>
          <Icon name={active.isReal ? "check" : "sparkle"} size={10} color={active.isReal ? "#22c55e" : "#e8a0b4"} /> 
          {active.isReal ? "VERIFIED ORDER" : "RECENT ACTIVITY"}
        </span>
        <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 9, color: "#666666", margin: "4px 0 0", lineHeight: 1.3 }}>
          {active.text} <span style={{ fontSize: 8, color: "#888888", display: "block", marginTop: 2 }}>{active.time}</span>
        </p>
      </div>
      <button onClick={() => setShow(false)} style={{ background: "none", border: "none", color: "#333333", fontSize: 18, cursor: "pointer", padding: "2px 4px", lineHeight: 1, alignSelf: "flex-start" }}>×</button>
    </div>
  );
}

function TestimonialSection({ testimonials }) {
  const list = testimonials && testimonials.length > 0 ? testimonials : [];
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState("fwd");
  const [animKey, setAnimKey] = useState(0);
  const visible = 3;
  const go = (direction) => { setDir(direction); setAnimKey(k => k + 1); if (direction === "fwd") setIdx(i => (i + 1) % list.length); else setIdx(i => (i - 1 + list.length) % list.length); };
  const cards = Array.from({ length: Math.min(visible, list.length) }, (_, i) => list[(idx + i) % list.length]);
  if (!list.length) return null;
  return (
    <div style={{ padding: "80px 0", borderTop: "1px solid #e8e8e8", overflow: "hidden", background: "#ffffff" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px" }}>
        <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 12, color: "#e8a0b4", letterSpacing: ".3em", textAlign: "center", marginBottom: 16 }}>SOCIAL PROOF</p>
        <h2 style={{ textAlign: "center", marginBottom: 48, fontSize: "clamp(28px,5vw,48px)", fontWeight: 300 }}>What our customers say</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button className="tnav-btn" onClick={() => go("back")} aria-label="Previous"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="square"><polyline points="15 18 9 12 15 6" /></svg></button>
          <div key={animKey} style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20, overflow: "hidden", animation: "fadeIn .45s ease forwards" }}>
            {cards.map((t, i) => (
              <div key={t.id + "-" + i} style={{ background: "#fafafa", border: "1px solid #e8e8e8", padding: "32px", position: "relative" }}>
                <div style={{ marginBottom: 16 }}><StarRating count={t.rating || 5} size={14} /></div>
                <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontStyle: "italic", color: "#111111", lineHeight: 1.6, marginBottom: 24 }}>"{t.review}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#e8a0b4", fontWeight: "bold", border: "1px solid #e8a0b444" }}>{t.name[0]}</div>
                  <div><p style={{ fontSize: 12, fontWeight: "bold", color: "#111111", margin: 0 }}>{t.name}</p><p style={{ fontSize: 10, color: "#e8a0b4", margin: 0 }}>@{t.handle || "verified_customer"}</p></div>
                </div>
              </div>
            ))}
          </div>
          <button className="tnav-btn" onClick={() => go("fwd")} aria-label="Next"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="square"><polyline points="9 18 15 12 9 6" /></svg></button>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 32 }}>
          {list.map((_, i) => (<button key={i} onClick={() => { setDir(i > idx ? "fwd" : "back"); setAnimKey(k => k + 1); setIdx(i); }} style={{ width: i === idx ? 24 : 8, height: 8, border: "none", cursor: "pointer", padding: 0, background: i === idx ? "#e8a0b4" : "#222222", borderRadius: 4, transition: "all .35s" }} aria-label={"Review " + (i + 1)} />))}
        </div>
      </div>
    </div>
  );
}

function OrderStepper({ status }) {
  const fmtTs = (ts) => ts ? new Date(ts).toLocaleString("en-GH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : null;
  const steps = [
    { key: "payment",   label: "Payment",          ts: status.paymentAt },
    { key: "packaged",  label: "Packaging",        ts: status.packagedAt },
    { key: "dispatched",label: "Out for Delivery", ts: status.dispatchedAt },
    { key: "delivered", label: "Delivered",        ts: status.deliveredAt },
  ];
  const completedCount = steps.filter(s => status[s.key]).length;
  // Progress spans between first and last dot center (33.33% per gap across 3 gaps)
  const progressPct = completedCount <= 1 ? 0 : ((completedCount - 1) / (steps.length - 1)) * 100;

  return (
    <div style={{ position: "relative", padding: "0 8px" }}>
      <div className="stepper-container">
        <div className="stepper-line" />
        <div className="stepper-line-progress" style={{ width: progressPct + "%" }} />
        {steps.map((step, i) => {
          const isCompleted = !!status[step.key];
          const isActive = !isCompleted && (i === 0 || !!status[steps[i - 1].key]);
          const dotClass = "stepper-dot" + (isCompleted ? " completed" : isActive ? " active" : "");
          const labelClass = "stepper-label" + (isCompleted ? " completed" : isActive ? " active" : "");
          return (
            <div key={step.key} className="stepper-step">
              <div className={dotClass}>
                {isCompleted ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                ) : (
                  i + 1
                )}
              </div>
              <span className={labelClass}>{step.label}</span>
              <span className="stepper-timestamp">{fmtTs(step.ts) || "\u00a0"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrderTracking({ orders, trackOrderId }) {
  const [query, setQuery] = useState("");
  const [trackedId, setTrackedId] = useState(null);
  const [err, setErr] = useState("");
  const activeOrder = trackedId ? orders.find(x => x.id === trackedId) : null;
  const track = () => {
    setErr(""); setTrackedId(null);
    if (!query.trim()) return;
    const q = query.trim().replace(/^#/, "").toLowerCase();
    const o = orders.find(x => x.id.toLowerCase() === q || x.customer.phone === query.trim());
    if (o) setTrackedId(o.id); else setErr("Order not found. Please check your ID or phone number.");
  };

  useEffect(() => {
    if (trackOrderId) {
      setQuery(trackOrderId);
      const o = orders.find(x => x.id.toLowerCase() === trackOrderId.toLowerCase());
      if (o) {
        setTrackedId(o.id);
        setErr("");
      }
    }
  }, [trackOrderId, orders]);
  return (
    <div style={{ maxWidth: 640, margin: "60px auto", padding: "0 16px" }}>
      <h2 style={{ textAlign: "center", marginBottom: 8, fontSize: "clamp(28px,6vw,64px)", fontWeight: 300 }}>Track Your Order</h2>
      <p style={{ textAlign: "center", fontFamily: "'Raleway',sans-serif", fontSize: 12, color: "#888888", marginBottom: 40, letterSpacing: ".05em" }}>Enter your Order ID or the phone number used at checkout</p>
      <div style={{ background: "#fafafa", padding: "32px", border: "1px solid #e8e8e8" }}>
        <Fld label="Order ID or Phone Number">
          <div style={{ display: "flex", gap: 8 }}>
            <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && track()} placeholder="e.g. SLY-XXXXXX or 024…" style={{ flex: 1 }} />
            <button className="rose-btn" onClick={track}>TRACK</button>
          </div>
        </Fld>
        {err && <p style={{ color: "#e8a0b4", fontSize: 12, marginTop: 16, fontFamily: "'Raleway',sans-serif" }}>{err}</p>}
        {activeOrder && (
          <div className="fade-in" style={{ marginTop: 32, borderTop: "1px solid #e8e8e8", paddingTop: 28 }}>
            {/* Order header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
              <p style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>Order {activeOrder.id}</p>
              {activeOrder.status.payment && (
                <span className="tag" style={{ background: "#22c55e", color: "#ffffff", border: "1px solid #22c55e", fontSize: 9, fontWeight: "bold", letterSpacing: ".15em" }}>
                  VERIFIED ORDER
                </span>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
              <div>
                <p style={{ fontSize: 9, color: "#888888", fontFamily: "'Raleway',sans-serif", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 4 }}>Customer</p>
                <p style={{ fontSize: 13 }}>{activeOrder.customer.name}</p>
              </div>
              <div>
                <p style={{ fontSize: 9, color: "#888888", fontFamily: "'Raleway',sans-serif", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 4 }}>Placed On</p>
                <p style={{ fontSize: 13 }}>{new Date(activeOrder.timestamp).toLocaleDateString("en-GH", { day: "numeric", month: "short", year: "numeric" })}</p>
              </div>
            </div>

            {/* 4-step stepper */}
            <div style={{ background: "#ffffff", border: "1px solid #e8e8e8", borderRadius: 2, padding: "24px 20px 20px" }}>
              <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 9, color: "#888888", letterSpacing: ".18em", textTransform: "uppercase", marginBottom: 0 }}>Delivery Progress</p>
              <OrderStepper status={activeOrder.status} />
            </div>

            {/* Admin note / Estimated delivery */}
            {(activeOrder.estimatedDelivery || activeOrder.adminNote) && (
              <div style={{ marginTop: 16, background: "#ffffff", border: "1px solid #e8e8e8", borderLeft: "3px solid #22c55e", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                {activeOrder.estimatedDelivery && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <div>
                      <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 9, color: "#888888", letterSpacing: ".12em", textTransform: "uppercase" }}>Estimated Delivery</p>
                      <p style={{ fontSize: 13, color: "#111111", marginTop: 2 }}>{activeOrder.estimatedDelivery}</p>
                    </div>
                  </div>
                )}
                {activeOrder.adminNote && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 2, flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <div>
                      <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 9, color: "#888888", letterSpacing: ".12em", textTransform: "uppercase" }}>Note from Team</p>
                      <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 12, color: "#555555", lineHeight: 1.6, marginTop: 2 }}>{activeOrder.adminNote}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Items */}
            <div style={{ marginTop: 20 }}>
              <p style={{ fontSize: 9, color: "#888888", fontFamily: "'Raleway',sans-serif", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 10 }}>Items</p>
              {activeOrder.items.map((it, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f3f4f6" }}>
                  <p style={{ fontSize: 12 }}><span style={{ fontFamily: "'Raleway',sans-serif", color: "#888888", marginRight: 6 }}>×{it.qty}</span>{it.name}</p>
                  <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 11, color: "#888888" }}>GH₵ {((it.promoActive && it.promoPrice ? it.promoPrice : it.price) * it.qty).toFixed(2)}</p>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10 }}>
                <span style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, color: "#888888" }}>Total</span>
                <span style={{ fontSize: 16, color: "#e8a0b4" }}>GH₵ {activeOrder.total}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


function AboutPage() {
  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "72px 16px 80px" }}>
      <p className="section-label">About us</p>
      <h2 style={{ fontWeight: 300, marginBottom: 32, lineHeight: 1.1, fontSize: "clamp(28px,5vw,48px)" }}>About {STORE_NAME}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 28, fontFamily: "'Raleway',sans-serif", fontSize: 13, lineHeight: 2, color: "#666666" }}>
        <p>{STORE_ABOUT}</p>
        <p>Based in <strong style={{ color: "#111111" }}>{LOCATION}</strong>, we serve customers across Accra and Ghana with trusted beauty products, quick WhatsApp support, and dependable delivery.</p>
        <div style={{ background: "#fafafa", border: "1px solid #e8e8e8", borderLeft: "3px solid #e8a0b4", padding: "22px 24px" }}>
          <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, letterSpacing: ".2em", color: "#e8a0b4", marginBottom: 14 }}>DELIVERY &amp; PAYMENTS</p>
          <p style={{ lineHeight: 1.9, margin: 0 }}>
            {DELIVERY_NOTE}.<br /><br />
            Contact us on WhatsApp: <a href={WA} target="_blank" rel="noreferrer" style={{ color: "#e8a0b4" }}>{PHONE}</a>
          </p>
        </div>
        <div style={{ background: "#fafafa", border: "1px solid #e8e8e8", borderLeft: "3px solid #e8a0b4", padding: "22px 24px" }}>
          <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, letterSpacing: ".2em", color: "#e8a0b4", marginBottom: 14 }}>RETURNS</p>
          <p style={{ lineHeight: 1.9, margin: 0 }}>
            Returns and exchanges are handled case-by-case for unopened items. Contact us on WhatsApp before returning any beauty products.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginTop: 8 }}>
          {WHY_CHOOSE_US.map(f => (
            <div key={f.title} style={{ background: "#ffffff", padding: "22px 18px", border: "1px solid #e8e8e8", borderTop: "2px solid #e8a0b4" }}>
              <p style={{ color: "#111111", marginBottom: 6, fontSize: 15, fontFamily: "'Cormorant Garamond',serif" }}>{f.title}</p>
              <p style={{ fontSize: 10, color: "#666666", lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", paddingTop: 16 }}>
          <a href={TIKTOK} target="_blank" rel="noreferrer" className="ghost-btn" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Icon name="tiktok" size={16} color="currentColor" /> Follow us on TikTok</a>
        </div>
      </div>
    </div>
  );
}

function FaqPage({ setPage }) {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "72px 16px 80px" }}>
      <p className="section-label">Need help?</p>
      <h2 style={{ fontWeight: 300, marginBottom: 16, fontSize: "clamp(28px,5vw,48px)" }}>Frequently asked questions</h2>
      <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 13, color: "#888888", marginBottom: 40, lineHeight: 1.8 }}>
        Quick answers before you order — delivery, payments, returns and more.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 40 }}>
        {STORE_FAQS.map(f => (
          <div key={f.q} style={{ background: "#fafafa", border: "1px solid #e8e8e8", padding: "24px 28px" }}>
            <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 13, fontWeight: 600, color: "#111111", marginBottom: 10 }}>{f.q}</p>
            <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 12, color: "#666666", lineHeight: 1.9, margin: 0 }}>{f.a}</p>
          </div>
        ))}
      </div>
      <div style={{ background: "#fce8ee", border: "1px solid #e8a0b444", padding: "28px 24px", textAlign: "center" }}>
        <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 12, color: "#666666", marginBottom: 20, lineHeight: 1.8 }}>{DELIVERY_NOTE}</p>
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 12 }}>
          <button className="rose-btn" onClick={() => setPage("shop")}>View Products</button>
          <a href={WA} target="_blank" rel="noreferrer" className="ghost-btn" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Icon name="whatsapp" size={16} color="currentColor" /> Contact Us</a>
        </div>
      </div>
    </div>
  );
}

function PrivacyPage() {
  const sections = [
    ["Information We Collect", "We collect your name, phone number, email (optional), and delivery address when you place an order. We do not collect payment card details — all Mobile Money payments are processed directly by your network provider."],
    ["How We Use Your Information", "Your details are used solely to process and deliver your order. We may contact you via WhatsApp or phone to confirm your order and arrange delivery."],
    ["Data Retention", "Order records are kept for business accounting and customer service purposes. You may request full deletion of your personal data at any time by contacting us via WhatsApp."],
    ["Cookies & Local Storage", STORE_NAME + " uses browser local storage to remember your shopping bag between visits. No third-party tracking cookies are used."],
    ["Security", "Your data is transmitted over HTTPS and stored on secure encrypted cloud storage. We follow industry-standard security practices to protect your personal information."],
    ["Contact & Data Requests", "For any data-related requests, please contact us:\n" + STORE_NAME + ", Accra, Ghana\nPhone: " + PHONE],
  ];
  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "72px 16px 80px" }}>
      <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 11, letterSpacing: ".35em", color: "#e8a0b4", textAlign: "center", marginBottom: 16 }}>LEGAL</p>
      <h1 style={{ fontWeight: 300, textAlign: "center", marginBottom: 12, fontSize: "clamp(28px,6vw,64px)" }}>Privacy Policy</h1>
      <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 11, color: "#666666", textAlign: "center", letterSpacing: ".15em", marginBottom: 56 }}>Last updated: June 2025</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        {sections.map(([title, body], i) => (
          <div key={i} style={{ borderLeft: "2px solid #e8e8e8", paddingLeft: 24 }}>
            <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, color: "#e8a0b4", letterSpacing: ".18em", marginBottom: 12 }}>{String(i + 1).padStart(2, "0")} · {title.toUpperCase()}</p>
            <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 13, color: "#999999", lineHeight: 2, whiteSpace: "pre-line" }}>{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TermsPage({ onBack }) {
  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "72px 16px 80px" }}>
      <button className="ghost-btn" onClick={() => { if (onBack) onBack(); }} style={{ marginBottom: 32, padding: "8px 16px", minHeight: 0 }}>← BACK</button>
      <h2 style={{ fontWeight: 300, marginBottom: 48, fontSize: "clamp(28px,6vw,64px)" }}>Terms &amp; Conditions</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {[
          ["Orders & Payments", "All items are subject to availability. Prices are in GHS and may change without notice. Full payment via Mobile Money is required to secure your pre-order."],
          ["Pre-Order Policy", STORE_NAME + " operates on a curated pre-order basis. Delivery timelines will be communicated upon order confirmation."],
          ["Delivery", "Orders placed before 4:00 PM qualify for 24-hour delivery in supported areas. Delivery timing depends on your location across Ghana. We are not liable for delays caused by third-party logistics."],
          ["Returns & Exchanges", "Due to the nature of skincare and wellness products, returns are only accepted for manufacturing defects reported within 7 days of purchase. Opened skincare or intimate wellness products cannot be returned for hygiene reasons."],
        ].map(([title, body], i) => (
          <div key={i} style={{ borderLeft: "1px solid #e8e8e8", paddingLeft: 20 }}>
            <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, color: "#e8a0b4", letterSpacing: ".18em", marginBottom: 10 }}>{i + 1}. {title.toUpperCase()}</p>
            <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 13, color: "#999999", lineHeight: 1.9 }}>{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SiteFooter({ setPage }) {
  const nav = (p) => { setPage(p); window.scrollTo(0, 0); };
  return (
    <footer style={{ background: "#fafafa", padding: "80px 24px 40px", borderTop: "1px solid #e8e8e8", marginTop: 0 }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 48, marginBottom: 80 }}>
        <div>
          <h2 style={{ fontSize: 22, letterSpacing: ".2em", marginBottom: 24, fontWeight: 300 }}>HAJIA SLAY EMPIRE</h2>
          <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 12, color: "#666666", lineHeight: 1.8, maxWidth: 320 }}>{STORE_ABOUT}</p>
        </div>
        <div>
          <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, color: "#e8a0b4", letterSpacing: ".2em", textTransform: "uppercase", marginBottom: 24 }}>Quick Links</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {["home", "shop", "about"].map(p => (
              <button key={p} onClick={() => nav(p)} style={{ background: "none", border: "none", color: "#888888", textAlign: "left", cursor: "pointer", fontSize: 13, padding: 0 }}>{p.charAt(0).toUpperCase() + p.slice(1)}</button>
            ))}
          </div>
        </div>
        <div>
          <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, color: "#e8a0b4", letterSpacing: ".2em", textTransform: "uppercase", marginBottom: 24 }}>Support</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button onClick={() => nav("faq")}     style={{ background: "none", border: "none", color: "#888888", textAlign: "left", cursor: "pointer", fontSize: 13, padding: 0 }}>FAQ</button>
            <button onClick={() => nav("track")}   style={{ background: "none", border: "none", color: "#888888", textAlign: "left", cursor: "pointer", fontSize: 13, padding: 0 }}>Track Order</button>
            <button onClick={() => nav("privacy")} style={{ background: "none", border: "none", color: "#888888", textAlign: "left", cursor: "pointer", fontSize: 13, padding: 0 }}>Privacy Policy</button>
            <button onClick={() => nav("terms")}   style={{ background: "none", border: "none", color: "#888888", textAlign: "left", cursor: "pointer", fontSize: 13, padding: 0 }}>Terms & Conditions</button>
          </div>
        </div>
        <div>
          <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, color: "#e8a0b4", letterSpacing: ".2em", textTransform: "uppercase", marginBottom: 24 }}>Contact</p>
          <p style={{ fontSize: 13, color: "#888888", margin: "0 0 4px" }}>Phone: {PHONE}</p>
          <p style={{ fontSize: 12, color: "#666666", margin: "0 0 16px" }}>{LOCATION}</p>
          <div style={{ display: "flex", gap: 16, marginTop: 8, alignItems: "center" }}>
            <a href={WA} target="_blank" rel="noreferrer" title="WhatsApp" style={{ color: "#666666", textDecoration: "none", transition: "color .2s", display: "flex" }} onMouseEnter={e => e.currentTarget.style.color = "#e8a0b4"} onMouseLeave={e => e.currentTarget.style.color = "#666666"}>
              <Icon name="whatsapp" size={24} color="currentColor" />
            </a>
            <a href={INSTAGRAM} target="_blank" rel="noreferrer" title="Instagram" style={{ color: "#666666", textDecoration: "none", transition: "color .2s", display: "flex" }} onMouseEnter={e => e.currentTarget.style.color = "#e8a0b4"} onMouseLeave={e => e.currentTarget.style.color = "#666666"}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>
            <a href={TIKTOK} target="_blank" rel="noreferrer" title="TikTok" style={{ color: "#666666", textDecoration: "none", transition: "color .2s", display: "flex" }} onMouseEnter={e => e.currentTarget.style.color = "#e8a0b4"} onMouseLeave={e => e.currentTarget.style.color = "#666666"}>
              <Icon name="tiktok" size={24} color="currentColor" />
            </a>
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 900, margin: "0 auto 40px", display: "flex", flexDirection: "column", gap: 10, textAlign: "center" }}>
        {TRUST_BULLETS.map(t => (
          <p key={t.text} style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, color: "#888888", margin: 0, letterSpacing: ".04em", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Icon name={t.icon} size={12} color="#e8a0b4" /> {t.text}</p>
        ))}
      </div>
      <div style={{ maxWidth: 1400, margin: "0 auto", textAlign: "center", borderTop: "1px solid #e8e8e8", paddingTop: 40 }}>
        <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, color: "#333333", letterSpacing: ".08em" }}>© {new Date().getFullYear()} {STORE_NAME} · {LOCATION} · All Rights Reserved</p>
      </div>
    </footer>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN APP
// ═══════════════════════════════════════════════════════════════════════════════
function AdminApp({ products, allFlat, addProduct, updateProduct, deleteProduct, bulkUpdatePromos, orders, logOrders, updateOrderStatus, updateOrderFields, deleteOrder, loaded, syncing, addOrder, testimonials, setTestimonials, stats, simulatedEnabled, setSimulatedEnabled, onOrderPlaced }) {
  const [adminLoggedIn, setAdminLoggedIn] = useLocalStorage(SK_ADMIN, false);
  const [adminPwd, setAdminPwd] = useLocalStorage(SK_PWD, btoa("slay2025admin"));
  const handleLogout = useCallback(() => {
    setAdminLoggedIn(false);
    localStorage.removeItem("slay_sb_token");
    localStorage.removeItem(SK_ADMIN);
    localStorage.removeItem(SK_SESSION_AT);
  }, [setAdminLoggedIn]);

  useEffect(() => {
    if (adminLoggedIn) {
      const sessionAt = localStorage.getItem(SK_SESSION_AT);
      const now = Date.now();
      const eightHours = 8 * 60 * 60 * 1000;
      if (!sessionAt || now - Number(sessionAt) > eightHours) {
        handleLogout();
        alert("Admin session expired. Please log in again.");
      }
    }
  }, [adminLoggedIn, handleLogout]);
  const [view, setView] = useState("orders");
  const [emailInput, setEmailInput] = useState("");
  const [pwdInput, setPwdInput] = useState("");
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [loginErr, setLoginErr] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [adminActiveCat, setAdminActiveCat] = useState("skincare");
  const [showAllLog, setShowAllLog] = useState(false);
  const [logSearch, setLogSearch] = useState("");

  const [deleteTargetOrder, setDeleteTargetOrder] = useState(null);
  const [bulkDeleteTargets, setBulkDeleteTargets] = useState(null);
  const [onBulkDeleteSuccess, setOnBulkDeleteSuccess] = useState(null);

  const handleDeleteRequest = useCallback((id) => {
    const found = orders.find(o => o.id === id) || logOrders.find(o => o.id === id);
    if (found) setDeleteTargetOrder(found);
  }, [orders, logOrders]);

  const triggerBulkDelete = useCallback((ids, onSuccess) => {
    setBulkDeleteTargets(ids);
    setOnBulkDeleteSuccess(() => onSuccess);
  }, []);
  const filteredLog = useMemo(() => {
    let base = showAllLog ? logOrders : logOrders.filter(o => (Date.now() - o.timestamp) < 2592000000);
    if (logSearch.trim()) { const q = logSearch.toLowerCase(); base = base.filter(o => o.id.toLowerCase().includes(q) || o.customer.name.toLowerCase().includes(q) || o.customer.phone.toLowerCase().includes(q)); }
    return base;
  }, [logOrders, showAllLog, logSearch]);

  const exportCSV = useCallback(() => {
    const headers = ["Order ID", "Purchase Code", "Customer Name", "Customer Phone", "Customer Email", "Placed On", "Items", "Total (GHS)", "Status", "Payment Method", "Momo Ref", "Paystack Ref", "Admin Note", "Estimated Delivery"];
    const rows = filteredLog.map(o => {
      const itemStr = o.items.map(i => `${i.qty}x ${i.name}`).join("; ");
      const statusStr = o.status.delivered ? "Delivered" : o.status.dispatched ? "Dispatched" : o.status.packaged ? "Packaged" : o.status.payment ? "Paid" : "Unpaid";
      return [
        o.id,
        o.purchaseCode || "",
        o.customer.name,
        o.customer.phone,
        o.customer.email || "",
        new Date(o.timestamp).toLocaleString(),
        itemStr,
        o.total,
        statusStr,
        o.paymentMethod || "",
        o.momoRef || "",
        o.paystackRef || "",
        o.adminNote || "",
        o.estimatedDelivery || ""
      ];
    });
    const csvContent = [headers.map(h => `"${h.replace(/"/g, '""')}"`).join(","), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `orders_export_${Date.now()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredLog]);
  const [adminCart, setAdminCart] = useState([]);
  const [showAdminCart, setShowAdminCart] = useState(false);
  const addToAdminCart = useCallback((p, qty = 1) => {
    setAdminCart(prev => { const ex = prev.find(i => i.id === p.id); if (ex) return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + qty } : i); return [...prev, { ...p, qty }]; });
    setShowAdminCart(true);
  }, []);
  const updateAdminQty   = useCallback((id, qty) => { if (qty < 1) { setAdminCart(p => p.filter(i => i.id !== id)); return; } setAdminCart(p => p.map(i => i.id === id ? { ...i, qty } : i)); }, []);
  const removeAdminItem  = useCallback((id) => setAdminCart(p => p.filter(i => i.id !== id)), []);
  const adminCartTotal   = useMemo(() => adminCart.reduce((s, i) => { const p = allFlat.find(x => x.id === i.id); const price = (p?.promoActive && p?.promoPrice) ? p.promoPrice : i.price; return s + price * i.qty; }, 0), [adminCart, allFlat]);
  const adminCartCount   = useMemo(() => adminCart.reduce((s, i) => s + i.qty, 0), [adminCart]);
  const [selectedAdminProduct, setSelectedAdminProduct] = useState(null);

  const login = async () => {
    setLoginLoading(true); setLoginErr("");
    if (supa._ready && emailInput.trim()) {
      const ok = await supa.signIn(emailInput, pwdInput);
      if (ok) {
        setAdminLoggedIn(true);
        localStorage.setItem(SK_SESSION_AT, String(Date.now()));
        setLoginLoading(false);
        return;
      }
    }
    const curHash = btoa(pwdInput);
    
    // First-time offline initialization: if no password hash is stored, set the entered password
    if (!adminPwd && !supa._ready) {
      localStorage.setItem(SK_PWD, JSON.stringify(curHash));
      setAdminPwd(curHash);
      setAdminLoggedIn(true);
      localStorage.setItem(SK_SESSION_AT, String(Date.now()));
      setLoginLoading(false);
      alert("No local admin password was set. Your password has been initialized to the one entered.");
      return;
    }

    if (curHash === adminPwd || pwdInput === adminPwd) {
      setAdminLoggedIn(true);
      localStorage.setItem(SK_SESSION_AT, String(Date.now()));
      setLoginLoading(false);
      return;
    }
    setLoginErr("Incorrect password or email."); setLoginLoading(false);
  };

  if (!adminLoggedIn) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ width: "100%", maxWidth: 380, background: "#fafafa", border: "1px solid #e8e8e8", padding: "48px 32px" }}>
          <h2 style={{ fontSize: 28, fontWeight: 300, marginBottom: 6, letterSpacing: ".18em" }}>HAJIA SLAY EMPIRE</h2>
          <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, color: "#666666", letterSpacing: ".15em", marginBottom: 32 }}>Secure Admin Access</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {supa._ready && (
              <div><label>Email</label>
                <input type="email" value={emailInput} onChange={e => { setEmailInput(e.target.value); setLoginErr(""); }} placeholder="admin@slayempire.com" onKeyDown={e => e.key === "Enter" && login()} />
              </div>
            )}
            <div><label>Password</label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input type={showLoginPwd ? "text" : "password"} value={pwdInput} onChange={e => { setPwdInput(e.target.value); setLoginErr(""); }} placeholder="Enter password" onKeyDown={e => e.key === "Enter" && login()} style={{ width: "100%", paddingRight: "40px" }} />
                <button type="button" onClick={() => setShowLoginPwd(!showLoginPwd)} style={{ position: "absolute", right: "12px", background: "none", border: "none", color: "#888888", cursor: "pointer", display: "flex", alignItems: "center", padding: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{showLoginPwd ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}</svg>
                </button>
              </div>
              {loginErr && <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, color: "#e8a0b4", marginTop: 5 }}>{loginErr}</p>}
            </div>
          </div>
          <button className="rose-btn" style={{ width: "100%", justifyContent: "center", marginTop: 20 }} onClick={login} disabled={loginLoading}>{loginLoading ? "Logging in…" : "Login"}</button>
          {!supa._ready && <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 9, color: "#666666", marginTop: 16, letterSpacing: ".1em", lineHeight: 1.6 }}>OFFLINE MODE — configure secure link to enable cloud sync</p>}
        </div>
      </div>
    );
  }

  // orders prop is already pre-filtered to active-only from App
  const activeOrders     = orders;
  const awaitingDelivery = activeOrders.filter(o => o.status.packaged && o.status.payment).sort((a, b) => a.timestamp - b.timestamp);
  const TABS = [["orders","Orders"],["log","Log"],["reviews","Reviews"],["products","Products"],["shop","Shop"],["insights","Insights"],["customers","Customers"],["settings","Settings"]];

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 280, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontWeight: 300, letterSpacing: ".2em" }}>
            <span className="desktop-admin-title">{STORE_NAME} Admin</span>
            <span className="mobile-admin-title">HSE Admin</span>
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: supa._ready ? "rgba(34,197,94,0.08)" : "#fafafa", padding: "4px 10px", borderRadius: 20, border: "1px solid " + (supa._ready ? "rgba(34,197,94,0.35)" : "#e8e8e8") }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: supa._ready ? "#22c55e" : "#e8a0b4", boxShadow: supa._ready ? "0 0 8px rgba(34,197,94,0.5)" : "none" }} />
            <span style={{ fontFamily: "'Raleway',sans-serif", fontSize: 8, color: supa._ready ? "#22c55e" : "#e8a0b4", letterSpacing: ".05em", fontWeight: "bold" }}>{supa._ready ? "CLOUD CONNECTED" : "OFFLINE MODE"}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {syncing && <span style={{ fontFamily: "'Raleway',sans-serif", fontSize: 9, color: "#e8a0b4", animation: "fadeIn 1s infinite alternate" }}>● Syncing…</span>}
          {view === "shop" && (
            <button onClick={() => setShowAdminCart(true)} className="ghost-btn" style={{ gap: 8, padding: "10px 18px" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
              Staff Cart {adminCartCount > 0 && <span style={{ background: "#e8a0b4", color: "#000000", borderRadius: "50%", width: 18, height: 18, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700 }}>{adminCartCount}</span>}
            </button>
          )}
          <button className="ghost-btn" style={{ padding: "10px 18px" }} onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 2, marginBottom: 22, flexWrap: "wrap" }}>
        {TABS.map(([v, l]) => <button key={v} className={"cat-tab " + (view === v ? "active" : "")} onClick={() => setView(v)}>{l}</button>)}
      </div>

      {view === "orders" && (
        <div className="fade-in">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
            {[
              ["TOTAL REVENUE",    GHS(stats.confirmedRev), "#e8a0b4"],
              ["ACTIVE ORDERS",    activeOrders.length,     "#111111"],
              ["PENDING PAYMENT",  activeOrders.filter(o => !o.status.payment).length, "#e8a0b4"],
            ].map(([label, val, color]) => (
              <div key={label} style={{ background: "#fafafa", padding: "20px", border: "1px solid #e8e8e8", borderLeft: "4px solid " + color }}>
                <p style={{ fontSize: 9, color: "#666666", letterSpacing: ".1em", marginBottom: 4, fontFamily: "'Raleway',sans-serif" }}>{label}</p>
                <p style={{ fontSize: 24, color: "#111111" }}>{val}</p>
              </div>
            ))}
          </div>
          <AdminOrdersView orders={orders} updateOrderStatus={updateOrderStatus} updateOrderFields={updateOrderFields} deleteOrder={handleDeleteRequest} onBulkDelete={triggerBulkDelete} adminPwd={adminPwd} awaitingDelivery={awaitingDelivery} />
        </div>
      )}
      {view === "log" && (
        <div className="fade-in">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 4px", marginBottom: 16 }}>
            <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, color: "#666666", letterSpacing: ".1em" }}>{showAllLog ? "MASTER RECORD · ALL HISTORY" : "RECENT ACTIVITY · LAST 30 DAYS"}</p>
            <button onClick={() => setShowAllLog(!showAllLog)} style={{ background: "none", border: "none", color: "#e8a0b4", fontFamily: "'Raleway',sans-serif", fontSize: 10, fontWeight: "bold", cursor: "pointer", textDecoration: "underline" }}>{showAllLog ? "Show Recent Only" : "Show All History"}</button>
          </div>
          <div style={{ marginBottom: 16, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <input value={logSearch} onChange={e => setLogSearch(e.target.value)} placeholder="Search by ID, name, or phone…" style={{ maxWidth: 400, flex: 1 }} />
            <button onClick={exportCSV} className="rose-btn" style={{ height: "42px", padding: "0 20px", display: "inline-flex", alignItems: "center", gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              EXPORT CSV
            </button>
          </div>
          <OrdersList orders={filteredLog} updateOrderStatus={updateOrderStatus} updateOrderFields={updateOrderFields} deleteOrder={handleDeleteRequest} onBulkDelete={triggerBulkDelete} adminPwd={adminPwd} />
        </div>
      )}
      {view === "reviews"   && <ErrorBoundary><AdminTestimonialsView testimonials={testimonials} setTestimonials={setTestimonials} /></ErrorBoundary>}
      {view === "products"  && <ErrorBoundary><AdminProductsView products={products} allFlat={allFlat} addProduct={addProduct} updateProduct={updateProduct} deleteProduct={deleteProduct} bulkUpdatePromos={bulkUpdatePromos} orders={orders} /></ErrorBoundary>}
      {view === "shop"      && (
        <div style={{ border: "1px solid #e8a0b488", padding: "32px 0 0", position: "relative", marginTop: 32, borderRadius: 4 }}>
          <div style={{ position: "absolute", top: -14, left: 24, background: "#ffffff", padding: "0 12px" }}>
            <span style={{ fontFamily: "'Raleway',sans-serif", fontSize: 13, color: "#e8a0b4", letterSpacing: ".2em", fontWeight: "bold" }}>SHOP PREVIEW</span>
          </div>
          <div style={{ position: "absolute", top: 12, right: 16 }}>
            <button onClick={() => setShowAdminCart(true)} style={{ background: "#e8a0b4", color: "#000000", border: "none", padding: "8px 16px", fontFamily: "'Raleway',sans-serif", fontSize: 10, fontWeight: "bold", cursor: "pointer", borderRadius: 2 }}>CART ({adminCartCount})</button>
          </div>
          <p style={{ padding: "0 24px 18px", fontFamily: "'Raleway',sans-serif", fontSize: 11, color: "#e8a0b4", letterSpacing: ".05em", fontStyle: "italic", opacity: 0.9 }}>Place orders on behalf of customers</p>
          <ShopPage products={products} activeCat={adminActiveCat} setActiveCat={setAdminActiveCat} addToCart={addToAdminCart} cart={adminCart} onSelectProduct={setSelectedAdminProduct} />
          {selectedAdminProduct && <ProductModal p={selectedAdminProduct} onClose={() => setSelectedAdminProduct(null)} addToCart={addToAdminCart} cart={adminCart} />}
        </div>
      )}
      {view === "insights"  && <InsightsView stats={stats} />}
      {view === "customers" && <AdminCustomers orders={[...orders, ...logOrders]} />}
      {view === "settings"  && <AdminSettingsView adminPwd={adminPwd} setAdminPwd={setAdminPwd} products={products} addProduct={addProduct} handleLogout={handleLogout} simulatedEnabled={simulatedEnabled} setSimulatedEnabled={setSimulatedEnabled} updateProduct={updateProduct} allFlat={allFlat} />}

      {showAdminCart && (
        <>
          <div className="drawer-overlay" onClick={() => setShowAdminCart(false)} />
          <CartDrawer cart={adminCart} updateCartQty={updateAdminQty} removeFromCart={removeAdminItem} cartTotal={adminCartTotal} onClose={() => setShowAdminCart(false)} addOrder={addOrder}
            onOrderPlaced={(res) => { setAdminCart([]); setShowAdminCart(false); if (onOrderPlaced) onOrderPlaced(res); }} products={products} staffMode />
        </>
      )}

      {deleteTargetOrder && (
        <DeleteOrderConfirmationModal
          order={deleteTargetOrder}
          onClose={() => setDeleteTargetOrder(null)}
          deleteOrder={deleteOrder}
          adminPwd={adminPwd}
        />
      )}

      {bulkDeleteTargets && (
        <BulkDeleteConfirmationModal
          orderIds={bulkDeleteTargets}
          onClose={() => { setBulkDeleteTargets(null); setOnBulkDeleteSuccess(null); }}
          deleteOrder={deleteOrder}
          adminPwd={adminPwd}
          onSuccess={onBulkDeleteSuccess}
        />
      )}
    </div>
  );
}

function AdminOrdersView({ orders, updateOrderStatus, updateOrderFields, deleteOrder, onBulkDelete, adminPwd, awaitingDelivery }) {
  const [open, setOpen] = useState(true);
  const [catFilter, setCatFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const filtered = useMemo(() => {
    let res = orders;
    if (catFilter !== "all") res = res.filter(o => o.items.some(i => (i.category || "").toLowerCase().includes(catFilter)));
    if (searchTerm.trim()) { const q = searchTerm.toLowerCase(); res = res.filter(o => o.id.toLowerCase().includes(q) || o.customer.name.toLowerCase().includes(q) || o.customer.phone.toLowerCase().includes(q) || (o.purchaseCode && o.purchaseCode.toLowerCase().includes(q))); }
    return res;
  }, [orders, catFilter, searchTerm]);
  const counts = useMemo(() => {
    const c = { all: orders.length, skincare: 0, wellness: 0, bundles: 0 };
    orders.forEach(o => { const cats = new Set(o.items.map(i => (i.category || "").toLowerCase())); cats.forEach(cat => { if (cat.includes("skincare")) c.skincare++; else if (cat.includes("wellness")) c.wellness++; else if (cat.includes("bundle")) c.bundles++; }); });
    return c;
  }, [orders]);
  const orderTabs = [["all","All Orders"],["skincare","Skincare"],["wellness","Wellness"],["bundles","Bundles"]];
  return (
    <div>
      <div style={{ position: "relative", marginBottom: 16 }}>
        <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search ID, name, phone, or code…" style={{ width: "100%", background: "#fafafa", border: "1px solid #e8e8e8", padding: "12px 16px 12px 42px", color: "#111111", fontFamily: "'Raleway',sans-serif", fontSize: 11 }} />
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666666" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        {searchTerm && <button onClick={() => setSearchTerm("")} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#e8a0b4", cursor: "pointer", fontSize: 14 }}>×</button>}
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        {orderTabs.map(([key, label]) => (
          <button key={key} onClick={() => setCatFilter(key)} style={{ background: catFilter === key ? "#e8a0b4" : "transparent", color: catFilter === key ? "#000000" : "#999999", border: "1px solid " + (catFilter === key ? "#e8a0b4" : "#333333"), padding: "8px 16px", fontSize: 10, fontFamily: "'Raleway',sans-serif", letterSpacing: ".1em", cursor: "pointer", transition: "all .2s", display: "flex", alignItems: "center", gap: 8 }}>
            {label.toUpperCase()}
            {counts[key] > 0 && <span style={{ background: catFilter === key ? "rgba(0,0,0,0.15)" : "#e8a0b4", color: "#000000", padding: "1px 6px", borderRadius: 10, fontSize: 9, fontWeight: "bold" }}>{counts[key]}</span>}
          </button>
        ))}
      </div>
      <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, color: "#666666", letterSpacing: ".1em", marginBottom: 16 }}>
        {catFilter === "all" ? "Showing all active orders" : "Showing orders containing " + catFilter.toUpperCase()}
      </p>
      {catFilter === "all" && awaitingDelivery.length > 0 && (
        <div style={{ marginBottom: 20, border: "1px solid #111111", background: "#111111" }}>
          <div style={{ padding: "12px 18px", display: "flex", justifyContent: "space-between", cursor: "pointer" }} onClick={() => setOpen(!open)}>
            <span style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, color: "#ffffff", letterSpacing: ".18em", display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="warning" size={12} color="#ffffff" /> AWAITING DELIVERY — {awaitingDelivery.length} ORDER{awaitingDelivery.length > 1 ? "S" : ""}</span>
            <span style={{ color: "#cccccc" }}>{open ? "▲" : "▼"}</span>
          </div>
          {open && (
            <div style={{ borderTop: "1px solid #333333", padding: "12px 18px", display: "flex", flexDirection: "column", gap: 8, background: "#fafafa" }}>
              {awaitingDelivery.map(o => {
                const days = Math.floor((Date.now() - o.timestamp) / 86400000);
                const col  = days >= 5 ? "#e8a0b4" : days >= 3 ? "#e8a0b4" : "#888888";
                return (
                  <div key={o.id} style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, padding: "10px 12px", background: "#ffffff", border: "1px solid #e8e8e8", borderLeft: "3px solid " + col }}>
                    <div>
                      <p style={{ fontSize: 14 }}>{o.customer?.name} <span style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, color: "#666666" }}>({o.customer?.phone})</span></p>
                      <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, color: "#666666", marginTop: 3 }}>{o.id} · {GHS(o.total)}</p>
                      <span className="tag" style={{ marginTop: 6, display: "inline-block", background: "#111111", color: "#ffffff", border: "1px solid #111111" }}>
                        {o.status.payment ? "Paid · Ready for Delivery" : "Packed — Awaiting Payment & Delivery"}
                      </span>
                      {o.status.payment && (
                        <span className="tag" style={{ display: "inline-block", marginLeft: 8, background: "#22c55e", color: "#ffffff", border: "1px solid #22c55e", fontSize: 9, fontWeight: "bold", letterSpacing: ".1em" }}>
                          VERIFIED ORDER
                        </span>
                      )}
                    </div>
                    <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 12, color: col, alignSelf: "center" }}>{ago(o.timestamp)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      <OrdersList orders={filtered} updateOrderStatus={updateOrderStatus} updateOrderFields={updateOrderFields} deleteOrder={deleteOrder} onBulkDelete={onBulkDelete} adminPwd={adminPwd} />
    </div>
  );
}

function OrdersList({ orders, updateOrderStatus, updateOrderFields, deleteOrder, onBulkDelete, adminPwd, readOnly }) {
  const [selectedIds, setSelectedIds] = useState(new Set());

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(orders.map(o => o.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Find duplicates
  const duplicateIds = useMemo(() => {
    return orders.filter(o => isDuplicateOrder(o, orders)).map(o => o.id);
  }, [orders]);

  const selectDuplicates = () => {
    setSelectedIds(new Set(duplicateIds));
  };

  const handleBulkDeleteClick = () => {
    if (selectedIds.size === 0) return;
    if (onBulkDelete) {
      onBulkDelete(Array.from(selectedIds), () => setSelectedIds(new Set()));
    }
  };

  if (!orders.length) return <div style={{ textAlign: "center", padding: "56px 0", border: "1px solid #e8e8e8" }}><p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 12, color: "#333333", letterSpacing: ".15em" }}>No orders found.</p></div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {!readOnly && orders.length > 0 && (
        <div style={{ background: "#fafafa", border: "1px solid #e8e8e8", padding: "12px 16px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, letterSpacing: ".1em", color: "#666666" }}>
              {selectedIds.size} SELECTED
            </span>
            {selectedIds.size > 0 ? (
              <button className="ghost-btn" onClick={clearSelection} style={{ fontSize: 9, padding: "4px 8px", minHeight: 0 }}>CLEAR</button>
            ) : (
              <button className="ghost-btn" onClick={selectAll} style={{ fontSize: 9, padding: "4px 8px", minHeight: 0 }}>SELECT ALL</button>
            )}
            {duplicateIds.length > 0 && (
              <button className="ghost-btn" onClick={selectDuplicates} style={{ fontSize: 9, padding: "4px 8px", minHeight: 0, color: "#e8a0b4", borderColor: "rgba(232, 160, 180, 0.3)" }}>
                SELECT DUPLICATES ({duplicateIds.length})
              </button>
            )}
          </div>
          {selectedIds.size > 0 && (
            <button className="rose-btn" onClick={handleBulkDeleteClick} style={{ background: "#ef4444", color: "#ffffff", padding: "6px 14px", fontSize: 9, height: "auto" }}>
              DELETE SELECTED
            </button>
          )}
        </div>
      )}
      {orders.map(o => {
        const isDup = duplicateIds.includes(o.id);
        return (
          <OrderCard
            key={o.id}
            order={o}
            updateOrderStatus={updateOrderStatus}
            updateOrderFields={updateOrderFields}
            deleteOrder={deleteOrder}
            adminPwd={adminPwd}
            readOnly={readOnly}
            isDuplicate={isDup}
            selected={selectedIds.has(o.id)}
            onToggleSelect={readOnly ? null : () => toggleSelect(o.id)}
          />
        );
      })}
    </div>
  );
}

function OrderCard({ order, updateOrderStatus, updateOrderFields, deleteOrder, adminPwd, readOnly, isDuplicate, selected, onToggleSelect }) {
  const [expanded, setExpanded] = useState(false);
  const [noteVal, setNoteVal] = useState(order.adminNote || "");
  const [estVal, setEstVal] = useState(order.estimatedDelivery || "");
  const [noteSaved, setNoteSaved] = useState(false);
  const [waSending, setWaSending] = useState(false);
  const [waMsg, setWaMsg] = useState("");

  const dateStr = new Date(order.timestamp).toLocaleDateString("en-GH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const returnOpen = Math.floor((Date.now() - order.timestamp) / 86400000) < 7;
  const { payment, packaged, dispatched, delivered } = order.status;

  let statusLabel, statusColor, statusBg;
  if (delivered)           { statusLabel = "Fulfilled";        statusColor = "#ffffff"; statusBg = "#111111"; }
  else if (dispatched)     { statusLabel = "Out for Delivery"; statusColor = "#ffffff"; statusBg = "#111111"; }
  else if (packaged)       { statusLabel = "Packed";           statusColor = "#ffffff"; statusBg = "#111111"; }
  else if (payment)        { statusLabel = "Paid · Packing";   statusColor = "#ffffff"; statusBg = "#111111"; }
  else                     { statusLabel = "Awaiting Payment"; statusColor = "#000000"; statusBg = "#ffffff"; }

  const saveNote = async () => {
    if (updateOrderFields) {
      await updateOrderFields(order.id, { adminNote: noteVal, estimatedDelivery: estVal });
      setNoteSaved(true); setTimeout(() => setNoteSaved(false), 2000);
    }
  };

  const sendWhatsApp = async () => {
    const phone = (order.customer?.phone || "").replace(/\D/g, "");
    const intlPhone = phone.startsWith("0") ? "233" + phone.slice(1) : phone;
    const token = import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN;
    const phoneId = import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID;
    if (!token || !phoneId) {
      const msg = `Hello ${order.customer?.name || "valued customer"}! 🌸\n\nYour Hajia Slay Empire order *${order.id}* is now *Out for Delivery*! 🚚\n\n${estVal ? "Estimated delivery: " + estVal + "\n\n" : ""}${noteVal ? noteVal + "\n\n" : ""}Track your order: https://hajiaslayempire.com\n\nThank you for shopping with us! 💕`;
      window.open("https://wa.me/" + intlPhone + "?text=" + encodeURIComponent(msg), "_blank");
      return;
    }
    setWaSending(true); setWaMsg("");
    try {
      const res = await fetch("https://graph.facebook.com/v19.0/" + phoneId + "/messages", {
        method: "POST",
        headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp", to: intlPhone, type: "text",
          text: { body: `Hello ${order.customer?.name || ""}! 🌸 Your Hajia Slay Empire order *${order.id}* is Out for Delivery! 🚚${estVal ? "\nEstimated: " + estVal : ""}${noteVal ? "\n" + noteVal : ""}\nTrack: https://hajiaslayempire.com 💕` }
        })
      });
      setWaMsg(res.ok ? "✓ Sent!" : "✗ Failed"); 
    } catch { setWaMsg("✗ Error"); }
    setWaSending(false); setTimeout(() => setWaMsg(""), 3000);
  };

  const checks = [["payment","Paid","#e8a0b4","#111111"],["packaged","Packed","#ffffff","#111111"],["dispatched","Dispatched","#ffffff","#111111"],["delivered","Delivered","#ffffff","#111111"]];

  return (
    <>
      <div style={{ background: "#fafafa", border: "1px solid #222222" }}>
        <div className="order-row" style={{ padding: "18px 20px", display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10, cursor: "pointer" }} onClick={() => setExpanded(!expanded)}>
          {onToggleSelect && (
            <div onClick={e => { e.stopPropagation(); onToggleSelect(); }} style={{ paddingRight: 8, display: "flex", alignItems: "center" }}>
              <input type="checkbox" className="check-box" checked={selected} readOnly style={{ width: 16, height: 16, cursor: "pointer" }} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
              <span style={{ fontFamily: "'Raleway',sans-serif", fontSize: 9, color: "#e8a0b4", letterSpacing: ".2em" }}>{order.id}</span>
              {order.staffOrder && <span className="tag tag-blue">Staff</span>}
              <span className="tag" style={{ color: statusColor, background: statusBg, border: "1px solid " + (statusBg === "#111111" ? "#111111" : "#000000") }}>{statusLabel}</span>
              {payment && <span className="tag" style={{ background: "#22c55e", color: "#ffffff", border: "1px solid #22c55e", fontSize: 9, fontWeight: "bold", letterSpacing: ".1em" }}>VERIFIED ORDER</span>}
              {isDuplicate && <span className="tag tag-red" style={{ background: "#ef4444", color: "#ffffff", border: "1px solid #ef4444" }}>⚠️ POTENTIAL DUPLICATE</span>}
            </div>
            <p style={{ fontSize: 18, fontWeight: 400 }}>{order.customer?.name}</p>
            <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, color: "#666666", marginTop: 2 }}>{order.customer?.phone} · {dateStr}</p>
          </div>
          <div className="order-status-checks" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {checks.map(([k,l,c,bg]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 5, background: order.status[k] ? bg : "#111111", padding: "6px 10px", border: "1px solid " + (order.status[k] ? c : "#222222"), cursor: readOnly ? "default" : "pointer", transition: "all .2s" }}
                onClick={e => { e.stopPropagation(); if (!readOnly) updateOrderStatus(order.id, k, !order.status[k]); }}>
                <input type="checkbox" className="check-box" checked={!!order.status[k]} readOnly onChange={() => {}} />
                <span style={{ fontFamily: "'Raleway',sans-serif", fontSize: 9, color: order.status[k] ? c : "#666666", fontWeight: order.status[k] ? "bold" : "normal" }}>{l}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            <span style={{ color: "#e8a0b4", fontSize: 18, fontWeight: 300 }}>{GHS(order.total)}</span>
            <span className="tag" style={{ background: returnOpen ? "#111111" : "#222222", color: returnOpen ? "#ffffff" : "#666666" }}>{returnOpen ? "Return Open" : "Return Closed"}</span>
          </div>
          <span style={{ color: "#666666" }}>{expanded ? "▲" : "▼"}</span>
        </div>
        {expanded && (
          <div style={{ borderTop: "1px solid #e8e8e8", padding: "18px 20px", display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 20 }}>
              {/* Customer Info */}
              <div style={{ position: "relative" }}>
                <button onClick={e => { e.stopPropagation(); const win = window.open("","_blank"); let h = "<html><head><title>"+STORE_NAME+" Receipt - "+order.id+"</title><style>body{font-family:sans-serif;padding:40px;color:#222;max-width:500px;margin:0 auto}.h{display:flex;justify-content:space-between;border-bottom:2px solid #c06080;padding-bottom:10px;margin-bottom:20px}.t{font-size:22px;font-weight:bold;letter-spacing:2px;color:#c06080}.it{width:100%;border-collapse:collapse;margin:20px 0}.it th{text-align:left;border-bottom:1px solid #ddd;padding:8px}.it td{padding:8px;border-bottom:1px solid #eee}.tot{font-size:18px;font-weight:bold;text-align:right;margin-top:15px;color:#c06080}.f{margin-top:40px;font-size:11px;text-align:center;color:#888}</style></head>"; h+="<body onload='window.print()'><div class='h'><div class='t'>HAJIA SLAY EMPIRE</div><div>"+order.id+"</div></div>"; h+="<p><strong>Customer:</strong> "+(order.customer?.name||"")+"<br><strong>Phone:</strong> "+(order.customer?.phone||"")+"<br><strong>Date:</strong> "+new Date(order.timestamp).toLocaleString()+"</p>"; h+="<table class='it'><thead><tr><th>Product</th><th>Qty</th><th>Subtotal</th></tr></thead><tbody>"; order.items.forEach(i=>{h+="<tr><td>"+i.name+"</td><td>"+i.qty+"</td><td>GH₵ "+(i.price*i.qty)+"</td></tr>";}); h+="</tbody></table><div class='tot'>Total Paid: GH₵ "+order.total+"</div><div class='f'>THANK YOU FOR SHOPPING WITH HAJIA SLAY EMPIRE<br>"+PHONE+"</div></body></html>"; win.document.write(h); win.document.close(); }} style={{ position: "absolute", top: -8, right: 0, background: "#e8a0b4", color: "#000000", border: "none", padding: "4px 8px", fontSize: 9, fontWeight: "bold", cursor: "pointer", zIndex: 10 }}>PRINT</button>
                <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 9, color: "#666666", letterSpacing: ".2em", marginBottom: 10 }}>CUSTOMER</p>
                <p style={{ fontSize: 16, marginBottom: 5 }}>{order.customer?.name}</p>
                <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 11, color: "#888888", marginBottom: 3 }}>📞 {order.customer?.phone}</p>
                {order.customer?.email && <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 11, color: "#888888", marginBottom: 3 }}>✉ {order.customer.email}</p>}
                <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 11, color: "#888888", lineHeight: 1.6 }}>📍 {[order.customer?.streetAddress, order.customer?.apartment, order.customer?.city, order.customer?.country].filter(Boolean).join(", ")}</p>
                {order.customer?.notes && <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, color: "#666666", marginTop: 8, fontStyle: "italic" }}>Note: {order.customer.notes}</p>}
                {order.purchaseCode && <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 11, color: "#e8a0b4", marginTop: 10, letterSpacing: ".15em" }}>Code: {order.purchaseCode}</p>}
                {order.momoRef && <div style={{ marginTop: 10, background: "#fafafa", padding: "8px 12px" }}><p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 9, color: "#e8a0b4", marginBottom: 3 }}>MOMO REF</p><p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 12, color: "#111111" }}>{order.momoRef}</p></div>}
                {order.paystackRef && <div style={{ marginTop: 10, background: "#fafafa", padding: "8px 12px" }}><p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 9, color: "#e8a0b4", marginBottom: 3 }}>PAYSTACK REF</p><p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 12, color: "#111111" }}>{order.paystackRef}</p></div>}
              </div>
              {/* Items */}
              <div>
                <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 9, color: "#666666", letterSpacing: ".2em", marginBottom: 10 }}>ITEMS</p>
                {order.items?.map(item => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid #e8e8e8" }}>
                    <div><span style={{ fontFamily: "'Raleway',sans-serif", fontSize: 9, color: "#e8a0b4", marginRight: 6 }}>{item.id}</span><span style={{ fontSize: 14 }}>{item.name}</span><span style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, color: "#666666", marginLeft: 5 }}>×{item.qty}</span></div>
                    <span style={{ fontFamily: "'Raleway',sans-serif", fontSize: 12, color: "#999999" }}>{GHS((item.promoActive && item.promoPrice ? item.promoPrice : item.price) * item.qty)}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
                  <span style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, color: "#888888" }}>Total</span>
                  <span style={{ fontSize: 18, color: "#e8a0b4" }}>{GHS(order.total)}</span>
                </div>
              </div>
            </div>
            {/* Admin Note + Estimated Delivery */}
            {!readOnly && (
              <div style={{ background: "#ffffff", border: "1px solid #e8e8e8", borderLeft: "3px solid #e8a0b4", padding: "16px" }}>
                <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 9, color: "#666666", letterSpacing: ".18em", marginBottom: 14 }}>ADMIN NOTE & DELIVERY INFO</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <div>
                    <label>Estimated Delivery</label>
                    <input value={estVal} onChange={e => setEstVal(e.target.value)} placeholder="e.g. Mon 16 Jun · 2–5pm" />
                  </div>
                  <div>
                    <label>Admin Note (visible to customer)</label>
                    <input value={noteVal} onChange={e => setNoteVal(e.target.value)} placeholder="e.g. Call when nearby" />
                  </div>
                </div>
                <button onClick={saveNote} style={{ background: noteSaved ? "#22c55e" : "#111111", color: "#ffffff", border: "none", padding: "8px 20px", fontFamily: "'Raleway',sans-serif", fontSize: 9, letterSpacing: ".15em", cursor: "pointer", transition: "background .3s" }}>
                  {noteSaved ? "✓ SAVED" : "SAVE NOTE"}
                </button>
              </div>
            )}
            {/* WhatsApp + Delete */}
            {!readOnly && (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button onClick={sendWhatsApp} disabled={!packaged || waSending}
                  style={{ display: "flex", alignItems: "center", gap: 8, background: packaged ? "#25D366" : "#333333", color: "#ffffff", border: "none", padding: "10px 18px", fontFamily: "'Raleway',sans-serif", fontSize: 9, letterSpacing: ".12em", cursor: packaged ? "pointer" : "not-allowed", opacity: packaged ? 1 : 0.5, transition: "all .2s" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.989.574 3.842 1.563 5.408L2 22l4.748-1.543A9.954 9.954 0 0011.999 22C17.522 22 22 17.523 22 12S17.522 2 11.999 2zm0 18c-1.72 0-3.322-.498-4.667-1.355l-.334-.2-3.462 1.124 1.152-3.37-.218-.347A7.951 7.951 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-7.001 8z"/></svg>
                  {waSending ? "SENDING…" : waMsg || (packaged ? "SEND DELIVERY NOTIFICATION" : "MARK PACKAGED FIRST")}
                </button>
                <button onClick={() => deleteOrder(order.id)}
                  style={{ background: "transparent", color: "#e8a0b4", border: "1px solid #e8a0b4", padding: "10px 18px", fontFamily: "'Raleway',sans-serif", fontSize: 9, letterSpacing: ".12em", cursor: "pointer" }}>
                  DELETE ORDER
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}


function AdminTestimonialsView({ testimonials, setTestimonials }) {
  const list = Array.isArray(testimonials) ? testimonials : [];
  const [form, setForm] = useState({ name: "", handle: "", review: "", rating: 5 });
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState({ text: "", ok: true });
  const EMPTY = { name: "", handle: "", review: "", rating: 5 };
  const showToast = (text, ok = true) => { setToast({ text, ok }); setTimeout(() => setToast({ text: "", ok: true }), 4000); };
  const submit = async () => {
    if (!form.name.trim() || !form.review.trim()) return showToast("Name and Review are required.", false);
    setBusy(true);
    try {
      if (editingId) {
        setTestimonials(prev => prev.map(t => t.id === editingId ? { ...t, ...form } : t));
        if (supa._ready) { const { error } = await supa.updateTestimonial(editingId, form); if (error) showToast("Saved locally. Cloud sync failed.", false); else showToast("Updated!"); }
        else showToast("Updated locally.");
        setEditingId(null);
      } else {
        const localId = Date.now();
        const newEntry = { ...form, id: localId, created_at: new Date().toISOString() };
        setTestimonials(prev => [newEntry, ...prev]);
        if (supa._ready) { const { data, error } = await supa.insertTestimonial(form); if (!error && data && data[0]) { setTestimonials(prev => prev.map(t => t.id === localId ? data[0] : t)); showToast("Review published!"); } else showToast("Saved locally. DB error.", false); }
        else showToast("Added locally.");
      }
    } catch (e) { showToast("Error: " + e.message, false); }
    setForm(EMPTY); setBusy(false);
  };
  const del = async (id) => {
    if (!verifyAdminPassword("delete this review")) return;
    if (!confirm("Delete this review permanently?")) return;
    setTestimonials(prev => prev.filter(t => t.id !== id));
    if (supa._ready) await supa.deleteTestimonial(id);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {toast.text && <div style={{ padding: "14px 20px", background: "#fafafa", border: "1px solid " + (toast.ok ? "#e8e8e8" : "#e8a0b444"), color: toast.ok ? "#111111" : "#e8a0b4", fontFamily: "'Raleway',sans-serif", fontSize: 11, letterSpacing: ".08em", animation: "fadeIn .3s ease" }}>{toast.text}</div>}
      <div style={{ background: "#fafafa", padding: "24px", border: "1px solid #e8e8e8" }}>
        <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, color: "#e8a0b4", letterSpacing: ".18em", marginBottom: 20 }}>{editingId ? "EDIT TESTIMONIAL" : "ADD TESTIMONIAL"}</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <Fld label="Customer Name"><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Abena Osei" /></Fld>
          <Fld label="Social Handle (@)"><input value={form.handle} onChange={e => setForm({ ...form, handle: e.target.value.replace("@","") })} placeholder="e.g. abena_glows" /></Fld>
        </div>
        <Fld label="Review Text"><textarea value={form.review} onChange={e => setForm({ ...form, review: e.target.value })} placeholder="What did they say about their glow?" style={{ height: 80 }} /></Fld>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Fld label="Rating (1-5)"><select value={form.rating} onChange={e => setForm({ ...form, rating: Number(e.target.value) })}>{[5,4,3,2,1].map(n => <option key={n} value={n}>{n} Stars</option>)}</select></Fld>
          <button className="rose-btn" onClick={submit} disabled={busy}>{busy ? "SAVING…" : (editingId ? "UPDATE" : "ADD REVIEW")}</button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {list.length === 0 && <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 20px", border: "1px solid #e8e8e8", background: "#fafafa" }}><p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 12, color: "#333333", letterSpacing: ".15em" }}>NO REVIEWS YET — Add your first glow story above.</p></div>}
        {list.map(t => (
          <div key={t.id} style={{ background: "#fafafa", padding: "20px", border: "1px solid #e8e8e8", position: "relative" }}>
            <div style={{ marginBottom: 8 }}><StarRating count={t.rating} size={12} /></div>
            <p style={{ fontSize: 13, fontStyle: "italic", color: "#111111", lineHeight: 1.5 }}>"{t.review}"</p>
            <p style={{ fontSize: 12, fontWeight: "bold", margin: "12px 0 2px" }}>{t.name}</p>
            <p style={{ fontSize: 10, color: "#666666" }}>@{t.handle || "verified_customer"}</p>
            <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 10, alignItems: "center" }}>
              <button onClick={() => { setEditingId(t.id); setForm({ name: t.name, handle: t.handle || "", review: t.review, rating: Number(t.rating) || 5 }); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={{ background: "none", border: "none", color: "#e8a0b4", cursor: "pointer", fontSize: 10, fontFamily: "'Raleway',sans-serif", textTransform: "uppercase", letterSpacing: ".1em" }}>Edit</button>
              <button onClick={() => del(t.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 10, fontFamily: "'Raleway',sans-serif", textTransform: "uppercase", letterSpacing: ".1em" }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BulkUpdatePanel({ allFlat, updateProduct, applyPromo, bulkUpdatePromos }) {
  const [open, setOpen] = useState(false);
  const [bulkPct, setBulkPct] = useState("");
  const [bulkCat, setBulkCat] = useState("all");
  const [bulkMsg, setBulkMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const cats = [["all","All Categories"],["skincare","Skincare"],["wellness","Wellness"],["bundles","Bundles & Sets"]];
  const promoCount = allFlat.filter(p => p.promoActive && p.promoPrice).length;

  const applyBulk = async () => {
    const pct = Number(bulkPct);
    if (isNaN(pct) || pct <= 0 || pct >= 100) { setBulkMsg("Enter a valid % (1–99)."); return; }
    const targets = bulkCat === "all" ? allFlat : allFlat.filter(p => p.category === bulkCat);
    if (targets.length === 0) { setBulkMsg("No products in this category."); return; }
    setBusy(true);
    const updatesList = targets.map(p => {
      const basePrice = Math.max(p.originalPrice || 0, p.price || 0);
      const promoPrice = Math.round(basePrice * (1 - pct / 100));
      return { cat: p.category, id: p.id, updates: { promoActive: true, promoPrice } };
    });
    await bulkUpdatePromos(updatesList);
    setBulkMsg(`✓ Applied ${pct}% off to ${targets.length} product${targets.length !== 1 ? "s" : ""}.`);
    setBusy(false);
    setTimeout(() => setBulkMsg(""), 4000);
  };

  const clearAll = async () => {
    if (!window.confirm("Are you sure you want to clear all active promotional discounts? This will revert all products to their original prices.")) return;
    const activePromos = allFlat.filter(p => p.promoActive);
    if (activePromos.length === 0) { setBulkMsg("No active promos to clear."); return; }
    setBusy(true);
    const updatesList = activePromos.map(p => ({ cat: p.category, id: p.id, updates: { promoActive: false, promoPrice: null } }));
    await bulkUpdatePromos(updatesList);
    setBulkMsg(`✓ All promos cleared.`);
    setBusy(false);
    setTimeout(() => setBulkMsg(""), 3000);
  };

  return (
    <div style={{ border: "1px solid #e8e8e8", marginBottom: 0 }}>
      <div style={{ padding: "14px 18px", background: "#fafafa", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setOpen(o => !o)}>
        <span style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, color: "#e8a0b4", letterSpacing: ".18em", display: "inline-flex", alignItems: "center", gap: 8 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          BULK PRICE / PROMO UPDATE
          {promoCount > 0 && <span style={{ background: "#22c55e", color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 9, fontWeight: "bold" }}>{promoCount} ACTIVE</span>}
        </span>
        <span style={{ color: "#888888", fontSize: 12 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div style={{ padding: "20px 18px", borderTop: "1px solid #e8e8e8", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div>
              <label>Category</label>
              <select value={bulkCat} onChange={e => setBulkCat(e.target.value)}>
                {cats.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label>Discount %</label>
              <input type="number" min="0" max="99" value={bulkPct} onChange={e => setBulkPct(e.target.value)} placeholder="e.g. 20" />
            </div>
            <button className="rose-btn" onClick={applyBulk} disabled={busy} style={{ height: 42, whiteSpace: "nowrap" }}>{busy ? "APPLYING…" : "APPLY TO ALL"}</button>
            <button className="ghost-btn" onClick={clearAll} disabled={busy} style={{ height: 42, whiteSpace: "nowrap" }}>{busy ? "CLEARING…" : "CLEAR ALL PROMOS"}</button>
          </div>
          {bulkMsg && <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 11, color: "#22c55e", letterSpacing: ".05em" }}>{bulkMsg}</p>}
          {promoCount > 0 && (
            <div style={{ background: "#fafafa", padding: "12px 14px", borderLeft: "3px solid #e8a0b4" }}>
              <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 9, color: "#e8a0b4", letterSpacing: ".15em", marginBottom: 8 }}>CURRENTLY ON PROMO</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {allFlat.filter(p => p.promoActive && p.promoPrice).map(p => {
                  const disc = Math.round((1 - p.promoPrice / (p.originalPrice || p.price)) * 100);
                  return (
                    <span key={p.id} style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, background: "#111111", color: "#ffffff", padding: "4px 10px", display: "inline-flex", gap: 6, alignItems: "center" }}>
                      {p.name} <strong style={{ color: "#e8a0b4" }}>−{disc}%</strong>
                      <button onClick={() => bulkUpdatePromos([{ cat: p.category, id: p.id, updates: { promoActive: false, promoPrice: null } }])} style={{ background: "none", border: "none", color: "#888888", cursor: "pointer", fontSize: 12, padding: 0, lineHeight: 1 }}>×</button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AdminProductsView({ products, allFlat, addProduct, updateProduct, deleteProduct, bulkUpdatePromos, orders }) {
  const EMPTY = { image: "", secondaryImage: "", name: "", brand: "", category: "skincare", subcategory: "face wash", price: "", notes: "", extra: "", gender: "women", stock: "10", lowStockThreshold: "3", bestseller: false, isTrending: false };
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState("");
  const [del, setDel] = useState({});
  const [imgEdit, setImgEdit] = useState({});
  const [search, setSearch] = useState("");
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const topProducts = useMemo(() => { const counts = {}; orders.forEach(o => o.items?.forEach(i => { counts[i.id] = (counts[i.id] || 0) + i.qty; })); return Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0,5).map(([id,count]) => ({ id, count, p: allFlat.find(x => x.id === id) })); }, [orders, allFlat]);
  const oos = allFlat.filter(p => p.stock === 0);
  const low = allFlat.filter(p => p.stock > 0 && p.stock <= p.lowStockThreshold);
  const handleEdit = (cat, p) => { setEditingId({ cat, id: p.id }); setForm({ image: p.image || "", secondaryImage: p.secondaryImage || "", name: p.name, brand: p.brand || "", category: cat, subcategory: p.subcategory || "face wash", price: p.price, notes: p.notes || "", extra: p.extra || "", gender: p.gender || "women", stock: p.stock, lowStockThreshold: p.lowStockThreshold || 3, bestseller: !!p.bestseller, isTrending: !!p.isTrending }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const handleAdd = () => {
    if (!form.name.trim() || !form.price || isNaN(form.price)) { setToast("WARN: Name and a valid price are required."); return; }
    if (editingId) { updateProduct(editingId.cat, editingId.id, { ...form, price: Number(form.price), stock: Number(form.stock || 10), lowStockThreshold: Number(form.lowStockThreshold || 3) }); setToast("Product updated!"); }
    else { addProduct(form.category, { ...form, price: Number(form.price), stock: Number(form.stock || 10), lowStockThreshold: Number(form.lowStockThreshold || 3) }); setToast("Product added!"); }
    setForm(EMPTY); setEditingId(null); setTimeout(() => setToast(""), 3000);
  };
  const applyPromo = (cat, p, pct) => {
    const percent = Number(pct);
    if (!percent || percent <= 0 || percent >= 100) {
      bulkUpdatePromos([{ cat, id: p.id, updates: { promoActive: false, promoPrice: null } }]);
    } else {
      const promoPrice = Math.round((p.originalPrice || p.price) * (1 - percent / 100));
      bulkUpdatePromos([{ cat, id: p.id, updates: { promoActive: true, promoPrice } }]);
    }
  };
  const filteredProducts = useMemo(() => { if (!search.trim()) return allFlat; const q = search.toLowerCase(); return allFlat.filter(p => p.id.toLowerCase().includes(q) || p.name.toLowerCase().includes(q) || (p.brand || "").toLowerCase().includes(q) || p.category.toLowerCase().includes(q)); }, [allFlat, search]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", background: "#fafafa", padding: "16px", border: "1px solid #e8e8e8" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#666666", display: "flex", alignItems: "center" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…" style={{ width: "100%", padding: "12px 16px 12px 42px", background: "#ffffff", border: "1px solid #e8e8e8", color: "#111111", fontFamily: "'Raleway',sans-serif", fontSize: 12 }} />
          {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#e8a0b4", cursor: "pointer" }}>×</button>}
        </div>
        <button className="rose-btn" onClick={() => { setEditingId(null); setForm(EMPTY); window.scrollTo({ top: 0, behavior: "smooth" }); }}>+ NEW PRODUCT</button>
      </div>
      {(oos.length > 0 || low.length > 0) && (
        <div style={{ border: "1px solid #e8e8e8", background: "#fafafa", padding: "16px 18px" }}>
          <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, color: "#eab308", letterSpacing: ".18em", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}><Icon name="warning" size={12} color="#eab308" /> STOCK ALERTS</p>
          {oos.map(p => <p key={p.id} style={{ fontFamily: "'Raleway',sans-serif", fontSize: 11, color: "#ef4444", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}><Icon name="dotRed" size={8} color="#ef4444" /> {p.id} — {p.name} — OUT OF STOCK</p>)}
          {low.map(p => <p key={p.id} style={{ fontFamily: "'Raleway',sans-serif", fontSize: 11, color: "#eab308", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}><Icon name="dotAmber" size={8} color="#eab308" /> {p.id} — {p.name} — Low Stock ({p.stock} left)</p>)}
        </div>
      )}
      {topProducts.length > 0 && (
        <div style={{ background: "#fafafa", padding: "16px 18px" }}>
          <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, color: "#e8a0b4", letterSpacing: ".18em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}><Icon name="star" size={12} color="#e8a0b4" /> TOP ORDERED</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {topProducts.map(({ id, count, p }) => (
              <div key={id} style={{ background: "#f5f5f5", padding: "8px 14px", display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontFamily: "'Raleway',sans-serif", fontSize: 9, color: "#e8a0b4" }}>{id}</span>
                <span style={{ fontSize: 14 }}>{p?.name || id}</span>
                <span className="tag tag-rose">{count} ordered</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{ background: "#fafafa", border: "1px solid #e8e8e8", padding: "22px" }}>
        <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, color: "#e8a0b4", letterSpacing: ".2em", marginBottom: 16 }}>{editingId ? "EDIT PRODUCT" : "ADD NEW PRODUCT"}</p>
        {toast && <div style={{ background: toast.startsWith("WARN:") ? "#222222" : "#111111", border: "1px solid " + (toast.startsWith("WARN:") ? "#e8a0b444" : "#ffffff44"), padding: "10px 14px", fontFamily: "'Raleway',sans-serif", fontSize: 11, color: toast.startsWith("WARN:") ? "#e8a0b4" : "#ffffff", marginBottom: 14 }}>{toast}</div>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, gridColumn: "1/-1" }}>
            <div><label style={{ display: "block", fontFamily: "'Raleway',sans-serif", fontSize: 9, color: "#e8a0b4", letterSpacing: ".15em", marginBottom: 6 }}>PRIMARY IMAGE — Product Photo</label><ImageInput value={form.image} onChange={v => setF("image", v)} /></div>
            <div><label style={{ display: "block", fontFamily: "'Raleway',sans-serif", fontSize: 9, color: "#e8a0b4", letterSpacing: ".15em", marginBottom: 6 }}>SECONDARY IMAGE — Back / Ingredients / In-Use</label><ImageInput value={form.secondaryImage} onChange={v => setF("secondaryImage", v)} /></div>
          </div>
          <Fld label="Product Name *"><input value={form.name} onChange={e => setF("name", e.target.value)} /></Fld>
          <Fld label="Brand"><input value={form.brand} onChange={e => setF("brand", e.target.value)} /></Fld>
          <Fld label="Category"><select value={form.category} onChange={e => { setF("category", e.target.value); setF("subcategory", SUBCAT_OPTS[e.target.value][0]); }}><option value="skincare">Skincare</option><option value="wellness">Wellness</option><option value="bundles">Bundles & Sets</option></select></Fld>
          <Fld label="Subcategory"><select value={form.subcategory} onChange={e => setF("subcategory", e.target.value)}>{SUBCAT_OPTS[form.category].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}</select></Fld>
          <Fld label="For"><select value={form.gender} onChange={e => setF("gender", e.target.value)}><option value="women">Women</option><option value="both">Unisex</option><option value="men">Men</option><option value="kids">Kids</option></select></Fld>
          <Fld label="Price (GH₵) *"><input type="number" value={form.price} onChange={e => setF("price", e.target.value)} /></Fld>
          <Fld label="Stock Qty"><input type="number" value={form.stock} onChange={e => setF("stock", e.target.value)} /></Fld>
          <Fld label="Low Stock Alert At"><input type="number" value={form.lowStockThreshold} onChange={e => setF("lowStockThreshold", e.target.value)} /></Fld>
          <Fld label="Key Ingredients / Benefits"><textarea value={form.notes} onChange={e => setF("notes", e.target.value)} placeholder="e.g. Vitamin C · Niacinamide · SPF 30 (Use Enter to add spacing and structure key headings and points)" style={{ height: 100, resize: "vertical" }} /></Fld>
          <Fld label="Size / Volume / Type"><input value={form.extra} onChange={e => setF("extra", e.target.value)} placeholder="e.g. 50ml · 30 capsules" /></Fld>
          <div style={{ display: "flex", gap: 20, gridColumn: "1/-1", marginTop: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="checkbox" className="check-box" checked={form.bestseller} onChange={e => setF("bestseller", e.target.checked)} /><label style={{ margin: 0, cursor: "pointer", fontSize: 11 }}>Mark as Bestseller</label></div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="checkbox" className="check-box" checked={form.isTrending} onChange={e => setF("isTrending", e.target.checked)} /><label style={{ margin: 0, cursor: "pointer", fontSize: 11 }}>Mark as Trending</label></div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button className="rose-btn" onClick={handleAdd}>{editingId ? "Update Product" : "Add Product to Shop"}</button>
          {editingId && <button className="ghost-btn" onClick={() => { setForm(EMPTY); setEditingId(null); }}>Cancel Edit</button>}
        </div>
      </div>
      {/* ── BULK UPDATE PANEL ── */}
      <BulkUpdatePanel allFlat={allFlat} updateProduct={updateProduct} applyPromo={applyPromo} bulkUpdatePromos={bulkUpdatePromos} />
      {["skincare","wellness","bundles"].map(cat => (
        <div key={cat} style={{ border: "1px solid #e8e8e8" }}>
          <div style={{ padding: "12px 18px", background: "#fafafa", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, color: "#e8a0b4", letterSpacing: ".18em" }}>{CAT_LABELS[cat].toUpperCase()}</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
              <thead><tr style={{ borderBottom: "1px solid #e8e8e8" }}>{["# Rank","Product","Primary Img","Detail Img","Price","Stock","% Off","Action"].map(h => (<th key={h} style={{ padding: "10px 12px", textAlign: "left", fontFamily: "'Raleway',sans-serif", fontSize: 9, color: "#666666", letterSpacing: ".15em" }}>{h}</th>))}</tr></thead>
              <tbody>
                {(filteredProducts.filter(p => p.category === cat)).map((p, pIdx) => {
                  const pct = p.promoActive && p.promoPrice ? Math.round((1 - p.promoPrice / (p.originalPrice || p.price)) * 100) : "";
                  return (
                    <tr key={p.id} style={{ borderBottom: "1px solid #1a1a1a" }}>
                      <td style={{ padding: "12px", fontFamily: "'Raleway',sans-serif", fontSize: 10, color: "#e8a0b4", fontWeight: "bold" }}>#{pIdx + 1}</td>
                      <td style={{ padding: "12px" }}><p style={{ fontSize: 14 }}>{p.name} <span style={{ fontFamily: "'Raleway',sans-serif", fontSize: 9, color: "#e8a0b4" }}>{p.id}</span></p><p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 9, color: "#666666", marginTop: 2 }}>{p.brand} · {p.subcategory}</p></td>
                      <td style={{ padding: "12px", width: 70 }}>
                        <div><p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 8, color: "#e8a0b4", letterSpacing: ".1em", marginBottom: 4 }}>PRIMARY</p>
                          <ImageInputCompact value={imgEdit[p.id] !== undefined ? imgEdit[p.id] : (p.image || "")} onChange={v => { setImgEdit(prev => ({ ...prev, [p.id]: v })); updateProduct(cat, p.id, { image: v }); }} />
                        </div>
                      </td>
                      <td style={{ padding: "12px", width: 70 }}>
                        <div><p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 8, color: "#e8a0b4", letterSpacing: ".1em", marginBottom: 4 }}>DETAIL</p>
                          <ImageInputCompact value={imgEdit[p.id + "_sec"] !== undefined ? imgEdit[p.id + "_sec"] : (p.secondaryImage || "")} onChange={v => { setImgEdit(prev => ({ ...prev, [p.id + "_sec"]: v })); updateProduct(cat, p.id, { secondaryImage: v }); }} />
                        </div>
                      </td>
                      <td style={{ padding: "12px" }}><input key={p.id + "_price_" + p.price} type="number" defaultValue={p.price} onBlur={e => updateProduct(cat, p.id, { price: Number(e.target.value) })} onKeyDown={e => e.key === "Enter" && updateProduct(cat, p.id, { price: Number(e.target.value) })} style={{ width: 80, padding: "5px 8px", fontSize: 12, minHeight: 0 }} /></td>
                      <td style={{ padding: "12px" }}>
                        <input key={p.id + "_stock_" + p.stock} type="number" defaultValue={p.stock} onBlur={e => updateProduct(cat, p.id, { stock: Number(e.target.value) })} onKeyDown={e => e.key === "Enter" && updateProduct(cat, p.id, { stock: Number(e.target.value) })} style={{ width: 60, padding: "5px 8px", fontSize: 12, minHeight: 0 }} />
                        {p.stock === 0 && <span className="tag tag-red" style={{ display: "block", marginTop: 3 }}>Out</span>}
                        {p.stock > 0 && p.stock <= p.lowStockThreshold && <span className="tag tag-amber" style={{ display: "block", marginTop: 3 }}>Low</span>}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <input key={p.id + "_promo_" + (pct || "none")} type="number" min="0" max="99" defaultValue={pct || ""} placeholder="e.g. 20" onBlur={e => applyPromo(cat, p, e.target.value)} onKeyDown={e => e.key === "Enter" && applyPromo(cat, p, e.target.value)} style={{ width: 70, padding: "5px 8px", fontSize: 12, minHeight: 0 }} />
                          <span style={{ fontFamily: "'Raleway',sans-serif", fontSize: 9, color: "#888888" }}>%</span>
                        </div>
                        {p.promoActive && p.promoPrice && <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 9, color: "#e8a0b4", marginTop: 4 }}>→ {GHS(p.promoPrice)}</p>}
                        {p.promoActive && p.promoPrice && <button onClick={() => applyPromo(cat, p, 0)} style={{ fontFamily: "'Raleway',sans-serif", fontSize: 9, color: "#e8a0b4", background: "none", border: "none", cursor: "pointer", padding: "2px 0", marginTop: 2 }}>Clear</button>}
                      </td>
                      <td style={{ padding: "12px" }}>
                        {del[p.id]
                          ? <div style={{ display: "flex", gap: 4 }}>
                              <button onClick={() => deleteProduct(cat, p.id)} style={{ fontFamily: "'Raleway',sans-serif", fontSize: 9, color: "#e8a0b4", background: "#f5f5f5", border: "1px solid #e8a0b4", padding: "6px 12px", cursor: "pointer", borderRadius: 2, fontWeight: "bold" }}>CONFIRM</button>
                              <button onClick={() => setDel(prev => ({ ...prev, [p.id]: false }))} style={{ fontFamily: "'Raleway',sans-serif", fontSize: 9, color: "#666666", background: "none", border: "1px solid #e8e8e8", padding: "6px 10px", cursor: "pointer", borderRadius: 2 }}>CANCEL</button>
                            </div>
                          : <div style={{ display: "flex", gap: 6 }}>
                              <button onClick={() => handleEdit(cat, p)} style={{ fontFamily: "'Raleway',sans-serif", fontSize: 9, color: "#e8a0b4", background: "rgba(232,160,180,0.05)", border: "1px solid #e8a0b488", padding: "6px 14px", cursor: "pointer", borderRadius: 2, fontWeight: "bold" }} onMouseEnter={e => { e.currentTarget.style.background = "#e8a0b4"; e.currentTarget.style.color = "#000000"; }} onMouseLeave={e => { e.currentTarget.style.background = "rgba(232,160,180,0.05)"; e.currentTarget.style.color = "#e8a0b4"; }}>EDIT</button>
                              <button onClick={() => setDel(prev => ({ ...prev, [p.id]: true }))} style={{ fontFamily: "'Raleway',sans-serif", fontSize: 9, color: "#e8a0b4", background: "rgba(232,160,180,0.05)", border: "1px solid #e8a0b488", padding: "6px 14px", cursor: "pointer", borderRadius: 2, fontWeight: "bold" }} onMouseEnter={e => { e.currentTarget.style.background = "#e8a0b4"; e.currentTarget.style.color = "#000000"; }} onMouseLeave={e => { e.currentTarget.style.background = "rgba(232,160,180,0.05)"; e.currentTarget.style.color = "#e8a0b4"; }}>DELETE</button>
                            </div>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

function InsightsView({ stats }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        {[
          { title: "REVENUE OVERVIEW",      rows: [{ val: GHS(stats.confirmedRev), label: "CONFIRMED (PAID)",   color: "#111111" }, { val: GHS(stats.pendingRev), label: "PENDING (UNPAID)", color: "#888" }] },
          { title: "MONTHLY PERFORMANCE",   rows: [{ val: GHS(stats.curMonthRev), label: "THIS MONTH SO FAR",   color: "#111111" }, { val: GHS(stats.lastMonthRev), label: "LAST MONTH TOTAL", color: "#666" }] },
          { title: "BUSINESS INTELLIGENCE", rows: [{ val: GHS(stats.aov), label: "AVG ORDER VALUE",            color: "#111111" }, { val: stats.lowStockItems + " of " + stats.totalItems, label: "LOW STOCK ALERTS", color: stats.lowStockItems > 0 ? "#e8a0b4" : "#111111" }] },
        ].map(({ title, rows }) => (
          <div key={title} style={{ background: "#fafafa", padding: 22, border: "1px solid #e8e8e8" }}>
            <p style={{ fontSize: 10, color: "#e8a0b4", letterSpacing: ".2em", marginBottom: 12, fontFamily: "'Raleway',sans-serif" }}>{title}</p>
            {rows.map(({ val, label, color }, i) => (
              <div key={label} style={{ ...(i > 0 ? { borderTop: "1px solid #e8e8e8", paddingTop: 16, marginTop: 16 } : {}) }}>
                <p style={{ fontSize: i === 0 ? 28 : 22, color }}>{val}</p>
                <p style={{ fontSize: 10, color: "#666666", marginTop: 4, fontFamily: "'Raleway',sans-serif" }}>{label}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ background: "#fafafa", padding: 22, border: "1px solid #e8e8e8" }}>
        <p style={{ fontSize: 10, color: "#e8a0b4", letterSpacing: ".2em", marginBottom: 20, fontFamily: "'Raleway',sans-serif" }}>PRODUCT INCOME BREAKDOWN</p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ borderBottom: "1px solid #e8e8e8" }}>{["#","PRODUCT","UNITS","REVENUE","% SHARE"].map(h => <th key={h} style={{ textAlign: h === "REVENUE" || h === "% SHARE" ? "right" : h === "UNITS" ? "center" : "left", padding: "10px 12px", fontSize: 9, color: "#666666", letterSpacing: ".15em", fontFamily: "'Raleway',sans-serif" }}>{h}</th>)}</tr></thead>
            <tbody>
              {stats.prodRank.length === 0
                ? <tr><td colSpan={5} style={{ padding: 32, textAlign: "center", fontSize: 12, color: "#222222", fontFamily: "'Raleway',sans-serif", letterSpacing: ".15em" }}>NO SALES DATA YET</td></tr>
                : stats.prodRank.map(([name, data], i) => {
                    const pct  = stats.confirmedRev > 0 ? ((data.rev / stats.confirmedRev) * 100).toFixed(1) : "0.0";
                    const barW = stats.confirmedRev > 0 ? (data.rev / stats.confirmedRev) * 100 : 0;
                    return (
                      <tr key={name} style={{ borderBottom: "1px solid #1a1a1a" }}>
                        <td style={{ padding: "12px", fontSize: 11, color: "#333333", fontFamily: "'Raleway',sans-serif", width: 32 }}>{String(i + 1).padStart(2, "0")}</td>
                        <td style={{ padding: "12px" }}>
                          <p style={{ fontSize: 14, margin: "0 0 4px" }}>{name}</p>
                          <div style={{ height: 2, background: "#f5f5f5", borderRadius: 1, width: "100%", maxWidth: 180 }}><div style={{ height: "100%", width: barW + "%", background: i === 0 ? "#e8a0b4" : "#333333", borderRadius: 1 }} /></div>
                        </td>
                        <td style={{ padding: "12px", fontSize: 13, color: "#888888", textAlign: "center" }}>{data.qty}</td>
                        <td style={{ padding: "12px", fontSize: 15, textAlign: "right", color: i === 0 ? "#e8a0b4" : "#111111", fontWeight: i === 0 ? 500 : 300 }}>{GHS(data.rev)}</td>
                        <td style={{ padding: "12px", fontSize: 12, textAlign: "right", color: "#666666", fontFamily: "'Raleway',sans-serif" }}>{pct}%</td>
                      </tr>
                    );
                  })
              }
            </tbody>
            {stats.prodRank.length > 0 && <tfoot><tr style={{ borderTop: "2px solid #222222" }}><td colSpan={3} style={{ padding: "12px", fontSize: 10, color: "#666666", fontFamily: "'Raleway',sans-serif", letterSpacing: ".1em" }}>TOTAL CONFIRMED REVENUE</td><td style={{ padding: "12px", fontSize: 16, textAlign: "right", color: "#e8a0b4" }}>{GHS(stats.confirmedRev)}</td><td style={{ padding: "12px", textAlign: "right", fontSize: 11, color: "#666666" }}>100%</td></tr></tfoot>}
          </table>
        </div>
      </div>
      <div style={{ background: "#fafafa", padding: 22, border: "1px solid #e8e8e8" }}>
        <p style={{ fontSize: 10, color: "#e8a0b4", letterSpacing: ".2em", marginBottom: 20, fontFamily: "'Raleway',sans-serif" }}>PAYMENT & FULFILLMENT STATUS (%)</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
          {[["Awaiting Payment", stats.sPct.unpaid, "#e8a0b4"],["Paid & Packing", stats.sPct.packing, "#e8a0b4"],["Out for Delivery", stats.sPct.delivering, "#111111"],["Fulfilled", stats.sPct.fulfilled, "#111111"]].map(([l,p,c]) => (
            <div key={l} style={{ background: "#ffffff", padding: 16, borderLeft: "2px solid " + c }}>
              <p style={{ fontSize: 22, color: c, fontWeight: 500 }}>{p}%</p>
              <p style={{ fontSize: 9, color: "#666666", marginTop: 4, letterSpacing: ".1em", fontFamily: "'Raleway',sans-serif" }}>{l.toUpperCase()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminCustomers({ orders }) {
  const [search, setSearch] = useState("");
  const map = useMemo(() => {
    const m = {};
    orders.forEach(o => {
      const ph = o.customer?.phone; if (!ph) return;
      if (!m[ph]) m[ph] = { name: o.customer.name, phone: ph, email: o.customer.email, orders: 0, spent: 0, first: o.timestamp, last: o.timestamp };
      m[ph].orders++; m[ph].spent += o.total;
      if (o.timestamp < m[ph].first) m[ph].first = o.timestamp;
      if (o.timestamp > m[ph].last)  m[ph].last  = o.timestamp;
    });
    return m;
  }, [orders]);
  const customers = useMemo(() => Object.values(map).sort((a,b) => b.last - a.last).filter(c => !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)), [map, search]);
  return (
    <div>
      <div style={{ marginBottom: 16 }}><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or phone…" style={{ maxWidth: 340 }} /></div>
      {!customers.length
        ? <div style={{ textAlign: "center", padding: "56px 0", border: "1px solid #e8e8e8" }}><p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 12, color: "#333333" }}>No customers yet</p></div>
        : <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {customers.map(c => (
            <div key={c.phone} style={{ background: "#fafafa", border: "1px solid #e8e8e8", padding: "16px 18px", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
                  <p style={{ fontSize: 17 }}>{c.name}</p>
                  {c.orders >= 5  && <span className="tag tag-teal">Gift Eligible</span>}
                  {(c.orders >= 3 || c.spent >= 1000) && <span className="tag tag-rose">VIP</span>}
                </div>
                <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 11, color: "#666666" }}>{c.phone}{c.email ? " · " + c.email : ""}</p>
              </div>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                <div style={{ textAlign: "center" }}><p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 9, color: "#666666", letterSpacing: ".12em", marginBottom: 4 }}>ORDERS</p><p style={{ fontSize: 22, color: "#111111", fontWeight: 300 }}>{c.orders}</p></div>
                <div style={{ textAlign: "center" }}><p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 9, color: "#666666", letterSpacing: ".12em", marginBottom: 4 }}>SPENT</p><p style={{ fontSize: 15, color: "#999999" }}>{GHS(c.spent)}</p></div>
                <div style={{ textAlign: "center" }}><p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 9, color: "#666666", letterSpacing: ".12em", marginBottom: 4 }}>LAST</p><p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 11, color: "#666666" }}>{ago(c.last)}</p></div>
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  );
}

function AdminSettingsView({ adminPwd, setAdminPwd, products, addProduct, handleLogout, simulatedEnabled, setSimulatedEnabled, updateProduct, allFlat }) {
  const [cur, setCur] = useState(""); const [np, setNp] = useState(""); const [cp, setCp] = useState("");
  const [showCur, setShowCur] = useState(false); const [showNp, setShowNp] = useState(false); const [showCp, setShowCp] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [resetting, setResetting] = useState(null);
  const EyeIcon = ({ show }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {show ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
    </svg>
  );
  const changePwd = async () => {
    const curHash = btoa(cur);
    if (curHash !== adminPwd && cur !== adminPwd) return setMsg({ type: "err", text: "Current password is incorrect." });
    if (np.length < 8) return setMsg({ type: "err", text: "New password must be at least 8 characters." });
    if (np !== cp) return setMsg({ type: "err", text: "Passwords do not match." });
    if (supa._ready && localStorage.getItem("slay_sb_token")) {
      setMsg({ type: "info", text: "Updating cloud credentials…" });
      const { error } = await supa.updatePassword(np);
      if (error) {
        const errMsg = error.message || error.msg || error.error_description || (typeof error === "string" ? error : "Unauthorized");
        return setMsg({ type: "err", text: "Failed: " + errMsg });
      }
    }
    try { localStorage.setItem(SK_PWD, JSON.stringify(btoa(np))); } catch {}
    setAdminPwd(btoa(np)); handleLogout(); setCur(""); setNp(""); setCp("");
    setMsg({ type: "ok", text: "Password updated. Please log in again." });
    setTimeout(() => setMsg({ type: "", text: "" }), 5000);
  };
  const [sheetsUrl, setSheetsUrl] = useLocalStorage(SK_SHEETS, "");
  const [autoSync, setAutoSync]   = useLocalStorage(SK_SYNC, false);
  const [importStatus, setImportStatus] = useState("");
  const [previewRows, setPreviewRows]   = useState(null);
  const parseCSVLine = (line) => { const result = []; let cur = "", inQ = false; for (let i = 0; i < line.length; i++) { const ch = line[i]; if (ch === '"') inQ = !inQ; else if (ch === ',' && !inQ) { result.push(cur.trim()); cur = ""; } else cur += ch; } result.push(cur.trim()); return result.map(v => v.replace(/^\"|\"$/g, "")); };
  const parseCSV = (text) => { const rows = text.split("\n").filter(r => r.trim()); if (rows.length < 2) throw new Error("CSV has no data rows"); const headers = parseCSVLine(rows[0]).map(h => h.toLowerCase()); return rows.slice(1).map(row => { const vals = parseCSVLine(row); const obj = {}; headers.forEach((h, i) => { if (h) obj[h] = vals[i] || ""; }); return obj; }); };
  const fetchCSV = async () => { try { setImportStatus("Fetching CSV…"); const res = await fetch(sheetsUrl); if (!res.ok) throw new Error("Network error"); const text = await res.text(); const parsed = parseCSV(text); setPreviewRows(parsed); setImportStatus("Found " + parsed.length + " row(s). Review then confirm."); } catch (e) { setImportStatus("Error: " + e.message); setPreviewRows(null); } };
  const confirmImport = () => {
    if (!previewRows) return;
    let updatedCount = 0;
    let addedCount = 0;
    previewRows.forEach(r => {
      if (!r.name || !r.price) return;
      const nameClean = r.name.trim();
      const c = (r.category || "").toLowerCase();
      let cat = "skincare";
      if (c.includes("wellness")) cat = "wellness";
      else if (c.includes("bundle")) cat = "bundles";

      const match = allFlat.find(p => (r.id && p.id === r.id) || p.name.toLowerCase() === nameClean.toLowerCase());

      const data = {
        name: nameClean,
        brand: r.brand || "",
        price: Number(r.price),
        originalPrice: r.originalprice ? Number(r.originalprice) : (match?.originalPrice || Number(r.price)),
        notes: r.notes || "",
        extra: r.extra || "",
        bestseller: String(r.bestseller).toLowerCase() === "true" || r.bestseller === "1",
        isTrending: String(r.istrending || r.is_trending).toLowerCase() === "true" || r.istrending === "1",
        image: r.image || "",
        secondaryImage: r.secondaryimage || r.secondary_image || "",
        gender: r.gender || "women",
        subcategory: r.subcategory || "face wash",
        stock: Number(r.stock) || 0,
        lowStockThreshold: Number(r.lowstockthreshold || r.low_stock_threshold) || 3,
        promoActive: String(r.promoactive || r.promo_active).toLowerCase() === "true" || r.promoactive === "1",
        promoPrice: r.promoprice || r.promo_price ? Number(r.promoprice || r.promo_price) : null
      };

      if (match) {
        updateProduct(match.category, match.id, data);
        updatedCount++;
      } else {
        addProduct(cat, data);
        addedCount++;
      }
    });
    setPreviewRows(null);
    setImportStatus(`Imported successfully. Added ${addedCount}, updated ${updatedCount} product(s).`);
  };
  useEffect(() => {
    let iv;
    if (autoSync && sheetsUrl) {
      const runSync = async () => {
        try {
          const res = await fetch(sheetsUrl);
          if (!res.ok) return;
          const text = await res.text();
          const parsed = parseCSV(text);
          parsed.forEach(r => {
            if (!r.name || !r.price) return;
            const nameClean = r.name.trim();
            const c = (r.category || "").toLowerCase();
            let cat = "skincare";
            if (c.includes("wellness")) cat = "wellness";
            else if (c.includes("bundle")) cat = "bundles";

            const match = allFlat.find(p => (r.id && p.id === r.id) || p.name.toLowerCase() === nameClean.toLowerCase());

            const data = {
              name: nameClean,
              brand: r.brand || "",
              price: Number(r.price),
              originalPrice: r.originalprice ? Number(r.originalprice) : (match?.originalPrice || Number(r.price)),
              notes: r.notes || "",
              extra: r.extra || "",
              bestseller: String(r.bestseller).toLowerCase() === "true" || r.bestseller === "1",
              isTrending: String(r.istrending || r.is_trending).toLowerCase() === "true" || r.istrending === "1",
              image: r.image || "",
              secondaryImage: r.secondaryimage || r.secondary_image || "",
              gender: r.gender || "women",
              subcategory: r.subcategory || "face wash",
              stock: Number(r.stock) || 0,
              lowStockThreshold: Number(r.lowstockthreshold || r.low_stock_threshold) || 3,
              promoActive: String(r.promoactive || r.promo_active).toLowerCase() === "true" || r.promoactive === "1",
              promoPrice: r.promoprice || r.promo_price ? Number(r.promoprice || r.promo_price) : null
            };

            if (match) {
              updateProduct(match.category, match.id, data);
            } else {
              addProduct(cat, data);
            }
          });
          console.log("Auto-sync completed.");
        } catch (e) {
          console.warn("Auto-sync failed:", e);
        }
      };
      runSync();
      iv = setInterval(runSync, 5 * 60 * 1000);
    }
    return () => clearInterval(iv);
  }, [autoSync, sheetsUrl, allFlat, addProduct, updateProduct]);
  return (
    <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
      <div style={{ background: "#fafafa", padding: 22, border: "1px solid #e8e8e8", flex: 1, minWidth: 280 }}>
        <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, color: "#e8a0b4", letterSpacing: ".2em", marginBottom: 20 }}>CHANGE PASSWORD</p>
        {!supa._ready && (
          <div style={{ background: "rgba(232,160,180,0.08)", border: "1px dashed #e8a0b4", padding: "10px 14px", fontSize: 10, fontFamily: "'Raleway',sans-serif", color: "#e8a0b4", letterSpacing: ".05em", lineHeight: 1.6, marginBottom: 14 }}>
            OFFLINE MODE: Password updates will be saved to your local browser storage only.
          </div>
        )}
        {msg.text && <div style={{ background: msg.type === "err" ? "#222222" : "#111111", border: "1px solid " + (msg.type === "err" ? "#e8a0b444" : "#ffffff44"), padding: "10px 14px", fontFamily: "'Raleway',sans-serif", fontSize: 11, color: msg.type === "err" ? "#e8a0b4" : "#ffffff", marginBottom: 14 }}>{msg.text}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[["Current Password", cur, setCur, showCur, setShowCur], ["New Password", np, setNp, showNp, setShowNp], ["Confirm New Password", cp, setCp, showCp, setShowCp]].map(([lbl, val, setter, shown, setShown]) => (
            <Fld key={lbl} label={lbl}>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input type={shown ? "text" : "password"} value={val} onChange={e => setter(e.target.value)} onKeyDown={e => lbl === "Confirm New Password" && e.key === "Enter" && changePwd()} placeholder={lbl === "New Password" ? "Min. 8 characters" : ""} style={{ width: "100%", paddingRight: "40px" }} />
                <button type="button" onClick={() => setShown(!shown)} style={{ position: "absolute", right: "12px", background: "none", border: "none", color: "#888888", cursor: "pointer", display: "flex", alignItems: "center", padding: 0 }}><EyeIcon show={shown} /></button>
              </div>
            </Fld>
          ))}
          <button className="rose-btn" onClick={changePwd}>Update Password</button>
        </div>
        <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid #e8e8e8" }}>
          <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, color: "#e8a0b4", letterSpacing: ".12em", marginBottom: 12 }}>DANGER ZONE</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button className="ghost-btn" style={{ borderColor: "#e8a0b444", color: "#e8a0b4", width: "100%", justifyContent: "center", fontSize: 9 }} disabled={resetting !== null}
              onClick={() => { if (!verifyAdminPassword("reset local browser data")) return; if (window.confirm("Reset local browser data? This clears orders stored in this browser only.")) { setResetting("local"); localStorage.removeItem(SK_ORDERS); setTimeout(() => window.location.reload(), 800); } }}>
              {resetting === "local" ? "Clearing…" : "Reset Local Browser Data"}
            </button>
            <button className="ghost-btn" style={{ borderColor: "#e8a0b444", color: "#e8a0b4", width: "100%", justifyContent: "center", fontSize: 9, opacity: (supa._ready && resetting === null) ? 1 : 0.5 }} disabled={!supa._ready || resetting !== null}
              onClick={() => { if (!verifyAdminPassword("wipe cloud storage")) return; if (window.confirm("WIPE CLOUD STORAGE? This cannot be undone.")) { setResetting("cloud"); supa.clearData().then(() => { setResetting("done"); setTimeout(() => window.location.reload(), 1200); }); } }}>
              {resetting === "cloud" ? "Wiping Cloud…" : resetting === "done" ? "Cloud Wiped" : "Wipe Cloud Storage System"}
            </button>
          </div>
        </div>
        <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid #e8e8e8" }}>
          <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, color: "#666666", letterSpacing: ".12em", marginBottom: 8 }}>CONTACT</p>
          <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 12, color: "#888888", lineHeight: 1.9 }}>{PHONE}<br /><a href={WA} target="_blank" rel="noreferrer" style={{ color: "#e8a0b4" }}>WhatsApp</a></p>
        </div>
      </div>
      <div style={{ background: "#fafafa", padding: 22, border: "1px solid #e8e8e8", flex: 1, minWidth: 280 }}>
        <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, color: "#e8a0b4", letterSpacing: ".2em", marginBottom: 16 }}>GOOGLE SHEETS SYNC</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
          {[["1. PREPARE","Use headers: name, brand, category, subcategory, price, notes, extra, gender, stock, bestseller, image"],["2. PUBLISH","File → Share → Publish to web → Whole Document → CSV"],["3. CONNECT","Paste the link below. Preview first, then Confirm to import."]].map(([t,d]) => (
            <div key={t} style={{ borderLeft: "2px solid #e8a0b4", paddingLeft: 12 }}><p style={{ fontSize: 10, color: "#e8a0b4", fontWeight: "bold", marginBottom: 4, fontFamily: "'Raleway',sans-serif" }}>{t}</p><p style={{ fontSize: 11, color: "#666666", lineHeight: 1.5, fontFamily: "'Raleway',sans-serif" }}>{d}</p></div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Fld label="Published CSV URL"><input type="text" value={sheetsUrl} onChange={e => setSheetsUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv" /></Fld>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", margin: 0 }}>
            <input type="checkbox" className="check-box" checked={autoSync} onChange={e => setAutoSync(e.target.checked)} />
            <span style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, color: "#888888", letterSpacing: ".12em" }}>AUTO-SYNC EVERY 5 MINS</span>
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="ghost-btn" style={{ padding: "10px 16px" }} onClick={fetchCSV}>Preview</button>
            {previewRows && <button className="rose-btn" style={{ padding: "10px 16px" }} onClick={confirmImport}>Confirm Import</button>}
          </div>
          {importStatus && <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 11, color: importStatus.startsWith("Error") ? "#e8a0b4" : "#e8a0b4" }}>{importStatus}</p>}
          {previewRows && <div style={{ borderTop: "1px solid #e8e8e8", paddingTop: 14, maxHeight: 160, overflowY: "auto" }}>{previewRows.map((r,i) => <div key={i} style={{ fontFamily: "'Raleway',sans-serif", fontSize: 11, color: "#888888", borderBottom: "1px solid #e8e8e8", padding: "4px 0" }}>{r.name} · {r.category} · GH₵{r.price}</div>)}</div>}
        </div>
        <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid #e8e8e8" }}>
          <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, color: "#e8a0b4", letterSpacing: ".2em", marginBottom: 20 }}>SOCIAL PROOF CONTROL</p>
          <div style={{ background: "#fafafa", padding: 16, border: "1px solid #e8e8e8" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div><p style={{ fontSize: 13, color: "#111111" }}>Simulated Popups</p><p style={{ fontSize: 10, color: "#666666", marginTop: 2 }}>Show "Someone in Accra purchased…" popups</p></div>
              <div onClick={() => setSimulatedEnabled(!simulatedEnabled)} style={{ position: "relative", display: "inline-block", width: 44, height: 24, cursor: "pointer", flexShrink: 0 }}>
                <div style={{ position: "absolute", inset: 0, backgroundColor: simulatedEnabled ? "#e8a0b4" : "#222222", transition: "background .4s", borderRadius: 24 }} />
                <div style={{ position: "absolute", height: 18, width: 18, left: simulatedEnabled ? 23 : 3, bottom: 3, backgroundColor: simulatedEnabled ? "#000000" : "#666666", transition: "left .4s", borderRadius: "50%" }} />
              </div>
            </div>
            <p style={{ fontSize: 9, color: "#e8a0b4", fontStyle: "italic", fontFamily: "'Raleway',sans-serif", display: "flex", alignItems: "center", gap: 6 }}><Icon name="sparkle" size={10} color="#e8a0b4" /> {simulatedEnabled ? "Showing a mix of real orders and simulated activity." : "Showing ONLY real verified orders."}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteOrderConfirmationModal({ order, onClose, deleteOrder, adminPwd }) {
  const [deletePwd, setDeletePwd] = useState("");
  const [deleteErr, setDeleteErr] = useState("");

  const confirmDelete = () => {
    if (deletePwd !== adminPwd && btoa(deletePwd) !== adminPwd) { setDeleteErr("Incorrect password."); return; }
    deleteOrder(order.id);
    onClose();
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal-content" onClick={e => e.stopPropagation()}>
        <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, letterSpacing: ".18em", color: "#e8a0b4", marginBottom: 12 }}>CONFIRM DELETION</p>
        <p style={{ fontSize: 14, marginBottom: 16 }}>Delete order <strong>{order.id}</strong>? This cannot be undone.</p>
        <label>Admin Password</label>
        <input type="password" value={deletePwd} onChange={e => { setDeletePwd(e.target.value); setDeleteErr(""); }} placeholder="Enter password to confirm" style={{ width: "100%", padding: "10px", border: "1px solid #e8e8e8", marginBottom: 14 }} />
        {deleteErr && <p style={{ color: "#e8a0b4", fontSize: 11, marginTop: -8, marginBottom: 12, fontFamily: "'Raleway',sans-serif" }}>{deleteErr}</p>}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={confirmDelete} style={{ flex: 1, background: "#ef4444", color: "#ffffff", border: "none", padding: "10px", fontFamily: "'Raleway',sans-serif", fontSize: 10, letterSpacing: ".1em", cursor: "pointer" }}>DELETE</button>
          <button onClick={onClose} className="ghost-btn" style={{ flex: 1, padding: "10px" }}>CANCEL</button>
        </div>
      </div>
    </div>
  );
}

function BulkDeleteConfirmationModal({ orderIds, onClose, deleteOrder, adminPwd, onSuccess }) {
  const [deletePwd, setDeletePwd] = useState("");
  const [deleteErr, setDeleteErr] = useState("");

  const confirmDelete = () => {
    if (deletePwd !== adminPwd && btoa(deletePwd) !== adminPwd) { setDeleteErr("Incorrect password."); return; }
    orderIds.forEach(id => deleteOrder(id));
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal-content" onClick={e => e.stopPropagation()}>
        <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: 10, letterSpacing: ".18em", color: "#e8a0b4", marginBottom: 12 }}>CONFIRM BULK DELETION</p>
        <p style={{ fontSize: 14, marginBottom: 16 }}>Are you sure you want to delete <strong>{orderIds.length}</strong> selected order(s)? This cannot be undone.</p>
        <label>Admin Password</label>
        <input type="password" value={deletePwd} onChange={e => { setDeletePwd(e.target.value); setDeleteErr(""); }} placeholder="Enter password to confirm" style={{ width: "100%", padding: "10px", border: "1px solid #e8e8e8", marginBottom: 14 }} />
        {deleteErr && <p style={{ color: "#e8a0b4", fontSize: 11, marginTop: -8, marginBottom: 12, fontFamily: "'Raleway',sans-serif" }}>{deleteErr}</p>}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={confirmDelete} style={{ flex: 1, background: "#ef4444", color: "#ffffff", border: "none", padding: "10px", fontFamily: "'Raleway',sans-serif", fontSize: 10, letterSpacing: ".1em", cursor: "pointer" }}>DELETE ALL</button>
          <button onClick={onClose} className="ghost-btn" style={{ flex: 1, padding: "10px" }}>CANCEL</button>
        </div>
      </div>
    </div>
  );
}
