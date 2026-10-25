import {createHmac,timingSafeEqual} from 'node:crypto';
export function authorizedBookingOperation(raw:string,stamp:string|null,signature:string|null){
  const secret=process.env.BOOKING_AUTOMATION_SECRET;
  if(!secret||!stamp||!signature||!/^\d{13}$/.test(stamp)||!/^[a-f0-9]{64}$/.test(signature))return false;
  if(Math.abs(Date.now()-Number(stamp))>5*60*1000)return false;
  const expected=createHmac('sha256',secret).update(`${stamp}.${raw}`).digest();
  return timingSafeEqual(expected,Buffer.from(signature,'hex'));
}
