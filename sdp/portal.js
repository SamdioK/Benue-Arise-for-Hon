(() => {
  "use strict";
  const toggle = document.querySelector(".menu-toggle");
  const menu = document.querySelector("#mobile-menu");
  const close = document.querySelector(".menu-close");
  const setMenu = (open) => {
    if (!toggle || !menu) return;
    menu.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
    document.body.classList.toggle("menu-open", open);
  };
  toggle?.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
  close?.addEventListener("click", () => setMenu(false));
  menu?.querySelector("[data-menu-close]")?.addEventListener("click", () => setMenu(false));
  menu?.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") setMenu(false);
  });
  document.querySelectorAll("[data-year]").forEach(node => node.textContent = String(new Date().getFullYear()));

  const search = document.querySelector("#lga-search");
  const grid = document.querySelector("#lga-grid");
  const count = document.querySelector("#lga-count");
  if (search && grid && count) {
    const items = Array.from(grid.querySelectorAll("button"));
    search.addEventListener("input", () => {
      const query = search.value.trim().toLocaleLowerCase();
      let visible = 0;
      items.forEach(item => {
        const match = item.textContent.trim().toLocaleLowerCase().includes(query);
        item.hidden = !match;
        if (match) visible += 1;
      });
      count.textContent = query ? visible + " MATCHING LOCAL GOVERNMENT" + (visible === 1 ? "" : "S") : "23 LOCAL GOVERNMENTS";
    });
  }

  const sections = Array.from(document.querySelectorAll("main section[id]"));
  const navLinks = Array.from(document.querySelectorAll(".desktop-nav a[href^='#']"));
  if ("IntersectionObserver" in window && sections.length && navLinks.length) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(link => link.classList.toggle("active", link.getAttribute("href") === "#" + entry.target.id));
      });
    }, {rootMargin:"-30% 0px -60% 0px",threshold:0});
    sections.forEach(section => observer.observe(section));
  }

  // Accessible featured media carousel. Image slides auto-advance; video slides
  // can be added later with data-kind="video" and a 10000–15000 ms data-duration.
  const gallery = document.querySelector("#hero-gallery");
  if (gallery) {
    const slides = Array.from(gallery.querySelectorAll(".hero-gallery-slide"));
    const title = gallery.querySelector("#gallery-title");
    const description = gallery.querySelector("#gallery-description");
    const count = gallery.querySelector("#gallery-count");
    const previous = gallery.querySelector("#gallery-prev");
    const next = gallery.querySelector("#gallery-next");
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let active = Math.max(0, slides.findIndex(slide => slide.classList.contains("is-active")));
    let rotation;
    const show = index => {
      if (!slides.length) return;
      active = (index + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        const selected = i === active;
        slide.classList.toggle("is-active", selected);
        slide.hidden = !selected;
        const video = slide.querySelector("video");
        if (video) {
          if (selected) {
            video.currentTime = 0;
            const attempt = video.play();
            if (attempt?.catch) attempt.catch(() => {});
          } else video.pause();
        }
      });
      const slide = slides[active];
      if (title) title.textContent = slide.dataset.title || "Featured media";
      if (description) description.textContent = slide.dataset.caption || "";
      if (count) count.textContent = String(active + 1).padStart(2, "0") + " / " + String(slides.length).padStart(2, "0");
      schedule();
    };
    const schedule = () => {
      window.clearTimeout(rotation);
      if (reducedMotion || slides.length < 2) return;
      const slide = slides[active];
      const video = slide.querySelector("video");
      const duration = video ? Math.min(15000, Math.max(10000, Number(slide.dataset.duration) || 12000)) : 5500;
      rotation = window.setTimeout(() => show(active + 1), duration);
    };
    previous?.addEventListener("click", () => show(active - 1));
    next?.addEventListener("click", () => show(active + 1));
    gallery.addEventListener("mouseenter", () => window.clearTimeout(rotation));
    gallery.addEventListener("mouseleave", schedule);
    gallery.addEventListener("focusin", () => window.clearTimeout(rotation));
    gallery.addEventListener("focusout", schedule);
    show(active);
  }

})();