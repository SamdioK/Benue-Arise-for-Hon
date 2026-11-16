(() => {
const cfg=window.ARISE_CONFIG||{},$=s=>document.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money=(v,c)=>new Intl.NumberFormat(c==="NGN"?"en-NG":"en-US",{style:"currency",currency:c,maximumFractionDigits:2}).format(Number(v||0));
document.querySelectorAll("[data-year]").forEach(n=>n.textContent=new Date().getFullYear());
const state={db:null,user:null,customer:null,cart:null,currency:new URLSearchParams(location.search).get("currency")==="USD"?"USD":"NGN",items:[]};
const accountStatus=m=>$("#account-status").textContent=m;
const cartStatus=m=>$("#cart-status").textContent=m;
const checkoutStatus=m=>$("#checkout-status").textContent=m;
async function boot(){
if(!cfg.SUPABASE_URL||!cfg.SUPABASE_PUBLISHABLE_KEY){accountStatus("The customer account service is not configured.");return;}
try{
const {createClient}=await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm");
state.db=createClient(cfg.SUPABASE_URL,cfg.SUPABASE_PUBLISHABLE_KEY,{db:{schema:"arise_site"},auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
$("#cart-currency").value=state.currency;
$("#signin-form").addEventListener("submit",signIn);
$("#signup-form").addEventListener("submit",signUp);
$("#signout-button").addEventListener("click",signOut);
$("#cart-currency").addEventListener("change",async e=>{state.currency=e.target.value;if(state.user)await loadCart();});
$("#checkout-form").addEventListener("submit",prepareOrder);
const {data:{user}}=await state.db.auth.getUser();
if(user)await activateCustomer(user);
else cartStatus("Sign in to retrieve or create your saved cart.");
}catch(e){console.error(e);accountStatus("The account service could not be loaded. Please refresh and try again.");}
}
async function signUp(e){
e.preventDefault();const f=e.currentTarget,fd=new FormData(f),button=f.querySelector('button[type="submit"]');button.disabled=true;
try{
const {data,error}=await state.db.auth.signUp({email:String(fd.get("email")).trim().toLowerCase(),password:String(fd.get("password")),options:{data:{full_name:String(fd.get("full_name")).trim(),phone:String(fd.get("phone")||"").trim()}}});
if(error)throw error;
if(data.session&&data.user)await activateCustomer(data.user,{full_name:fd.get("full_name"),phone:fd.get("phone"),email:fd.get("email")});
else accountStatus("Account registration received. Check your email for the confirmation link, then return here to sign in.");
}catch(err){accountStatus(err.message||"Account registration failed.");}
finally{button.disabled=false;}
}
async function signIn(e){
e.preventDefault();const f=e.currentTarget,fd=new FormData(f),button=f.querySelector("button[type=submit");button.disabled=true;
try{
const {data,error}=await state.db.auth.signInWithPassword({email:String(fd.get("email")).trim().toLowerCase(),password:String(fd.get("password"))});
if(error)throw error;await activateCustomer(data.user);
}catch(err){accountStatus(err.message||"Sign in failed.");}
finally{button.disabled=false;}
}
async function activateCustomer(user){
state.user=user;state.customer={id:null,full_name:user.user_metadata?.full_name||user.email?.split("@")[0]||"Customer",email:user.email,phone:user.user_metadata?.phone||null};
$("#auth-forms").hidden=true;$("#signed-in-panel").hidden=false;$("#customer-email").textContent="Signed in as "+user.email;
accountStatus("Your customer account is active. Your saved cart is retrieved securely from Supabase.");
await loadCart();const params=new URLSearchParams(location.search),variant=params.get("variant");
if(variant){await addVariant(variant);params.delete("variant");history.replaceState(null,"",location.pathname+(params.toString()?"?"+params.toString():""));}
await loadOrders();
}
async function signOut(){
await state.db.auth.signOut();state.user=null;state.customer=null;state.cart=null;state.items=[];
$("#auth-forms").hidden=false;$("#signed-in-panel").hidden=true;$("#checkout-panel").hidden=true;$("#order-history").hidden=true;$("#cart-items").innerHTML="";$("#cart-subtotal").textContent="—";accountStatus("You have signed out. Your cart remains saved in Supabase.");cartStatus("Sign in to retrieve your saved cart.");
}
async function ensureCart(){
if(!state.user)throw new Error("Sign in to manage your cart.");
const {data,error}=await state.db.rpc("commerce_cart_get",{p_currency:state.currency});if(error)throw error;return data;
}
async function loadCart(){
try{const data=await ensureCart();state.cart={id:data.id,currency:data.currency,status:data.status};state.items=data.items||[];state.currency=data.currency||state.currency;$("#cart-currency").value=state.currency;renderCart();}
catch(e){console.error(e);cartStatus(e.message||"Unable to load your cart.");}
}
function renderCart(){
const root=$("#cart-items");
if(!state.items.length){root.innerHTML='<p class="shop-status">Your cart is empty. <a href="bookshop.html">Explore the books</a>.</p>';$("#cart-subtotal").textContent=money(0,state.currency);$("#checkout-panel").hidden=true;cartStatus("Your "+state.currency+" cart is ready.");return;}
let subtotal=0;
root.innerHTML='<div class="cart-items-list">'+state.items.map(item=>{
const unit=Number(item.unit_price||0),line=Number(item.line_total||unit*item.quantity);subtotal+=line;
return '<article class="cart-item"><div><h3>'+esc(item.title||"Book")+'</h3><small>'+esc(item.format==="physical"?"Printed edition":"Digital edition")+' · '+money(unit,state.currency)+' each</small><p><strong>'+money(line,state.currency)+'</strong></p></div><div class="cart-item-controls"><input aria-label="Quantity for '+esc(item.title)+'" type="number" min="1" max="50" value="'+item.quantity+'" data-quantity="'+esc(item.variant_id)+'"><button type="button" data-remove="'+esc(item.variant_id)+'">Remove</button></div></article>';
}).join("")+'</div>';
$("#cart-subtotal").textContent=money(subtotal,state.currency);$("#checkout-panel").hidden=false;
cartStatus(state.items.length+" item line(s) saved in your "+state.currency+" cart.");
root.querySelectorAll("[data-quantity]").forEach(el=>el.addEventListener("change",()=>changeQuantity(el.dataset.quantity,Number(el.value))));
root.querySelectorAll("[data-remove]").forEach(el=>el.addEventListener("click",()=>removeItem(el.dataset.remove)));
}
async function addVariant(variantId){
try{const {data,error}=await state.db.rpc("commerce_cart_add",{p_variant_id:variantId,p_quantity:1,p_currency:state.currency});if(error)throw error;state.cart={id:data.id,currency:data.currency,status:data.status};state.items=data.items||[];renderCart();cartStatus("Edition added to your saved cart.");}
catch(e){cartStatus(e.message||"Could not add this edition.");}
}
async function changeQuantity(variantId,quantity){
if(!Number.isInteger(quantity)||quantity<1||quantity>50){await loadCart();return;}
const {data,error}=await state.db.rpc("commerce_cart_set_quantity",{p_variant_id:variantId,p_quantity:quantity});
if(error){cartStatus(error.message);await loadCart();return;}state.cart={id:data.id,currency:data.currency,status:data.status};state.items=data.items||[];renderCart();
}
async function removeItem(variantId){
const {data,error}=await state.db.rpc("commerce_cart_remove",{p_variant_id:variantId});
if(error){cartStatus(error.message);return;}state.cart={id:data.id,currency:data.currency,status:data.status};state.items=data.items||[];renderCart();
}
async function prepareOrder(e){
e.preventDefault();if(!state.user||!state.cart||!state.items.length)return;
const form=e.currentTarget,fd=new FormData(form),button=$("#prepare-order-button");
const physical=state.items.some(i=>i.format==="physical");
const address={address_line1:String(fd.get("address_line1")||"").trim(),city:String(fd.get("city")||"").trim(),state:String(fd.get("state")||"").trim(),country:String(fd.get("country")||"").trim()};
if(physical&&(!address.address_line1||!address.city||!address.country)){checkoutStatus("Enter the street address, city and country for printed books.");return;}
button.disabled=true;checkoutStatus("Preparing your order with current database prices…");
try{
const {data,error}=await state.db.rpc("commerce_prepare_order",{p_customer_name:fd.get("customer_name"),p_customer_email:fd.get("customer_email"),p_customer_phone:fd.get("customer_phone"),p_delivery_address:physical?address:null,p_delivery_method:fd.get("delivery_method"),p_customer_note:fd.get("customer_note")});
if(error)throw error;if(!data?.success)throw new Error(data?.error||"Order could not be prepared.");
checkoutStatus("Order "+data.order_number+" has been recorded for "+money(data.total,data.currency)+". Payment is not yet enabled. This order is awaiting payment and is not marked as paid.");
state.cart=null;state.items=[];await loadOrders();await loadCart();
}catch(err){checkoutStatus(err.message||"Order preparation failed. Please try again.");}
finally{button.disabled=false;}
}
async function loadOrders(){
try{const {data,error}=await state.db.rpc("commerce_customer_orders");if(error)throw error;
$("#order-history").hidden=false;$("#order-list").innerHTML=data?.length?data.map(o=>'<article class="order-record"><strong>'+esc(o.order_number)+'</strong><small>'+esc(o.status.replaceAll("_"," "))+' · '+money(o.total,o.currency)+' · '+esc(new Date(o.created_at).toLocaleDateString("en-GB"))+'</small></article>').join(""):"<p>No orders yet.</p>";
}catch(error){console.warn("Order history",error);}
}
=await state.db.from("shop_orders").select("id,order_number,currency,total,status,created_at").eq("customer_id",state.customer.id).order("created_at",{ascending:false}).limit(20);
if(error){console.warn("Order history",error);return;}
$("#order-history").hidden=false;$("#order-list").innerHTML=data?.length?data.map(o=>'<article class="order-record"><strong>'+esc(o.order_number)+'</strong><small>'+esc(o.status.replaceAll("_"," "))+' · '+money(o.total,o.currency)+' · '+esc(new Date(o.created_at).toLocaleDateString("en-GB"))+'</small></article>').join(""):"<p>No orders yet.</p>";
}
$("#cart-currency").addEventListener("change",()=>{const u=new URL(location.href);u.searchParams.set("currency",state.currency);history.replaceState(null,"",u.pathname+u.search);});
boot();
})();