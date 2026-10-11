(() => {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }
  const form = document.querySelector("#interest-form");
  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const selected = form.querySelectorAll('input[name="interest"]:checked');
      const message = document.querySelector("#form-message");
      if (!selected.length) {
        message.textContent = "Please select at least one way you would like to participate.";
        message.classList.add("message-error");
        return;
      }
      message.classList.remove("message-error");
      message.textContent = "The form design is working, but live submission is not connected. No information has been sent or saved.";
    });
  }
})();