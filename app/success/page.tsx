export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-[#0b0f17] text-white flex items-center justify-center px-6">
      <div className="max-w-xl text-center">
        <h1 className="text-4xl font-bold mb-4">Payment successful</h1>
        <p className="text-lg text-slate-400 mb-6">
          Your premium access is being activated now.
        </p>
        <a
          href="/train"
          className="inline-block rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-black hover:brightness-110"
        >
          Go to Training
        </a>
      </div>
    </main>
  );
}