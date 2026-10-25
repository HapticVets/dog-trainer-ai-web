import Stripe from 'stripe';
import {authorizedBookingOperation} from '@/lib/bookingOperationAuth';
import {prepareBookingInvoice,closeBookingInvoice,expireUnpaidInvoices,PRIVATE_LESSON_PRICE} from '@/lib/bookingInvoices';
export const runtime='nodejs';
export async function POST(request:Request){
  const raw=await request.text();
  if(raw.length>2000||!authorizedBookingOperation(raw,request.headers.get('x-booking-time'),request.headers.get('x-booking-signature')))return Response.json({error:'Unauthorized'},{status:401});
  let body:{action?:string;id?:string};try{body=JSON.parse(raw);}catch{return Response.json({error:'Invalid request'},{status:400});}
  try{
    const stripe=new Stripe(process.env.STRIPE_SECRET_KEY!);
    if(body.action==='approve'&&body.id)return Response.json(await prepareBookingInvoice(stripe,body.id));
    if((body.action==='cancel'||body.action==='decline')&&body.id)return Response.json(await closeBookingInvoice(stripe,body.id,body.action==='cancel'?'cancelled':'declined'));
    if(body.action==='expire-unpaid')return Response.json({results:await expireUnpaidInvoices(stripe)});
    if(body.action==='configure-webhooks'){
      const endpoints=await stripe.webhookEndpoints.list({limit:100});
      const matching=endpoints.data.filter(e=>{try{const u=new URL(e.url);return ['app.patriotk9kennel.com','train.hapticvets.com'].includes(u.hostname)&&u.pathname==='/api/stripe/webhook';}catch{return false;}});
      if(!matching.length)throw new Error('No existing booking application webhook was found. Connect the webhook before enabling invoices.');
      for(const e of matching){if(!e.enabled_events.includes('*'))await stripe.webhookEndpoints.update(e.id,{enabled_events:[...new Set([...e.enabled_events,'invoice.paid','invoice.voided','invoice.payment_failed','invoice.overdue'])] as Stripe.WebhookEndpointUpdateParams.EnabledEvent[]});}
      return Response.json({configured:true,endpoints:matching.map(e=>e.id)});
    }
    if(body.action!=='health')return Response.json({error:'Unsupported operation'},{status:400});
    const [account,endpoints,price]=await Promise.all([stripe.accounts.retrieve(),stripe.webhookEndpoints.list({limit:100}),stripe.prices.retrieve(PRIVATE_LESSON_PRICE)]);
    return Response.json({connected:true,accountId:account.id,chargesEnabled:account.charges_enabled,payoutsEnabled:account.payouts_enabled,lessonPrice:{id:price.id,amount:price.unit_amount,currency:price.currency,active:price.active,recurring:Boolean(price.recurring)},webhooks:endpoints.data.map(e=>({id:e.id,url:e.url,events:e.enabled_events,status:e.status}))},{headers:{'Cache-Control':'no-store'}});
  }catch(error){
    const code=error&&typeof error==='object'&&'code' in error?String(error.code):'connection_failed';
    return Response.json({connected:false,error:code,...(code==='connection_failed'&&error instanceof Error?{message:error.message}: {})},{status:503});
  }
}
