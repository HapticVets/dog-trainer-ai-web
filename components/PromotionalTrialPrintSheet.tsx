"use client";

import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

export type PrintableTrial = {
  id: string;
  code: string;
  trialDays: number;
  campaignName: string | null;
  organizationName: string | null;
  redemptionUrl: string;
};

function TrialCardQr({ trial }: { trial: PrintableTrial }) {
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    let mounted = true;
    void QRCode.toDataURL(trial.redemptionUrl, {
      width: 320,
      margin: 1,
      color: { dark: "#080808", light: "#ffffff" },
      errorCorrectionLevel: "M",
    }).then((url) => {
      if (mounted) setDataUrl(url);
    });

    return () => {
      mounted = false;
    };
  }, [trial.redemptionUrl]);

  return dataUrl ? (
    <Image
      src={dataUrl}
      alt={`QR code for Patriot K9 trial ${trial.code}`}
      width={148}
      height={148}
      unoptimized
      className="h-[132px] w-[132px] rounded-md bg-white p-1"
    />
  ) : <div className="h-[132px] w-[132px] animate-pulse rounded-md bg-neutral-200" aria-label="Generating QR code" />;
}

function PromotionalTrialPrintCard({ trial }: { trial: PrintableTrial }) {
  const campaign = [trial.campaignName, trial.organizationName].filter(Boolean).join(" · ");

  return (
    <article className="promotional-print-card rounded-xl border border-black/20 bg-white p-5 text-black shadow-sm">
      <div className="flex items-start gap-3 border-b-2 border-amber-500 pb-3">
        <Image src="/images/patriot-k9-favicon.jpg" alt="Patriot K9 Command" width={44} height={44} className="h-11 w-11 rounded-full object-cover" />
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em]">Patriot K9 Command</p>
          <h2 className="mt-1 text-xl font-black leading-tight">Free 30-Day AI Dog Trainer Trial</h2>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <TrialCardQr trial={trial} />
        <div className="min-w-0">
          <p className="text-sm font-bold leading-5">Scan to start your free AI dog training trial.</p>
          <p className="mt-2 text-xs leading-5 text-neutral-700">Get structured guidance, personalized plans, and clear next steps for your dog.</p>
          {campaign && <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-neutral-600">{campaign}</p>}
        </div>
      </div>

      <div className="mt-4 border-t border-black/15 pt-3">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.12em]">How it works</p>
        <ol className="mt-2 space-y-1 text-xs leading-4 text-neutral-800">
          <li>1. Scan the QR code.</li>
          <li>2. Create your free account.</li>
          <li>3. Build your dog&apos;s case file and start training.</li>
        </ol>
      </div>

      <div className="mt-4 border-t border-black/15 pt-3 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em]">One-time use · New users only · {trial.trialDays}-day trial</p>
        <p className="mt-1 text-[11px] text-neutral-700">app.patriotk9kennel.com</p>
      </div>
    </article>
  );
}

export default function PromotionalTrialPrintSheet({ trials }: { trials: PrintableTrial[] }) {
  return (
    <main className="promotional-print-sheet mx-auto max-w-[860px] px-4 py-6 sm:px-6 sm:py-9">
      <div className="print-screen-controls mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/25 bg-neutral-950 p-4 text-white">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">Printable Trial Cards</p>
          <p className="mt-1 text-sm text-neutral-300">{trials.length} selected {trials.length === 1 ? "card" : "cards"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/trials" className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-semibold text-neutral-100 hover:bg-neutral-900">Back to Trials</Link>
          <button type="button" onClick={() => window.print()} className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-black hover:bg-amber-300">Print</button>
        </div>
      </div>
      <div className="promotional-print-grid grid gap-5 sm:grid-cols-2">
        {trials.map((trial) => <PromotionalTrialPrintCard key={trial.id} trial={trial} />)}
      </div>
    </main>
  );
}
