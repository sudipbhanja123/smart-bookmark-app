import { AuthControls } from "@/components/auth-controls";
import { BookmarkApp } from "@/components/bookmark-app";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Server-rendered home page: resolves current auth state and renders UI accordingly.
export default async function HomePage() {
  // Read the signed-in user from server cookies/session.
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl p-6 md:p-10">
      <h1 className="text-3xl font-bold md:text-4xl">Smart Bookmark App</h1>
      <p className="mt-2 text-slate-700">Google OAuth login, private bookmarks, realtime sync.</p>

      <section className="mt-8 rounded-lg bg-white p-5 shadow">
        {/* Auth controls handle Google login/logout from the client side. */}
        <AuthControls userEmail={user?.email ?? null} isLoggedIn={Boolean(user)} />
      </section>

      {user ? (
        <section className="mt-6 rounded-lg bg-white p-5 shadow">
          {/* Bookmark manager is shown only for authenticated users. */}
          <BookmarkApp userId={user.id} />
        </section>
      ) : (
        <section className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white p-5 text-slate-700">
          Please sign in with Google to manage your private bookmarks.
        </section>
      )}
    </main>
  );
}
