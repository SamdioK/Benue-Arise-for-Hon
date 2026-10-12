// ============================================================
// BENUE ARISE FOR HON
// Public website frontend
// File: site.js
// ============================================================

const cfg = window.ARISE_CONFIG || {};

const $ = (selector, root = document) =>
  root.querySelector(selector);

// Update copyright years.
document.querySelectorAll("[data-year]").forEach((el) => {
  el.textContent = new Date().getFullYear();
});

// ------------------------------------------------------------
// MOBILE NAVIGATION
// ------------------------------------------------------------

const menu = $(".menu-toggle");
const nav = $("#primary-nav");

if (menu && nav) {
  menu.addEventListener("click", () => {
    const open = menu.getAttribute("aria-expanded") !== "true";

    menu.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("is-open", open);

    menu.setAttribute(
      "aria-label",
      open ? "Close navigation" : "Open navigation"
    );
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menu.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
    });
  });
}

// ------------------------------------------------------------
// SUPABASE INITIALIZATION
// Reads the root-level config.js file.
// Uses the arise_site schema.
// ------------------------------------------------------------

let supabaseClient = null;

if (cfg.SUPABASE_URL && cfg.SUPABASE_PUBLISHABLE_KEY) {
  try {
    const { createClient } = await import(
      "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm"
    );

    supabaseClient = createClient(
      cfg.SUPABASE_URL,
      cfg.SUPABASE_PUBLISHABLE_KEY,
      {
        db: {
          schema: "arise_site"
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      }
    );
  } catch (error) {
    console.error(
      "Supabase client could not be initialized.",
      error
    );
  }
}

// ------------------------------------------------------------
// GENERAL HELPERS
// ------------------------------------------------------------

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function dateLabel(value) {
  if (!value) return "Date not specified";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date not specified";
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function showStatus(id, message) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = message;
  }
}

// ------------------------------------------------------------
// NEWS CARDS
// ------------------------------------------------------------

function articleCard(item) {
  const slug = encodeURIComponent(item.slug || "");

  const image = item.cover_image_url
    ? `<img loading="lazy"
            src="${escapeHTML(item.cover_image_url)}"
            alt="">`
    : `<span class="empty-symbol">✳</span>`;

  return `
    <article class="news-card">
      <div class="news-card-image">
        ${image}
      </div>

      <div class="news-card-body">
        <div class="card-meta">
          ${escapeHTML(dateLabel(item.published_at))}
          <span>·</span>
          ${escapeHTML(item.category || "Update")}
        </div>

        <h3>${escapeHTML(item.title || "Untitled update")}</h3>

        <p>${escapeHTML(item.excerpt || "")}</p>

        <a class="text-link"
           href="article.html?slug=${slug}">
          Read article <span>↗</span>
        </a>
      </div>
    </article>
  `;
}

// ------------------------------------------------------------
// LOAD PUBLISHED NEWS
// Expected table: arise_site.news_articles
// ------------------------------------------------------------

async function loadNews() {
  const list = $("#news-list");
  const home = $("#home-news");

  if (!supabaseClient) {
    showStatus(
      "news-status",
      "Supabase is not configured. Check the root config.js file and its project URL and publishable key."
    );
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from("news_articles")
      .select(
        "title,slug,excerpt,category,published_at,cover_image_url"
      )
      .eq("status", "published")
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false })
      .limit(12);

    if (error) throw error;

    const html = data?.length
      ? data.map(articleCard).join("")
      : `
        <article class="empty-card">
          <span class="empty-symbol">✳</span>
          <h3>No published articles yet</h3>
          <p>Approved news will appear here when published.</p>
        </article>
      `;

    if (list) {
      list.innerHTML = html;
    }

    if (home) {
      home.innerHTML = data?.length
        ? data.slice(0, 3).map(articleCard).join("")
        : html;
    }

    showStatus(
      "news-status",
      `${data?.length || 0} published article(s) available.`
    );
  } catch (error) {
    console.error("News loading failed:", error);

    showStatus(
      "news-status",
      "News could not be loaded. Check that the news_articles table exists in arise_site, the schema is exposed, and the required read policies are configured."
    );
  }
}

