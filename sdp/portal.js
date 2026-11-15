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
})();