import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main id="main-content" className="flex w-full flex-1 items-center justify-center px-4 py-16">
      <SignIn />
    </main>
  );
}
