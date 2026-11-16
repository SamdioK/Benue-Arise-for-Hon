(() => {
const cfg=window.ARISE_CONFIG||{},$=s=>document.querySelector(s),views=["signin","signup","forgot","reset","account"];
let db=null,user=null;
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
const COUNTRY_DATA=`AF:93:Afghanistan;AL:355:Albania;DZ:213:Algeria;AS:1684:American Samoa;AO:244:Angola;AI:1264:Anguilla;AG:1268:Antigua and Barbuda;AR:54:Argentina;AM:374:Armenia;AW:297:Aruba;AC:247:Ascension Island;AD:376:Andorra;AU:61:Australia;AT:43:Austria;AZ:994:Azerbaijan;BH:973:Bahrain;BD:880:Bangladesh;BB:1246:Barbados;BY:375:Belarus;BE:32:Belgium;BZ:501:Belize;BJ:229:Benin;BM:1441:Bermuda;BT:975:Bhutan;BO:591:Bolivia;BQ:599:Bonaire, Sint Eustatius and Saba;BA:387:Bosnia and Herzegovina;BW:267:Botswana;BR:55:Brazil;IO:246:British Indian Ocean Territory;VG:1284:British Virgin Islands;BN:673:Brunei;BG:359:Bulgaria;BF:226:Burkina Faso;BI:257:Burundi;KH:855:Cambodia;CM:237:Cameroon;CA:1:Canada;CV:238:Cape Verde;KY:1345:Cayman Islands;CF:236:Central African Republic;TD:235:Chad;CL:56:Chile;CN:86:China;CX:61:Christmas Island;CC:61:Cocos (Keeling) Islands;CO:57:Colombia;KM:269:Comoros;CK:682:Cook Islands;CR:506:Costa Rica;HR:385:Croatia;CU:53:Cuba;CW:599:Curaçao;CY:357:Cyprus;CZ:420:Czech Republic;CD:243:Democratic Republic of the Congo;DK:45:Denmark;DG:246:Diego Garcia;DJ:253:Djibouti;DM:1767:Dominica;DO:1809:Dominican Republic;TL:670:East Timor;EC:593:Ecuador;EG:20:Egypt;SV:503:El Salvador;GQ:240:Equatorial Guinea;ER:291:Eritrea;EE:372:Estonia;ET:251:Ethiopia;FK:500:Falkland Islands;FO:298:Faroe Islands;FM:691:Federated States of Micronesia;FJ:679:Fiji;FI:358:Finland;FR:33:France;GF:594:French Guiana;PF:689:French Polynesia;GA:241:Gabon;GE:995:Georgia;DE:49:Germany;GH:233:Ghana;GI:350:Gibraltar;GR:30:Greece;GL:299:Greenland;GD:1473:Grenada;GP:590:Guadeloupe;GU:1671:Guam;GT:502:Guatemala;GG:44:Guernsey;GN:224:Guinea;GW:245:Guinea-Bissau;GY:592:Guyana;HT:509:Haiti;HN:504:Honduras;HK:852:Hong Kong;HU:36:Hungary;IS:354:Iceland;IN:91:India;ID:62:Indonesia;IR:98:Iran;IQ:964:Iraq;IE:353:Ireland;IM:44:Isle of Man;IL:972:Israel;IT:39:Italy;CI:225:Ivory Coast;JM:1876:Jamaica;JP:81:Japan;JE:44:Jersey;JO:962:Jordan;KZ:7:Kazakhstan;KE:254:Kenya;KI:686:Kiribati;XK:383:Kosovo;KW:965:Kuwait;KG:996:Kyrgyzstan;LA:856:Laos;LV:371:Latvia;LB:961:Lebanon;LS:266:Lesotho;LR:231:Liberia;LY:218:Libya;LI:423:Liechtenstein;LT:370:Lithuania;LU:352:Luxembourg;MO:853:Macau;MG:261:Madagascar;MW:265:Malawi;MY:60:Malaysia;MV:960:Maldives;ML:223:Mali;MT:356:Malta;MH:692:Marshall Islands;MQ:596:Martinique;MR:222:Mauritania;MU:230:Mauritius;YT:262:Mayotte;MX:52:Mexico;MD:373:Moldova;MC:377:Monaco;MN:976:Mongolia;MS:1664:Montserrat;MA:212:Morocco;MZ:258:Mozambique;NA:264:Namibia;NR:674:Nauru;NP:977:Nepal;NL:31:Netherlands;NC:687:New Caledonia;NZ:64:New Zealand;NI:505:Nicaragua;NE:227:Niger;NG:234:Nigeria;NU:683:Niue;NF:672:Norfolk Island;KP:850:North Korea;MP:1670:Northern Mariana Islands;NO:47:Norway;OM:968:Oman;PK:92:Pakistan;PW:680:Palau;PS:970:Palestine;PA:507:Panama;PG:675:Papua New Guinea;PY:595:Paraguay;PE:51:Peru;PH:63:Philippines;PN:64:Pitcairn Islands;PL:48:Poland;PT:351:Portugal;PR:1787:Puerto Rico;QA:974:Qatar;MK:389:Republic of Macedonia;CG:242:Republic of the Congo;RO:40:Romania;RU:7:Russia;RW:250:Rwanda;RE:262:Réunion;BL:590:Saint Barthélemy;SH:290:Saint Helena;KN:1869:Saint Kitts and Nevis;LC:1758:Saint Lucia;MF:590:Saint Martin;PM:508:Saint Pierre and Miquelon;VC:1784:Saint Vincent and the Grenadines;WS:685:Samoa;SM:378:San Marino;SA:966:Saudi Arabia;SN:221:Senegal;RS:381:Serbia;SC:248:Seychelles;SL:232:Sierra Leone;SG:65:Singapore;SX:1721:Sint Maarten;SK:421:Slovakia;SI:386:Slovenia;SB:677:Solomon Islands;SO:252:Somalia;ZA:27:South Africa;GS:500:South Georgia;KR:82:South Korea;SS:211:South Sudan;ES:34:Spain;LK:94:Sri Lanka;SD:249:Sudan;SR:597:Suriname;SJ:47:Svalbard and Jan Mayen;SZ:268:Swaziland;SE:46:Sweden;CH:41:Switzerland;SY:963:Syria;ST:239:São Tomé and Príncipe;TW:886:Taiwan;TJ:992:Tajikistan;TZ:255:Tanzania;TH:66:Thailand;BS:1242:The Bahamas;GM:220:The Gambia;TG:228:Togo;TK:690:Tokelau;TO:676:Tonga;TT:1868:Trinidad and Tobago;TA:290:Tristan da Cunha;TN:216:Tunisia;TR:90:Turkey;TM:993:Turkmenistan;TC:1649:Turks and Caicos Islands;TV:688:Tuvalu;VI:1340:U.S. Virgin Islands;UG:256:Uganda;UA:380:Ukraine;AE:971:United Arab Emirates;GB:44:United Kingdom;US:1:United States;UY:598:Uruguay;UZ:998:Uzbekistan;VU:678:Vanuatu;VA:39:Vatican City;VE:58:Venezuela;VN:84:Vietnam;WF:681:Wallis and Futuna;EH:212:Western Sahara;YE:967:Yemen;ZM:260:Zambia;ZW:263:Zimbabwe;AX:358:Åland Islands`;
const countries=COUNTRY_DATA.split(";").map(row=>{const [iso,dial,...name]=row.split(":");return {iso,dial,name:name.join(":"),flag:String.fromCodePoint(...[...iso].map(ch=>127397+ch.charCodeAt(0)))};});
const countrySelect=$("#signup-country"),phoneInput=$("#signup-phone"),dialPreview=$("#phone-dial-preview"),flagDisplay=$("#country-flag");
const trigger=$("#country-picker-trigger"),panel=$("#country-picker-panel"),search=$("#country-search"),options=$("#country-options");
let activeCountry=countries.find(c=>c.iso==="NG")||countries[0];
function selectCountry(country){
 activeCountry=country;countrySelect.value=country.iso;dialPreview.textContent="+"+country.dial;flagDisplay.textContent=country.flag;
 trigger.setAttribute("aria-label","Selected country "+country.name+" +"+country.dial);panel.hidden=true;trigger.setAttribute("aria-expanded","false");
}
function renderCountries(query=""){
 const q=query.trim().toLocaleLowerCase();const matches=countries.filter(c=>!q||(c.name+" "+c.iso+" "+c.dial+" +"+c.dial).toLocaleLowerCase().includes(q));
 options.replaceChildren();
 if(!matches.length){const empty=document.createElement("p");empty.className="country-empty";empty.textContent="No matching country";options.append(empty);return;}
 const fragment=document.createDocumentFragment();
 matches.forEach(country=>{const button=document.createElement("button");button.type="button";button.className="country-option";button.role="option";button.setAttribute("aria-selected",String(country.iso===activeCountry.iso));const flag=document.createElement("span");flag.className="country-option-flag";flag.textContent=country.flag;const name=document.createElement("span");name.className="country-option-name";name.textContent=country.name;const code=document.createElement("span");code.className="country-option-code";code.textContent="+"+country.dial;button.append(flag,name,code);button.addEventListener("click",()=>selectCountry(country));fragment.append(button);});
 options.append(fragment);
}
trigger.addEventListener("click",()=>{panel.hidden=!panel.hidden;trigger.setAttribute("aria-expanded",String(!panel.hidden));if(!panel.hidden){search.value="";renderCountries();search.focus();}});
search.addEventListener("input",()=>renderCountries(search.value));
document.addEventListener("click",e=>{if(!$("#phone-field").contains(e.target)&&!panel.hidden){panel.hidden=true;trigger.setAttribute("aria-expanded","false");}});
const selectedDial=()=>activeCountry.dial;
function buildInternationalPhone(){
 const raw=String(phoneInput?.value||"").trim();const digits=raw.replace(/\D/g,"");if(!digits)return "";
 const national=raw.startsWith("+")?digits:digits.replace(/^0+/,"");
 if(national.length<7||national.length>15)throw new Error("Please enter a valid phone number.");
 return raw.startsWith("+")?"+"+national:"+"+selectedDial()+national;
}

async function init(){

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
 const phone=buildInternationalPhone();
 const {data,error}=await db.auth.signUp({
   email:String(fd.get("email")).trim().toLowerCase(),
   password:String(fd.get("password")),
   options:{
     data:{full_name:String(fd.get("full_name")).trim(),phone},
     // Return the customer to this exact GitHub Pages project URL after Supabase verifies the email.
     emailRedirectTo:window.location.origin+window.location.pathname
   }
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