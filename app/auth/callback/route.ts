import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// OAuth callback: exchanges provider code for a Supabase session cookie.
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Always send users back to the home page after auth.
  return NextResponse.redirect(`${origin}/`);
}
