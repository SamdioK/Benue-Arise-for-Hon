/* ============================================================
   BENUE ARISE FOR HON
   Main Website JavaScript
   File: site.js

   Handles:
   - Mobile navigation
   - Current-year footer
   - Supabase initialization
   - Published news and article pages
   - Published events
   - Published gallery items
   - Homepage hero slideshow
   - Secure contact form submission through an Edge Function

   Vision and Mission content + PDF download are handled by
   vision.js. Administrator functions are handled by admin.js.

   Official slogan: RESCUE | REBUILD | RESTORE
   ============================================================ */

const cfg = window.ARISE_CONFIG || {};

const $ = (selector, root = document) =>
  root.querySelector(selector);

const $$ = (selector, root = document) =>
  [...root.querySelectorAll(selector)];

const CAMPAIGN_NAME = "Benue Arise for Hon";
const CAMPAIGN_SLOGAN = "RESCUE | REBUILD | RESTORE";

/* ------------------------------------------------------------
   1. SHARED HELPERS
   ------------------------------------------------------------ */

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function safeURL(value) {
  if (!value) return "";

  try {
    const url = new URL(String(value), window.location.href);

    if (!["http:", "https:"].includes(url.protocol)) {
      return "";
    }

    return url.href;
  } catch {
    return "";
  }
}

function dateLabel(value) {
  if (!value) return "Date to be announced";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date to be announced";
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

function showEmptyCard(title, description, symbol = "✳") {
  return `
    <article class="empty-card">
      <span class="empty-symbol" aria-hidden="true">
        ${escapeHTML(symbol)}
      </span>
      <h3>${escapeHTML(title)}</h3>
      <p>${escapeHTML(description)}</p>
    </article>
  `;
}

function showLoadError(container, title, description) {
  if (!container) return;

  container.innerHTML = showEmptyCard(
    title,
    description
  );
}

/* ------------------------------------------------------------
   2. FOOTER YEAR
   ------------------------------------------------------------ */

$$("[data-year]").forEach(element => {
  element.textContent = String(new Date().getFullYear());
});

/* ------------------------------------------------------------
   3. MOBILE NAVIGATION
   ------------------------------------------------------------ */

const menu = $(".menu-toggle");
const nav = $("#primary-nav");

if (menu && nav) {
  menu.addEventListener("click", () => {
    const isOpen = menu.getAttribute("aria-expanded") !== "true";

    menu.setAttribute("aria-expanded", String(isOpen));
    nav.classList.toggle("is-open", isOpen);

    menu.setAttribute(
      "aria-label",
      isOpen ? "Close navigation" : "Open navigation"
    );
  });

  nav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      menu.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
      menu.setAttribute("aria-label", "Open navigation");
    });
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      menu.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
      menu.setAttribute("aria-label", "Open navigation");
    }
  });
}

/* ------------------------------------------------------------
   4. SUPABASE INITIALIZATION
   ------------------------------------------------------------ */

let supabaseClient = null;

if (
  cfg.SUPABASE_URL &&
  cfg.SUPABASE_PUBLISHABLE_KEY
) {
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
      "Supabase client initialization failed:",
      error
    );
  }
} else {
  console.warn(
    "Supabase is not configured. Check config.js."
  );
}

/* ------------------------------------------------------------
   5. NEWS CARD
   Uses the verified arise_site.news table.
   ------------------------------------------------------------ */

function articleCard(item) {
  const slug = encodeURIComponent(item.slug || "");
  const cover = safeURL(item.featured_image);

  return `
    <article class="news-card">
      <div class="news-card-image">
        ${
          cover
            ? `
              <img
                loading="lazy"
                decoding="async"
                src="${escapeHTML(cover)}"
                alt=""
              >
            `
            : `
              <span class="empty-symbol" aria-hidden="true">
                ✳
              </span>
            `
        }
      </div>

      <div class="news-card-body">
        <div class="card-meta">
          ${escapeHTML(dateLabel(item.published_at))}
          <span>·</span>
          ${escapeHTML(item.category || "Campaign Update")}
        </div>

        <h3>${escapeHTML(item.title || "Campaign update")}</h3>

        <p>${escapeHTML(item.excerpt || "")}</p>

        <a
          class="text-link"
          href="article.html?slug=${slug}"
        >
          Read article <span>↗</span>
        </a>
      </div>
    </article>
  `;
}

