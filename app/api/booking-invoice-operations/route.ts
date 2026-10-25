import Stripe from 'stripe';
import {authorizedBookingOperation} from '@/lib/bookingOperationAuth';
export const runtime='nodejs';
export async function POST(request:Request){
  const raw=await request.text();
  if(raw.length>2000||!authorizedBookingOperation(raw,request.headers.get('x-booking-time'),request.headers.get('x-booking-signature')))return Response.json({error:'Unauthorized'},{status:401});
  let body:{action?:string};try{body=JSON.parse(raw);}catch{return Response.json({error:'Invalid request'},{status:400});}
  if(body.action!=='health')return Response.json({error:'Unsupported operation'},{status:400});
  try{
    const stripe=new Stripe(process.env.STRIPE_SECRET_KEY!);
    const [account,endpoints]=await Promise.all([stripe.accounts.retrieve(),stripe.webhookEndpoints.list({limit:100})]);
    return Response.json({connected:true,chargesEnabled:account.charges_enabled,payoutsEnabled:account.payouts_enabled,webhooks:endpoints.data.map(e=>({id:e.id,url:e.url,events:e.enabled_events,status:e.status}))},{headers:{'Cache-Control':'no-store'}});
  }catch(error){
    const code=error&&typeof error==='object'&&'code' in error?String(error.code):'connection_failed';
    return Response.json({connected:false,error:code},{status:503});
  }
}
