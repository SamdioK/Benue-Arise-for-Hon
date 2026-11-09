const cfg = window.ARISE_CONFIG || {};
const $ = (selector) => document.querySelector(selector);
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));
document.querySelectorAll("[data-year]").forEach((node) => node.textContent = new Date().getFullYear());

const toggle = $(".menu-toggle");
const nav = $(".nav");
toggle?.addEventListener("click", () => {
  const open = nav.classList.toggle("nav-open");
  toggle.setAttribute("aria-expanded", String(open));
});

let clientPromise;
async function getClient() {
  if (!cfg.SUPABASE_URL || !cfg.SUPABASE_PUBLISHABLE_KEY) return null;
  if (!clientPromise) {
    clientPromise = import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm")
      .then(({ createClient }) => createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY, {
        db: { schema: "arise_site" },
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      }));
  }
  return clientPromise;
}

const placeholders = {
  biography: [{ title: "Biography and personal profile", category: "Profile", status: "Under Verification", description: "The approved biography will be published here after review." }],
  "legal-academic": [{ title: "Legal and academic career", category: "Career", status: "Under Verification", description: "Professional designations, appointments and publications will be added with supporting sources." }],
  "public-service": [{ title: "Public service record", category: "Public service", status: "Under Verification", description: "Documented institutional and public-interest contributions will be published after verification." }],
  scholarships: [{ title: "Scholarships and education", category: "Education", status: "Under Verification", description: "No scholarship programme is asserted until supporting records are reviewed." }],
  philanthropy: [{ title: "Philanthropy and humanitarian services", category: "Humanitarian", status: "Under Verification", description: "Only documented interventions will be published. Identifiable beneficiary information requires consent." }],
  achievements: [{ title: "Achievements and recognition", category: "Recognition", status: "Under Verification", description: "Awards and recognitions will be listed with issuing organisations and evidence." }],
  projects: [{ title: "Community development register", category: "Projects", status: "Under Verification", description: "Project claims will be listed only when location, dates, candidate role and evidence have been checked." }],
  manifesto: [{ title: "Governance vision and policy proposals", category: "Policy", status: "Under Verification", description: "Approved policy proposals will be published with implementation and accountability details." }],
  evidence: [{ title: "Accountability and evidence centre", category: "Evidence", status: "Under Verification", description: "Public documents and source records will appear here after review." }]
};

function pageKey() {
  return location.pathname.split("/").pop().replace(/\.html?$/i, "") || "index";
}

function renderRecords(records, mode = "standard") {
  const box = $("#record-list");
  if (!box) return;
  const query = ($("#record-search")?.value || "").trim().toLowerCase();
  const category = $("#category-filter")?.value || "";
  const status = $("#status-filter")?.value || "";
  const filtered = records.filter((record) => {
    const searchable = [record.title, record.description, record.content, record.excerpt,
      record.category, record.venue, record.caption, record.alt_text].join(" ").toLowerCase();
    return (!query || searchable.includes(query)) &&
      (!category || record.category === category) &&
      (!status || (record.status || record.verification_status || "") === status);
  });
  if (!filtered.length) {
    box.innerHTML = '<div class="empty-state">No published records are available in this section yet.</div>';
    return;
  }
  box.innerHTML = filtered.map((record) => {
    const summary = record.excerpt || record.description || record.content || record.caption || "";
    const date = record.published_at || record.starts_at || record.created_at;
    const dateLabel = date ? new Date(date).toLocaleDateString("en-GB", { timeZone: "Africa/Lagos", day: "numeric", month: "short", year: "numeric" }) : "";
    const mediaUrl = /^https?:\/\//i.test(record.storage_path || "") ? record.storage_path : "";
    const image = mediaUrl ? '<img class="record-image" src="' + esc(mediaUrl) + '" alt="' + esc(record.alt_text || record.title || "Campaign gallery image") + '" loading="lazy">' : "";
    const link = record.registration_url ? '<p><a class="text-link" href="' + esc(record.registration_url) + '" target="_blank" rel="noopener noreferrer">Event information ↗</a></p>' : "";
    return '<article class="record-card">' + image +
      '<div class="record-meta"><span>' + esc(record.category || "Public information") + '</span><span class="status-pill">' + esc(record.status || "Published") + '</span></div>' +
      '<h3>' + esc(record.title) + '</h3>' +
      (record.venue ? '<p class="record-location">' + esc(record.venue) + '</p>' : "") +
      (dateLabel ? '<small>' + esc(dateLabel) + '</small>' : "") +
      (summary ? '<p>' + esc(summary) + '</p>' : "") + link + '</article>';
  }).join("");
  const select = $("#category-filter");
  if (select && select.options.length <= 1) {
    [...new Set(records.map((record) => record.category).filter(Boolean))].sort()
      .forEach((value) => select.add(new Option(value, value)));
  }
}

async function loadPageRecords() {
  const key = pageKey();
  const box = $("#record-list");
  if (!box) return;
  const fallback = placeholders[key] || [];
  try {
    const client = await getClient();
    const table = ({ news: "news", events: "events", gallery: "gallery" })[key];
    if (!client || !table) {
      renderRecords(fallback);
      return;
    }
    const orderColumn = key === "events" ? "starts_at" : key === "news" ? "published_at" : "display_order";
    const query = client.from(table).select("*").eq("status", "published")
      .order(orderColumn, { ascending: key === "gallery", nullsFirst: false }).limit(60);
    const { data, error } = await query;
    if (error) throw error;
    renderRecords(data || []);
  } catch (error) {
    console.warn("Published records could not be loaded.", error);
    renderRecords(fallback);
  }
}

["#record-search", "#category-filter", "#status-filter"].forEach((selector) => {
  $(selector)?.addEventListener("input", loadPageRecords);
});
loadPageRecords();

const homeNews = $("#home-news");
if (homeNews) {
  (async () => {
    try {
      const client = await getClient();
      if (!client) return;
      const { data, error } = await client.from("news")
        .select("title,slug,excerpt,published_at")
        .eq("status", "published")
        .order("published_at", { ascending: false, nullsFirst: false }).limit(3);
      if (error) throw error;
      if (data?.length) {
        homeNews.innerHTML = data.map((item) =>
          '<article class="record-card"><div class="record-meta"><span>News</span><span>' +
          (item.published_at ? esc(new Date(item.published_at).toLocaleDateString("en-GB", { timeZone: "Africa/Lagos" })) : "") +
          '</span></div><h3>' + esc(item.title) + '</h3><p>' + esc(item.excerpt || "") +
          '</p><a class="text-link" href="news.html#' + encodeURIComponent(item.slug || "") + '">Read update ↗</a></article>'
        ).join("");
      }
    } catch (error) {
      console.warn("Homepage news could not be loaded.", error);
    }
  })();
}

const contactForm = $("#contact-form");
if (contactForm) {
  const submit = contactForm.querySelector('button[type="submit"]');
  if (submit) submit.disabled = true;
  const status = $("#form-status");
  if (status) status.textContent = "Online enquiry submission is not enabled yet. Please use an authorised contact channel.";
}
