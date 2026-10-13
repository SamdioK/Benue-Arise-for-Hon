
const cfg = window.ARISE_CONFIG || {};
const $ = (s) => document.querySelector(s);
const loginForm = $("#login-form"), manager = $("#manager"), status = $("#admin-status"), signout = $("#signout");
let client = null, currentUser = null;
function say(message) { if (status) status.textContent = message; }
function safeText(value="") { return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]); }
if (cfg.SUPABASE_URL && cfg.SUPABASE_PUBLISHABLE_KEY) {
  const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
  client = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY, { db:{schema:"arise_site"}, auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true} });
} else say("Supabase is not configured. Add the project URL and publishable key in config.js first.");
async function checkAdmin() {
  if (!client) return;
  const { data:{session} } = await client.auth.getSession();
  currentUser = session?.user || null;
  if (!currentUser) { loginForm.hidden=false; manager.hidden=true; signout.hidden=true; return; }
  const [heroCheck, contentCheck] = await Promise.all([
    client.from("hero_admins").select("user_id").eq("user_id",currentUser.id).maybeSingle(),
    client.from("admins").select("user_id").eq("user_id",currentUser.id).maybeSingle()
  ]);
  const canManageHero = !!heroCheck.data;
  const canManageContent = !!contentCheck.data;
  if (heroCheck.error && contentCheck.error) { loginForm.hidden=false; manager.hidden=true; signout.hidden=false; say("Could not verify administrator access. Check schema exposure and RLS."); return; }
  if (!canManageHero && !canManageContent) { loginForm.hidden=false; manager.hidden=true; signout.hidden=false; say("This account is signed in but is not on either administrator allowlist."); return; }
  loginForm.hidden=true; manager.hidden=false; signout.hidden=false;
  const heroSection = $("#upload-form")?.closest("#manager");
  const contentSection = $(".admin-content-section");
  if (!canManageHero) { $("#slide-count").hidden=true; $("#upload-form").hidden=true; $("#slide-list").hidden=true; const h2 = $("#slide-list")?.previousElementSibling; if (h2) h2.hidden=true; }
  if (!canManageContent && contentSection) { contentSection.hidden=true; say("Hero administrator access verified. Mission & Vision editing requires arise_site.admins access."); }
  else say("Administrator access verified.");
  if (canManageHero) await loadSlides();
  if (canManageContent) await loadVisionMission();
}
loginForm?.addEventListener("submit", async e=>{e.preventDefault(); if(!client)return say("Configure Supabase first."); const fd=new FormData(loginForm); const button=loginForm.querySelector('button[type="submit"]'); button.disabled=true; say("Signing in…"); try { const {error}=await client.auth.signInWithPassword({email:String(fd.get("email")||"").trim(),password:String(fd.get("password")||"")}); if(error) throw error; await checkAdmin(); } catch(err) { say(err.message || "Sign-in failed."); } finally {button.disabled=false;} });
signout?.addEventListener("click",async()=>{if(client) await client.auth.signOut(); currentUser=null; await checkAdmin(); say("Signed out.");});
async function loadSlides(){ if(!client)return; const list=$("#slide-list"); list.innerHTML="<p>Loading photographs…</p>"; const {data,error}=await client.from("hero_slides").select("id,image_url,storage_path,alt_text,caption,display_order,active").order("display_order",{ascending:true}); if(error){list.innerHTML="";say("Could not load slides: "+error.message);return;} const rows=data||[]; $("#slide-count").textContent=`${rows.length} of 5 photographs used`; const form=$("#upload-form"); form.querySelector("button").disabled=rows.length>=5; $("#slide-file").disabled=rows.length>=5; if(!rows.length){list.innerHTML="<p>No hero photographs uploaded yet.</p>";return;} list.innerHTML=rows.map((x,i)=>`<article class="admin-slide-item"><img src="${safeText(x.image_url)}" alt=""><div><strong>${safeText(x.caption||x.alt_text||`Hero photograph ${i+1}`)}</strong><small>Position ${i+1} · ${x.active?"Visible on homepage":"Hidden"}</small></div><button class="admin-danger" type="button" data-delete="${safeText(x.id)}">Delete</button></article>`).join(""); list.querySelectorAll("[data-delete]").forEach(btn=>btn.addEventListener("click",()=>deleteSlide(btn.dataset.delete,btn))); }
$("#upload-form")?.addEventListener("submit",async e=>{e.preventDefault(); if(!client||!currentUser)return say("Sign in as an authorized administrator first."); const {data:allow,error:allowErr}=await client.from("hero_admins").select("user_id").eq("user_id",currentUser.id).maybeSingle(); if(allowErr||!allow)return say("Admin permission check failed. No upload was attempted."); const file=$("#slide-file").files?.[0]; if(!file)return say("Choose a photograph first."); const allowed={"image/jpeg":"jpg","image/png":"png","image/webp":"webp"}; if(!allowed[file.type])return say("Choose a JPG, PNG, or WebP image."); if(file.size>5*1024*1024)return say("Image must be 5 MB or smaller."); const {count,error:countErr}=await client.from("hero_slides").select("id",{count:"exact",head:true}); if(countErr)return say("Could not check current slide count: "+countErr.message); if(count>=5)return say("The maximum of five hero photographs has been reached. Delete one first."); const button=$("#upload-button"); button.disabled=true; say("Uploading photograph…"); let path=null; try{path=`${currentUser.id}/${crypto.randomUUID()}.${allowed[file.type]}`; const {error:upErr}=await client.storage.from("hero-slides").upload(path,file,{cacheControl:"3600",contentType:file.type,upsert:false}); if(upErr)throw upErr; const {data:{publicUrl}}=client.storage.from("hero-slides").getPublicUrl(path); const {error:insertErr}=await client.from("hero_slides").insert({image_url:publicUrl,storage_path:path,caption:$("#slide-caption").value.trim(),alt_text:$("#slide-alt").value.trim()||"Benue Arise for Hon campaign photograph",display_order:count+1,active:true}); if(insertErr)throw insertErr; $("#upload-form").reset(); say("Photograph uploaded successfully."); await loadSlides(); }catch(err){if(path)await client.storage.from("hero-slides").remove([path]); say(err.message||"Upload failed. Check Storage policies and database setup.");}finally{button.disabled=false;} });
async function deleteSlide(id,button){if(!confirm("Remove this photograph from the homepage slideshow? This also deletes its stored image."))return; button.disabled=true; const {data:slide,error:readErr}=await client.from("hero_slides").select("id,storage_path").eq("id",id).maybeSingle(); if(readErr||!slide){button.disabled=false;return say("Could not find this slide. Refresh and try again.");} const {error:delErr}=await client.from("hero_slides").delete().eq("id",id); if(delErr){button.disabled=false;return say("Could not delete slide: "+delErr.message);} if(slide.storage_path){const {error:storageErr}=await client.storage.from("hero-slides").remove([slide.storage_path]); if(storageErr)console.warn("Image storage cleanup failed",storageErr.message);} const {data:remaining}=await client.from("hero_slides").select("id").order("display_order",{ascending:true}); for(let i=0;i<(remaining||[]).length;i++) await client.from("hero_slides").update({display_order:i+1}).eq("id",remaining[i].id); say("Photograph removed."); await loadSlides(); }


