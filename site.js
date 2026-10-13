
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

// Hero slideshow: loads up to five published slides from Supabase; local portrait is the fallback.
async function setupHeroSlideshow() {
  const root = document.getElementById("hero-slideshow");
  const frame = document.getElementById("hero-slide-frame");
  if (!root || !frame) return;
  let slides = [];
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from("hero_slides")
        .select("id,image_url,alt_text,caption,display_order")
        .eq("active", true).order("display_order", { ascending: true }).limit(5);
      if (error) throw error;
      slides = (data || []).slice(0, 5).filter(x => x.image_url);
    } catch (error) {
      console.warn("Hero slides could not be loaded; using the default portrait.", error);
    }
  }
  const defaultImg = frame.querySelector(".hero-slide-image");
  if (slides.length) {
    frame.querySelectorAll(".hero-slide-image, .hero-slide-generated").forEach(el => el.remove());
    const shade = frame.querySelector(".hero-slide-shade");
    const caption = frame.querySelector(".hero-slide-caption");
    slides.forEach((slide, index) => {
      const img = document.createElement("img");
      img.className = "hero-slide-image" + (index === 0 ? " is-active" : "");
      img.src = slide.image_url;
      img.alt = slide.alt_text || slide.caption || "Benue Arise for Hon featured photograph";
      img.loading = index === 0 ? "eager" : "lazy";
      img.decoding = "async";
      img.dataset.slideIndex = String(index);
      frame.insertBefore(img, shade || caption || null);
    });
    const placeholder = frame.querySelector(".portrait-placeholder");
    if (placeholder) placeholder.style.display = "none";
    if (caption) {
      caption.innerHTML = `<span class="label-kicker">BENUE ARISE FOR HON</span><strong></strong>`;
      caption.querySelector("strong").textContent = slides[0].caption || "RESCUE · REBUILD · RESTORE";
    }
  } else if (defaultImg) {
    defaultImg.addEventListener("error", () => {
      defaultImg.style.display = "none";
      const placeholder = frame.querySelector(".portrait-placeholder");
      if (placeholder) placeholder.style.display = "flex";
    }, { once: true });
  }
  const images = [...frame.querySelectorAll(".hero-slide-image")];
  if (!images.length) return;
  let current = 0, timer = null;
  const dots = document.getElementById("hero-slide-dots");
  if (dots) {
    dots.replaceChildren();
    images.forEach((img, index) => {
      const dot = document.createElement("button");
      dot.type = "button"; dot.className = "hero-slide-dot" + (index === 0 ? " is-active" : "");
      dot.setAttribute("aria-label", `Show photograph ${index + 1} of ${images.length}`);
      dot.addEventListener("click", () => { show(index); restart(); });
      dots.append(dot);
    });
  }
  function show(index) {
    current = (index + images.length) % images.length;
    images.forEach((img, i) => img.classList.toggle("is-active", i === current));
    dots?.querySelectorAll(".hero-slide-dot").forEach((dot, i) => {
      dot.classList.toggle("is-active", i === current);
      dot.setAttribute("aria-current", i === current ? "true" : "false");
    });
    const captionText = slides[current]?.caption;
    const caption = frame.querySelector(".hero-slide-caption strong");
    if (caption && captionText) caption.textContent = captionText;
  }
  const prev = frame.querySelector(".hero-slide-prev"), next = frame.querySelector(".hero-slide-next");
  if (images.length < 2) {
    if (prev) prev.hidden = true;
    if (next) next.hidden = true;
    if (dots) dots.hidden = true;
    return;
  }
  prev?.addEventListener("click", () => { show(current - 1); restart(); });
  next?.addEventListener("click", () => { show(current + 1); restart(); });
  let touchX = null;
  frame.addEventListener("touchstart", e => { touchX = e.changedTouches[0]?.clientX ?? null; }, { passive: true });
  frame.addEventListener("touchend", e => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX; touchX = null;
    if (Math.abs(dx) > 45) { show(current + (dx < 0 ? 1 : -1)); restart(); }
  }, { passive: true });
  function restart() { clearInterval(timer); timer = setInterval(() => show(current + 1), 5500); }
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) restart();
}


