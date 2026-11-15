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
  if(document.fonts?.load)await Promise.all([
    document.fonts.load("700 82px Caveat"),
    document.fonts.load("700 30px DM Sans"),
    document.fonts.load("800 46px Playfair Display")
  ]);
  const canvas=document.createElement("canvas");canvas.width=1080;canvas.height=1350;
  const ctx=canvas.getContext("2d");
  const bg=ctx.createLinearGradient(0,0,1080,1350);
  bg.addColorStop(0,"#03251c");bg.addColorStop(.5,"#07543c");bg.addColorStop(1,"#021e1b");
  ctx.fillStyle=bg;ctx.fillRect(0,0,1080,1350);
  const glow=ctx.createRadialGradient(790,500,20,790,500,820);
  glow.addColorStop(0,"rgba(35,143,93,.28)");glow.addColorStop(1,"rgba(3,31,25,0)");
  ctx.fillStyle=glow;ctx.fillRect(0,0,1080,1350);
  // Restrained curved linework, kept behind all text.
  ctx.strokeStyle="rgba(226,169,91,.12)";ctx.lineWidth=2;
  for(let i=0;i<7;i++){ctx.beginPath();ctx.arc(1080,180,190+i*72,Math.PI*.48,Math.PI*1.52);ctx.stroke();}
  // Double gold frame.
  ctx.strokeStyle="#dca45b";ctx.lineWidth=3;ctx.strokeRect(36,36,1008,1278);
  ctx.strokeStyle="rgba(240,190,119,.42)";ctx.lineWidth=1;ctx.strokeRect(51,51,978,1248);
  // Official SDP logo: preserve its complete aspect ratio, never crop it into a circle.
  drawImageContain(ctx,logo,68,66,154,132);
  ctx.strokeStyle="#e2b16d";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(242,72);ctx.lineTo(242,205);ctx.stroke();
  ctx.textAlign="left";ctx.fillStyle="#f1bd77";ctx.font="800 39px 'DM Sans',Arial";ctx.fillText("BENUE ARISE",278,118);
  ctx.fillStyle="#fff8e9";ctx.font="600 35px 'DM Sans',Arial";ctx.fillText("FOR HON",278,164);
  ctx.textAlign="right";ctx.fillStyle="#f1bd77";ctx.font="700 23px 'DM Sans',Arial";ctx.fillText("CHAN U YA CHAN",1000,132);
  ctx.strokeStyle="rgba(231,183,117,.55)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(278,202);ctx.lineTo(1000,202);ctx.stroke();
  // Section ribbon.
  ctx.save();ctx.fillStyle="#dca34f";ctx.beginPath();ctx.moveTo(248,224);ctx.lineTo(1000,224);ctx.lineTo(970,282);ctx.lineTo(218,282);ctx.closePath();ctx.fill();
  ctx.fillStyle="#073b2b";ctx.textAlign="center";ctx.font="800 30px 'DM Sans',Arial";ctx.fillText("PHILOSOPHY & QUOTES",609,263);ctx.restore();
  // A more deliberate editorial quotation treatment with balanced opening and closing marks.
  const quoteWords=q.text.trim().split(/\s+/);
  const quoteMaxWidth=900,quoteCenterX=540,quoteTop=420,quoteBottom=690;
  function wrapQuote(size){
    ctx.font="700 "+size+"px Caveat,cursive";
    const lines=[];let line="";
    for(const word of quoteWords){
      const test=line?line+" "+word:word;
      if(ctx.measureText(test).width>quoteMaxWidth&&line){lines.push(line);line=word;}else line=test;
    }
    if(line)lines.push(line);
    return lines;
  }
  let quoteSize=86,quoteLines=wrapQuote(quoteSize),lineHeight=quoteSize*1.08;
  while(quoteSize>54){
    lineHeight=quoteSize*1.08;quoteLines=wrapQuote(quoteSize);
    if(quoteLines.length*lineHeight<=quoteBottom-quoteTop)break;
    quoteSize-=2;
  }
  lineHeight=quoteSize*1.08;quoteLines=wrapQuote(quoteSize);
  const blockHeight=quoteLines.length*lineHeight;
  const blockTop=quoteTop+Math.max(0,(quoteBottom-quoteTop-blockHeight)/2);
  ctx.textAlign="center";ctx.fillStyle="#efb36a";ctx.font="700 104px Georgia";
  ctx.fillText("“",quoteCenterX,blockTop-8);
  ctx.font="700 "+quoteSize+"px Caveat,cursive";ctx.fillStyle="#fff9ed";
  let baseline=blockTop+quoteSize*.84;
  quoteLines.forEach(line=>{ctx.fillText(line,quoteCenterX,baseline,quoteMaxWidth);baseline+=lineHeight;});
  ctx.fillStyle="#efb36a";ctx.font="700 100px Georgia";
  ctx.fillText("”",quoteCenterX,baseline+8);
  // Candidate portrait: deliberate head-and-shoulders crop, in a clean framed panel.
  const px=54,py=780,pw=430,ph=510;
  ctx.save();ctx.shadowColor="rgba(0,0,0,.32)";ctx.shadowBlur=22;ctx.shadowOffsetY=8;
  roundRect(ctx,px-7,py-7,pw+14,ph+14,40);ctx.fillStyle="#e2b16d";ctx.fill();ctx.restore();
  ctx.save();roundRect(ctx,px,py,pw,ph,34);ctx.clip();
  drawImageCover(ctx,portrait,px,py,pw,ph,0,0,1,1);
  ctx.restore();
  // Identity block aligned to the right of the portrait, with clear breathing room.
  const cx=765;
  ctx.strokeStyle="rgba(226,169,91,.75)";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(525,790);ctx.lineTo(1005,790);ctx.stroke();
  ctx.textAlign="center";ctx.fillStyle="#fff0d7";ctx.font="700 28px 'DM Sans',Arial";ctx.fillText("PROF. (CHIEF)",cx,842);
  ctx.fillStyle="#f2c56f";ctx.font="800 46px 'Playfair Display',Georgia";ctx.fillText("SEBASTINE",cx,902);
  ctx.fillText("TARTENGER HON",cx,958);
  ctx.fillStyle="#fff8e9";ctx.font="600 19px 'DM Sans',Arial";ctx.fillText("SAN, FCIArb, DSSRS,",cx,1002);
  ctx.fillText("Sema-Wan u Tiv",cx,1031);
  // Candidacy plaque sized for mobile readability.
  ctx.fillStyle="#5b160e";roundRect(ctx,515,1060,500,68,25);ctx.fill();
  ctx.strokeStyle="#e6b45f";ctx.lineWidth=3;roundRect(ctx,515,1060,500,68,25);ctx.stroke();
  ctx.fillStyle="#fff8e9";ctx.font="800 19px 'DM Sans',Arial";ctx.fillText("SDP GUBERNATORIAL CANDIDATE",cx,1088);
  ctx.fillStyle="#f4c875";ctx.font="800 22px 'DM Sans',Arial";ctx.fillText("2027",cx,1115);
  ctx.fillStyle="#e8b36d";ctx.font="italic 39px Caveat,cursive";ctx.fillText("S. T. Hon",cx,1182);
  // Footer baseline and slogan; all inside the gold frame.
  ctx.strokeStyle="#dca45b";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(520,1210);ctx.lineTo(1010,1210);ctx.stroke();
  ctx.fillStyle="#f5d39c";ctx.font="800 21px 'DM Sans',Arial";ctx.fillText("A GREATER BENUE IS POSSIBLE",cx,1250);
  ctx.fillStyle="rgba(255,245,226,.82)";ctx.font="600 13px 'DM Sans',Arial";ctx.fillText("LEADERSHIP  ·  SERVICE  ·  PUBLIC ENGAGEMENT",cx,1280);
  return await new Promise(resolve=>canvas.toBlob(resolve,"image/png"));
}
function drawImageContain(ctx,image,x,y,width,height){
  const scale=Math.min(width/image.naturalWidth,height/image.naturalHeight);
  const w=image.naturalWidth*scale,h=image.naturalHeight*scale;
  ctx.drawImage(image,x+(width-w)/2,y+(height-h)/2,w,h);
}
function drawImageCover(ctx,image,x,y,width,height,cropX=0,cropY=0,cropW=1,cropH=1){
  const sx=image.naturalWidth*cropX,sy=image.naturalHeight*cropY;
  const sw=image.naturalWidth*cropW,sh=image.naturalHeight*cropH;
  const scale=Math.max(width/sw,height/sh);
  const dw=sw*scale,dh=sh*scale;
  ctx.drawImage(image,sx,sy,sw,sh,x+(width-dw)/2,y+(height-dh)/2,dw,dh);
}
function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
$("quote-share").addEventListener("click",async()=>{const button=$("quote-share"),status=$("quote-share-status"),q=quotes[current];button.disabled=true;status.textContent="Preparing the branded quote image…";try{const blob=await makeArtwork(q);if(!blob)throw new Error("The artwork could not be generated on this device.");const file=new File([blob],"benue-arise-quote-"+q.key+".png",{type:"image/png"});const shareData={files:[file],title:"Prof. S. T. Hon — Philosophy & Quotes",text:q.text+" — Prof. S. T. Hon · 2027"};if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share(shareData);status.textContent="Quote artwork shared.";}else{const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);try{await navigator.clipboard.writeText(q.text+" — Prof. S. T. Hon · 2027");}catch{}status.textContent="The branded quote image has been downloaded. Attach that image to your social post; the quote text has also been copied where supported."}}catch(error){if(error.name==="AbortError"){status.textContent="Sharing cancelled.";}else{status.textContent=error.message||"Unable to share this artwork on this device.";}}finally{button.disabled=false;}});
async function init(){for(let i=0;i<quotes.length;i++){current=i;try{const data=await call("list");cache[quotes[i].key]=data;const card=quotes[i].card;card.querySelector("[data-love-count]").textContent=data.reactions?.love||0;card.querySelector("[data-like-count]").textContent=data.reactions?.like||0;card.querySelector("[data-comment-count]").textContent=data.comment_count||0;}catch(e){console.warn("Quote interaction counts unavailable",e);}}current=0;}
const year=document.querySelector("[data-year]");if(year)year.textContent=new Date().getFullYear();init();
})();