const cfg = window.ARISE_CONFIG || {};
const $ = (selector) => document.querySelector(selector);
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));
document.querySelectorAll("[data-year]").forEach((node) => node.textContent = new Date().getFullYear());

const modules = {
  news: { label: "News & publications", table: "news", id: "id", order: "created_at",
    fields: [
      ["title","Title","text",true],["slug","URL slug","text",true],["excerpt","Short summary","textarea"],
      ["content","Full article","textarea"],["featured_image","Featured image URL","url"],
      ["status","Status","select",true,["draft","published","archived"]],["published_at","Publication date and time","datetime-local"]
    ] },
  events: { label: "Events", table: "events", id: "id", order: "created_at",
    fields: [
      ["title","Event title","text",true],["slug","URL slug","text",true],["description","Description","textarea"],
      ["venue","Venue","text"],["starts_at","Starts at","datetime-local"],["ends_at","Ends at","datetime-local"],
      ["registration_url","Registration URL","url"],["featured_image","Featured image URL","url"],
      ["status","Status","select",true,["draft","published","archived"]]
    ] },
  gallery: { label: "Gallery captions", table: "gallery", id: "id", order: "created_at",
    fields: [
      ["title","Title","text"],["caption","Caption","textarea"],["alt_text","Accessible image description","text",true],
      ["storage_path","Image storage path (existing public image URL accepted)","text",true],
      ["display_order","Display order","number"],["status","Status","select",true,["draft","published","archived"]]
    ] },
  vision_mission_content: { label: "Vision & mission", table: "vision_mission_content", id: "id", order: "display_order",
    fields: [
      ["section_type","Section type","select",true,["vision","mission"]],["title","Title","text",true],
      ["content_text","Content","textarea",true],["published","Published","select",true,["false","true"]],
      ["display_order","Display order","number"]
    ] },
  profile_records: { label: "Profile, projects & evidence", table: "profile_records", id: "id", order: "updated_at",
    fields: [
      ["section_key","Website section","select",true,["biography","legal_academic","public_service","scholarships","philanthropy","achievements","projects","evidence"]],
      ["title","Title","text",true],["slug","URL slug","text",true],["category","Subsection / category (use exact Personal Profile subsection name)","text"],
      ["excerpt","Short summary","textarea"],["body","Full content","textarea"],["image_url","Photograph URL (Supabase Storage)","url"],["image_alt","Photograph description (accessibility)","text"],["milestone_date","Milestone date","date"],["display_order","Display order","number"],["location","Location / LGA","text"],
      ["source_url","Primary source URL","url"],["evidence_url","Supporting evidence URL","url"],
      ["verification_status","Verification status","select",true,["Under Verification","Verified","Official Record","Campaign Statement"]],
      ["status","Publication status","select",true,["draft","published","archived"]],
      ["published_at","Publication date and time","datetime-local"]
    ] }
};

let client;
let activeId = null;
let activeModule = modules.news;
const say = (message) => { const node = $("#cms-status"); if (node) node.textContent = message; };
const authSay = (message) => { const node = $("#auth-status"); if (node) node.textContent = message; };

async function initialise() {
  if (!cfg.SUPABASE_URL || !cfg.SUPABASE_PUBLISHABLE_KEY) {
    authSay("Supabase browser configuration is missing.");
    return;
  }
  const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm");
  client = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY, {
    db: { schema: "arise_site" },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: true }
  });
  client.auth.onAuthStateChange(() => setTimeout(checkAuth, 0));
  $("#login-form").addEventListener("submit", login);
  $("#signout").addEventListener("click", async () => { await client.auth.signOut(); });
  $("#content-type").addEventListener("change", () => { activeModule = modules[$("#content-type").value]; activeId = null; clearEditor(); loadList(); });
  $("#admin-search").addEventListener("input", loadList);
  $("#new-record").addEventListener("click", () => { activeId = null; clearEditor(); $("#form-heading").textContent = "New " + activeModule.label; });
  $("#reset-record").addEventListener("click", () => { activeId = null; clearEditor(); });
  $("#record-form").addEventListener("submit", saveRecord);
  $("#delete-record").addEventListener("click", deleteRecord);
  await checkAuth();
}