// ------------------------------------------------------------
// SINGLE NEWS ARTICLE
// Expected table: arise_site.news_articles
// URL example: article.html?slug=sample-article
// ------------------------------------------------------------

async function loadArticle() {
  const container = $("#article-detail");

  if (!container || !supabaseClient) return;

  const slug = new URLSearchParams(location.search).get("slug");

  if (!slug) return;

  try {
    const { data, error } = await supabaseClient
      .from("news_articles")
      .select(
        "title,body,category,published_at,cover_image_url"
      )
      .eq("slug", slug)
      .eq("status", "published")
      .lte("published_at", new Date().toISOString())
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      container.innerHTML = `
        <div class="section-kicker">NEWSROOM</div>
        <h1>Article <span>not found.</span></h1>
        <p>This article may be unpublished or the link may be incorrect.</p>
      `;
      return;
    }

    const cover = data.cover_image_url
      ? `
        <img class="article-cover"
             src="${escapeHTML(data.cover_image_url)}"
             alt="">
      `
      : "";

    const paragraphs = escapeHTML(data.body || "")
      .split(/\n{2,}/)
      .map((paragraph) =>
        `<p>${paragraph.replace(/\n/g, "<br>")}</p>`
      )
      .join("");

    container.innerHTML = `
      <div class="section-kicker">
        ${escapeHTML(data.category || "NEWSROOM")}
        · ${escapeHTML(dateLabel(data.published_at))}
      </div>

      <h1>${escapeHTML(data.title || "News article")}</h1>

      ${cover}

      <div class="article-body">
        ${paragraphs}
      </div>
    `;

    document.title =
      `${data.title || "Article"} | Benue Arise for Hon`;
  } catch (error) {
    console.error("Article loading failed:", error);

    container.insertAdjacentHTML(
      "beforeend",
      `<p class="form-status">
        Article could not be loaded. Please try again later.
      </p>`
    );
  }
}

// ------------------------------------------------------------
// LOAD UPCOMING EVENTS
// Expected table: arise_site.events
// ------------------------------------------------------------

async function loadEvents() {
  const list = $("#events-list");

  if (!list) return;

  if (!supabaseClient) {
    showStatus(
      "events-status",
      "Events will load after the Supabase project is configured."
    );
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from("events")
      .select(
        "title,description,starts_at,ends_at,venue,public_url"
      )
      .eq("status", "published")
      .gte(
        "starts_at",
        new Date(Date.now() - 86400000).toISOString()
      )
      .order("starts_at", { ascending: true })
      .limit(12);

    if (error) throw error;

    list.innerHTML = data?.length
      ? data.map((event) => {
          const eventDate = new Date(event.starts_at);

          const month = Number.isNaN(eventDate.getTime())
            ? ""
            : eventDate.toLocaleDateString(undefined, {
                month: "short"
              });

          const day = Number.isNaN(eventDate.getTime())
            ? "--"
            : eventDate.toLocaleDateString(undefined, {
                day: "2-digit"
              });

          const eventLink = event.public_url
            ? `
              <a class="text-link"
                 href="${escapeHTML(event.public_url)}"
                 target="_blank"
                 rel="noopener noreferrer">
                Event details ↗
              </a>
            `
            : "";

          return `
            <article class="event-card">
              <div class="event-date">
                <span>${escapeHTML(month)}</span>
                <strong>${escapeHTML(day)}</strong>
              </div>

              <div class="event-copy">
                <div class="card-meta">
                  ${escapeHTML(dateLabel(event.starts_at))}
                </div>

                <h3>${escapeHTML(event.title || "Event")}</h3>

                <p>${escapeHTML(event.description || "")}</p>

                <p class="event-venue">
                  ⌖ ${escapeHTML(
                    event.venue ||
                    "Venue to be announced by organizers"
                  )}
                </p>

                ${eventLink}
              </div>
            </article>
          `;
        }).join("")
      : `
        <article class="empty-card">
          <span class="empty-symbol">◷</span>
          <h3>No upcoming events published</h3>
          <p>Please check back for confirmed activity details.</p>
        </article>
      `;

    showStatus(
      "events-status",
      `${data?.length || 0} upcoming event(s) available.`
    );
  } catch (error) {
    console.error("Events loading failed:", error);

    showStatus(
      "events-status",
      "Events could not be loaded. Check the events table, schema exposure, policies and configuration."
    );
  }
}