/* ------------------------------------------------------------
   6. LOAD PUBLISHED NEWS
   ------------------------------------------------------------ */

async function loadNews() {
  const list = $("#news-list");
  const home = $("#home-news");

  if (!list && !home) return;

  if (!supabaseClient) {
    showStatus(
      "news-status",
      "News is temporarily unavailable. Please check back later."
    );
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from("news")
      .select(
        "id,title,slug,excerpt,featured_image,status,published_at,created_at"
      )
      .eq("status", "published")
      .not("published_at", "is", null)
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false })
      .limit(12);

    if (error) throw error;

    const articles = data || [];

    const cards = articles.length
      ? articles.map(articleCard).join("")
      : showEmptyCard(
          "No published articles yet",
          "Approved news and campaign updates will appear here.",
          "✳"
        );

    if (list) {
      list.innerHTML = cards;
    }

    if (home) {
      home.innerHTML = articles.length
        ? articles.slice(0, 3).map(articleCard).join("")
        : cards;
    }

    showStatus(
      "news-status",
      `${articles.length} published article(s) available.`
    );
  } catch (error) {
    console.error("News loading failed:", error);

    showStatus(
      "news-status",
      "News could not be loaded. Check the Supabase news table, schema permissions and public read policies."
    );

    showLoadError(
      list,
      "News temporarily unavailable",
      "Please try again later."
    );

    showLoadError(
      home,
      "News temporarily unavailable",
      "Please try again later."
    );
  }
}

/* ------------------------------------------------------------
   7. LOAD A SINGLE NEWS ARTICLE
   Uses the content column in arise_site.news.
   ------------------------------------------------------------ */

async function loadArticle() {
  const container = $("#article-detail");

  if (!container) return;

  const slug = new URLSearchParams(
    window.location.search
  ).get("slug");

  if (!slug) {
    showLoadError(
      container,
      "Article link is incomplete",
      "Return to the newsroom and choose an article."
    );
    return;
  }

  if (!supabaseClient) {
    showLoadError(
      container,
      "Article temporarily unavailable",
      "The website database is not configured."
    );
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from("news")
      .select(
        "title,slug,excerpt,content,featured_image,status,published_at,created_at"
      )
      .eq("slug", slug)
      .eq("status", "published")
      .not("published_at", "is", null)
      .lte("published_at", new Date().toISOString())
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      container.innerHTML = `
        <div class="section-kicker">NEWSROOM</div>
        <h1>Article <span>not found.</span></h1>
        <p>
          This article may not be published, or the link may be incorrect.
        </p>
        <a class="text-link" href="news.html">
          Return to news <span>↗</span>
        </a>
      `;
      return;
    }

    const imageURL = safeURL(data.featured_image);

    const paragraphs = String(data.content || "")
      .trim()
      .split(/\n\s*\n/)
      .filter(Boolean)
      .map(paragraph => `
        <p>${escapeHTML(paragraph).replace(/\n/g, "<br>")}</p>
      `)
      .join("");

    container.innerHTML = `
      <div class="section-kicker">
        ${escapeHTML(dateLabel(data.published_at))}
      </div>

      <h1>${escapeHTML(data.title)}</h1>

      ${
        data.excerpt
          ? `<p class="lead">${escapeHTML(data.excerpt)}</p>`
          : ""
      }

      ${
        imageURL
          ? `
            <img
              class="article-cover"
              src="${escapeHTML(imageURL)}"
              alt=""
              loading="eager"
              decoding="async"
            >
          `
          : ""
      }

      <div class="article-body">
        ${
          paragraphs ||
          "<p>The article content has not been added yet.</p>"
        }
      </div>

      <p class="small-muted">
        ${escapeHTML(CAMPAIGN_NAME)} · ${escapeHTML(CAMPAIGN_SLOGAN)}
      </p>

      <a class="text-link" href="news.html">
        Back to newsroom <span>↗</span>
      </a>
    `;

    document.title = `${data.title} | ${CAMPAIGN_NAME}`;
  } catch (error) {
    console.error("Article loading failed:", error);

    showLoadError(
      container,
      "Article temporarily unavailable",
      "Please try again later."
    );
  }
}

/* ------------------------------------------------------------
   8. LOAD PUBLISHED EVENTS
   Uses registration_url from arise_site.events.
   ------------------------------------------------------------ */