async function login(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  authSay("Signing in…");
  try {
    const values = new FormData(form);
    const { error } = await client.auth.signInWithPassword({
      email: String(values.get("email") || "").trim(),
      password: String(values.get("password") || "")
    });
    if (error) throw error;
    await checkAuth();
  } catch (error) {
    authSay(error.message || "Sign in failed.");
  } finally {
    button.disabled = false;
  }
}

async function checkAuth() {
  if (!client) return;
  const { data: { user } } = await client.auth.getUser();
  if (!user) { $("#auth-panel").hidden = false; $("#cms-panel").hidden = true; return; }
  const { data, error } = await client.from("admins").select("user_id,role").eq("user_id", user.id).maybeSingle();
  if (error || !data) {
    $("#auth-panel").hidden = false; $("#cms-panel").hidden = true;
    authSay("This signed-in account is not authorised to administer this portal.");
    return;
  }
  $("#auth-panel").hidden = true; $("#cms-panel").hidden = false;
  $("#signed-in-as").textContent = "Signed in as " + (user.email || "authorised administrator") + " · " + data.role;
  await loadList();
  await loadSiteAssets();
}

function renderFields(record = {}) {
  const target = $("#record-fields");
  target.innerHTML = activeModule.fields.map(([name,label,type,required,options]) => {
    const value = record[name] ?? (name === "status" ? "draft" : name === "published" ? "false" : "");
    const req = required ? " required" : "";
    if (type === "textarea") return '<label>' + esc(label) + '<textarea name="' + name + '" rows="5"' + req + '>' + esc(value) + '</textarea></label>';
    if (type === "select") return '<label>' + esc(label) + '<select name="' + name + '"' + req + '>' + options.map(option => '<option value="' + option + '"' + (String(value) === option ? " selected" : "") + '>' + esc(option) + '</option>').join("") + '</select></label>';
    const inputType = type === "datetime-local" && value ? "datetime-local" : type;
    const formatted = type === "datetime-local" && value ? new Date(value).toISOString().slice(0,16) : value;
    return '<label>' + esc(label) + '<input name="' + name + '" type="' + inputType + '" value="' + esc(formatted) + '"' + req + '></label>';
  }).join("");
}

function clearEditor() {
  $("#record-form").reset();
  renderFields();
  $("#form-heading").textContent = "Select or create a record";
  $("#record-id-label").textContent = "";
  $("#delete-record").hidden = true;
  say("");
}

async function loadList() {
  if (!client || $("#cms-panel").hidden) return;
  const box = $("#admin-record-list");
  box.innerHTML = "<p>Loading…</p>";
  const { data, error } = await client.from(activeModule.table).select("*").order(activeModule.order, { ascending: false }).limit(100);
  if (error) { box.innerHTML = "<p>Records could not be loaded. Check administrator access.</p>"; say(error.message); return; }
  const query = ($("#admin-search").value || "").toLowerCase();
  const rows = (data || []).filter(row => JSON.stringify(row).toLowerCase().includes(query));
  if (!rows.length) { box.innerHTML = "<p>No records in this module yet.</p>"; return; }
  box.innerHTML = rows.map(row => '<button type="button" class="admin-record ' + (row.id === activeId ? "active" : "") + '" data-id="' + esc(row.id) + '"><strong>' + esc(row.title || row.section_type || "Untitled") + '</strong><small>' + esc(row.status || (row.published ? "published" : "draft")) + '</small></button>').join("");
  box.querySelectorAll("[data-id]").forEach(button => button.addEventListener("click", () => loadRecord(button.dataset.id)));
}

async function loadRecord(id) {
  const { data, error } = await client.from(activeModule.table).select("*").eq(activeModule.id, id).maybeSingle();
  if (error || !data) { say(error?.message || "Record not found."); return; }
  activeId = id;
  renderFields(data);
  $("#form-heading").textContent = "Edit " + activeModule.label;
  $("#record-id-label").textContent = id;
  $("#delete-record").hidden = false;
  await loadList();
}