// ------------------------------------------------------------
// CONTACT FORM
// Requires CONTACT_FUNCTION_URL in config.js.
// This form does not write directly to the database.
// ------------------------------------------------------------

const contactForm = $("#contact-form");

if (contactForm) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const status = $("#contact-status");
    const button = contactForm.querySelector(
      'button[type="submit"]'
    );

    if (!status || !button) return;

    if (!cfg.CONTACT_FUNCTION_URL) {
      status.textContent =
        "This contact form is not active yet. Please use the movement's verified contact details once published.";
      return;
    }

    const formData = new FormData(contactForm);

    const payload = {
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      subject: String(formData.get("subject") || "").trim(),
      message: String(formData.get("message") || "").trim()
    };

    const validEmail =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email);

    if (
      !payload.name ||
      payload.name.length > 100 ||
      !validEmail ||
      payload.email.length > 254 ||
      !payload.subject ||
      payload.subject.length > 150 ||
      !payload.message ||
      payload.message.length > 3000
    ) {
      status.textContent =
        "Please check your name, email, subject and message. Messages must be no longer than 3,000 characters.";
      return;
    }

    button.disabled = true;
    status.textContent = "Sending…";

    try {
      const response = await fetch(
        cfg.CONTACT_FUNCTION_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        throw new Error(
          `Contact submission failed: HTTP ${response.status}`
        );
      }

      contactForm.reset();

      status.textContent =
        "Your enquiry was submitted. Please do not send sensitive personal information through this form.";
    } catch (error) {
      console.error("Contact submission failed:", error);

      status.textContent =
        "We could not submit your message. Please try again later or use a verified official contact channel.";
    } finally {
      button.disabled = false;
    }
  });
}

// ------------------------------------------------------------
// HOMEPAGE HERO SLIDESHOW
// Reads active records from arise_site.hero_slides.
// Maximum of five slides.
// Falls back to the local portrait if no slides are available.
// ------------------------------------------------------------