async function loadEvents() {
  const list = $("#events-list");

  if (!list) return;

  if (!supabaseClient) {
    showStatus(
      "events-status",
      "Events are temporarily unavailable. Please check back later."
    );
    return;
  }

  try {
    const cutoff = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    ).toISOString();

    const { data, error } = await supabaseClient
      .from("events")
      .select(
        "id,title,description,venue,starts_at,ends_at,registration_url,featured_image,status"
      )
      .eq("status", "published")
      .gte("starts_at", cutoff)
      .order("starts_at", { ascending: true })
      .limit(12);

    if (error) throw error;

    const events = data || [];

    if (!events.length) {
      list.innerHTML = showEmptyCard(
        "No upcoming events published",
        "Please check back for confirmed activities and event details.",
        "◷"
      );
    } else {
      list.innerHTML = events.map(event => {
        const start = new Date(event.starts_at);
        const validDate = !Number.isNaN(start.getTime());
        const month = validDate
          ? start.toLocaleDateString(undefined, { month: "short" })
          : "TBA";
        const day = validDate
          ? start.toLocaleDateString(undefined, { day: "2-digit" })
          : "—";

        const registrationURL = safeURL(event.registration_url);
        const imageURL = safeURL(event.featured_image);

        return `
          <article class="event-card">
            ${
              imageURL
                ? `
                  <img
                    class="event-cover"
                    src="${escapeHTML(imageURL)}"
                    alt=""
                    loading="lazy"
                    decoding="async"
                  >
                `
                : ""
            }

            <div class="event-date">
              <span>${escapeHTML(month)}</span>
              <strong>${escapeHTML(day)}</strong>
            </div>

            <div class="event-copy">
              <div class="card-meta">
                ${escapeHTML(dateLabel(event.starts_at))}
              </div>

              <h3>${escapeHTML(event.title)}</h3>

              <p>${escapeHTML(event.description || "")}</p>

              <p class="event-venue">
                ⌖ ${escapeHTML(
                  event.venue || "Venue to be announced"
                )}
              </p>

              ${
                registrationURL
                  ? `
                    <a
                      class="text-link"
                      href="${escapeHTML(registrationURL)}"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Registration / details <span>↗</span>
                    </a>
                  `
                  : ""
              }
            </div>
          </article>
        `;
      }).join("");
    }

    showStatus(
      "events-status",
      `${events.length} upcoming event(s) available.`
    );
  } catch (error) {
    console.error("Events loading failed:", error);

    showStatus(
      "events-status",
      "Events could not be loaded. Check the events table and its public read policy."
    );

    showLoadError(
      list,
      "Events temporarily unavailable",
      "Please try again later.",
      "◷"
    );
  }
}

/* ------------------------------------------------------------
   9. LOAD PUBLISHED GALLERY
   Uses arise_site.gallery.
   ------------------------------------------------------------ */

async function loadGallery() {
  const list =
    $("#gallery-list") ||
    $("#gallery-grid");

  if (!list) return;

  if (!supabaseClient) {
    showStatus(
      "gallery-status",
      "Gallery items are temporarily unavailable."
    );
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from("gallery")
      .select(
        "id,title,caption,alt_text,storage_path,display_order,status,created_at"
      )
      .eq("status", "published")
      .order("display_order", { ascending: true })
      .limit(60);

    if (error) throw error;

    const items = data || [];

    if (!items.length) {
      list.innerHTML = showEmptyCard(
        "No gallery items published yet",
        "Approved campaign photographs will appear here.",
        "▧"
      );

      showStatus("gallery-status", "No published gallery items yet.");
      return;
    }

    /*
      If storage_path is a full URL, use it directly.
      Otherwise, try the public "gallery" Storage bucket.
      This assumes the bucket is named "gallery".
      Adjust the bucket name if your project uses another one.
    */

    list.innerHTML = items.map(item => {
      let imageURL = safeURL(item.storage_path);

      if (!imageURL && item.storage_path && supabaseClient) {
        const { data: publicData } = supabaseClient
          .storage
          .from("gallery")
          .getPublicUrl(item.storage_path);

        imageURL = safeURL(publicData?.publicUrl);
      }

      return `
        <article class="gallery-item">
          ${
            imageURL
              ? `
                <img
                  src="${escapeHTML(imageURL)}"
                  alt="${escapeHTML(item.alt_text || item.title || "Campaign photograph")}"
                  loading="lazy"
                  decoding="async"
                >
              `
              : `
                <div class="gallery-placeholder">
                  <span class="empty-symbol">▧</span>
                  <p>Image unavailable</p>
                </div>
              `
          }

          <div class="gallery-item-copy">
            <h3>${escapeHTML(item.title || "Campaign photograph")}</h3>
            ${
              item.caption
                ? `<p>${escapeHTML(item.caption)}</p>`
                : ""
            }
          </div>
        </article>
      `;
    }).join("");

    showStatus(
      "gallery-status",
      `${items.length} gallery item(s) available.`
    );
  } catch (error) {
    console.error("Gallery loading failed:", error);

    showStatus(
      "gallery-status",
      "Gallery items could not be loaded. Check the gallery table, Storage bucket and public policies."
    );

    showLoadError(
      list,
      "Gallery temporarily unavailable",
      "Please try again later.",
      "▧"
    );
  }
}

