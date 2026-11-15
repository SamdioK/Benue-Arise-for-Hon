const cfg = window.ARISE_CONFIG || {};
const $ = (selector) => document.querySelector(selector);
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));
document.querySelectorAll("[data-year]").forEach((node) => node.textContent = new Date().getFullYear());

/* Multilingual campaign mantra: timed text changes, never a scrolling ticker. */
const mantraText = document.getElementById("home-slogan-text");
const mantraLanguage = document.querySelector(".home-slogan-language");
if (mantraText && mantraLanguage) {
  const mantras = [
    { language: "TIV", text: "Chan u ya Chan" },
    { language: "PIDGIN", text: "Na Poverty go Suffer" },
    { language: "IDOMA", text: "Eha ge m’owe" },
    { language: "IGEDE", text: "Ebiahi a ka y’ebiahi le" },
    { language: "HAUSA", text: "Talauci zai sha wahala" },
    { language: "IGBO", text: "Ịda ogbenye ga-ata ahụhụ" },
    { language: "YORUBA", text: "Oṣiṣẹ́ yóò jìyà" }
  ];
  let mantraIndex = 0;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const showNextMantra = () => {
    const current = mantras[mantraIndex];
    mantraText.classList.add("is-changing");
    window.setTimeout(() => {
      mantraLanguage.textContent = current.language;
      mantraText.textContent = current.text;
      mantraText.classList.remove("is-changing");
      mantraIndex = (mantraIndex + 1) % mantras.length;
      const duration = Math.min(5200, Math.max(3000, 2200 + current.text.length * 75));
      window.setTimeout(showNextMantra, duration);
    }, reducedMotion ? 0 : 220);
  };
  if (!reducedMotion) {
    const firstDuration = Math.min(5200, Math.max(3000, 2200 + mantras[0].text.length * 75));
    window.setTimeout(showNextMantra, firstDuration);
  } else {
    window.setTimeout(showNextMantra, 4000);
  }
}


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
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: true }
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

document.addEventListener("click", async (event) => {
  const like = event.target.closest("[data-record-like]");
  if (like) {
    const active = like.getAttribute("aria-pressed") === "true";
    like.setAttribute("aria-pressed", String(!active));
    like.innerHTML = (!active ? "♥ <span>Liked</span>" : "♡ <span>Like</span>");
    return;
  }
  const share = event.target.closest("[data-record-share]");
  if (!share) return;
  const payload = { title: share.dataset.shareTitle || "Benue Arise for Hon", text: share.dataset.shareText || "", url: share.dataset.shareUrl || location.href };
  try {
    if (navigator.share) await navigator.share(payload);
    else if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(payload.url);
      share.innerHTML = "✓ <span>Link copied</span>";
      window.setTimeout(() => { share.innerHTML = "↗ <span>Share</span>"; }, 2200);
    } else {
      window.prompt("Copy this link to share:", payload.url);
    }
  } catch (error) {
    if (error?.name !== "AbortError") console.warn("Share action could not be completed", error);
  }
});

