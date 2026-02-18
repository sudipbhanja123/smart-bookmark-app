import { type NextRequest } from "next/server";
import { updateSession } from "@/supabase/middleware";

// Edge middleware entrypoint: refreshes Supabase auth cookies on each request.
export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Skip static assets; run middleware for app routes/API routes.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
