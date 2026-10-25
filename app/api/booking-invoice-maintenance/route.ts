import Stripe from 'stripe';
import {timingSafeEqual} from 'node:crypto';
import {expireUnpaidInvoices} from '@/lib/bookingInvoices';
export const runtime='nodejs';
export const maxDuration=60;
export async function POST(request:Request){
  const expected=process.env.BOOKING_WORKER_SECRET;
  const supplied=request.headers.get('authorization')?.replace(/^Bearer /,'')||'';
  if(!expected||!/^[a-f0-9]{64}$/.test(supplied)||supplied.length!==expected.length||!timingSafeEqual(Buffer.from(supplied),Buffer.from(expected)))return Response.json({error:'Unauthorized'},{status:401});
  if(process.env.BOOKING_INVOICES_ENABLED!=='true')return Response.json({enabled:false});
  try{return Response.json({results:await expireUnpaidInvoices(new Stripe(process.env.STRIPE_SECRET_KEY!))});}
  catch{return Response.json({error:'Invoice maintenance needs review.'},{status:503});}
}