/* ------------------------------------------------------------
   10. CONTACT FORM
   Submits only to the configured Edge Function.
   Never writes contact submissions directly from the browser.
   ------------------------------------------------------------ */

const contactForm = $("#contact-form");

if (contactForm) {
  contactForm.addEventListener("submit", async event => {
    event.preventDefault();

    const status = $("#contact-status");
    const button = contactForm.querySelector(
      'button[type="submit"]'
    );

    if (!status) {
      console.error("Missing #contact-status element.");
      return;
    }

    if (!cfg.CONTACT_FUNCTION_URL) {
      status.textContent =
        "This contact form is not active yet. Please use a verified official contact channel.";
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
      payload.name.length < 1 ||
      payload.name.length > 100 ||
      !validEmail ||
      payload.email.length > 254 ||
      payload.subject.length < 1 ||
      payload.subject.length > 150 ||
      payload.message.length < 1 ||
      payload.message.length > 3000
    ) {
      status.textContent =
        "Please check your name, email, subject and message. Messages must not exceed 3,000 characters.";
      return;
    }

    if (button) button.disabled = true;

    status.textContent = "Sending your enquiry…";

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
        let message = "Request failed.";

        try {
          const result = await response.json();
          if (result?.error) message = result.error;
        } catch {
          // Keep the generic error when no JSON response is available.
        }

        throw new Error(message);
      }

      contactForm.reset();

      status.textContent =
        "Your enquiry was submitted successfully.";
    } catch (error) {
      console.error("Contact submission failed:", error);

      status.textContent =
        "We could not submit your message. Please try again later or use a verified official contact channel.";
    } finally {
      if (button) button.disabled = false;
    }
  });
}

/* ------------------------------------------------------------
   11. HOMEPAGE HERO SLIDESHOW
   Loads up to five active slides from hero_slides.
   Uses the existing portrait as fallback.
   ------------------------------------------------------------ */

