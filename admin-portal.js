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
    ] },
  campaign_songs: { label: "Campaign Songs", table: "campaign_songs", id: "id", order: "created_at",
    fields: [
      ["title","Song title","text",true],["slug","URL slug","text",true],["artist","Artist / performer","text",true],
      ["contributors","Other contributors","text"],["description","Song description","textarea"],["lyrics","Lyrics (approved text only)","textarea"],
      ["campaign_level","Campaign level","select",true,["governorship","senate","house_of_representatives","house_of_assembly"]],
      ["language","Language","text",true],["constituency","Constituency / district (if applicable)","text"],
      ["audio_path","Audio storage path (upload in Campaign Audio Studio)","text",true],["artwork_path","Cover artwork storage path","text"],
      ["duration_seconds","Duration in seconds (optional)","number"],["featured","Featured song","select",true,["false","true"]],
      ["allow_download","Allow public download","select",true,["false","true"]],
      ["status","Publication status","select",true,["draft","pending","approved","published","archived"]],
      ["published_at","Publication date and time","datetime-local"]
    ] },
  broadcast_events: { label: "Broadcast Events & Schedule", table: "broadcast_events", id: "id", order: "starts_at",
    fields: [
      ["title","Broadcast / event title","text",true],["slug","URL slug","text",true],["description","Event description","textarea"],
      ["venue","Venue / event site","text"],["location","Location / LGA","text"],["event_type","Event type","select",true,["campaign_event","rally","town_hall","press_conference","interview","community_meeting","other"]],
      ["speaker","Speaker / host","text"],["starts_at","Scheduled start","datetime-local"],["ends_at","Scheduled end","datetime-local"],
      ["status","Broadcast status","select",true,["draft","scheduled","live","ended","cancelled"]],
      ["is_published","Publish event details","select",true,["false","true"]],
      ["enable_on_air","Show on Benue Arise On-Air","select",true,["true","false"]],
      ["enable_live_video","Show on Benue Arise Live","select",true,["true","false"]],
      ["audio_playback_url","Public audio playback URL (HTTPS only)","url"],["video_playback_url","Public video playback URL (HTTPS only)","url"],
      ["recording_url","Public recording URL (HTTPS only)","url"],["poster_path","Event poster image path or URL","text"]
    ] },
  campaign_playlists: { label: "Campaign Playlists", table: "campaign_playlists", id: "id", order: "display_order",
    fields: [
      ["title","Playlist title","text",true],["slug","URL slug","text",true],["description","Description","textarea"],
      ["campaign_level","Campaign level (optional)","select",false,["governorship","senate","house_of_representatives","house_of_assembly"]],
      ["artwork_path","Artwork storage path","text"],["featured","Featured playlist","select",true,["false","true"]],
      ["status","Publication status","select",true,["draft","published","archived"]],["display_order","Display order","number"]
    ] }
};

let client;
let activeId = null;
let activeModule = modules.news;
let currentUser = null;
let currentRole = null;
let recoveryMode = new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery" || new URLSearchParams(window.location.search).get("type") === "recovery" || new URLSearchParams(window.location.search).has("code");
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
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce" }
  });
  client.auth.onAuthStateChange((event) => setTimeout(() => { if (event === "PASSWORD_RECOVERY") { recoveryMode = true; showPasswordRecovery(); } else if (!recoveryMode) checkAuth(); }, 0));
  $("#login-form").addEventListener("submit", login);
  $("#forgot-password").addEventListener("click", requestPasswordReset);
  $("#recovery-form").addEventListener("submit", completePasswordRecovery);
  $("#signout").addEventListener("click", async () => { await client.auth.signOut(); });
  $("#content-type").addEventListener("change", () => { activeModule = modules[$("#content-type").value]; activeId = null; clearEditor(); loadList(); });
  $("#open-broadcast-events")?.addEventListener("click",()=>{$("#content-type").value="broadcast_events";$("#content-type").dispatchEvent(new Event("change",{bubbles:true}));$("#content-type").scrollIntoView({behavior:"smooth",block:"center"})});
  $("#admin-search").addEventListener("input", loadList);
  $("#new-record").addEventListener("click", () => { activeId = null; clearEditor(); $("#form-heading").textContent = "New " + activeModule.label; });
  $("#reset-record").addEventListener("click", () => { activeId = null; clearEditor(); });
  $("#record-form").addEventListener("submit", saveRecord);
  $("#playlist-select")?.addEventListener("change", loadPlaylistSongOptions);
  $("#save-playlist-tracks")?.addEventListener("click", savePlaylistTracks);
  $("#delete-record").addEventListener("click", deleteRecord);
  $("#profile-manager-form")?.addEventListener("submit", assignProfileManager);
  $("#create-mux-audio")?.addEventListener("click", () => createMuxBroadcastStream("audio"));
  $("#create-mux-video")?.addEventListener("click", () => createMuxBroadcastStream("video"));
  if (recoveryMode) {
    const { data: { session }, error } = await client.auth.getSession();
    if (session) showPasswordRecovery();
    else {
      recoveryMode = false;
      $("#recovery-form").hidden = true;
      $("#login-form").hidden = false;
      authSay(error?.message || "This recovery link is expired, already used, or could not be verified. Request a fresh password-reset email.");
      await checkAuth();
    }
  } else await checkAuth();
}

