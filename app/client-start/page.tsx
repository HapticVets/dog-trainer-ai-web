import type { Metadata } from 'next';
import Link from 'next/link';
export const metadata:Metadata={title:'Client Homework Setup | Patriot K9 Command',description:'Set up your included AI Trainer access and follow your assigned homework between Patriot K9 lessons.'};
export default function ClientStart(){
  return <main className="mx-auto max-w-3xl space-y-7 px-5 py-12 text-white">
    <p className="text-sm font-bold uppercase tracking-widest text-amber-300">Patriot K9 client training</p>
    <h1 className="text-3xl font-bold sm:text-4xl">Your lessons continue at home</h1>
    <p className="text-lg leading-8 text-neutral-300">Owner practice is part of our training process. Your included AI Trainer helps you follow John&apos;s assigned homework, record your practice, and bring useful progress notes to your next lesson.</p>
    <ol className="space-y-5">
      <li className="rounded-xl border border-neutral-700 p-5"><h2 className="text-xl font-bold">1. Use your booking email</h2><p className="mt-2 leading-7 text-neutral-300">Create an account or sign in using the same email address you used to book. Add your dog&apos;s profile so John can match it to your client record.</p><div className="mt-4 flex flex-wrap gap-3"><Link href="/sign-up" className="rounded-lg bg-amber-400 px-4 py-3 font-bold text-black">Create your account</Link><Link href="/sign-in" className="rounded-lg border border-neutral-600 px-4 py-3 font-semibold">Already have an account?</Link></div></li>
      <li className="rounded-xl border border-neutral-700 p-5"><h2 className="text-xl font-bold">2. Have John link your access</h2><p className="mt-2 leading-7 text-neutral-300">Tell John when your account and dog profile are ready. He will link your dog, activate your included client access, and assign your homework. You do not need to purchase a separate AI subscription for your included client access. If you see a payment prompt, contact John before paying.</p></li>
      <li className="rounded-xl border border-neutral-700 p-5"><h2 className="text-xl font-bold">3. Practice and log what happened</h2><p className="mt-2 leading-7 text-neutral-300">After your lesson, open your linked dog in the AI Trainer and follow the assigned homework. Keep practice short and consistent, using the duration and exercises John assigns. Log your session, what went well, and what was difficult. Those logs help John plan your next lesson.</p><Link href="/train" className="mt-4 inline-block rounded-lg bg-amber-400 px-4 py-3 font-bold text-black">Open the AI Trainer</Link></li>
    </ol>
    <p className="leading-7 text-neutral-300">Consistent home practice helps you get more from your paid lessons. Progress and the number of lessons needed depend on your dog, goals, and follow-through. Ask John before changing your assigned exercises or increasing difficulty.</p>
    <p>Need help? <a className="text-amber-200 underline" href="sms:8132996905">Text John at (813) 299-6905</a>.</p>
  </main>;
}
