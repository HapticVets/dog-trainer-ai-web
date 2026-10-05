import { SignUp } from "@clerk/nextjs";
import { authRoutes } from "@/lib/site";

export default function Page() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-white">
      <SignUp
        signInUrl={authRoutes.signInUrl}
        fallbackRedirectUrl={authRoutes.postSignUpUrl}
        appearance={{
          elements: {
            card: "border border-neutral-700 bg-white text-neutral-950 shadow-2xl",
            formButtonPrimary: "bg-amber-400 text-black hover:bg-amber-300",
            footerActionLink: "text-amber-700 hover:text-amber-800",
          },
        }}
      />
    </main>
  );
}