function showPasswordRecovery() {
  recoveryMode = true;
  $("#auth-panel").hidden = false;
  $("#cms-panel").hidden = true;
  $("#login-form").hidden = true;
  $("#recovery-form").hidden = false;
  authSay("Recovery link verified. Enter and confirm your new password below.");
}

async function requestPasswordReset() {
  const email = String(new FormData($("#login-form")).get("email") || "").trim();
  if (!email) { authSay("Enter your administrator email address first."); $("#login-form [name=email]").focus(); return; }
  const button = $("#forgot-password");
  button.disabled = true;
  authSay("Sending password recovery email…");
  try {
    const redirectTo = "https://samdiok.github.io/Benue-Arise-for-Hon/admin.html";
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
    authSay("If this email belongs to an account, a fresh recovery link has been sent. Check your inbox and spam folder.");
  } catch (error) {
    authSay(error.message || "Could not send the recovery email.");
  } finally { button.disabled = false; }
}

async function completePasswordRecovery(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const values = new FormData(form);
  const password = String(values.get("password") || "");
  const confirm = String(values.get("confirm_password") || "");
  const status = $("#recovery-status");
  const button = form.querySelector('button[type="submit"]');
  if (password.length < 10) { status.textContent = "Use at least 10 characters."; return; }
  if (password !== confirm) { status.textContent = "The passwords do not match."; return; }
  button.disabled = true;
  status.textContent = "Updating password…";
  try {
    const { error } = await client.auth.updateUser({ password });
    if (error) throw error;
    recoveryMode = false;
    await client.auth.signOut();
    form.reset();
    form.hidden = true;
    $("#login-form").hidden = false;
    authSay("Password updated successfully. Sign in with your new password.");
    if (window.location.hash) history.replaceState(null, "", window.location.pathname + window.location.search);
  } catch (error) {
    status.textContent = error.message || "Password update failed. Request a fresh recovery link and try again.";
  } finally { button.disabled = false; }
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
  currentUser = user;
  const [{ data: admin, error: adminError }, { data: manager, error: managerError }] = await Promise.all([
    client.from("admins").select("user_id,role").eq("user_id", user.id).maybeSingle(),
    client.from("profile_managers").select("user_id,display_name,email").eq("user_id", user.id).maybeSingle()
  ]);
  if (adminError || managerError || (!admin && !manager)) {
    $("#auth-panel").hidden = false; $("#cms-panel").hidden = true;
    authSay("This signed-in account is not authorised to administer this portal.");
    return;
  }
  currentRole = admin ? admin.role : "profile_manager";
  $("#auth-panel").hidden = true; $("#cms-panel").hidden = false;
  $("#signed-in-as").textContent = "Signed in as " + (user.email || "authorised user") + " · " + (admin ? admin.role : "Profile Manager");
  const isManager = !admin && !!manager;
  $("#profile-manager-users").hidden = isManager;
  $("#site-assets-manager").hidden = isManager;
  $("#campaign-audio-manager").hidden = isManager;
  $("#playlist-track-manager").hidden = isManager;
  $("#content-type").disabled = isManager;
  if (isManager) {
    $("#content-type").value = "profile_records";
    activeModule = modules.profile_records;
    $("#new-record").textContent = "+ New profile record";
    $("#cms-panel .cms-top h2").textContent = "Profile Manager workspace";
    $("#cms-panel .admin-note").textContent = "Profile Manager access: manage the candidate’s profile records only. Save content as Draft until it has been checked and approved for publication.";
  } else {
    $("#new-record").textContent = "+ New record";
    $("#cms-panel .cms-top h2").textContent = "Manage portal content";
  }
  await loadList();
  if (!isManager) {
    await loadSiteAssets();
    await loadProfileManagers();
    await loadPlaylistComposer();
  }
}