async function setupHeroSlideshow() {
  const root = $("#hero-slideshow");
  const frame = $("#hero-slide-frame");

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
        .filter(slide => safeURL(slide.image_url))
        .slice(0, 5);
    } catch (error) {
      console.warn(
        "Could not load homepage slides; using the fallback portrait.",
        error
      );
    }
  }

  const originalImage = frame.querySelector(
    ".hero-slide-image"
  );

  if (slides.length) {
    frame.querySelectorAll(
      ".hero-slide-image, .hero-slide-generated"
    ).forEach(element => element.remove());

    const shade = frame.querySelector(".hero-slide-shade");
    const caption = frame.querySelector(".hero-slide-caption");

    slides.forEach((slide, index) => {
      const image = document.createElement("img");

      image.className =
        "hero-slide-image" +
        (index === 0 ? " is-active" : "");

      image.src = safeURL(slide.image_url);
      image.alt =
        slide.alt_text ||
        slide.caption ||
        "Benue Arise for Hon campaign photograph";

      image.loading = index === 0 ? "eager" : "lazy";
      image.decoding = "async";
      image.dataset.slideIndex = String(index);

      frame.insertBefore(
        image,
        shade || caption || null
      );

      image.addEventListener("error", () => {
        image.remove();

        const remaining = frame.querySelectorAll(
          ".hero-slide-image"
        );

        if (!remaining.length && originalImage) {
          originalImage.style.display = "";
        }
      }, { once: true });
    });

    if (originalImage) {
      originalImage.remove();
    }

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
        slides[0].caption || CAMPAIGN_SLOGAN;
    }
  } else if (originalImage) {
    originalImage.addEventListener("error", () => {
      originalImage.style.display = "none";

      const placeholder = frame.querySelector(
        ".portrait-placeholder"
      );

      if (placeholder) {
        placeholder.style.display = "flex";
      }
    }, { once: true });
  }

  const images = [
    ...frame.querySelectorAll(".hero-slide-image")
  ];

  if (!images.length) return;

  let current = 0;
  let timer = null;
  let touchX = null;

  const dots = $("#hero-slide-dots");

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

    dots?.querySelectorAll(
      ".hero-slide-dot"
    ).forEach((dot, dotIndex) => {
      const active = dotIndex === current;

      dot.classList.toggle("is-active", active);
      dot.setAttribute(
        "aria-current",
        active ? "true" : "false"
      );
    });

    const captionText = slides[current]?.caption;
    const caption = frame.querySelector(
      ".hero-slide-caption strong"
    );

    if (caption) {
      caption.textContent =
        captionText || CAMPAIGN_SLOGAN;
    }
  }

  const previousButton = frame.querySelector(
    ".hero-slide-prev"
  );

  const nextButton = frame.querySelector(
    ".hero-slide-next"
  );

  if (images.length < 2) {

/* ------------------------------------------------------------
   11. HOMEPAGE HERO SLIDESHOW
   Loads active photographs from arise_site.hero_slides.
   Preserves the original portrait until a new photo loads.
   ------------------------------------------------------------ */

async function setupHeroSlideshow() {
  const root = $("#hero-slideshow");
  const frame = $("#hero-slide-frame");

  if (!root || !frame) {
    console.warn(
      "[Hero slideshow] Missing #hero-slideshow or #hero-slide-frame."
    );
    return;
  }

  const originalImage = [
    ...frame.querySelectorAll(".hero-slide-image")
  ].find(image => !image.classList.contains("hero-slide-generated"));

  const placeholder = frame.querySelector(".portrait-placeholder");
  const caption = frame.querySelector(".hero-slide-caption");
  const dots = $("#hero-slide-dots");

  const previousButton = frame.querySelector(".hero-slide-prev");
  const nextButton = frame.querySelector(".hero-slide-next");

  let slides = [];

  if (!supabaseClient) {
    console.error(
      "[Hero slideshow] Supabase is unavailable. Check config.js and script loading."
    );
  } else {
    try {
      const { data, error } = await supabaseClient
        .from("hero_slides")
        .select("id,image_url,alt_text,caption,display_order")
        .eq("active", true)
        .order("display_order", { ascending: true })
        .limit(5);

      if (error) throw error;

      slides = (data || [])
        .filter(slide => safeURL(slide.image_url))
        .slice(0, 5);

      console.info(
        "[Hero slideshow] Active slides received:",
        slides.length
      );
    } catch (error) {
      console.error(
        "[Hero slideshow] Supabase query failed:",
        error
      );
    }
  }

  /*
   * Remove only images generated by a previous slideshow run.
   * Never remove the original portrait before a replacement
   * photograph has successfully loaded.
   */
  frame.querySelectorAll(".hero-slide-generated").forEach(image => {
    image.remove();
  });

  /*
   * Preload each candidate image and retain only successful
   * loads. This prevents broken image elements from becoming
   * slideshow slides.
   */
  const loadedSlides = await Promise.all(
    slides.map(slide => {
      return new Promise(resolve => {
        const image = new Image();
        const url = safeURL(slide.image_url);

        if (!url) {
          resolve(null);
          return;
        }

        image.onload = () => {
          resolve({ slide, url });
        };

        image.onerror = () => {
          console.error(
            "[Hero slideshow] Photograph failed to load:",
            url
          );
          resolve(null);
        };

        image.src = url;
      });
    })
  );

  const validSlides = loadedSlides.filter(Boolean);

  /*
   * Keep the existing portrait or placeholder if no uploaded
   * photographs load successfully.
   */
  if (!validSlides.length) {
    if (originalImage) {
      originalImage.style.display = "";
    }

    if (placeholder && !originalImage) {
      placeholder.style.display = "flex";
    }

    if (dots) {
      dots.replaceChildren();
      dots.hidden = true;
    }

    if (previousButton) previousButton.hidden = true;
    if (nextButton) nextButton.hidden = true;

    console.warn(
      "[Hero slideshow] No uploaded photographs loaded; fallback retained."
    );
    return;
  }

  const shade = frame.querySelector(".hero-slide-shade");
  const insertionPoint = shade || caption || null;
  const images = [];

  validSlides.forEach(({ slide, url }, index) => {
    const image = document.createElement("img");

    image.className =
      "hero-slide-image hero-slide-generated" +
      (index === 0 ? " is-active" : "");

    image.src = url;

    image.alt =
      slide.alt_text ||
      slide.caption ||
      "Benue Arise for Hon campaign photograph";

    image.loading = "eager";
    image.decoding = "async";
    image.dataset.slideIndex = String(index);

    frame.insertBefore(image, insertionPoint);
    images.push(image);
  });

  /*
   * At least one replacement image has loaded successfully.
   * It is now safe to remove the original portrait.
   */
  if (originalImage) {
    originalImage.remove();
  }

  if (placeholder) {
    placeholder.style.display = "none";
  }

  if (dots) {
    dots.replaceChildren();
    dots.hidden = images.length < 2;

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

      dot.setAttribute(
        "aria-current",
        index === 0 ? "true" : "false"
      );

      dot.addEventListener("click", () => {
        show(index);
        restart();
      });

      dots.append(dot);
    });
  }

  let current = 0;
  let timer = null;
  let touchX = null;

  function show(index) {
    current = (index + images.length) % images.length;

    images.forEach((image, imageIndex) => {
      image.classList.toggle(
        "is-active",
        imageIndex === current
      );
    });

    if (dots) {
      dots.querySelectorAll(".hero-slide-dot").forEach(
        (dot, dotIndex) => {
          const active = dotIndex === current;

          dot.classList.toggle("is-active", active);
          dot.setAttribute(
            "aria-current",
            active ? "true" : "false"
          );
        }
      );
    }

    if (caption) {
      const kicker = document.createElement("span");
      kicker.className = "label-kicker";
      kicker.textContent = "BENUE ARISE FOR HON";

      const title = document.createElement("strong");
      title.textContent =
        validSlides[current].slide.caption ||
        CAMPAIGN_SLOGAN;

      caption.replaceChildren(kicker, title);
    }
  }

  function stop() {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }

  function restart() {
    stop();

    if (
      !document.hidden &&
      !window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches &&
      images.length > 1
    ) {
      timer = setInterval(() => {
        show(current + 1);
      }, 5500);
    }
  }

  if (previousButton) {
    previousButton.hidden = images.length < 2;
    previousButton.onclick = () => {
      show(current - 1);
      restart();
    };
  }

  if (nextButton) {
    nextButton.hidden = images.length < 2;
    nextButton.onclick = () => {
      show(current + 1);
      restart();
    };
  }

  frame.addEventListener(
    "touchstart",
    event => {
      touchX = event.changedTouches[0]?.clientX ?? null;
    },
    { passive: true }
  );

  frame.addEventListener(
    "touchend",
    event => {
      if (touchX === null) return;

      const endX = event.changedTouches[0]?.clientX;
      const difference =
        typeof endX === "number" ? endX - touchX : 0;

      touchX = null;

      if (Math.abs(difference) > 45 && images.length > 1) {
        show(current + (difference < 0 ? 1 : -1));
        restart();
      }
    },
    { passive: true }
  );

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stop();
    } else {
      restart();
    }
  });

  show(0);
  restart();

  console.info(
    "[Hero slideshow] Successfully displayed photographs:",
    images.length
  );
}

/* ------------------------------------------------------------
   12. START PAGE FEATURES
   Each function checks whether its page elements exist.
   ------------------------------------------------------------ */

const pageTasks = [
  ["news", loadNews],
  ["article", loadArticle],
  ["events", loadEvents],
  ["gallery", loadGallery],
  ["hero slideshow", setupHeroSlideshow]
];

const results = await Promise.allSettled(
  pageTasks.map(([, task]) => task())
);

results.forEach((result, index) => {
  if (result.status === "rejected") {
    console.error(
      `Page feature "${pageTasks[index][0]}" failed:`,
      result.reason
    );
  }
});