function renderRecords(records, mode = "standard") {
  const box = $("#record-list");
  if (!box) return;
  const query = ($("#record-search")?.value || "").trim().toLowerCase();
  const category = $("#category-filter")?.value || "";
  const status = $("#status-filter")?.value || "";
  const filtered = records.filter((record) => {
    const searchable = [record.title, record.description, record.content, record.content_text, record.body, record.excerpt,
      record.category, record.venue, record.caption, record.alt_text].join(" ").toLowerCase();
    return (!query || searchable.includes(query)) &&
      (!category || record.category === category) &&
      (!status || (record.verification_status || record.status || "") === status);
  });
  if (!filtered.length) {
    box.innerHTML = '<section class="profile-empty-card"><span class="profile-empty-mark" aria-hidden="true">✦</span><p class="profile-empty-kicker">BENUE ARISE FOR HON</p><h2>More about the journey, coming soon.</h2><p>We are preparing this section with care. Verified profile information and supporting details will appear here as they are approved for publication.</p></section>';
    return;
  }
  box.innerHTML = filtered.map((record) => {
    const summary = record.excerpt || record.description || record.content || record.content_text || record.body || record.caption || "";
    const date = record.published_at || record.starts_at || record.created_at;
    const dateLabel = date ? new Date(date).toLocaleDateString("en-GB", { timeZone: "Africa/Lagos", day: "numeric", month: "short", year: "numeric" }) : "";
    const mediaPath = record.storage_path || "";
    const mediaUrl = /^https?:\/\//i.test(mediaPath) ? mediaPath :
      /^(videos|images)\//i.test(mediaPath) ? cfg.SUPABASE_URL + "/storage/v1/object/public/gallery-media/" + mediaPath.split("/").map(encodeURIComponent).join("/") : "";
    const isVideo = record.media_type === "video" || /\.(mp4|webm|mov)(?:[?#].*)?$/i.test(mediaPath);
    const posterPath = record.featured_image || record.poster_path || "";
    const posterUrl = /^https?:\/\//i.test(posterPath) ? posterPath :
      /^(videos|images)\//i.test(posterPath) ? cfg.SUPABASE_URL + "/storage/v1/object/public/gallery-media/" + posterPath.split("/").map(encodeURIComponent).join("/") : "";
    const media = mediaUrl ? (isVideo
      ? '<video class="record-image record-video" controls playsinline preload="metadata" ' + (posterUrl ? 'poster="' + esc(posterUrl) + '"' : "") + ' aria-label="' + esc(record.title || "Campaign gallery video") + '"><source src="' + esc(mediaUrl) + '"></video>'
      : '<img class="record-image" src="' + esc(mediaUrl) + '" alt="' + esc(record.alt_text || record.title || "Campaign gallery image") + '" loading="lazy">') : "";
    const link = record.registration_url ? '<p><a class="text-link" href="' + esc(record.registration_url) + '" target="_blank" rel="noopener noreferrer">Event information ↗</a></p>' : "";
    const shareUrl = new URL(location.href);
    if (record.slug) shareUrl.searchParams.set("story", record.slug);
    const shareText = (record.title || "Benue Arise for Hon") + (summary ? " — " + summary : "");
    return '<article class="record-card">' + media +
      '<div class="record-meta"><span>' + esc(record.category || "Public information") + '</span><span class="status-pill">' + esc(record.status || "Published") + '</span></div>' +
      '<h3>' + esc(record.title) + '</h3>' +
      (record.venue || record.location ? '<p class="record-location">' + esc(record.venue || record.location) + '</p>' : "") +
      (dateLabel ? '<small>' + esc(dateLabel) + '</small>' : "") +
      (record.verification_status ? '<p class="verification-label">' + esc(record.verification_status) + '</p>' : "") +
      (summary ? '<p class="record-description">' + esc(summary) + '</p>' : "") +
      (record.source_url ? '<p><a class="text-link" href="' + esc(record.source_url) + '" target="_blank" rel="noopener noreferrer">Primary source ↗</a></p>' : "") +
      (record.evidence_url ? '<p><a class="text-link" href="' + esc(record.evidence_url) + '" target="_blank" rel="noopener noreferrer">Supporting evidence ↗</a></p>' : "") +
      link + '<div class="record-social-actions"><button type="button" class="record-like" data-record-like aria-pressed="false">♡ <span>Like</span></button><button type="button" class="record-share" data-record-share data-share-url="' + esc(shareUrl.href) + '" data-share-title="' + esc(record.title || "Benue Arise for Hon") + '" data-share-text="' + esc(shareText) + '">↗ <span>Share</span></button></div></article>';
  }).join("");
  const select = $("#category-filter");
  if (select && select.options.length <= 1) {
    [...new Set(records.map((record) => record.category).filter(Boolean))].sort()
      .forEach((value) => select.add(new Option(value, value)));
  }
}


const personalSections = [
  { key: "Background & Origins", id: "origins", title: "Background & Origins", intro: "Family background, place of origin and the roots of his personal story." },
  { key: "Early Life & Upbringing", id: "early-life", title: "Early Life & Upbringing", intro: "Childhood experiences, upbringing and formative years." },
  { key: "Formative Influences", id: "influences", title: "Formative Influences", intro: "People, events and experiences that helped shape his outlook." },
  { key: "Personal Formation", id: "education", title: "Personal Formation", intro: "The wider experiences and learning that contributed to his development." },
  { key: "Values & Philosophy", id: "values", title: "Values & Philosophy", intro: "Personal principles, convictions and approach to life." },
  { key: "Life Milestones", id: "milestones", title: "Life Milestones", intro: "Significant moments and turning points in his personal journey." },
  { key: "Community & Cultural Roots", id: "community", title: "Community & Cultural Roots", intro: "Community connections, cultural identity and sense of belonging." },
  { key: "Beyond Public Life", id: "interests", title: "Beyond Public Life", intro: "Personal interests and pursuits shared with approval." }
];

function renderPersonalProfileRecords(records) {
  const box = $("#record-list");
  if (!box) return;
  const groups = new Map();
  records.forEach((record) => {
    const key = (record.category || "").trim();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  });
  const used = new Set();
  const sections = personalSections.map((section) => {
    const items = groups.get(section.key) || [];
    
    used.add(section.key);
    return renderPersonalSection(section, items);
  }).join("");
  const extras = [...groups.entries()].filter(([key]) => !used.has(key)).map(([key, items]) =>
    renderPersonalSection({id:"additional-records",title:key || "Additional Personal Records",intro:"Further approved information within the Personal Profile."},items)
  ).join("");
  box.innerHTML = sections + extras;
}

function renderPersonalSection(section, records) {
  const cards = records.length ? records.map((record) => {
    const imageUrl = /^https:\/\//i.test(record.image_url || "") ? record.image_url : "";
    const image = imageUrl ? '<figure class="personal-record-image"><img src="' + esc(imageUrl) + '" alt="' + esc(record.image_alt || record.title || "Personal profile photograph") + '" loading="lazy"></figure>' : "";
    const date = record.milestone_date ? new Date(record.milestone_date + "T12:00:00").toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"}) : "";
    const body = String(record.body || "").trim().split(/\n{2,}/).map(part => '<p>' + esc(part).replace(/\n/g,"<br>") + '</p>').join("");
    return '<article class="personal-record-card">' + image + '<div class="personal-record-copy">' +
      (date ? '<p class="personal-record-date">' + esc(date) + '</p>' : "") +
      '<h3>' + esc(record.title) + '</h3>' +
      (record.excerpt ? '<p class="personal-record-excerpt">' + esc(record.excerpt) + '</p>' : "") +
      body +
      (record.location ? '<p class="personal-record-location">' + esc(record.location) + '</p>' : "") +
      '<div class="personal-record-sources">' +
      (record.verification_status ? '<span class="verification-label">' + esc(record.verification_status) + '</span>' : "") +
      (record.source_url ? '<a class="text-link" href="' + esc(record.source_url) + '" target="_blank" rel="noopener noreferrer">Primary source ↗</a>' : "") +
      (record.evidence_url ? '<a class="text-link" href="' + esc(record.evidence_url) + '" target="_blank" rel="noopener noreferrer">Supporting record ↗</a>' : "") +
      '</div></div></article>';
  }).join("") : '<article class="personal-subsection-empty"><span>✦</span><p>Approved information for this subsection will be added after review and verification.</p></article>';
  return '<section class="personal-record-group" id="' + esc(section.id) + '"><div class="personal-record-group-heading"><span class="personal-record-number">PROFILE THEME</span><h2>' + esc(section.title) + '</h2><p>' + esc(section.intro) + '</p></div><div class="personal-record-cards">' + cards + '</div></section>';
}

async function loadPageRecords() {
  const key = pageKey();
  const box = $("#record-list");
  if (!box) return;
  const fallback = placeholders[key] || [];
  try {
    const client = await getClient();
    const profileSection = ({ biography: "biography", "legal-academic": "legal_academic", "public-service": "public_service", scholarships: "scholarships", philanthropy: "philanthropy", achievements: "achievements", projects: "projects", evidence: "evidence" })[key];
    const table = profileSection ? "profile_records" : ({ news: "news", events: "events", gallery: "gallery", manifesto: "vision_mission_content" })[key];
    if (!client || !table) {
      renderRecords(fallback);
      return;
    }
    const orderColumn = key === "biography" ? "display_order" : profileSection || key === "news" ? "published_at" : key === "events" ? "starts_at" : "display_order";
    let query = client.from(table).select("*");
    query = profileSection ? query.eq("section_key", profileSection).eq("status", "published") : key === "manifesto" ? query.eq("published", true) : query.eq("status", "published");
    query = query.order(orderColumn, { ascending: key !== "news", nullsFirst: false }).limit(60);
    const { data, error } = await query;
    if (error) throw error;
    if (key === "biography") renderPersonalProfileRecords(data || []); else renderRecords(data || []);
  } catch (error) {
    console.warn("Published records could not be loaded.", error);
    renderRecords(fallback);
  }
}

["#record-search", "#category-filter", "#status-filter"].forEach((selector) => {
  $(selector)?.addEventListener("input", loadPageRecords);
});
loadPageRecords();

const tickerTrack = $("#welcome-ticker-track");
const tickerWelcome = "WELCOME TO BENUE ARISE FOR HON! This is the official campaign website of the 2027 SDP Gubernatorial Candidate in Benue State, Prof. (Chief) Sebastine Tartenger Hon, SAN, FCIArb, DSSRS, Sema-Wan u Tiv. Explore our vision, follow our activities and join the movement for a peaceful, prosperous and progressive Benue State. Together, let us rescue and rebuild Benue in 2027.";
if (tickerTrack) {
  (async () => {
    try {
      const client = await getClient();
      let items = '<span class="ticker-item welcome-message">' + esc(tickerWelcome) + '</span>';
      if (client) {
        const { data, error } = await client.from("news")
          .select("title,slug,published_at")
          .eq("status", "published")
          .order("published_at", { ascending: false, nullsFirst: false })
          .limit(12);
        if (error) throw error;
        (data || []).forEach((item) => {
          const href = "news.html" + (item.slug ? "#" + encodeURIComponent(item.slug) : "");
          items += '<span class="ticker-item ticker-headline"><a href="' + esc(href) + '">' +
            esc(item.title) + '</a></span>';
        });
      }
      // Duplicate the content for a seamless continuous loop.
      tickerTrack.innerHTML = '<div class="ticker-content">' + items + '</div><div class="ticker-content" aria-hidden="true">' + items + '</div>';
    } catch (error) {
      console.warn("Campaign ticker headlines could not be loaded; welcome message remains visible.", error);
    }
  })();
}

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


const homeEvents = $("#home-events");
if (homeEvents) {
  (async () => {
    try {
      const client = await getClient();
      if (!client) return;
      const { data, error } = await client.from("events").select("title,description,venue,starts_at")
        .eq("status", "published").gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true }).limit(3);
      if (error) throw error;
      if (!data?.length) {
        homeEvents.innerHTML = '<div class="home-empty">No upcoming events have been published yet.</div>';
        return;
      }
      homeEvents.innerHTML = data.map((item) => {
        const date = item.starts_at ? new Date(item.starts_at) : null;
        const month = date ? date.toLocaleDateString("en-GB", { month: "short", timeZone: "Africa/Lagos" }).toUpperCase() : "";
        const day = date ? date.toLocaleDateString("en-GB", { day: "2-digit", timeZone: "Africa/Lagos" }) : "";
        const detail = [item.venue, date ? date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos" }) : ""].filter(Boolean).join(" · ");
        return '<article class="home-event-item"><div class="home-event-date">' + esc(month) + '<b>' + esc(day) + '</b></div><div><h3>' + esc(item.title) + '</h3><p>' + esc(detail || item.description || "Public engagement") + '</p></div></article>';
      }).join("");
    } catch (error) {
      console.warn("Homepage events could not be loaded.", error);
      homeEvents.innerHTML = '<div class="home-empty">Events are temporarily unavailable. Visit the events page for updates.</div>';
    }
  })();
}

const homeGallery = $("#home-gallery");
if (homeGallery) {
  (async () => {
    try {
      const client = await getClient();
      if (!client) return;
      const { data, error } = await client.from("gallery").select("title,caption,alt_text,storage_path,media_type")
        .eq("status", "published").order("display_order", { ascending: true }).limit(3);
      if (error) throw error;
      if (!data?.length) {
        homeGallery.innerHTML = '<div class="home-empty">No approved gallery items have been published yet.</div>';
        return;
      }
      homeGallery.innerHTML = data.map((item) => {
        const mediaPath = item.storage_path || "";
        const mediaUrl = /^https?:\/\//i.test(mediaPath) ? mediaPath : /^(videos|images)\//i.test(mediaPath) ? cfg.SUPABASE_URL + "/storage/v1/object/public/gallery-media/" + mediaPath.split("/").map(encodeURIComponent).join("/") : "";
        const isVideo = item.media_type === "video" || /\.(mp4|webm|mov)(?:[?#].*)?$/i.test(mediaPath);
        const media = mediaUrl ? (isVideo ? '<video class="record-image record-video" controls playsinline preload="metadata" aria-label="' + esc(item.title || "Campaign video") + '"><source src="' + esc(mediaUrl) + '"></video>' : '<img class="record-image" src="' + esc(mediaUrl) + '" alt="' + esc(item.alt_text || item.title || "Campaign media") + '" loading="lazy">') : "";
        return '<article class="record-card">' + media + '<div class="record-meta"><span>Media gallery</span></div><h3>' + esc(item.title || "Campaign media") + '</h3><p>' + esc(item.caption || item.alt_text || "Approved campaign media item") + '</p><a class="text-link" href="gallery.html">View gallery →</a></article>';
      }).join("");
    } catch (error) {
      console.warn("Homepage gallery could not be loaded.", error);
      homeGallery.innerHTML = '<div class="home-empty">Gallery items are temporarily unavailable.</div>';
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