function updateMuxBroadcastControls() {
  const panel = $("#mux-stream-controls");
  if (!panel) return;
  const allowed = currentRole !== "profile_manager" && activeModule.table === "broadcast_events" && !!activeId;
  panel.hidden = !allowed;
  if (!allowed) {
    const output = $("#mux-stream-output");
    if (output) output.replaceChildren();
    const status = $("#mux-stream-status");
    if (status) status.textContent = "";
  }
}

async function createMuxBroadcastStream(channelType) {
  if (!activeId || activeModule.table !== "broadcast_events" || currentRole === "profile_manager") {
    say("Select a saved broadcast event as an authorised administrator first.");
    return;
  }
  const button = channelType === "audio" ? $("#create-mux-audio") : $("#create-mux-video");
  const status = $("#mux-stream-status");
  const output = $("#mux-stream-output");
  button.disabled = true;
  status.textContent = "Requesting a secure Mux test stream…";
  output.replaceChildren();
  try {
    const { data, error } = await client.functions.invoke("mux-create-broadcast-stream", {
      body: { event_id: activeId, channel_type: channelType }
    });
    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || "Mux stream creation failed.");
    const wrap = document.createElement("div");
    wrap.className = "mux-stream-result";
    const heading = document.createElement("strong");
    heading.textContent = channelType === "audio" ? "On-Air audio stream created" : "Live video stream created";
    const warning = document.createElement("p");
    warning.textContent = "Copy the stream key now. It is not saved in the database and cannot be retrieved from this screen after you leave.";
    const ingestLabel = document.createElement("label");
    ingestLabel.textContent = "RTMPS server";
    const ingest = document.createElement("input");
    ingest.readOnly = true;
    ingest.value = data.ingest_url;
    const keyLabel = document.createElement("label");
    keyLabel.textContent = "Private stream key";
    const key = document.createElement("input");
    key.readOnly = true;
    key.type = "text";
    key.autocomplete = "off";
    key.spellcheck = false;
    key.value = data.stream_key;
    const playback = document.createElement("p");
    playback.textContent = "Public playback URL saved to the event: " + data.playback_url;
    const copyServer = document.createElement("button");
    copyServer.type = "button";
    copyServer.textContent = "Copy RTMPS server";
    copyServer.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(ingest.value); copyServer.textContent = "Copied"; }
      catch { ingest.select(); document.execCommand("copy"); copyServer.textContent = "Copy attempted"; }
    });
    const copyKey = document.createElement("button");
    copyKey.type = "button";
    copyKey.textContent = "Copy stream key";
    copyKey.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(key.value); copyKey.textContent = "Copied"; }
      catch { key.select(); document.execCommand("copy"); copyKey.textContent = "Copy attempted"; }
    });
    wrap.append(heading, warning, ingestLabel, ingest, copyServer, keyLabel, key, copyKey, playback);
    output.append(wrap);
    status.textContent = "Mux Development test stream created successfully. The public playback URL has been saved to Supabase.";
  } catch (error) {
    status.textContent = error?.message || "Could not create the Mux stream. Check the function logs and administrator access.";
  } finally {
    button.disabled = false;
  }
}

