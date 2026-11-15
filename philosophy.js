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
async function loadPosterImage(url,label){
  return new Promise((resolve,reject)=>{
    const image=new Image();
    image.crossOrigin="anonymous";
    image.onload=()=>resolve(image);
    image.onerror=()=>reject(new Error("The official "+label+" could not be retrieved. Please check the Supabase Storage asset URL and public access."));
    image.src=url;
  });
}
async function makeArtwork(q){
  const portraitUrl=new URL("assets/candidate-portrait.jpg",document.baseURI).href;
  const logoUrl=new URL("assets/sdp-logo.jpg",document.baseURI).href;
  const [portrait,logo]=await Promise.all([loadPosterImage(portraitUrl,"candidate portrait"),loadPosterImage(logoUrl,"official SDP logo")]);
  if(document.fonts?.load)await Promise.all([document.fonts.load("700 96px Caveat"),document.fonts.load("700 30px DM Sans")]);
  const canvas=document.createElement("canvas");canvas.width=1080;canvas.height=1350;
  const ctx=canvas.getContext("2d");
  const bg=ctx.createLinearGradient(0,0,1080,1350);bg.addColorStop(0,"#031f19");bg.addColorStop(.48,"#07533b");bg.addColorStop(1,"#031f25");ctx.fillStyle=bg;ctx.fillRect(0,0,1080,1350);
  const glow=ctx.createRadialGradient(820,390,20,820,390,780);glow.addColorStop(0,"rgba(35,143,93,.34)");glow.addColorStop(1,"rgba(3,31,25,0)");ctx.fillStyle=glow;ctx.fillRect(0,0,1080,1350);
  ctx.strokeStyle="rgba(226,169,91,.16)";ctx.lineWidth=2;for(let i=0;i<7;i++){ctx.beginPath();ctx.arc(1080,220,180+i*64,Math.PI*.5,Math.PI*1.5);ctx.stroke();}
  ctx.strokeStyle="#dca45b";ctx.lineWidth=3;ctx.strokeRect(38,38,1004,1274);ctx.strokeStyle="rgba(240,190,119,.42)";ctx.lineWidth=1;ctx.strokeRect(52,52,976,1246);
  // Official party logo: loaded directly from the campaign's Supabase Storage asset.
  ctx.save();ctx.beginPath();ctx.arc(142,132,66,0,Math.PI*2);ctx.clip();ctx.fillStyle="#fff";ctx.fillRect(76,66,132,132);drawImageCover(ctx,logo,76,66,132,132);ctx.restore();
  ctx.strokeStyle="#e2b16d";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(230,76);ctx.lineTo(230,188);ctx.stroke();
  ctx.textAlign="left";ctx.fillStyle="#f1bd77";ctx.font="800 34px 'DM Sans',Arial";ctx.fillText("BENUE ARISE",266,120);ctx.fillStyle="#fff8e9";ctx.font="600 30px 'DM Sans',Arial";ctx.fillText("FOR HON",266,158);
  ctx.textAlign="right";ctx.fillStyle="#f1bd77";ctx.font="700 22px 'DM Sans',Arial";ctx.fillText("CHAN U YA CHAN",986,125);
  ctx.strokeStyle="rgba(231,183,117,.55)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(266,190);ctx.lineTo(986,190);ctx.stroke();
  // Campaign section ribbon.
  ctx.save();ctx.fillStyle="#dca34f";ctx.beginPath();ctx.moveTo(266,220);ctx.lineTo(990,220);ctx.lineTo(962,280);ctx.lineTo(238,280);ctx.closePath();ctx.fill();
  ctx.fillStyle="#073b2b";ctx.textAlign="center";ctx.font="800 29px 'DM Sans',Arial";ctx.fillText("PHILOSOPHY & QUOTES",614,260);ctx.restore();
  // The hero's real portrait anchors the lower-left portion of the poster.
  ctx.save();ctx.beginPath();ctx.moveTo(0,720);ctx.bezierCurveTo(120,660,270,670,380,770);ctx.bezierCurveTo(455,845,500,1030,640,1350);ctx.lineTo(0,1350);ctx.closePath();ctx.clip();
  drawImageCover(ctx,portrait,-32,640,690,760);
  const shade=ctx.createLinearGradient(0,740,570,1300);shade.addColorStop(0,"rgba(3,35,26,.02)");shade.addColorStop(1,"rgba(3,35,26,.32)");ctx.fillStyle=shade;ctx.fillRect(0,640,660,710);ctx.restore();
  // Restrained Tiv-inspired woven side detail.
  ctx.save();ctx.beginPath();ctx.moveTo(0,440);ctx.lineTo(36,500);ctx.lineTo(36,1120);ctx.lineTo(0,1180);ctx.closePath();ctx.clip();
  for(let i=0;i<7;i++){ctx.strokeStyle=i%3===0?"#c94c37":i%2===0?"#e7d7b9":"#253c58";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(i*8,430);ctx.lineTo(i*8+260,1190);ctx.stroke();}ctx.restore();
  // Quote is the primary visual focus.
  ctx.textAlign="center";ctx.fillStyle="#efb36a";ctx.font="700 170px Georgia";ctx.fillText("“",690,390);
  ctx.fillStyle="#fff9ed";const words=q.text.split(/\s+/);let lines=[],fontSize=88;
  function wrapAt(size){ctx.font="700 "+size+"px Caveat,cursive";const output=[];let line="";for(const word of words){const test=line?line+" "+word:word;if(ctx.measureText(test).width>750&&line){output.push(line);line=word;}else line=test;}if(line)output.push(line);return output;}
  lines=wrapAt(fontSize);while((lines.length>4||Math.max(...lines.map(x=>ctx.measureText(x).width))>750)&&fontSize>62){fontSize-=4;lines=wrapAt(fontSize);}
  ctx.font="700 "+fontSize+"px Caveat,cursive";const lineHeight=fontSize*1.1;const quoteTop=500-(lines.length*lineHeight)/2;
  lines.forEach((part,i)=>ctx.fillText(part,690,quoteTop+i*lineHeight,790));
  ctx.strokeStyle="#e8b36d";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(500,770);ctx.quadraticCurveTo(690,720,870,770);ctx.stroke();
  // Attribution and candidacy details.
  ctx.fillStyle="#fff0d7";ctx.font="700 28px 'DM Sans',Arial";ctx.fillText("PROF. (CHIEF)",690,850);
  ctx.fillStyle="#f2c56f";ctx.font="800 48px 'Playfair Display',Georgia";ctx.fillText("SEBASTINE",690,910);ctx.fillText("TARTENGER HON",690,966);
  ctx.fillStyle="#fff8e9";ctx.font="600 20px 'DM Sans',Arial";ctx.fillText("SAN, FCIArb, DSSRS, Sema-Wan u Tiv",690,1010);
  ctx.fillStyle="#5b160e";roundRect(ctx,390,1040,590,58,25);ctx.fill();
  ctx.strokeStyle="#e6b45f";ctx.lineWidth=3;roundRect(ctx,390,1040,590,58,25);ctx.stroke();
  ctx.fillStyle="#fff8e9";ctx.font="800 22px 'DM Sans',Arial";ctx.fillText("SDP GUBERNATORIAL CANDIDATE 2027",685,1077);
  ctx.fillStyle="#e8b36d";ctx.font="italic 38px Caveat,cursive";ctx.fillText("S. T. Hon",790,1160);
  // Scenic glow and closing campaign line.
  const horizon=ctx.createLinearGradient(0,1160,0,1285);horizon.addColorStop(0,"rgba(239,163,70,0)");horizon.addColorStop(1,"rgba(236,147,55,.30)");ctx.fillStyle=horizon;ctx.fillRect(380,1160,650,120);
  ctx.strokeStyle="#dca45b";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(36,1235);ctx.quadraticCurveTo(520,1320,1044,1220);ctx.stroke();
  ctx.fillStyle="#f5d39c";ctx.font="800 23px 'DM Sans',Arial";ctx.fillText("A GREATER BENUE IS POSSIBLE",760,1282);
  ctx.fillStyle="rgba(255,245,226,.8)";ctx.font="600 16px 'DM Sans',Arial";ctx.fillText("LEADERSHIP  ·  SERVICE  ·  PUBLIC ENGAGEMENT",760,1308);
  return await new Promise(resolve=>canvas.toBlob(resolve,"image/png"));
}
function drawImageCover(ctx,image,x,y,width,height){
  const scale=Math.max(width/image.naturalWidth,height/image.naturalHeight),sw=width/scale,sh=height/scale;
  const sx=(image.naturalWidth-sw)/2,sy=(image.naturalHeight-sh)/2;
  ctx.drawImage(image,sx,sy,sw,sh,x,y,width,height);
}
function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
$("quote-share").addEventListener("click",async()=>{const button=$("quote-share"),status=$("quote-share-status"),q=quotes[current];button.disabled=true;status.textContent="Preparing the branded quote image…";try{const blob=await makeArtwork(q);if(!blob)throw new Error("The artwork could not be generated on this device.");const file=new File([blob],"benue-arise-quote-"+q.key+".png",{type:"image/png"});const shareData={files:[file],title:"Prof. S. T. Hon — Philosophy & Quotes",text:q.text+" — Prof. S. T. Hon · 2027"};if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share(shareData);status.textContent="Quote artwork shared.";}else{const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);try{await navigator.clipboard.writeText(q.text+" — Prof. S. T. Hon · 2027");}catch{}status.textContent="The branded quote image has been downloaded. Attach that image to your social post; the quote text has also been copied where supported."}}catch(error){if(error.name==="AbortError"){status.textContent="Sharing cancelled.";}else{status.textContent=error.message||"Unable to share this artwork on this device.";}}finally{button.disabled=false;}});
async function init(){for(let i=0;i<quotes.length;i++){current=i;try{const data=await call("list");cache[quotes[i].key]=data;const card=quotes[i].card;card.querySelector("[data-love-count]").textContent=data.reactions?.love||0;card.querySelector("[data-like-count]").textContent=data.reactions?.like||0;card.querySelector("[data-comment-count]").textContent=data.comment_count||0;}catch(e){console.warn("Quote interaction counts unavailable",e);}}current=0;}
const year=document.querySelector("[data-year]");if(year)year.textContent=new Date().getFullYear();init();
})();