async function setupHeroSlideshow() {
  const root = document.getElementById("hero-slideshow");
  const frame = document.getElementById("hero-slide-frame");

  if (!root || !frame) return;

  let slides = [];

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from("hero_slides")
        .select(
          "id,image_url,alt_text,caption,display_order"
        )
        .eq("active", true)
        .order("display_order", { ascending: true })
        .limit(5);

      if (error) throw error;

      slides = (data || [])
        .slice(0, 5)
        .filter((slide) => slide.image_url);
    } catch (error) {
      console.warn(
        "Hero slides could not be loaded; using the default portrait.",
        error
      );
    }
  }

  const defaultImage = frame.querySelector(
    ".hero-slide-image"
  );

  if (slides.length) {
    frame.querySelectorAll(
      ".hero-slide-image, .hero-slide-generated"
    ).forEach((element) => element.remove());

    const shade = frame.querySelector(".hero-slide-shade");
    const caption = frame.querySelector(".hero-slide-caption");

    slides.forEach((slide, index) => {
      const image = document.createElement("img");

      image.className =
        "hero-slide-image" +
        (index === 0 ? " is-active" : "");

      image.src = slide.image_url;
      image.alt =
        slide.alt_text ||
        slide.caption ||
        "Benue Arise for Hon featured photograph";

      image.loading = index === 0 ? "eager" : "lazy";
      image.decoding = "async";
      image.dataset.slideIndex = String(index);

      frame.insertBefore(
        image,
        shade || caption || null
      );
    });

    const placeholder = frame.querySelector(
      ".portrait-placeholder"
    );

    if (placeholder) {
      placeholder.style.display = "none";
    }

    if (caption) {
      caption.innerHTML = `
        <span class="label-kicker">BENUE ARISE FOR HON</span>
        <strong></strong>
      `;

      caption.querySelector("strong").textContent =
        slides[0].caption || "RESCUE · REBUILD · RESTORE";
    }
  } else if (defaultImage) {
    defaultImage.addEventListener(
      "error",
      () => {
        defaultImage.style.display = "none";

        const placeholder = frame.querySelector(
          ".portrait-placeholder"
        );

        if (placeholder) {
          placeholder.style.display = "flex";
        }
      },
      { once: true }
    );
  }

  const images = [
    ...frame.querySelectorAll(".hero-slide-image")
  ];

  if (!images.length) return;

  let current = 0;
  let timer = null;

  const dots = document.getElementById("hero-slide-dots");

  if (dots) {
    dots.replaceChildren();

    images.forEach((image, index) => {
      const dot = document.createElement("button");

      dot.type = "button";

      dot.className =
        "hero-slide-dot" +
        (index === 0 ? " is-active" : "");

      dot.setAttribute(
        "aria-label",
        `Show photograph ${index + 1} of ${images.length}`
      );

      dot.addEventListener("click", () => {
        show(index);
        restart();
      });

      dots.append(dot);
    });
  }

  function show(index) {
    current = (index + images.length) % images.length;

    images.forEach((image, imageIndex) => {
      image.classList.toggle(
        "is-active",
        imageIndex === current
      );
    });

    dots?.querySelectorAll(".hero-slide-dot")
      .forEach((dot, dotIndex) => {
        dot.classList.toggle(
          "is-active",
          dotIndex === current
        );

        dot.setAttribute(
          "aria-current",
          dotIndex === current ? "true" : "false"
        );
      });

    const captionText = slides[current]?.caption;

    const caption = frame.querySelector(
      ".hero-slide-caption strong"
    );

    if (caption && captionText) {
      caption.textContent = captionText;
    }
  }

  const previousButton = frame.querySelector(
    ".hero-slide-prev"
  );

  const nextButton = frame.querySelector(
    ".hero-slide-next"
  );

  if (images.length < 2) {
    if (previousButton) previousButton.hidden = true;
    if (nextButton) nextButton.hidden = true;
    if (dots) dots.hidden = true;

    return;
  }

  previousButton?.addEventListener("click", () => {
    show(current - 1);
    restart();
  });

  nextButton?.addEventListener("click", () => {
    show(current + 1);
    restart();
  });

  let touchX = null;

  frame.addEventListener(
    "touchstart",
    (event) => {
      touchX = event.changedTouches[0]?.clientX ?? null;
    },
    { passive: true }
  );

  frame.addEventListener(
    "touchend",
    (event) => {
      if (touchX === null) return;

      const dx =
        event.changedTouches[0].clientX - touchX;

      touchX = null;

      if (Math.abs(dx) > 45) {
        show(current + (dx < 0 ? 1 : -1));
        restart();
      }
    },
    { passive: true }
  );

  function restart() {
    clearInterval(timer);

    timer = setInterval(() => {
      show(current + 1);
    }, 5500);
  }

  if (
    !window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
  ) {
    restart();
  }
}

// ------------------------------------------------------------
// START PAGE FEATURES
// ------------------------------------------------------------

await Promise.all([
  loadNews(),
  loadArticle(),
  loadEvents(),
  setupHeroSlideshow()
]);