function renderFields(record = {}) {
  const target = $("#record-fields");
  target.innerHTML = activeModule.fields.filter(([name]) => !(currentRole === "profile_manager" && name === "status")).map(([name,label,type,required,options]) => {
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
  if (currentRole === "profile_manager" && data.status !== "draft") { say("Published and archived records are read-only for Profile Managers. Ask an Administrator to return the record to Draft before editing."); return; }
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
      if (["display_order","duration_seconds"].includes(name)) value = Number(value || 0);
      if (["published","featured","allow_download","is_published","enable_on_air","enable_live_video"].includes(name)) value = value === "true";
      if (name.endsWith("_at") && value) value = new Date(value).toISOString();
      if (value !== "" && value !== null) payload[name] = value;
    }
    if (["news","profile_records","campaign_songs"].includes(activeModule.table) && payload.status === "published" && !payload.published_at) payload.published_at = new Date().toISOString();
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


async function loadProfileManagers() {
  const box = $("#profile-manager-list");
  if (!box || currentRole === "profile_manager") return;
  const { data, error } = await client.from("profile_managers").select("user_id,display_name,email,created_at").order("created_at", {ascending:false});
  if (error) { box.textContent = "Could not load Profile Managers: " + error.message; return; }
  if (!data?.length) { box.innerHTML = "<p>No Profile Managers assigned yet.</p>"; return; }
  box.innerHTML = data.map(row => '<div class="admin-record"><strong>' + esc(row.display_name) + '</strong><small>' + esc(row.email) + '<br>' + esc(row.user_id) + '</small><button type="button" class="admin-delete" data-manager-remove="' + esc(row.user_id) + '">Revoke access</button></div>').join("");
  box.querySelectorAll("[data-manager-remove]").forEach(button => button.addEventListener("click", async () => {
    if (!window.confirm("Revoke this user's Profile Manager access?")) return;
    const { error: removeError } = await client.from("profile_managers").delete().eq("user_id", button.dataset.managerRemove);
    $("#profile-manager-status").textContent = removeError ? removeError.message : "Profile Manager access revoked.";
    if (!removeError) await loadProfileManagers();
  }));
}

async function assignProfileManager(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = $("#assign-profile-manager");
  const status = $("#profile-manager-status");
  button.disabled = true;
  status.textContent = "Assigning access…";
  try {
    const values = new FormData(form);
    const payload = {
      user_id: String(values.get("user_id") || "").trim(),
      display_name: String(values.get("display_name") || "").trim(),
      email: String(values.get("email") || "").trim().toLowerCase()
    };
    const { error } = await client.from("profile_managers").insert(payload);
    if (error) throw error;
    status.textContent = "Profile Manager access assigned. The user can now sign in with the existing Auth account.";
    form.reset();
    await loadProfileManagers();
  } catch (error) {
    status.textContent = error.message || "Could not assign Profile Manager access.";
  } finally {
    button.disabled = false;
  }
}


async function loadPlaylistComposer() {
  const panel=$("#playlist-track-manager");
  if(!panel||!client||currentRole==="profile_manager")return;
  const [{data:playlists,error:pError},{data:songs,error:sError}]=await Promise.all([
    client.from("campaign_playlists").select("id,title").order("title"),
    client.from("campaign_songs").select("id,title,artist,status").order("title")
  ]);
  if(pError||sError){$("#playlist-track-status").textContent=(pError||sError).message;return}
  const select=$("#playlist-select"),previous=select.value;
  select.innerHTML='<option value="">Select a playlist</option>'+(playlists||[]).map(p=>'<option value="'+esc(p.id)+'">'+esc(p.title)+'</option>').join("");
  if(playlists?.some(p=>p.id===previous))select.value=previous;
  panel.dataset.songs=JSON.stringify(songs||[]);
  if(!playlists?.length)$("#playlist-song-options").innerHTML='<div class="playlist-empty">No playlists yet. Create one using the Campaign Playlists module, then return here to add its tracks.</div>';
  else await loadPlaylistSongOptions();
}
async function loadPlaylistSongOptions(){
  const box=$("#playlist-song-options"),playlistId=$("#playlist-select")?.value;
  if(!box)return;
  const songs=JSON.parse($("#playlist-track-manager").dataset.songs||"[]");
  if(!playlistId){box.innerHTML='<div class="playlist-empty">Choose a playlist above to view and arrange its songs.</div>';$("#playlist-song-count").textContent="0 tracks selected";return}
  const {data:links,error}=await client.from("campaign_playlist_songs").select("song_id,display_order").eq("playlist_id",playlistId).order("display_order");
  if(error){box.textContent=error.message;return}
  const order=(links||[]).map(x=>x.song_id),byId=new Map(songs.map(s=>[s.id,s]));
  const selected=order.map(id=>byId.get(id)).filter(Boolean),remaining=songs.filter(s=>!order.includes(s.id));
  const render=(s,isSelected,index)=>'<div class="playlist-track-row '+(isSelected?"is-selected":"")+'" data-track="'+esc(s.id)+'"><label class="playlist-track-check"><input type="checkbox" value="'+esc(s.id)+'" '+(isSelected?"checked":"")+'><span><strong>'+esc(s.title)+'</strong><small>'+esc(s.artist||"Artist not specified")+' · '+esc(s.status||"draft")+'</small></span></label>'+(isSelected?'<div class="track-order-controls"><span>'+(index+1)+'</span><button type="button" data-move="-1" aria-label="Move '+esc(s.title)+' up" '+(index===0?"disabled":"")+'>↑</button><button type="button" data-move="1" aria-label="Move '+esc(s.title)+' down" '+(index===selected.length-1?"disabled":"")+'>↓</button></div>':'<span class="track-add-hint">Available to add</span>')+'</div>';
  box.innerHTML=(selected.map((s,i)=>render(s,true,i)).join("")||"")+(remaining.map(s=>render(s,false,-1)).join("")||"");
  $("#playlist-song-count").textContent=selected.length+" track"+(selected.length===1?"":"s")+" selected";
  box.querySelectorAll('input[type="checkbox"]').forEach(input=>input.addEventListener("change",async()=>{
    const chosen=Array.from(box.querySelectorAll('input[type="checkbox"]:checked')).map(x=>x.value);
    const currentOrder=Array.from(box.querySelectorAll(".playlist-track-row.is-selected")).map(x=>x.dataset.track);
    const nextOrder=currentOrder.filter(id=>chosen.includes(id));
    chosen.forEach(id=>{if(!nextOrder.includes(id))nextOrder.push(id)});
    await renderPlaylistSelection(nextOrder);
  }));
  box.querySelectorAll("[data-move]").forEach(button=>button.addEventListener("click",async()=>{
    const rows=Array.from(box.querySelectorAll(".playlist-track-row.is-selected")),ids=rows.map(x=>x.dataset.track),row=button.closest(".playlist-track-row"),from=ids.indexOf(row.dataset.track),to=from+Number(button.dataset.move);
    if(to<0||to>=ids.length)return;
    [ids[from],ids[to]]=[ids[to],ids[from]];
    await renderPlaylistSelection(ids);
  }));
}
async function renderPlaylistSelection(ids){
  const box=$("#playlist-song-options"),songs=JSON.parse($("#playlist-track-manager").dataset.songs||"[]"),byId=new Map(songs.map(s=>[s.id,s]));
  const ordered=ids.map(id=>byId.get(id)).filter(Boolean),remaining=songs.filter(s=>!ids.includes(s.id));
  const render=(s,isSelected,index)=>'<div class="playlist-track-row '+(isSelected?"is-selected":"")+'" data-track="'+esc(s.id)+'"><label class="playlist-track-check"><input type="checkbox" value="'+esc(s.id)+'" '+(isSelected?"checked":"")+'><span><strong>'+esc(s.title)+'</strong><small>'+esc(s.artist||"Artist not specified")+' · '+esc(s.status||"draft")+'</small></span></label>'+(isSelected?'<div class="track-order-controls"><span>'+(index+1)+'</span><button type="button" data-move="-1" aria-label="Move track up" '+(index===0?"disabled":"")+'>↑</button><button type="button" data-move="1" aria-label="Move track down" '+(index===ordered.length-1?"disabled":"")+'>↓</button></div>':'<span class="track-add-hint">Available to add</span>')+'</div>';
  box.innerHTML=ordered.map((s,i)=>render(s,true,i)).join("")+remaining.map(s=>render(s,false,-1)).join("");
  $("#playlist-song-count").textContent=ordered.length+" track"+(ordered.length===1?"":"s")+" selected";
  box.querySelectorAll('input[type="checkbox"]').forEach(input=>input.addEventListener("change",()=>{const current=Array.from(box.querySelectorAll(".playlist-track-row.is-selected")).map(x=>x.dataset.track);const next=current.filter(id=>id!==input.value);if(input.checked)next.push(input.value);renderPlaylistSelection(next)}));
  box.querySelectorAll("[data-move]").forEach(button=>button.addEventListener("click",()=>{const current=Array.from(box.querySelectorAll(".playlist-track-row.is-selected")).map(x=>x.dataset.track),row=button.closest(".playlist-track-row"),from=current.indexOf(row.dataset.track),to=from+Number(button.dataset.move);if(to<0||to>=current.length)return;[current[from],current[to]]=[current[to],current[from]];renderPlaylistSelection(current)}));
}
async function savePlaylistTracks(){
  const playlistId=$("#playlist-select").value,status=$("#playlist-track-status"),button=$("#save-playlist-tracks");
  if(!playlistId){status.textContent="Choose a playlist before saving.";return}
  const selected=Array.from($("#playlist-song-options").querySelectorAll(".playlist-track-row.is-selected")).map(x=>x.dataset.track);
  button.disabled=true;status.textContent="Saving the selected track order…";
  try{
    const {error:delError}=await client.from("campaign_playlist_songs").delete().eq("playlist_id",playlistId);
    if(delError)throw delError;
    if(selected.length){const {error}=await client.from("campaign_playlist_songs").insert(selected.map((song_id,i)=>({playlist_id:playlistId,song_id,display_order:i+1})));if(error)throw error}
    status.textContent="Saved successfully · "+selected.length+" track(s) in playback order.";
  }catch(error){status.textContent=error.message||"Could not save playlist order."}
  finally{button.disabled=false}
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

async function uploadCampaignAsset(kind){
  const audio=kind==="audio",input=audio?$("#campaign-audio-file"):$("#campaign-artwork-file"),status=$("#campaign-audio-status"),button=audio?$("#upload-campaign-audio"):$("#upload-campaign-artwork"),file=input?.files?.[0];
  if(!file){status.textContent=audio?"Choose an audio recording first.":"Choose cover artwork first.";return}
  const allowed=audio?new Set(["audio/mpeg","audio/mp4","audio/aac","audio/ogg","audio/wav","audio/x-wav","audio/flac","audio/webm"]):new Set(["image/jpeg","image/png","image/webp"]),max=audio?50*1024*1024:8*1024*1024;
  if(!allowed.has(file.type)){status.textContent="This file format is not supported. Choose an approved audio or image format.";return}
  if(file.size>max){status.textContent="The selected file exceeds the "+(audio?"50 MB":"8 MB")+" upload limit.";return}
  button.disabled=true;button.textContent="Uploading…";status.textContent="Uploading securely to Supabase Storage…";
  try{
    const safe=file.name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g,"-").replace(/^-+|-+$/g,""),path=(audio?"songs/":"artwork/")+Date.now()+"-"+safe;
    const {error}=await client.storage.from("campaign-audio").upload(path,file,{cacheControl:"3600",contentType:file.type,upsert:false});
    if(error)throw error;
    const field=audio?"audio_path":"artwork_path",target=document.querySelector('#record-fields [name="'+field+'"]');
    if(target){target.value=path;target.dispatchEvent(new Event("input",{bubbles:true}));status.textContent="Upload complete. The "+(audio?"audio":"artwork")+" path has been inserted into the open Campaign Song record. Save that record to keep the link."}
    else status.textContent="Upload complete. Storage path: "+path+". Open Campaign Songs, create or select the matching song, then paste this path into its "+(audio?"Audio storage path":"Cover artwork storage path")+" field.";
    const result=document.createElement("div");result.className="studio-upload-result";result.innerHTML='<span>UPLOAD COMPLETE</span><code></code><button type="button" class="studio-copy-path">Copy path</button>';
    result.querySelector("code").textContent=path;result.querySelector("button").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(path);status.textContent="Storage path copied to clipboard."}catch{status.textContent="Select and copy the storage path shown above."}});
    status.appendChild(result);input.value="";
  }catch(error){status.textContent=error.message||"Upload failed."}
  finally{button.disabled=false;button.textContent=audio?"Upload recording":"Upload artwork"}
}
$("#upload-campaign-audio")?.addEventListener("click", () => uploadCampaignAsset("audio"));
$("#upload-campaign-artwork")?.addEventListener("click", () => uploadCampaignAsset("artwork"));


initialise();
