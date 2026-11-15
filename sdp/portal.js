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

  const electoralSupabaseUrl="https://mcbwbcqetrrwxfqfvhkc.supabase.co";
  const electoralSupabaseKey="sb_publishable_3R6ExeGg6ZTR6gQKKhPDvA_xvlSwme1";
  let electoralClientPromise;
  const getElectoralClient=()=>{if(!electoralClientPromise)electoralClientPromise=import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm").then(({createClient})=>createClient(electoralSupabaseUrl,electoralSupabaseKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}));return electoralClientPromise;};
  const safe=value=>{const el=document.createElement("span");el.textContent=String(value??"");return el.innerHTML;};
  const detailPanel=document.querySelector("#lga-detail-panel"),wardRoot=document.querySelector("#lga-ward-list"),puRoot=document.querySelector("#lga-pu-list");
  const lgaTitle=document.querySelector("#selected-lga-name"),wardTotal=document.querySelector("#selected-lga-ward-count"),puTotal=document.querySelector("#selected-lga-pu-count"),wardMeta=document.querySelector("#ward-list-count"),wardTitle=document.querySelector("#selected-ward-heading"),puMeta=document.querySelector("#selected-ward-count");
  let lgaRequest=0;
  async function openLga(name){
    if(!detailPanel)return;const req=++lgaRequest;detailPanel.hidden=false;detailPanel.scrollIntoView({behavior:"smooth",block:"start"});lgaTitle.textContent=name;wardTotal.textContent="…";puTotal.textContent="…";wardMeta.textContent="Loading";wardRoot.textContent="Loading verified ward records…";wardTitle.textContent="Polling units";puMeta.textContent="";puRoot.textContent="Select a ward to display its polling units.";
    document.querySelectorAll("#lga-grid button").forEach(b=>b.classList.toggle("is-selected",b.textContent.trim()===name));
    try{const client=await getElectoralClient();let result=await client.from("benue_polling_units").select("lga_name,ward_code,ward_name,pu_code,pu_name,pu_location,full_code,verification_status").ilike("lga_name","%"+name.trim()+"%").order("ward_code",{ascending:true}).order("pu_code",{ascending:true});
      if(result.error)throw result.error;
      let records=result.data||[];
      if(!records.length){
        const allRows=[];let start=0,page=[];
        do{
          const pageResult=await client.from("benue_polling_units").select("lga_name,ward_code,ward_name,pu_code,pu_name,pu_location,full_code,verification_status").order("lga_name",{ascending:true}).order("ward_code",{ascending:true}).range(start,start+999);
          if(pageResult.error)throw pageResult.error;
          page=pageResult.data||[];allRows.push(...page);start+=page.length;
        }while(page.length===1000&&start<20000);
        const normalise=value=>String(value||"").toLowerCase().replace(/\blga\b/g,"").replace(/[^a-z0-9]/g,"");
        const wanted=normalise(name);
        records=allRows.filter(row=>normalise(row.lga_name)===wanted);
      }
      if(req!==lgaRequest)return;
      const grouped=new Map();records.forEach(row=>{const k=String(row.ward_code??"")+"|"+String(row.ward_name??"");if(!grouped.has(k))grouped.set(k,{ward_code:row.ward_code,ward_name:row.ward_name,polling_units:[]});grouped.get(k).polling_units.push(row);});
      const wards=Array.from(grouped.values()).sort((a,b)=>String(a.ward_code).localeCompare(String(b.ward_code),undefined,{numeric:true}));wardTotal.textContent=String(wards.length);puTotal.textContent=String(records.length);wardMeta.textContent=wards.length+" wards";
      wardRoot.innerHTML=wards.length?wards.map((w,i)=>'<button type="button" class="lga-ward-item" data-ward-index="'+i+'"><span class="lga-ward-code">'+safe(w.ward_code)+'</span><span class="lga-ward-name">'+safe(w.ward_name||"Ward name not recorded")+'<small>'+w.polling_units.length+' polling units</small></span><span class="lga-ward-arrow">›</span></button>').join(""):"<p>No verified ward records were found for this LGA.</p>";
      wardRoot.querySelectorAll("[data-ward-index]").forEach(b=>b.addEventListener("click",()=>{const w=wards[Number(b.dataset.wardIndex)];if(!w)return;wardRoot.querySelectorAll(".lga-ward-item").forEach(x=>x.classList.toggle("is-selected",x===b));renderPollingUnits(w);}));
    }catch(error){if(req!==lgaRequest)return;console.error("Electoral directory load failed",error);wardTotal.textContent="Unavailable";puTotal.textContent="Unavailable";wardMeta.textContent="Connection issue";wardRoot.innerHTML="<p class=directory-error>The verified electoral directory could not be reached. Please try again shortly.</p>";}
  }
  function renderPollingUnits(ward){const rows=ward.polling_units||[];wardTitle.textContent=ward.ward_name||"Selected ward";puMeta.textContent=rows.length+" polling units";puRoot.innerHTML=rows.length?rows.map(r=>'<article class="lga-pu-item"><div><strong>'+safe(r.pu_name||"Polling unit name not recorded")+'</strong><small>PU code: '+safe(r.pu_code||"Not recorded")+'</small><small>Register code: '+safe(r.full_code||"Not recorded")+'</small>'+(r.pu_location?'<small>Location: '+safe(r.pu_location)+'</small>':'<small class="location-unavailable">Location not recorded in source</small>')+'</div><span>'+safe(String(r.verification_status||"REGISTERED").toUpperCase())+'</span></article>').join(""):"<p>No polling units are recorded under this ward.</p>";}
  document.querySelectorAll("#lga-grid button").forEach(b=>{b.type="button";b.addEventListener("click",()=>openLga(b.textContent.trim()));});
  document.querySelector("#close-lga-detail")?.addEventListener("click",()=>{lgaRequest++;detailPanel.hidden=true;document.querySelectorAll("#lga-grid button").forEach(b=>b.classList.remove("is-selected"));});
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