async function loadVisionMission() {
  const root = document.getElementById("vision-mission-list");
  const pdfButton = document.getElementById("download-vision-pdf");
  if (!root) return;
  const status = document.getElementById("vision-status");
  let rows = [];
  if (supabaseClient) {
    const { data, error } = await supabaseClient.from("vision_mission_content")
      .select("section_type,title,content_text,published,display_order,updated_at")
      .eq("published", true).order("display_order", {ascending:true});
    if (error) {
      console.error("Mission/Vision content could not be loaded", error);
      root.innerHTML = `<article class="empty-card"><h2>Statements temporarily unavailable</h2><p>Please try again later.</p></article>`;
      if (status) status.textContent = "The statements could not be loaded. Please check again later.";
      return;
    }
    rows = data || [];
  }
  const byKind = kind => rows.filter(row => row.section_type === kind).sort((a,b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))[0];
  const vision = byKind("vision"), mission = byKind("mission");
  const renderCard = (row, kind, dark=false) => row
    ? `<article class="statement-card${dark ? " statement-dark" : ""}"><div class="section-kicker${dark ? " light" : ""}">${kind === "vision" ? "01 / VISION" : "02 / MISSION"}</div><div class="statement-symbol">${kind === "vision" ? "✳" : "↗"}</div><h2>${escapeHTML(row.title)}</h2><div class="statement-copy">${escapeHTML(row.content_text).split(/\n{2,}/).map(p=>`<p>${p.replace(/\n/g,"<br>")}</p>`).join("")}</div></article>`
    : `<article class="statement-card${dark ? " statement-dark" : ""}"><div class="section-kicker${dark ? " light" : ""}">${kind === "vision" ? "01 / VISION" : "02 / MISSION"}</div><div class="statement-symbol">${kind === "vision" ? "✳" : "↗"}</div><h2>${kind === "vision" ? "The vision statement" : "The mission statement"}</h2><p>This statement has not yet been published.</p><small>AWAITING OFFICIAL APPROVAL</small></article>`;
  root.innerHTML = renderCard(vision,"vision") + renderCard(mission,"mission",true);
  window.__ARISE_PUBLIC_STATEMENTS__ = { vision, mission };
  if (pdfButton) pdfButton.disabled = !(vision || mission);
  if (status) status.textContent = `${vision ? "Vision published" : "Vision not yet published"} · ${mission ? "Mission published" : "Mission not yet published"}.`;
}
const pdfButton = document.getElementById("download-vision-pdf");
pdfButton?.addEventListener("click", () => {
  const statements = window.__ARISE_PUBLIC_STATEMENTS__ || {};
  if (!window.jspdf?.jsPDF) {
    const status = document.getElementById("vision-status");
    if (status) status.textContent = "PDF generator did not load. Check your connection and try again.";
    return;
  }
  if (!statements.vision && !statements.mission) return;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({unit:"mm", format:"a4"});
  const pageW = doc.internal.pageSize.getWidth(), margin = 20, maxW = pageW - margin*2;
  doc.setFillColor(39,20,63); doc.rect(0,0,pageW,49,"F");
  doc.setTextColor(255,255,255); doc.setFont("helvetica","bold"); doc.setFontSize(16);
  doc.text("BENUE ARISE FOR HON", margin, 18);
  doc.setFontSize(10); doc.setFont("helvetica","normal"); doc.text("RESCUE | REBUILD | RESTORE", margin, 27);
  doc.setFontSize(9); doc.text("Prof. Sebastine Tartenger Hon, SAN", margin, 36);
  doc.text("SDP Governorship Candidate, Benue State 2027", margin, 42);
  let y = 62;
  for (const [label, row] of [["VISION",statements.vision],["MISSION",statements.mission]]) {
    if (!row) continue;
    if (y > 245) { doc.addPage(); y=22; }
    doc.setTextColor(109,40,168); doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.text(label,margin,y); y+=8;
    doc.setTextColor(39,20,63); doc.setFontSize(15); const titleLines=doc.splitTextToSize(row.title || label, maxW); doc.text(titleLines,margin,y); y+=titleLines.length*7+3;
    doc.setFont("helvetica","normal"); doc.setFontSize(11); const bodyLines=doc.splitTextToSize(row.content_text || "",maxW);
    for (const line of bodyLines) { if (y>275) { doc.addPage(); y=20; } doc.text(line,margin,y); y+=5.5; }
    y+=12;
  }
  const pages=doc.getNumberOfPages();
  for(let i=1;i<=pages;i++){doc.setPage(i);doc.setTextColor(120,105,130);doc.setFontSize(8);doc.text("RESCUE | REBUILD | RESTORE",margin,288);doc.text(`Page ${i} of ${pages}`,pageW-margin,288,{align:"right"});}
  doc.save("Benue-Arise-for-Hon-Vision-and-Mission.pdf");
});

await Promise.all([loadNews(), loadArticle(), loadEvents(), setupHeroSlideshow(), loadVisionMission()]);
