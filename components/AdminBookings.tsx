'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {easternTime} from '@/lib/bookingTime';
type Slot={id:string;starts_at:string;ends_at:string;state:string};
type Booking={id:string;slot_id:string;status:string;created_at:string;details:Record<string,string>;booking_slots:Pick<Slot,'starts_at'|'ends_at'>};
type Mail={request_id:string;kind:string;state:string};
const time=(v:string)=>new Date(v).toLocaleString('en-US',{timeZone:'America/New_York',dateStyle:'medium',timeStyle:'short'});
export default function AdminBookings() {
  const [data,setData]=useState<{slots:Slot[];requests:Booking[];mail:Mail[]}>({slots:[],requests:[],mail:[]});
  const [status,setStatus]=useState('');
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [start,setStart]=useState('');
  const [filter,setFilter]=useState('pending');
  async function load() {
    const response=await fetch('/api/admin/bookings',{cache:'no-store'});
    const result=await response.json();
    if(!response.ok) throw new Error(result.error || 'Unable to load bookings.');
    setData(result);setLoading(false);
  }
  useEffect(()=>{void load().catch(e=>{setStatus(e.message);setLoading(false);});},[]);
  async function action(body:Record<string,string>) {
    setBusy(true);setStatus('');
    try {
      const response=await fetch('/api/admin/bookings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      const result=await response.json();
      if(!response.ok) throw new Error(result.error || 'Unable to save.');
      setStatus(result.mailSent===false ? 'Saved. Email is still pending. Wait two minutes, then use Retry email.' : 'Saved.');
      if(body.action==='publish') setStart('');
      await load();
    } catch(e) {setStatus(e instanceof Error?e.message:'Unable to save.');}
    finally {setBusy(false);}
  }
  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 text-white">
    <Link href="/admin" className="text-amber-200 underline">Back to admin</Link>
    <h1 className="text-3xl font-bold">Training appointments</h1>
    <p>Offer 60-minute appointments for one client at a time. All times below are Eastern time. Customers request a time; only your approval reserves it. Boarding is handled separately through your inquiry emails.</p>
    {status?<p role="status" className="rounded-lg border border-amber-400 p-4">{status}</p>:null}
    <section className="rounded-xl border border-white/20 p-5">
      <h2 className="text-xl font-semibold">Offer an appointment time</h2>
      <p className="my-2 text-sm">Choose times you are available. No weekly hours are assumed. Overlapping appointments cannot be offered.</p>
      <form className="flex flex-wrap items-end gap-3" onSubmit={e=>{e.preventDefault();try{void action({action:'publish',startsAt:easternTime(start)});}catch(e){setStatus((e as Error).message);}}}>
        <label>Day and start time (Eastern)<input className="mt-1 block rounded border border-white/30 bg-neutral-900 p-3" type="datetime-local" required value={start} onChange={e=>setStart(e.target.value)} /></label>
        <button className="rounded bg-amber-400 px-4 py-3 font-bold text-black disabled:opacity-50" disabled={busy}>Offer this time</button>
      </form>
    </section>
    <section className="rounded-xl border border-white/20 p-5">
      <div className="flex flex-wrap items-center gap-4"><h2 className="text-xl font-semibold">Requests</h2><label className="sr-only" htmlFor="status-filter">Show requests</label><select id="status-filter" className="rounded bg-neutral-900 p-2" value={filter} onChange={e=>setFilter(e.target.value)}>{['pending','approved','declined','cancelled','all'].map(s=><option key={s}>{s}</option>)}</select><button type="button" disabled={busy} onClick={()=>{void load().catch(e=>setStatus(e.message));}} className="underline">Refresh</button></div>
      {loading?<p className="mt-4">Loading…</p>:null}
      {!loading&&!data.requests.some(r=>filter==='all'||r.status===filter)?<p className="mt-4">No {filter==='all'?'':filter} requests.</p>:null}
      <div className="mt-4 space-y-4">{data.requests.filter(r=>filter==='all'||r.status===filter).map(r=><article key={r.id} className="rounded-lg border border-white/20 p-4">
        <h3 className="text-lg font-bold">{r.details.name} · {r.details.dogName}</h3>
        <p>{time(r.booking_slots.starts_at)} · 60 minutes · <strong>{r.status}</strong></p>
        <p className="mt-2"><a className="underline" href={`mailto:${r.details.email}`}>{r.details.email}</a> · {r.details.phone}</p>
        <p>{r.details.breed} · {r.details.dogAge} · {r.details.cityState}</p><p className="my-3 whitespace-pre-wrap">{r.details.goals}</p>
        <div className="flex flex-wrap gap-3">{(r.status==='pending'?['approved','declined']:r.status==='approved'?['cancelled']:[]).map(a=><button key={a} disabled={busy} className="rounded border border-amber-300 px-4 py-2 disabled:opacity-50" onClick={()=>{if(window.confirm(`${a==='approved'?'Approve':a==='declined'?'Decline':'Cancel'} this appointment for ${r.details.name} on ${time(r.booking_slots.starts_at)}? An email will be sent to the customer.`)) void action({action:a,id:r.id});}}>{a==='approved'?'Approve':a==='declined'?'Decline':'Cancel appointment'}</button>)}
        {data.mail.some(m=>m.request_id===r.id&&(m.kind==='owner'||m.kind===r.status))?<button disabled={busy} className="rounded border border-white/30 px-4 py-2" onClick={()=>void action({action:'retry',id:r.id})}>Retry email</button>:null}</div>
      </article>)}</div>
    </section>
    <section className="rounded-xl border border-white/20 p-5"><h2 className="text-xl font-semibold">Offered times</h2><p className="mt-2 text-sm">Approved times are hidden from the customer calendar. Cancelling an appointment makes that time available again; remove it here if you want it closed.</p>
      <ul className="mt-3 space-y-2">{data.slots.filter(s=>s.state==='open').map(s=><li key={s.id} className="flex flex-wrap items-center gap-3 border-b border-white/10 py-3"><span>{time(s.starts_at)}</span>{data.requests.some(r=>r.slot_id===s.id&&r.status==='approved')?<strong>Reserved</strong>:<button className="underline" disabled={busy} onClick={()=>{if(window.confirm('Remove this offered time? Pending requests will still need to be declined.')) void action({action:'remove',id:s.id});}}>Remove time</button>}</li>)}</ul>
    </section>
  </main>;
}
