import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <main className="min-h-screen bg-[#0b0f17] flex items-center justify-center px-6">
      <SignIn
        appearance={{
          elements: {
            card: "bg-[#111827] text-white",
            formButtonPrimary: "bg-cyan-400 text-black hover:brightness-110",
          },
        }}
      />
    </main>
  );
}