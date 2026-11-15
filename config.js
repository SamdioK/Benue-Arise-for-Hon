/* Public browser configuration. Publishable keys are designed for frontend use with RLS enabled.
   Never place a Supabase secret or service_role key in this file. */
window.ARISE_CONFIG = window.ARISE_CONFIG || {
  SUPABASE_URL: "https://atstsekevoozausbiqbi.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_mD18Fear8eew3LrpdVwZyA_9AaTOSOx"
};

/* Live West Africa Time across the Benue Arise portal. */
(() => {
  const mountWatClock = () => {
    const topbar = document.querySelector(".topline");
    if (!topbar || topbar.querySelector(".ba-wat-clock")) return;

    const style = document.createElement("style");
    style.textContent = `
      .topline{position:relative;min-height:42px}
      .ba-wat-clock{position:absolute;left:clamp(10px,2vw,28px);top:50%;transform:translateY(-50%);z-index:2;display:flex;align-items:center;gap:9px;text-align:left;letter-spacing:.02em;font-family:Inter,system-ui,sans-serif;font-weight:700;line-height:1.2;white-space:nowrap}
      .ba-wat-clock-mark{width:7px;height:7px;border-radius:50%;background:#f4a340;box-shadow:0 0 0 3px rgba(244,163,64,.18);flex:none}
      .ba-wat-clock-copy{display:flex;flex-direction:column;gap:3px}
      .ba-wat-clock-time{font-size:.76rem;font-variant-numeric:tabular-nums;color:#fff}
      .ba-wat-clock-date{font-size:.58rem;font-weight:600;letter-spacing:.04em;color:rgba(255,255,255,.78)}
      @media(max-width:640px){.topline{min-height:54px;padding-top:7px;padding-bottom:7px}.ba-wat-clock{left:9px;gap:6px}.ba-wat-clock-mark{width:6px;height:6px}.ba-wat-clock-time{font-size:.65rem}.ba-wat-clock-date{font-size:.5rem}.home-slogan{margin-left:112px;min-height:38px}.home-slogan-attribution{display:none}}
      @media(max-width:380px){.ba-wat-clock{left:6px}.ba-wat-clock-date{display:none}.home-slogan{margin-left:94px}}
    `;
    document.head.appendChild(style);

    const clock = document.createElement("div");
    clock.className = "ba-wat-clock";
    clock.setAttribute("role", "timer");
    clock.setAttribute("aria-label", "Current West Africa Time");
    clock.innerHTML = '<span class="ba-wat-clock-mark" aria-hidden="true"></span><span class="ba-wat-clock-copy"><span class="ba-wat-clock-time"></span><span class="ba-wat-clock-date"></span></span>';
    topbar.appendChild(clock);

    const timeNode = clock.querySelector(".ba-wat-clock-time");
    const dateNode = clock.querySelector(".ba-wat-clock-date");
    const timeFormat = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Lagos", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
    });
    const dateFormat = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Lagos", weekday: "short", day: "2-digit", month: "short", year: "numeric"
    });
    const update = () => {
      const now = new Date();
      timeNode.textContent = timeFormat.format(now) + " WAT";
      dateNode.textContent = dateFormat.format(now);
    };
    update();
    window.setInterval(update, 1000);
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountWatClock, { once: true });
  else mountWatClock();
})();

