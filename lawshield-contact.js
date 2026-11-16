(() => {
const cfg=window.ARISE_CONFIG||{},$=s=>document.querySelector(s),esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
document.querySelectorAll("[data-year]").forEach(n=>n.textContent=new Date().getFullYear());
const time=$("#shop-wat-time"),date=$("#shop-wat-date");
if(time&&date){const tf=new Intl.DateTimeFormat("en-GB",{timeZone:"Africa/Lagos",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false}),df=new Intl.DateTimeFormat("en-GB",{timeZone:"Africa/Lagos",weekday:"short",day:"2-digit",month:"short",year:"numeric"});const tick=()=>{const now=new Date();time.textContent=tf.format(now)+" WAT";date.textContent=df.format(now);};tick();window.setInterval(tick,1000);}
const toggle=$(".menu-toggle"),nav=$(".lawshield-nav");toggle?.addEventListener("click",()=>{const open=nav.classList.toggle("nav-open");toggle.setAttribute("aria-expanded",String(open));});
const labels={phone:"Telephone",whatsapp:"WhatsApp",email:"Email",website:"Website",facebook:"Facebook",instagram:"Instagram",linkedin:"LinkedIn",x:"X",youtube:"YouTube"};
async function load(){
if(!cfg.SUPABASE_URL||!cfg.SUPABASE_PUBLISHABLE_KEY){$("#lawshield-contact-load-status").textContent="The contact directory is temporarily unavailable.";return;}
try{
const {createClient}=await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm");
const db=createClient(cfg.SUPABASE_URL,cfg.SUPABASE_PUBLISHABLE_KEY,{db:{schema:"arise_site"},auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
const {data,error}=await db.from("site_settings").select("setting_value").eq("setting_key","lawshield_contact").maybeSingle();if(error)throw error;
const v=data?.setting_value||{};
if(v.publication_status!=="published"){return;}
const methods=$("#lawshield-contact-methods"),social=$("#lawshield-social-links");let count=0;
for(const key of ["phone","whatsapp","email"]){const value=String(v[key]||"").trim();if(!value)continue;let href=key==="email"?"mailto:"+value:key==="whatsapp"?"https://wa.me/"+value.replace(/\D/g,""):"tel:"+value.replace(/[^+\d]/g,"");methods.insertAdjacentHTML("beforeend",'<a class="lawshield-contact-link" href="'+esc(href)+'"><span>'+labels[key]+'</span><strong>'+esc(value)+'</strong></a>');count++;}
for(const key of ["website","facebook","instagram","linkedin","x","youtube"]){const value=String(v[key]||"").trim();if(!value||!/^https:\/\//i.test(value))continue;social.insertAdjacentHTML("beforeend",'<a class="lawshield-social-link" href="'+esc(value)+'" target="_blank" rel="noopener noreferrer">'+labels[key]+' <span aria-hidden="true">↗</span></a>');}
if(v.intro)$("#lawshield-contact-intro").textContent=v.intro;else $("#lawshield-contact-intro").textContent="Contact the firm for customer-care and professional service enquiries.";
if(v.address){$("#lawshield-office-address").textContent=v.address;$("#lawshield-office-card").hidden=false;}
if(count||social.children.length||v.address){$("#lawshield-contact-pending").hidden=true;$("#lawshield-contact-published").hidden=false;}
}catch(e){console.error(e);$("#lawshield-contact-load-status").textContent="We could not load the contact directory. Please try again later.";}
}
load();
})();