async function saveRecord(event) {
  event.preventDefault();
  const button = $("#save-record");
  button.disabled = true;
  say("Saving…");
  try {
    const form = new FormData(event.currentTarget);
    const payload = {};
    for (const [name] of activeModule.fields) {
      let value = form.get(name);
      if (typeof value === "string") value = value.trim();
      if (name === "display_order") value = Number(value || 0);
      if (name === "published") value = value === "true";
      if (name.endsWith("_at") && value) value = new Date(value).toISOString();
      if (value !== "" && value !== null) payload[name] = value;
    }
    if (["news","profile_records"].includes(activeModule.table) && payload.status === "published" && !payload.published_at) payload.published_at = new Date().toISOString();
    const result = activeId
      ? await client.from(activeModule.table).update(payload).eq(activeModule.id, activeId).select(activeModule.id).single()
      : await client.from(activeModule.table).insert(payload).select(activeModule.id).single();
    if (result.error) throw result.error;
    activeId = result.data.id;
    say("Saved successfully. Check the public page after publishing.");
    await loadList();
    $("#record-id-label").textContent = activeId;
    $("#delete-record").hidden = false;
  } catch (error) {
    say(error.message || "Save failed.");
  } finally {
    button.disabled = false;
  }
}

async function deleteRecord() {
  if (!activeId || !window.confirm("Permanently delete this record?")) return;
  const { error } = await client.from(activeModule.table).delete().eq(activeModule.id, activeId);
  if (error) { say(error.message); return; }
  activeId = null; clearEditor(); say("Record deleted."); await loadList();
}


async function loadSiteAssets() {
  const box = $("#site-assets-list");
  if (!box || !client || $("#cms-panel").hidden) return;
  const { data, error } = await client.storage.from("site-assets").list("campaign", { limit: 100, sortBy: { column: "name", order: "asc" } });
  if (error) { box.textContent = "Storage listing unavailable: " + error.message; return; }
  const files = (data || []).filter(item => item.name && !item.id?.endsWith("/"));
  if (!files.length) { box.innerHTML = "<p>No permanent site assets uploaded yet.</p>"; return; }
  box.innerHTML = files.map(item => {
    const path = "campaign/" + item.name;
    const { data: urlData } = client.storage.from("site-assets").getPublicUrl(path);
    return '<div class="admin-record"><strong>' + esc(path) + '</strong><small><a href="' + esc(urlData.publicUrl) + '" target="_blank" rel="noopener">Open asset</a></small><button type="button" class="admin-delete" data-asset-delete="' + esc(path) + '">Delete</button></div>';
  }).join("");
  box.querySelectorAll("[data-asset-delete]").forEach(button => button.addEventListener("click", async () => {
    if (!window.confirm("Permanently delete this Supabase Storage asset?")) return;
    const { error: removeError } = await client.storage.from("site-assets").remove([button.dataset.assetDelete]);
    if (removeError) { $("#site-assets-status").textContent = removeError.message; return; }
    $("#site-assets-status").textContent = "Asset deleted from Supabase Storage.";
    await loadSiteAssets();
  }));
}

async function uploadSiteAssets() {
  const input = $("#site-assets-files");
  const status = $("#site-assets-status");
  const button = $("#upload-site-assets");
  if (!input?.files?.length) { status.textContent = "Choose one or more image files first."; return; }
  const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]);
  button.disabled = true;
  const completed = [];
  try {
    for (const file of Array.from(input.files)) {
      if (!allowed.has(file.type)) throw new Error("Unsupported file type: " + file.name);
      if (file.size > 10 * 1024 * 1024) throw new Error(file.name + " exceeds the 10 MB limit.");
      const safeName = file.name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
      const path = "campaign/" + safeName;
      const { error } = await client.storage.from("site-assets").upload(path, file, {
        cacheControl: "3600", contentType: file.type, upsert: true
      });
      if (error) throw error;
      const { data } = client.storage.from("site-assets").getPublicUrl(path);
      completed.push({ name: safeName, url: data.publicUrl });
    }
    status.textContent = completed.length + " asset(s) uploaded to Supabase Storage. Copy the URLs below when updating the public image references.";
    input.value = "";
    await loadSiteAssets();
  } catch (error) {
    status.textContent = error.message || "Upload failed.";
  } finally {
    button.disabled = false;
  }
}

$("#upload-site-assets")?.addEventListener("click", uploadSiteAssets);

initialise();
