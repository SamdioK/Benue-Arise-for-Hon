// Example Supabase Edge Function. Review before deployment.
// Production TODO: add rate limiting (for example an external limiter),
// CAPTCHA verification, email delivery/provider integration, and monitoring.
// Do not store a Supabase secret key in frontend JavaScript.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? "";
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!allowedOrigin || req.headers.get("origin") !== allowedOrigin) {
    return json({ error: "Origin not allowed" }, 403);
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (name.length < 1 || name.length > 100 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
      subject.length < 1 || subject.length > 150 ||
      message.length < 1 || message.length > 3000) {
    return json({ error: "Please check the submitted fields" }, 400);
  }

  // Intentionally do not accept arbitrary database writes from the browser.
  // Configure a trusted email/ticket provider here, with secrets stored as
  // Edge Function secrets. Do not log full message bodies or email addresses.
  // Until delivery is configured, return an explicit not-configured response.
  return json({
    error: "Contact delivery is not configured yet. Please use a verified official contact channel."
  }, 503);
});
