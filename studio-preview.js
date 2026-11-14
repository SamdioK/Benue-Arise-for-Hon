(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const toast = (message) => {
    const node = $("#sp-toast");
    node.textContent = message;
    node.classList.add("is-visible");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => node.classList.remove("is-visible"), 2600);
  };
  const log = (message, tag="DEMO") => {
    const list = $("#sp-activity-list");
    const row = document.createElement("div");
    const time = document.createElement("time");
    const label = document.createElement("span");
    const badge = document.createElement("b");
    time.textContent = new Date().toLocaleTimeString("en-GB", {hour12:false});
    label.textContent = message;
    badge.textContent = tag;
    row.append(time,label,badge);
    list.prepend(row);
    while(list.children.length>8) list.lastElementChild.remove();
  };
  document.querySelectorAll(".sp-tab").forEach(button => button.addEventListener("click", () => {
    const mode = button.dataset.mode;
    document.querySelectorAll(".sp-tab").forEach(tab => tab.classList.toggle("is-active", tab===button));
    document.querySelectorAll("[data-studio]").forEach(panel => panel.hidden = panel.dataset.studio!==mode);
    log((mode==="audio"?"Audio":"Video")+" studio selected");
  }));
  let playing=false, muted=false, previewing=false, recording=false;
  $("#audio-play").addEventListener("click", () => {
    playing=!playing;
    $("#audio-play").textContent=playing?"Ⅱ":"▶";
    $("#audio-play-label").textContent=playing?"Demonstration playing":"Preview paused";
    $(".sp-audio-screen").classList.toggle("is-playing",playing);
    $("#audio-meter").style.width=playing?"68%":"0%";
    $("#audio-meter-value").textContent=playing?"−12 dB":"−∞ dB";
    toast(playing?"Demo audio animation started. No audio is transmitted.":"Demo audio animation paused.");
    log(playing?"Audio preview simulation started":"Audio preview simulation paused");
  });
  $("#audio-mute").addEventListener("click", () => {
    muted=!muted;
    $("#audio-mute").textContent=muted?"🔇 Muted":"🔊 Sound";
    toast("Visual mute control toggled. No real audio input is connected.");
    log("Audio monitor mute display "+(muted?"enabled":"disabled"));
  });
  $("#video-preview").addEventListener("click", () => {
    previewing=!previewing;
    $("#video-preview").textContent=previewing?"Ⅱ Pause preview simulation":"▶ Start preview simulation";
    $(".sp-video-frame").style.filter=previewing?"brightness(1.12) saturate(1.12)":"none";
    toast(previewing?"Video preview simulation started. No camera or stream is connected.":"Video preview simulation paused.");
    log(previewing?"Video preview simulation started":"Video preview simulation paused");
  });
  $("#video-record").addEventListener("click", () => {
    recording=!recording;
    $("#video-record").textContent=recording?"Stop recording preview":"Start recording preview";
    $("#video-record").style.background=recording?"#f7f0df":"#fff";
    $("#video-record").style.color=recording?"#8b6420":"#286043";
    toast(recording?"Recording indicator simulated. No file is being created.":"Recording simulation stopped. No file was saved.");
    log(recording?"Recording preview indicator enabled":"Recording preview indicator disabled");
  });
  document.querySelectorAll("[data-toggle]").forEach(button => button.addEventListener("click", () => {
    const on=button.classList.toggle("is-on");
    button.setAttribute("aria-pressed",String(on));
    const name=button.dataset.toggle.replaceAll("-"," ");
    toast(name+" "+(on?"enabled":"disabled")+" in this visual preview.");
    log(name+" display "+(on?"enabled":"disabled"));
  }));
  document.querySelectorAll("[data-preview]").forEach(button => button.addEventListener("click", () => {
    const messages={recording:"This is a sample recording-library action. No recording is played.",schedule:"Sample schedule and run-sheet panel selected. No event was changed.",notice:"Emergency notice preview: 'Official campaign broadcast update'. Nothing has been published."};
    toast(messages[button.dataset.preview]);
    log(button.dataset.preview+" preview opened");
  }));
  $("#audio-quality").addEventListener("change",e=>{toast("Audio quality preview set to "+e.target.value);log("Audio quality display changed");});
  $("#video-quality").addEventListener("change",e=>{toast("Video quality preview set to "+e.target.value);log("Video quality display changed");});
})();