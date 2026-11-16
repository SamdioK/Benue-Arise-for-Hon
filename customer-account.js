(() => {
const cfg=window.ARISE_CONFIG||{},$=s=>document.querySelector(s),views=["signin","signup","forgot","reset","account"];
let db=null,user=null,phoneIti=null;
const params=new URLSearchParams(location.search);
const setView=name=>views.forEach(v=>$("#"+v+"-view").hidden=v!==name);
const status=(id,message,ok=false)=>{const el=$("#"+id);if(el){el.textContent=message;el.classList.toggle("success",ok);}};
const setBusy=(form,busy)=>form.querySelectorAll("button").forEach(b=>b.disabled=busy);
const tf=new Intl.DateTimeFormat("en-GB",{timeZone:"Africa/Lagos",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false});
const df=new Intl.DateTimeFormat("en-GB",{timeZone:"Africa/Lagos",weekday:"short",day:"2-digit",month:"short",year:"numeric"});
const tick=()=>{const now=new Date();$("#auth-time").textContent=tf.format(now)+" WAT";$("#auth-date").textContent=df.format(now);};
tick();window.setInterval(tick,1000);
document.querySelectorAll("[data-toggle-password]").forEach(b=>b.addEventListener("click",()=>{const input=$("#"+b.dataset.togglePassword),show=input.type==="password";input.type=show?"text":"password";b.setAttribute("aria-label",show?"Hide password":"Show password");b.textContent=show?"◎":"◉";}));
$("#show-signup").addEventListener("click",()=>setView("signup"));
document.querySelectorAll("[data-show-signin]").forEach(b=>b.addEventListener("click",()=>setView("signin")));
$("#forgot-button").addEventListener("click",()=>{const email=$("#signin-form").elements.email.value.trim();$("#forgot-form").elements.email.value=email;setView("forgot");});
document.querySelectorAll("[data-open-legal]").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();const terms=a.dataset.openLegal==="terms";$("#legal-title").textContent=terms?"Terms of Service":"Privacy Policy";$("#legal-copy").textContent=terms?"Use this account to manage purchases, book orders and professional-service enquiries with S. T. Hon (SAN) & Co. Product prices, availability, delivery arrangements and service engagements are confirmed by the firm. Orders are not considered paid until the payment provider confirms payment.":"Account information is used to authenticate customers, manage shopping carts and orders, respond to service enquiries and provide purchased digital publications. Authentication is handled by the firm's Supabase service. Do not submit confidential legal instructions or privileged documents through general shopping forms.";$("#legal-dialog").showModal();}));
$("#legal-close").addEventListener("click",()=>$("#legal-dialog").close());
function initInternationalPhone(){
const input=$("#signup-phone");
if(!input||!window.intlTelInput)return;
phoneIti=window.intlTelInput(input,{
  initialCountry:"ng",
  countryOrder:["ng"],
  separateDialCode:true,
  nationalMode:true,
  autoPlaceholder:"aggressive",
  formatAsYouType:true,
  formatOnDisplay:true,
  loadUtils:()=>import("https://cdn.jsdelivr.net/npm/intl-tel-input@29.5.11/build/js/utils.js")
});
}
async function init(){
initInternationalPhone();
if(!cfg.SUPABASE_URL||!cfg.SUPABASE_PUBLISHABLE_KEY){status("signin-status","The secure account service is not configured.");return;}
try{
const {createClient}=await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm");
db=createClient(cfg.SUPABASE_URL,cfg.SUPABASE_PUBLISHABLE_KEY,{db:{schema:"arise_site"},auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:true}});
if(params.get("mode")==="reset"){setView("reset");return;}
const {data,error}=await db.auth.getUser();if(!error&&data.user)activate(data.user);
}catch(e){console.error(e);status("signin-status","We could not connect to the account service. Please try again.");}
}
async function signIn(e){e.preventDefault();const form=e.currentTarget,fd=new FormData(form);setBusy(form,true);status("signin-status","Signing you in securely…");try{const {data,error}=await db.auth.signInWithPassword({email:String(fd.get("email")).trim().toLowerCase(),password:String(fd.get("password"))});if(error)throw error;activate(data.user);}catch(err){status("signin-status",err.message||"Sign in failed.");}finally{setBusy(form,false);}}
async function signUp(e){
e.preventDefault();const form=e.currentTarget,fd=new FormData(form);setBusy(form,true);
status("signup-status","Creating your customer account…");
try{
 let phone="";
 if(phoneIti){
   await phoneIti.promise;
   const raw=String(fd.get("phone")||"").trim();
   if(raw){
     if(!phoneIti.isValidNumber())throw new Error("Please check the phone number and selected country code.");
     phone=phoneIti.getNumber();
   }
 }else if(String(fd.get("phone")||"").trim()){
   throw new Error("The international phone selector is still loading. Please try again.");
 }
 const {data,error}=await db.auth.signUp({
   email:String(fd.get("email")).trim().toLowerCase(),
   password:String(fd.get("password")),
   options:{data:{full_name:String(fd.get("full_name")).trim(),phone}}
 });
 if(error)throw error;
 if(data.session&&data.user){activate(data.user);status("signup-status","Your account has been created.",true);}
 else status("signup-status","If this is a new account, a confirmation email should arrive shortly. Check Spam/Junk too. If you have registered before, return to sign in or use Forgot password. You can request another confirmation email below.",true);
}catch(err){status("signup-status",err.message||"Account creation failed.");}
finally{setBusy(form,false);}
}
async function resendConfirmation(){
 const email=$("#signup-form").elements.email.value.trim().toLowerCase();
 if(!email){status("signup-status","Enter your email address first.");return;}
 const button=$("#resend-confirmation");button.disabled=true;
 status("signup-status","Requesting a new confirmation email…");
 try{
  const {error}=await db.auth.resend({type:"signup",email,options:{emailRedirectTo:location.origin+location.pathname}});
  if(error){
   if(/already confirmed/i.test(error.message||""))status("signup-status","This email address is already confirmed. Please sign in or use Forgot password.",true);
   else throw error;
  }else status("signup-status","A new confirmation request has been accepted. Check Inbox, Spam/Junk and Promotions.",true);
 }catch(err){status("signup-status",err.message||"We could not request another confirmation email.");}
 finally{button.disabled=false;}
}
async function forgot(e){e.preventDefault();const form=e.currentTarget,fd=new FormData(form);setBusy(form,true);status("forgot-status","Sending a secure password-reset link…");try{const redirectTo=location.origin+location.pathname+"?mode=reset";const {error}=await db.auth.resetPasswordForEmail(String(fd.get("email")).trim().toLowerCase(),{redirectTo});if(error)throw error;status("forgot-status","If an account exists for that address, a password-reset link has been sent.",true);}catch(err){status("forgot-status",err.message||"We could not send the reset link.");}finally{setBusy(form,false);}}
async function reset(e){e.preventDefault();const form=e.currentTarget,fd=new FormData(form);setBusy(form,true);status("reset-status","Updating your password…");try{const {error}=await db.auth.updateUser({password:String(fd.get("password"))});if(error)throw error;status("reset-status","Your password has been updated. You can now sign in.",true);setTimeout(()=>{history.replaceState(null,"",location.pathname);setView("signin");},1100);}catch(err){status("reset-status",err.message||"Password update failed.");}finally{setBusy(form,false);}}
function activate(account){user=account;$("#account-email").textContent=account.email||"Your account";setView("account");}
async function signOut(){if(db)await db.auth.signOut();user=null;setView("signin");status("signin-status","You have signed out.",true);}
$("#signin-form").addEventListener("submit",signIn);$("#signup-form").addEventListener("submit",signUp);$("#resend-confirmation").addEventListener("click",resendConfirmation);$("#forgot-form").addEventListener("submit",forgot);$("#reset-form").addEventListener("submit",reset);$("#signout-button").addEventListener("click",signOut);
init();
})();