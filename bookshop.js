(() => {
const cfg=window.ARISE_CONFIG||{},$=s=>document.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
document.querySelectorAll("[data-year]").forEach(n=>n.textContent=new Date().getFullYear());
const mountShopWatClock=()=>{
 const timeNode=$("#shop-wat-time"),dateNode=$("#shop-wat-date");
 if(!timeNode||!dateNode)return;
 const timeFormat=new Intl.DateTimeFormat("en-GB",{timeZone:"Africa/Lagos",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false});
 const dateFormat=new Intl.DateTimeFormat("en-GB",{timeZone:"Africa/Lagos",weekday:"short",day:"2-digit",month:"short",year:"numeric"});
 const update=()=>{const now=new Date();timeNode.textContent=timeFormat.format(now)+" WAT";dateNode.textContent=dateFormat.format(now);};
 update();window.setInterval(update,1000);
};
mountShopWatClock();
const toggle=$(".menu-toggle"),nav=$(".nav");toggle?.addEventListener("click",()=>{const o=nav.classList.toggle("nav-open");toggle.setAttribute("aria-expanded",String(o));});
let db=null;
const state={products:[],categories:[],services:[],currency:"NGN",search:"",category:"",format:""};
const money=(v,c)=>new Intl.NumberFormat(c==="NGN"?"en-NG":"en-US",{style:"currency",currency:c,maximumFractionDigits:2}).format(Number(v||0));
const date=v=>v?new Intl.DateTimeFormat("en-GB",{dateStyle:"medium",timeStyle:"short",timeZone:"Africa/Lagos"}).format(new Date(v))+" WAT":"";
function renderCategories(){$("#book-category").innerHTML='<option value="">All categories</option>'+state.categories.map(c=>'<option value="'+esc(c.id)+'">'+esc(c.name)+'</option>').join("");}
function renderBooks(){
const q=state.search.toLowerCase(),list=state.products.filter(p=>[p.title,p.author_name,p.isbn_10,p.isbn_13,p.description].join(" ").toLowerCase().includes(q)&&(!state.category||p.category_id===state.category)&&(!state.format||(p.shop_product_variants||[]).some(v=>v.format===state.format)));
if(!list.length){$("#book-grid").innerHTML='<p class="shop-status">No published books match this search yet.</p>';return;}
$("#book-grid").innerHTML=list.map(p=>{
const category=state.categories.find(c=>c.id===p.category_id)?.name||"Book collection";
const cover=p.cover_storage_path&&cfg.SUPABASE_URL?cfg.SUPABASE_URL+"/storage/v1/object/public/shop-covers/"+p.cover_storage_path.split("/").map(encodeURIComponent).join("/"):"";
const variants=(p.shop_product_variants||[]).filter(v=>v.is_active&&(!state.format||v.format===state.format));
const editions=variants.map(v=>'<div class="book-edition"><span>'+(v.format==="physical"?"Printed edition":"Digital edition")+'</span><strong>'+money(state.currency==="NGN"?v.price_ngn:v.price_usd,state.currency)+'</strong><a class="add-to-cart" href="cart.html?variant='+encodeURIComponent(v.id)+'&currency='+state.currency+'" data-add-variant="'+esc(v.id)+'">Add to cart</a></div>').join("");
const refs=(p.shop_external_listings||[]).map(x=>{
const shown=x.price_display_authorized&&x.observed_price!==null&&x.currency;
const price=shown?" · "+money(x.observed_price,x.currency)+(x.price_observed_at?" (checked "+esc(date(x.price_observed_at))+")":""):"";
return '<a href="'+esc(x.listing_url)+'" target="_blank" rel="noopener noreferrer">'+esc(x.marketplace)+' listing ↗</a>'+price;
}).join("");
return '<article class="book-card"><div class="book-cover">'+(cover?'<img src="'+esc(cover)+'" alt="Cover of '+esc(p.title)+'" loading="lazy">':'<div class="book-cover-placeholder">'+esc(p.title)+'</div>')+'</div><div class="book-body"><span class="book-category">'+esc(category)+'</span><h3>'+esc(p.title)+'</h3><p class="book-author">By '+esc(p.author_name)+(p.publisher?' · '+esc(p.publisher):'')+'</p><p class="book-description">'+esc(p.description||"Explore this published work.")+'</p><div class="book-editions">'+(editions||'<span class="shop-status">No active edition is currently available.</span>')+'</div>'+(refs?'<div class="marketplace-links">'+refs+'<small>External retailer prices and availability may change. Check the retailer for its current price.</small></div>':'')+'</div></article>';
}).join("");
}
function renderServices(){
if(!state.services.length){$("#service-grid").innerHTML='<p class="shop-status">Professional services will be listed here when published.</p>';return;}
$("#service-grid").innerHTML=state.services.map(s=>{
const price=s.pricing_mode==="quote"?"Request a quotation":(s.pricing_mode==="from"?"From ":"")+money(state.currency==="NGN"?s.price_ngn:s.price_usd,state.currency);
return '<article class="service-card"><div class="service-body"><span class="service-category">PROFESSIONAL SERVICE</span><h3>'+esc(s.title)+'</h3><p class="service-description">'+esc(s.description||"Contact the team to discuss the scope and delivery.")+'</p><p class="service-price">'+esc(price)+'<small>'+(s.pricing_mode==="quote"?"Final fee depends on agreed scope.":"Shown in your selected currency.")+'</small></p><button class="service-cta" type="button" data-service-id="'+esc(s.id)+'" data-service-title="'+esc(s.title)+'">Enquire about this service ↗</button></div></article>';
}).join("");
}
function render(){renderBooks();renderServices();}
async function load(){
if(!cfg.SUPABASE_URL||!cfg.SUPABASE_PUBLISHABLE_KEY){$("#bookshop-status").textContent="The catalogue connection is not configured. Please contact the site administrator.";$("#services-status").textContent="The services catalogue is temporarily unavailable.";return;}
try{
const {createClient}=await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm");
db=createClient(cfg.SUPABASE_URL,cfg.SUPABASE_PUBLISHABLE_KEY,{db:{schema:"arise_site"},auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
const [p,c,s]=await Promise.all([
db.from("shop_products").select("id,title,author_name,description,isbn_10,isbn_13,publisher,cover_storage_path,category_id,shop_product_variants(id,format,price_ngn,price_usd,is_active),shop_external_listings(marketplace,listing_url,observed_price,currency,price_observed_at,price_display_authorized,capture_method)").eq("status","published").order("display_order").order("title"),
db.from("shop_categories").select("id,name").eq("is_active",true).order("display_order"),
db.from("service_offerings").select("id,title,description,pricing_mode,price_ngn,price_usd").eq("status","published").order("display_order")
]);
const err=p.error||c.error||s.error;if(err)throw err;
state.products=p.data||[];state.categories=c.data||[];state.services=s.data||[];renderCategories();
$("#bookshop-status").textContent=state.products.length?state.products.length+" published title(s) available.":"The book catalogue is being prepared. Please check back soon.";
$("#services-status").textContent=state.services.length?state.services.length+" professional service(s) available.":"No professional services have been published yet.";render();
}catch(e){console.error("Bookshop load failed",e);$("#bookshop-status").textContent="The catalogue could not be loaded from Supabase. Please try again later.";}
}
$("#book-grid").addEventListener("click",async e=>{
const btn=e.target.closest("[data-add-variant]");if(!btn)return;e.preventDefault();
if(!db){window.location.href=btn.href;return;}
const {data:{user}}=await db.auth.getUser();if(!user){window.location.href=btn.href;return;}
btn.setAttribute("aria-busy","true");btn.textContent="Adding…";
try{const {error}=await db.rpc("commerce_cart_add",{p_variant_id:btn.dataset.addVariant,p_quantity:1,p_currency:state.currency});if(error)throw error;btn.textContent="Added ✓";}
catch(err){btn.textContent="Try again";$("#bookshop-status").textContent=err.message||"Could not add this edition to your cart.";}
finally{btn.removeAttribute("aria-busy");}
});
$("#service-grid").addEventListener("click",e=>{const btn=e.target.closest("[data-service-id]");if(!btn)return;const dialog=$("#service-request-dialog"),form=$("#service-request-form");form.elements.service_id.value=btn.dataset.serviceId;$("#service-request-heading").textContent="Enquire about "+btn.dataset.serviceTitle;$("#service-request-name").textContent="Tell us what you need in relation to "+btn.dataset.serviceTitle+". The team will review your request.";$("#service-request-status").textContent="";dialog.hidden=false;form.elements.customer_name.focus();});
$("#service-request-close").addEventListener("click",()=>{$("#service-request-dialog").hidden=true;});
$("#service-request-dialog").addEventListener("click",e=>{if(e.target.id==="service-request-dialog")e.currentTarget.hidden=true;});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("#service-request-dialog").hidden)$("#service-request-dialog").hidden=true;});
$("#service-request-form").addEventListener("submit",async e=>{e.preventDefault();const form=e.currentTarget,fd=new FormData(form),button=$("#service-request-submit"),out=$("#service-request-status");if(fd.get("website"))return;if(!db){out.textContent="The service request system is unavailable. Please try again later.";return;}button.disabled=true;out.textContent="Submitting your request securely…";try{const {data,error}=await db.functions.invoke("commerce-service-request",{body:{service_id:fd.get("service_id"),customer_name:fd.get("customer_name"),customer_email:fd.get("customer_email"),customer_phone:fd.get("customer_phone"),currency:fd.get("currency"),description:fd.get("description"),website:fd.get("website")}});if(error)throw error;if(!data?.success)throw new Error(data?.error||"Request was not accepted.");out.textContent="Your enquiry has been received. Reference: "+data.request_number+". Please keep this reference for follow-up.";form.reset();}catch(err){out.textContent=err.message||"Your enquiry could not be submitted. Please try again.";}finally{button.disabled=false;}});
$("#shop-currency").addEventListener("change",e=>{state.currency=e.target.value;render();});
$("#book-search").addEventListener("input",e=>{state.search=e.target.value.trim();renderBooks();});
$("#book-category").addEventListener("change",e=>{state.category=e.target.value;renderBooks();});
$("#book-format").addEventListener("change",e=>{state.format=e.target.value;renderBooks();});
load();
})();