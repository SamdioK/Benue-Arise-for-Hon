import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const secretMap = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
const serviceKey = secretMap.default || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const db = serviceKey && supabaseUrl
  ? createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);
  if (!db) return json({ error: "The service request system is not configured." }, 503);

  try {
    const body = await req.json();
    if (String(body.website || "").trim()) return json({ success: true, request_number: "RECEIVED" });

    const serviceId = String(body.service_id || "").trim();
    const customerName = String(body.customer_name || "").trim();
    const customerEmail = String(body.customer_email || "").trim().toLowerCase();
    const customerPhone = String(body.customer_phone || "").trim().slice(0, 40) || null;
    const description = String(body.description || "").trim();
    const currency = body.currency === "USD" ? "USD" : body.currency === "NGN" ? "NGN" : null;

    if (!serviceId) return json({ error: "Choose a professional service." }, 400);
    if (customerName.length < 2 || customerName.length > 160) return json({ error: "Enter your full name." }, 400);
    if (customerEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) return json({ error: "Enter a valid email address." }, 400);
    if (description.length < 10 || description.length > 5000) return json({ error: "Describe your request in 10 to 5,000 characters." }, 400);

    const { data: service, error: serviceError } = await db.schema("arise_site")
      .from("service_offerings").select("id,title").eq("id", serviceId).eq("status", "published").maybeSingle();
    if (serviceError) throw serviceError;
    if (!service) return json({ error: "This service is no longer available. Refresh the page and try again." }, 404);

    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count, error: rateError } = await db.schema("arise_site")
      .from("service_requests").select("id", { count: "exact", head: true })
      .eq("customer_email", customerEmail).gte("created_at", since);
    if (rateError) throw rateError;
    if ((count || 0) >= 3) return json({ error: "Too many recent requests from this email address. Please try again later." }, 429);

    const requestNumber = "HBS-SRV-" + new Date().toISOString().slice(0, 10).replaceAll("-", "") + "-" +
      crypto.randomUUID().slice(0, 8).toUpperCase();

    const { error: insertError } = await db.schema("arise_site").from("service_requests").insert({
      request_number: requestNumber,
      service_id: service.id,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      description,
      currency,
      status: "submitted"
    });
    if (insertError) throw insertError;

    return json({ success: true, request_number: requestNumber, service_title: service.title });
  } catch (error) {
    console.error("commerce-service-request", error);
    return json({ error: "We could not submit your request. Please try again later." }, 500);
  }
});
