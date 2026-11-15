(() => {
const modal=document.getElementById("quote-modal");if(!modal)return;
const cards=[...document.querySelectorAll(".quote-card")],quotes=cards.map(card=>({key:card.dataset.quoteKey,text:card.dataset.quote,label:card.dataset.label,card}));
const text=document.getElementById("quote-modal-text"),category=document.getElementById("quote-modal-category"),close=modal.querySelector(".quote-modal-close");
const endpoint="https://atstsekevoozausbiqbi.supabase.co/functions/v1/quote-interactions",apiKey=window.ARISE_CONFIG?.SUPABASE_PUBLISHABLE_KEY;
let current=0,previousFocus=null,editTokens=new Map(),cache={};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const $=id=>document.getElementById(id);
async function call(action,payload={}){if(!apiKey)throw new Error("The public site connection is not configured.");const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json","apikey":apiKey},body:JSON.stringify({action,quote_key:quotes[current].key,...payload})});const data=await response.json();if(!response.ok)throw new Error(data.error||"Request failed.");return data;}
function updateCounts(data){const love=data.reactions?.love||0,like=data.reactions?.like||0,count=data.comment_count??data.comments?.length??0;$("modal-love-count").textContent=love;$("modal-like-count").textContent=like;$("modal-comment-count").textContent=count;$("comments-total").textContent="("+count+")";const card=quotes[current].card;card.querySelector("[data-love-count]").textContent=love;card.querySelector("[data-like-count]").textContent=like;card.querySelector("[data-comment-count]").textContent=count;}
function renderComments(items){const box=$("quote-comment-list");box.replaceChildren();if(!items?.length){const p=document.createElement("p");p.className="comments-empty";p.textContent="No approved comments yet. Be the first to contribute thoughtfully.";box.append(p);return;}items.forEach(item=>{const article=document.createElement("article");article.className="quote-comment";const header=document.createElement("header"),name=document.createElement("span"),time=document.createElement("time"),body=document.createElement("p");name.textContent=item.display_name||"Guest";time.textContent=new Date(item.created_at).toLocaleString("en-GB",{dateStyle:"medium",timeStyle:"short"});body.textContent=item.comment_text;header.append(name,time);article.append(header,body);box.append(article);});}
async function loadData(){const quote=quotes[current];$("quote-comment-list").innerHTML='<p class="comments-loading">Loading comments…</p>';try{const data=await call("list");cache[quote.key]=data;updateCounts(data);renderComments(data.comments);}catch(error){$("quote-comment-list").innerHTML='<p class="comments-empty">Comments are temporarily unavailable. Please try again shortly.</p>';}}
function show(index){current=(index+quotes.length)%quotes.length;const q=quotes[current];text.textContent="“"+q.text+"”";category.textContent=q.label; $("quote-position").textContent=String(current+1).padStart(2,"0")+" / "+String(quotes.length).padStart(2,"0");$("quote-share-status").textContent="Share the designed quote image directly to supported apps.";loadData();}
function open(index,card){previousFocus=card;modal.hidden=false;document.body.style.overflow="hidden";show(index);close.focus();}
function closeModal(){modal.hidden=true;document.body.style.overflow="";if(previousFocus)previousFocus.focus();}
cards.forEach((card,index)=>card.addEventListener("click",()=>open(index,card)));close.addEventListener("click",closeModal);modal.addEventListener("click",e=>{if(e.target===modal)closeModal();});document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!modal.hidden)closeModal();});
$("quote-previous").addEventListener("click",()=>show(current-1));$("quote-next").addEventListener("click",()=>show(current+1));
async function react(kind){const button=$(kind==="love"?"quote-love":"quote-like");button.disabled=true;try{const data=await call("react",{reaction:kind});updateCounts(data);}catch(e){$("quote-share-status").textContent=e.message;}finally{button.disabled=false;}}
$("quote-love").addEventListener("click",()=>react("love"));$("quote-like").addEventListener("click",()=>react("like"));
$("quote-comment-jump").addEventListener("click",()=>$("comment-text").focus());
$("quote-comment-form").addEventListener("submit",async e=>{e.preventDefault();const button=$("comment-submit"),status=$("comment-status");button.disabled=true;status.textContent="Submitting…";try{const data=await call("comment",{display_name:$("comment-name").value,comment_text:$("comment-text").value});status.textContent=data.message+(data.status==="approved"?"":" A moderator will review it.");if(data.edit_token){editTokens.set(data.id,data.edit_token);$("edit-comment-id").value=data.id;$("edit-code").value=data.edit_token;$("edit-comment-text").value=$("comment-text").value;status.textContent+=" Your private edit code is shown in the correction section below; keep it safe.";document.querySelector(".comment-edit-panel").open=true;} $("comment-text").value="";await loadData();}catch(error){status.textContent=error.message;}finally{button.disabled=false;}});
$("quote-edit-form").addEventListener("submit",async e=>{e.preventDefault();const button=e.currentTarget.querySelector("button"),status=$("edit-status");button.disabled=true;status.textContent="Saving correction…";try{const data=await call("edit",{id:$("edit-comment-id").value.trim(),edit_token:$("edit-code").value.trim(),comment_text:$("edit-comment-text").value});status.textContent=data.message;await loadData();}catch(error){status.textContent=error.message;}finally{button.disabled=false;}});
async function makeArtwork(q){
  if(document.fonts?.load){await Promise.all([document.fonts.load("700 96px Caveat"),document.fonts.load("700 32px DM Sans")]);}
  const canvas=document.createElement("canvas");canvas.width=1080;canvas.height=1350;
  const ctx=canvas.getContext("2d");
  const bg=ctx.createLinearGradient(0,0,1080,1350);bg.addColorStop(0,"#031f19");bg.addColorStop(.48,"#07533b");bg.addColorStop(1,"#031f25");ctx.fillStyle=bg;ctx.fillRect(0,0,1080,1350);
  const glow=ctx.createRadialGradient(830,410,30,830,410,780);glow.addColorStop(0,"rgba(31,132,91,.32)");glow.addColorStop(1,"rgba(3,31,25,0)");ctx.fillStyle=glow;ctx.fillRect(0,0,1080,1350);
  // Architectural linework adds depth without competing with the quotation.
  ctx.strokeStyle="rgba(226,169,91,.16)";ctx.lineWidth=2;
  for(let i=0;i<7;i++){ctx.beginPath();ctx.arc(1060,220,180+i*64,Math.PI*.5,Math.PI*1.5);ctx.stroke();}
  ctx.strokeStyle="#dca45b";ctx.lineWidth=3;ctx.strokeRect(44,44,992,1262);
  ctx.strokeStyle="rgba(240,190,119,.48)";ctx.lineWidth=1;ctx.strokeRect(58,58,964,1234);
  // Header lock-up
  ctx.textAlign="left";ctx.fillStyle="#f1bd77";ctx.font="700 25px 'DM Sans',Arial";ctx.fillText("BENUE ARISE",92,126);
  ctx.fillStyle="rgba(255,244,222,.72)";ctx.font="600 18px 'DM Sans',Arial";ctx.fillText("FOR HON",92,157);
  ctx.textAlign="right";ctx.fillStyle="#f1bd77";ctx.font="700 19px 'DM Sans',Arial";ctx.fillText("CHAN U YA CHAN",988,132);
  ctx.strokeStyle="rgba(231,183,117,.55)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(92,194);ctx.lineTo(988,194);ctx.stroke();
  // Quote category and statement
  ctx.textAlign="center";ctx.fillStyle="#efb36a";ctx.font="700 19px 'DM Sans',Arial";
  const category=q.key==="poverty-will-suffer"?"POVERTY ERADICATION  /  HUMAN DIGNITY":"RESILIENCE  /  PERSONAL DETERMINATION";
  ctx.fillText(category,540,280);
  ctx.fillStyle="#e9ae61";ctx.font="700 190px Georgia";ctx.fillText("“",540,455);
  ctx.fillStyle="#fff9ed";ctx.textAlign="center";
  const words=q.text.split(/\s+/);let lines=[],line="",fontSize=94;
  function wrapAt(size){ctx.font="700 "+size+"px Caveat, cursive";const output=[];let currentLine="";for(const word of words){const test=currentLine?currentLine+" "+word:word;if(ctx.measureText(test).width>850&&currentLine){output.push(currentLine);currentLine=word;}else currentLine=test;}if(currentLine)output.push(currentLine);return output;}
  lines=wrapAt(fontSize);while((lines.length>4||Math.max(...lines.map(x=>ctx.measureText(x).width))>850)&&fontSize>66){fontSize-=4;lines=wrapAt(fontSize);}
  ctx.font="700 "+fontSize+"px Caveat, cursive";const lineHeight=fontSize*1.12;const quoteTop=690-(lines.length*lineHeight)/2;
  lines.forEach((part,i)=>ctx.fillText(part,540,quoteTop+i*lineHeight,880));
  // Gold signature flourish
  const flourish=ctx.createLinearGradient(365,0,715,0);flourish.addColorStop(0,"rgba(221,161,86,0)");flourish.addColorStop(.5,"#e8b36d");flourish.addColorStop(1,"rgba(221,161,86,0)");
  ctx.fillStyle=flourish;ctx.fillRect(365,970,350,3);
  ctx.fillStyle="#fff0d7";ctx.font="700 34px 'DM Sans',Arial";ctx.fillText("PROF. S. T. HON",540,1054);
  ctx.fillStyle="#efb36a";ctx.font="700 21px 'DM Sans',Arial";ctx.fillText("SDP GUBERNATORIAL CANDIDATE  ·  2027",540,1104);
  ctx.fillStyle="rgba(245,244,229,.78)";ctx.font="500 21px 'DM Sans',Arial";ctx.fillText("Ideas that inspire courage. Words that move a people.",540,1194);
  ctx.fillStyle="#e7b36e";ctx.font="700 17px 'DM Sans',Arial";ctx.fillText("LEADERSHIP  ·  SERVICE  ·  PUBLIC ENGAGEMENT",540,1252);
  return await new Promise(resolve=>canvas.toBlob(resolve,"image/png"));
}
$("quote-share").addEventListener("click",async()=>{const button=$("quote-share"),status=$("quote-share-status"),q=quotes[current];button.disabled=true;status.textContent="Preparing the branded quote image…";try{const blob=await makeArtwork(q);if(!blob)throw new Error("The artwork could not be generated on this device.");const file=new File([blob],"benue-arise-quote-"+q.key+".png",{type:"image/png"});const shareData={files:[file],title:"Prof. S. T. Hon — Philosophy & Quotes",text:q.text+" — Prof. S. T. Hon · 2027"};if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share(shareData);status.textContent="Quote artwork shared.";}else{const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);try{await navigator.clipboard.writeText(q.text+" — Prof. S. T. Hon · 2027");}catch{}status.textContent="The branded quote image has been downloaded. Attach that image to your social post; the quote text has also been copied where supported."}}catch(error){if(error.name==="AbortError"){status.textContent="Sharing cancelled.";}else{status.textContent=error.message||"Unable to share this artwork on this device.";}}finally{button.disabled=false;}});
async function init(){for(let i=0;i<quotes.length;i++){current=i;try{const data=await call("list");cache[quotes[i].key]=data;const card=quotes[i].card;card.querySelector("[data-love-count]").textContent=data.reactions?.love||0;card.querySelector("[data-like-count]").textContent=data.reactions?.like||0;card.querySelector("[data-comment-count]").textContent=data.comment_count||0;}catch(e){console.warn("Quote interaction counts unavailable",e);}}current=0;}
const year=document.querySelector("[data-year]");if(year)year.textContent=new Date().getFullYear();init();
})();