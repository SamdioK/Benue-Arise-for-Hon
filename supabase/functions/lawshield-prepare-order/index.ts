import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}});
const secretMap=JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}");
const serviceKey=secretMap.default||Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const url=Deno.env.get("SUPABASE_URL");
const db=serviceKey&&url?createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}}):null;

Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return json({error:"Method not allowed."},405);
 if(!db)return json({error:"Order preparation is not configured."},503);
 try{
  const auth=req.headers.get("Authorization")||"";
  const token=auth.replace(/^Bearer\s+/i,"");
  if(!token)return json({error:"Please sign in before preparing an order."},401);
  const {data:{user},error:authError}=await db.auth.getUser(token);
  if(authError||!user)return json({error:"Your session is invalid. Please sign in again."},401);
  const body=await req.json();
  const name=String(body.customer_name||"").trim();
  const email=String(body.customer_email||"").trim().toLowerCase();
  const phone=String(body.customer_phone||"").trim().slice(0,40);
  const cartId=String(body.cart_id||"").trim();
  if(name.length<2||name.length>160)return json({error:"Enter your full name."},400);
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)return json({error:"Enter a valid email address."},400);
  if(!/^[0-9a-f-]{36}$/i.test(cartId))return json({error:"Your cart could not be identified. Refresh and try again."},400);
  const address=body.delivery_address&&typeof body.delivery_address==="object"?body.delivery_address:null;
  const {data,error}=await db.schema("arise_site").rpc("commerce_prepare_order",{
    p_user_id:user.id,p_cart_id:cartId,p_customer_name:name,p_customer_email:email,
    p_customer_phone:phone||null,p_delivery_address:address,
    p_delivery_method:String(body.delivery_method||"").slice(0,80),
    p_customer_note:String(body.customer_note||"").slice(0,1500)
  });
  if(error)throw error;
  return json(data||{success:false,error:"Order could not be prepared."});
 }catch(error){
  console.error("lawshield-prepare-order",error);
  const message=error instanceof Error?error.message:"Order could not be prepared.";
  return json({error:message},400);
 }
});
