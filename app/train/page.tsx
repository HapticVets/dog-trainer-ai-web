import { auth, clerkClient } from "@clerk/nextjs/server";

export default async function TrainPage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <main className="min-h-screen bg-[#0b0f17] text-white flex items-center justify-center px-6">
        <div className="max-w-xl text-center">
          <h1 className="text-4xl font-bold mb-4">Login required</h1>
          <p className="text-lg text-slate-400 mb-6">
            You need to sign in before using training.
          </p>
          <a
            href="/sign-in"
            className="inline-block rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-black hover:brightness-110"
          >
            Sign In
          </a>
        </div>
      </main>
    );
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const premium = user.publicMetadata?.premium === true;

  return (
    <main className="min-h-screen bg-[#0b0f17] text-white px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold">Patriot K9 Command Trainer</h1>

        {!premium && (
          <div className="mt-8 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-6">
            <h2 className="text-2xl font-semibold">Basic Access</h2>
            <p className="mt-3 text-slate-300">
              You are logged in, but premium access is not active yet.
            </p>
            <p className="mt-2 text-slate-400">
              Upgrade to unlock full trainer access.
            </p>
            <a
              href="/"
              className="mt-6 inline-block rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-black hover:brightness-110"
            >
              Upgrade
            </a>
          </div>
        )}

        {premium && (
          <div className="mt-8 rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-6">
            <h2 className="text-2xl font-semibold">Premium Access Active</h2>
            <p className="mt-3 text-slate-200">
              Full trainer access is unlocked for this account.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}