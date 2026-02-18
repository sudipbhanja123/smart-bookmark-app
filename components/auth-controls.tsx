"use client";

import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type AuthControlsProps = {
  isLoggedIn: boolean;
  userEmail: string | null;
};

// Client-only auth actions (Google OAuth sign-in and logout).
export function AuthControls({ isLoggedIn, userEmail }: AuthControlsProps) {
  const router = useRouter();

  const handleGoogleLogin = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
  };

  const handleLogout = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    // Refresh server components so auth-gated UI updates immediately.
    router.refresh();
  };

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-slate-700">You are not logged in.</p>
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-fit rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-slate-700">Signed in as {userEmail}</p>
      <button
        type="button"
        onClick={handleLogout}
        className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
      >
        Log out
      </button>
    </div>
  );
}