// Mission & Vision editor. Database RLS remains the final authorization boundary.
async function loadVisionMission() {
  if (!client || !currentUser) return;
  const { data, error } = await client.from("vision_mission_content")
    .select("id,section_type,title,content_text,published,display_order,updated_at")
    .order("display_order", { ascending: true });
  if (error) {
    say("Could not load Mission & Vision content: " + error.message + ". Check table grants and schema exposure.");
    return;
  }
  for (const kind of ["vision", "mission"]) {
    const form = document.getElementById(`${kind}-form`);
    if (!form) continue;
    const row = (data || []).filter(x => x.section_type === kind).sort((a,b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))[0];
    form.dataset.rowId = row?.id || "";
    form.elements.title.value = row?.title || (kind === "vision" ? "Our Vision" : "Our Mission");
    form.elements.content_text.value = row?.content_text || "";
    form.elements.published.checked = !!row?.published;
    const statusEl = document.getElementById(`${kind}-editor-status`);
    if (statusEl) statusEl.textContent = row ? (row.published ? "Currently published." : "Saved as draft.") : "No statement saved yet.";
  }
}
for (const kind of ["vision", "mission"]) {
  document.getElementById(`${kind}-form`)?.addEventListener("submit", async event => {
    event.preventDefault();
    if (!client || !currentUser) return say("Sign in as an authorized administrator first.");
    const form = event.currentTarget;
    const statusEl = document.getElementById(`${kind}-editor-status`);
    const button = form.querySelector('button[type="submit"]');
    const payload = {
      section_type: kind,
      title: String(form.elements.title.value || "").trim(),
      content_text: String(form.elements.content_text.value || "").trim(),
      published: form.elements.published.checked,
      display_order: kind === "vision" ? 1 : 2,
      updated_by: currentUser.id,
      updated_at: new Date().toISOString()
    };
    if (!payload.title || !payload.content_text) { if (statusEl) statusEl.textContent = "Enter both a heading and statement text."; return; }
    button.disabled = true;
    if (statusEl) statusEl.textContent = "Saving…";
    try {
      let result;
      if (form.dataset.rowId) {
        result = await client.from("vision_mission_content").update(payload).eq("id", form.dataset.rowId).select("id").single();
      } else {
        result = await client.from("vision_mission_content").insert(payload).select("id").single();
      }
      if (result.error) throw result.error;
      form.dataset.rowId = result.data.id;
      if (statusEl) statusEl.textContent = payload.published ? "Saved and published successfully." : "Saved as draft. It is not visible to the public.";
    } catch (err) {
      if (statusEl) statusEl.textContent = "Save failed: " + (err.message || "Check the table policies and schema exposure.");
    } finally { button.disabled = false; }
  });
}

if(client) await checkAdmin();
