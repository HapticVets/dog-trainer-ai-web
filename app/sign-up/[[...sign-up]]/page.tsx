import { SignUp } from "@clerk/nextjs";
import { authRoutes } from "@/lib/site";

export default function Page() {
  return (
    <main className="min-h-screen bg-[#0b0f17] flex items-center justify-center px-6">
      <SignUp
        signInUrl={authRoutes.signInUrl}
        fallbackRedirectUrl={authRoutes.postSignUpUrl}
      />
    </main>
  );
}
