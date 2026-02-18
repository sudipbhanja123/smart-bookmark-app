"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Bookmark = {
  id: string;
  title: string;
  url: string;
  created_at: string;
};

type BookmarkAppProps = {
  userId: string;
};

// Client bookmark manager: CRUD + Supabase realtime + cross-tab sync.
export function BookmarkApp({ userId }: BookmarkAppProps) {
  // Browser-wide channel used to notify other tabs after local mutations.
  const crossTabChannelName = "bookmark-app-sync";
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  // Loads latest bookmarks from server API (no cache to avoid stale data).
  const loadBookmarks = async () => {
    const response = await fetch("/api/bookmarks", { method: "GET", cache: "no-store" });
    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error ?? "Failed to fetch bookmarks.");
      return;
    }

    setBookmarks(payload.bookmarks ?? []);
  };

  useEffect(() => {
    let active = true;
    const crossTabChannel = new BroadcastChannel(crossTabChannelName);

    // Initial fetch when component mounts.
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        await loadBookmarks();
      } finally {
        if (active) setLoading(false);
      }
    };

    run();

    // Listen to database changes for this user and refresh list.
    const channel = supabase
      .channel(`bookmarks-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${userId}`
        },
        async () => {
          await loadBookmarks();
        }
      )
      .subscribe();

    // Fallback for same-browser multi-tab updates.
    crossTabChannel.onmessage = async (event) => {
      if (event.data?.type === "bookmarks:changed") {
        await loadBookmarks();
      }
    };

    return () => {
      active = false;
      crossTabChannel.close();
      channel.unsubscribe();
    };
  }, [supabase, userId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const response = await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, url })
    });

    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error ?? "Failed to add bookmark.");
      setSubmitting(false);
      return;
    }

    setTitle("");
    setUrl("");
    setSubmitting(false);
    await loadBookmarks();

    // Notify other open tabs to refresh.
    const crossTabChannel = new BroadcastChannel(crossTabChannelName);
    crossTabChannel.postMessage({ type: "bookmarks:changed" });
    crossTabChannel.close();
  };

  const handleDelete = async (id: string) => {
    setError(null);
    const response = await fetch(`/api/bookmarks/${id}`, {
      method: "DELETE"
    });

    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error ?? "Failed to delete bookmark.");
      return;
    }

    await loadBookmarks();

    // Notify other open tabs to refresh.
    const crossTabChannel = new BroadcastChannel(crossTabChannelName);
    crossTabChannel.postMessage({ type: "bookmarks:changed" });
    crossTabChannel.close();
  };

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold">Your Bookmarks</h2>

      <form onSubmit={handleSubmit} className="grid gap-3 rounded-md border border-slate-200 p-4 md:grid-cols-[1fr_1fr_auto]">
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Title"
          className="rounded-md border border-slate-300 px-3 py-2"
          required
        />
        <input
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://example.com"
          className="rounded-md border border-slate-300 px-3 py-2"
          required
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-500 disabled:opacity-70"
        >
          {submitting ? "Adding..." : "Add"}
        </button>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {loading ? <p className="text-slate-600">Loading bookmarks...</p> : null}

      {!loading && bookmarks.length === 0 ? (
        <p className="text-slate-600">No bookmarks yet.</p>
      ) : (
        <ul className="space-y-2">
          {bookmarks.map((bookmark) => (
            <li key={bookmark.id} className="flex items-center justify-between gap-4 rounded-md border border-slate-200 p-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{bookmark.title}</p>
                <a href={bookmark.url} target="_blank" rel="noreferrer" className="truncate text-sm text-blue-700 underline">
                  {bookmark.url}
                </a>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(bookmark.id)}
                className="rounded-md border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-50"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
