const cfg = window.ARISE_CONFIG || {};
const $ = (selector, root = document) => root.querySelector(selector);

document.querySelectorAll("[data-year]").forEach(el => el.textContent = new Date().getFullYear());

const menu = $(".menu-toggle");
const nav = $("#primary-nav");
if (menu && nav) {
  menu.addEventListener("click", () => {
    const open = menu.getAttribute("aria-expanded") !== "true";
    menu.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("is-open", open);
    menu.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  });
  nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
    menu.setAttribute("aria-expanded", "false");
    nav.classList.remove("is-open");
  }));
}

let supabaseClient = null;
if (cfg.SUPABASE_URL && cfg.SUPABASE_PUBLISHABLE_KEY) {
  try {
    const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
    supabaseClient = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY, {
      db: { schema: "arise_site" },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
  } catch (error) {
    console.error("Supabase client could not be initialized.", error);
  }
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  })[ch]);
}
function dateLabel(value) {
  if (!value) return "Date not specified";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "Date not specified" : d.toLocaleDateString(undefined, {day:"numeric",month:"short",year:"numeric"});
}
function showStatus(id, message) {
  const el = document.getElementById(id);
  if (el) el.textContent = message;
}
function articleCard(item) {
  const slug = encodeURIComponent(item.slug || "");
  return `<article class="news-card"><div class="news-card-image">${item.cover_image_url ? `<img loading="lazy" src="${escapeHTML(item.cover_image_url)}" alt="">` : `<span class="empty-symbol">✳</span>`}</div><div class="news-card-body"><div class="card-meta">${escapeHTML(dateLabel(item.published_at))} <span>·</span> ${escapeHTML(item.category || "Update")}</div><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.excerpt || "")}</p><a class="text-link" href="article.html?slug=${slug}">Read article <span>↗</span></a></div></article>`;
}
async function loadNews() {
  const list = $("#news-list");
  const home = $("#home-news");
  if (!supabaseClient) {
    showStatus("news-status", "Supabase is not configured yet. Add the project URL and publishable key to assets/js/config.js after applying the reviewed migration.");
    return;
  }
  try {
    const { data, error } = await supabaseClient.from("news_articles")
      .select("title,slug,excerpt,category,published_at,cover_image_url")
      .eq("status", "published").lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false }).limit(12);
    if (error) throw error;
    const html = data?.length ? data.map(articleCard).join("") : `<article class="empty-card"><span class="empty-symbol">✳</span><h3>No published articles yet</h3><p>Approved news will appear here when published.</p></article>`;
    if (list) list.innerHTML = html;
    if (home) home.innerHTML = data?.length ? data.slice(0,3).map(articleCard).join("") : html;
    showStatus("news-status", `${data?.length || 0} published article(s) available.`);
  } catch (err) {
    console.error(err);
    showStatus("news-status", "News could not be loaded. Check the schema exposure, RLS policies and Supabase configuration.");
  }
}
async function loadArticle() {
  const container = $("#article-detail");
  if (!container || !supabaseClient) return;
  const slug = new URLSearchParams(location.search).get("slug");
  if (!slug) return;
  try {
    const { data, error } = await supabaseClient.from("news_articles")
      .select("title,body,category,published_at,cover_image_url")
      .eq("slug", slug).eq("status", "published").lte("published_at", new Date().toISOString()).maybeSingle();
    if (error) throw error;
    if (!data) {
      container.innerHTML = `<div class="section-kicker">NEWSROOM</div><h1>Article <span>not found.</span></h1><p>This article may be unpublished or the link may be incorrect.</p>`;
      return;
    }
    container.innerHTML = `<div class="section-kicker">${escapeHTML(data.category || "NEWSROOM")} · ${escapeHTML(dateLabel(data.published_at))}</div><h1>${escapeHTML(data.title)}</h1>${data.cover_image_url ? `<img class="article-cover" src="${escapeHTML(data.cover_image_url)}" alt="">` : ""}<div class="article-body">${escapeHTML(data.body || "").split(/\n{2,}/).map(p=>`<p>${p.replace(/\n/g,"<br>")}</p>`).join("")}</div>`;
    document.title = `${data.title} | Benue Arise for Hon`;
  } catch (err) {
    console.error(err);
    container.insertAdjacentHTML("beforeend", `<p class="form-status">Article could not be loaded. Please try again later.</p>`);
  }
}
async function loadEvents() {
  const list = $("#events-list");
  if (!list || !supabaseClient) {
    showStatus("events-status", "Events will load after the Supabase project is configured.");
    return;
  }
  try {
    const { data, error } = await supabaseClient.from("events")
      .select("title,description,starts_at,ends_at,venue,public_url")
      .eq("status","published").gte("starts_at", new Date(Date.now()-86400000).toISOString())
      .order("starts_at", {ascending:true}).limit(12);
    if (error) throw error;
    list.innerHTML = data?.length ? data.map(e => `<article class="event-card"><div class="event-date"><span>${escapeHTML(new Date(e.starts_at).toLocaleDateString(undefined,{month:"short"}))}</span><strong>${escapeHTML(new Date(e.starts_at).toLocaleDateString(undefined,{day:"2-digit"}))}</strong></div><div class="event-copy"><div class="card-meta">${escapeHTML(dateLabel(e.starts_at))}</div><h3>${escapeHTML(e.title)}</h3><p>${escapeHTML(e.description || "")}</p><p class="event-venue">⌖ ${escapeHTML(e.venue || "Venue to be announced by organizers")}</p>${e.public_url ? `<a class="text-link" href="${escapeHTML(e.public_url)}" rel="noopener noreferrer">Event details ↗</a>` : ""}</div></article>`).join("") : `<article class="empty-card"><span class="empty-symbol">◷</span><h3>No upcoming events published</h3><p>Please check back for confirmed activity details.</p></article>`;
    showStatus("events-status", `${data?.length || 0} upcoming event(s) available.`);
  } catch (err) {
    console.error(err);
    showStatus("events-status", "Events could not be loaded. Check schema exposure, policies and configuration.");
  }
}
const contactForm = $("#contact-form");
if (contactForm) {
  contactForm.addEventListener("submit", async event => {
    event.preventDefault();
    const status = $("#contact-status");
    const button = contactForm.querySelector('button[type="submit"]');
    if (!cfg.CONTACT_FUNCTION_URL) {
      status.textContent = "This contact form is not active yet. Please use the movement's verified contact details once published.";
      return;
    }
    const formData = new FormData(contactForm);
    const payload = {
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      subject: String(formData.get("subject") || "").trim(),
      message: String(formData.get("message") || "").trim()
    };
    if (!payload.name || !payload.email || !payload.subject || !payload.message || payload.message.length > 3000) {
      status.textContent = "Please check all fields and keep your message under 3,000 characters.";
      return;
    }
    button.disabled = true;
    status.textContent = "Sending…";
    try {
      const response = await fetch(cfg.CONTACT_FUNCTION_URL, {
        method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error("Request failed");
      contactForm.reset();
      status.textContent = "Your enquiry was submitted. Please do not send sensitive personal information through this form.";
    } catch (err) {
      status.textContent = "We could not submit your message. Please try again later or use a verified official contact channel.";
    } finally {
      button.disabled = false;
    }
  });
}
await Promise.all([loadNews(), loadArticle(), loadEvents()]);
