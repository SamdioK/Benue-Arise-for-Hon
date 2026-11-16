(() => {
const cfg=window.ARISE_CONFIG||{},$=s=>document.querySelector(s);
const status=(m)=>{const n=$("#commerce-admin-status");if(n)n.textContent=m;};
let db=null,adminReady=false;
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const slugify=v=>String(v||"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const fileName=v=>String(v||"file").normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g,"-").replace(/^-|-$/g,"");
async function init(){
if(!cfg.SUPABASE_URL||!cfg.SUPABASE_PUBLISHABLE_KEY){status("Supabase configuration is unavailable.");return;}
try{
const {createClient}=await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm");
db=createClient(cfg.SUPABASE_URL,cfg.SUPABASE_PUBLISHABLE_KEY,{db:{schema:"arise_site"},auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:"pkce"}});
const {data:{user},error}=await db.auth.getUser();if(error||!user){status("Sign in with an authorised portal administrator account to manage commerce.");return;}
const {data:admin,error:roleError}=await db.from("admins").select("user_id,role").eq("user_id",user.id).maybeSingle();
if(roleError||!admin){status("This account is not on the portal administrator allowlist. Commerce management is restricted.");return;}
adminReady=true;$("#commerce-admin-panel").hidden=false;status("Administrator access verified. Commerce records are saved directly to Supabase.");
await Promise.all([loadCategories(),loadBooks(),loadOrders()]);
$("#commerce-book-form").addEventListener("submit",saveBook);
$("#commerce-service-form").addEventListener("submit",saveService);
$("#commerce-refresh-books").addEventListener("click",loadBooks);
$("#commerce-refresh-orders").addEventListener("click",loadOrders);
}catch(e){console.error(e);status("Commerce administration could not initialise. Confirm the Phase 1 database migration has been applied.");}
}
async function loadCategories(){
const {data,error}=await db.from("shop_categories").select("id,name").eq("is_active",true).order("display_order");
if(error)throw error;
$("#commerce-book-category").innerHTML='<option value="">Uncategorised</option>'+(data||[]).map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name)+'</option>').join("");
}
async function upload(bucket,file,id){
if(!file)return null;
const path=id+"/"+Date.now()+"-"+fileName(file.name);
const {error}=await db.storage.from(bucket).upload(path,file,{upsert:false,contentType:file.type||undefined});
if(error)throw error;
return path;
}
async function saveBook(event){
event.preventDefault();if(!adminReady)return;
const form=event.currentTarget,fd=new FormData(form),title=String(fd.get("title")||"").trim(),author=String(fd.get("author_name")||"").trim();
const slug=String(fd.get("slug")||"").trim()||slugify(title);
const p={title,author_name:author,slug,category_id:fd.get("category_id")||null,publisher:String(fd.get("publisher")||"").trim()||null,isbn_13:String(fd.get("isbn_13")||"").trim()||null,description:String(fd.get("description")||"").trim()||null,status:"draft",product_kind:"book"};
const physical=String(fd.get("physical_ngn")||"")!==""||String(fd.get("physical_usd")||"")!=="";
const digital=String(fd.get("digital_ngn")||"")!==""||String(fd.get("digital_usd")||"")!=="";
if(!physical&&!digital){status("Enter at least one edition and its NGN and USD prices.");return;}
if(physical&&(!fd.get("physical_ngn")||!fd.get("physical_usd"))){status("Physical edition requires both NGN and USD prices.");return;}
if(digital&&(!fd.get("digital_ngn")||!fd.get("digital_usd")||!fd.get("digital_file")?.size)){status("Digital edition requires NGN and USD prices and an e-book file.");return;}
const submit=form.querySelector('button[type="submit"]');submit.disabled=true;status("Creating book record in Supabase…");
try{
const {data:product,error}=await db.from("shop_products").insert(p).select("id").single();if(error)throw error;
const productId=product.id;
const cover=await upload("shop-covers",fd.get("cover"),productId);
if(cover){const {error:e}=await db.from("shop_products").update({cover_storage_path:cover}).eq("id",productId);if(e)throw e;}
const variants=[];
if(physical)variants.push({product_id:productId,format:"physical",price_ngn:Number(fd.get("physical_ngn")),price_usd:Number(fd.get("physical_usd")),stock_quantity:fd.get("physical_stock")===""?0:Number(fd.get("physical_stock")),weight_grams:fd.get("physical_weight")===""?null:Number(fd.get("physical_weight"))});
if(digital){const path=await upload("shop-digital",fd.get("digital_file"),productId);variants.push({product_id:productId,format:"digital",price_ngn:Number(fd.get("digital_ngn")),price_usd:Number(fd.get("digital_usd")),digital_storage_path:path});}
if(variants.length){const {error:e}=await db.from("shop_product_variants").insert(variants);if(e)throw e;}
const listing=String(fd.get("listing_url")||"").trim();
if(listing){const marketplace=String(fd.get("marketplace")||"").trim();if(!marketplace||!listing.startsWith("https://"))throw new Error("Marketplace name and a secure HTTPS listing URL are required.");const raw=String(fd.get("external_price")||"");const {error:e}=await db.from("shop_external_listings").insert({product_id:productId,marketplace,listing_url:listing,observed_price:raw===""?null:Number(raw),currency:fd.get("external_currency")||null,capture_method:"manual",price_observed_at:raw===""?null:new Date().toISOString(),source_note:"Manually entered reference; verify retailer terms before displaying any price."});if(e)throw e;}
form.reset();status("Book saved successfully in Supabase as a draft. Review its editions and marketplace reference before publishing.");await loadBooks();
}catch(e){console.error(e);status("Book was not fully saved: "+(e.message||"Supabase rejected the operation")+". Check the draft record and uploaded files before retrying.");}
finally{submit.disabled=false;}
}
async function saveService(event){
event.preventDefault();if(!adminReady)return;
const form=event.currentTarget,fd=new FormData(form),mode=fd.get("pricing_mode"),title=String(fd.get("title")||"").trim();
const payload={title,slug:String(fd.get("slug")||"").trim()||slugify(title),description:String(fd.get("description")||"").trim()||null,pricing_mode:mode,status:"draft",price_ngn:mode==="quote"?null:Number(fd.get("price_ngn")),price_usd:mode==="quote"?null:Number(fd.get("price_usd"))};
if(mode!=="quote"&&(!fd.get("price_ngn")||!fd.get("price_usd"))){status("Fixed and starting-price services require both NGN and USD prices.");return;}
const button=form.querySelector('button[type="submit"]');button.disabled=true;status("Saving service to Supabase…");
try{const {error}=await db.from("service_offerings").insert(payload);if(error)throw error;form.reset();status("Service saved successfully as a draft in Supabase.");}
catch(e){console.error(e);status("Service was not saved: "+(e.message||"Supabase rejected the operation")+".");}
finally{button.disabled=false;}
}
async function loadBooks(){
const {data,error}=await db.from("shop_products").select("id,title,author_name,status,shop_product_variants(format,price_ngn,price_usd,is_active)").order("created_at",{ascending:false}).limit(50);
if(error)throw error;
const list=$("#commerce-book-list");if(!data?.length){list.innerHTML="<p>No books have been added yet.</p>";return;}
list.innerHTML=data.map(p=>'<div class="admin-record"><div><strong>'+esc(p.title)+'</strong><small>'+esc(p.author_name)+' · '+esc(p.status)+' · '+(p.shop_product_variants||[]).map(v=>esc(v.format)).join(", ")+'</small></div>'+(p.status==="draft"?'<button type="button" data-publish-book="'+esc(p.id)+'">Publish</button>':'')+'</div>').join("");
list.querySelectorAll("[data-publish-book]").forEach(b=>b.addEventListener("click",()=>publishBook(b.dataset.publishBook,b)));
}
async function publishBook(id,button){
button.disabled=true;
try{const {data:variants,error:vErr}=await db.from("shop_product_variants").select("id,format,digital_storage_path,is_active").eq("product_id",id).eq("is_active",true);if(vErr)throw vErr;if(!variants?.length)throw new Error("Add at least one active edition before publishing.");if(variants.some(v=>v.format==="digital"&&!v.digital_storage_path))throw new Error("The digital edition has no private file.");const {error}=await db.from("shop_products").update({status:"published"}).eq("id",id);if(error)throw error;status("Book published. It is now eligible to appear in the public catalogue.");await loadBooks();}
catch(e){status("Book not published: "+e.message);button.disabled=false;}
}
async function loadOrders(){
const {data,error}=await db.from("shop_orders").select("id,order_number,currency,total,status,created_at").order("created_at",{ascending:false}).limit(20);
if(error)throw error;
const list=$("#commerce-order-list");if(!data?.length){list.innerHTML="<p>No customer orders have been recorded.</p>";return;}
list.innerHTML=data.map(o=>'<div class="admin-record"><div><strong>'+esc(o.order_number)+'</strong><small>'+esc(o.status)+' · '+esc(o.currency)+' '+Number(o.total).toFixed(2)+' · '+esc(new Date(o.created_at).toLocaleDateString("en-GB"))+'</small></div></div>').join("");
}
init();
})();