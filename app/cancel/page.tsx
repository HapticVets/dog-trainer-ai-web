export default function CancelPage() {
  return (
    <main className="min-h-screen bg-[#0b0f17] text-white flex items-center justify-center px-6">
      <div className="max-w-xl text-center">
        <h1 className="text-4xl font-bold mb-4">Checkout canceled</h1>
        <p className="text-lg text-slate-400 mb-6">
          No charge was made. You can upgrade any time.
        </p>
        <a
          href="/"
          className="inline-block rounded-xl border border-white/20 px-6 py-3 font-semibold text-white hover:bg-white/10"
        >
          Back Home
        </a>
      </div>
    </main>
  );
}