import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Bugs fixed:
// 1. No POST guard — non-POST requests (GET/PUT) were silently processed
// 2. Signature verification was skipped when PAYSTACK_SECRET_KEY is unset (security hole)
// 3. catch block used err.message which is undefined for non-Error throws
// 4. Supabase client was initialised inside the hot path every request — moved out

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
)

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-paystack-signature",
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS })
  }

  // Only accept POST — Paystack always sends POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...CORS, "Content-Type": "application/json" },
    })
  }

  try {
    const signature = req.headers.get("x-paystack-signature")
    const secret = Deno.env.get("PAYSTACK_SECRET_KEY") ?? ""
    const bodyText = await req.text()

    // Always verify signature — reject if secret is missing or sig is absent
    if (!secret) {
      console.error("PAYSTACK_SECRET_KEY is not set — rejecting request")
      return new Response(JSON.stringify({ error: "Server misconfiguration" }), {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
      })
    }

    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing x-paystack-signature" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      })
    }

    // HMAC-SHA512 verification (Paystack signs with SHA-512)
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-512" },
      false,
      ["verify"]
    )

    // Paystack sends a lowercase hex digest — decode it
    const sigBytes = new Uint8Array(
      (signature.match(/.{1,2}/g) ?? []).map((b) => parseInt(b, 16))
    )

    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      encoder.encode(bodyText)
    )

    if (!valid) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...CORS, "Content-Type": "application/json" },
      })
    }

    const { event, data } = JSON.parse(bodyText)

    if (event === "charge.success" && data?.status === "success") {
      const reference: string = data.reference

      const { data: order, error: findErr } = await supabase
        .from("orders")
        .select("id, status_payment")
        .eq("paystack_ref", reference)
        .single()

      if (findErr || !order) {
        // Not necessarily an error — could be a non-Slay-Empire charge
        console.warn(`No order found for paystack_ref: ${reference}`)
      } else if (!order.status_payment) {
        const { error: updateErr } = await supabase
          .from("orders")
          .update({ status_payment: true, status_payment_at: Date.now() })
          .eq("id", order.id)

        if (updateErr) {
          console.error("Failed to mark order paid:", updateErr)
          return new Response(JSON.stringify({ error: "DB update failed" }), {
            status: 500,
            headers: { ...CORS, "Content-Type": "application/json" },
          })
        }

        console.log(`Order ${order.id} marked as paid (ref: ${reference})`)
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
    })
  } catch (err) {
    // Bug fix: err may not be an Error instance — always coerce to string
    const msg = err instanceof Error ? err.message : String(err)
    console.error("Webhook error:", msg)
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    })
  }
})
