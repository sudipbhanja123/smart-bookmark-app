import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type CreateBookmarkInput = {
  title?: string;
  url?: string;
};

// GET /api/bookmarks: returns current user's bookmarks sorted newest first.
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // RLS ensures only this user's rows are visible.
    const { data, error } = await supabase
      .from("bookmarks")
      .select("id,title,url,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ bookmarks: data ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/bookmarks: validates payload and creates a bookmark for the current user.
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as CreateBookmarkInput;
    const title = body.title?.trim();
    const url = body.url?.trim();

    if (!title || !url) {
      return NextResponse.json({ error: "Title and URL are required." }, { status: 400 });
    }

    // Normalize URL to a canonical absolute form before storing.
    let normalizedUrl = url;
    try {
      normalizedUrl = new URL(url).toString();
    } catch {
      return NextResponse.json({ error: "Invalid URL." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("bookmarks")
      .insert({ title, url: normalizedUrl, user_id: user.id })
      .select("id,title,url,created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ bookmark: data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
