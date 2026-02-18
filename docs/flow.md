# Smart Bookmark App Workflow Guide

## 1) High-Level Request Flow

```text
Browser -> Next.js App Router -> Middleware (session refresh) -> Page/API -> Supabase
```

1. User hits a route like `/`.
2. `middleware.ts` runs and calls `supabase/middleware.ts` to refresh/validate auth cookies.
3. Page or API route executes with updated session context.
4. Supabase Auth/DB is queried using server or browser client helpers.

## 2) Auth Flow (Google OAuth)

```text
AuthControls -> Supabase OAuth -> Google -> /auth/callback -> exchange code -> set session -> redirect /
```

1. `components/auth-controls.tsx` calls `supabase.auth.signInWithOAuth`.
2. User authenticates with Google.
3. Google redirects to `app/auth/callback/route.ts`.
4. Callback exchanges `code` for Supabase session cookies.
5. User is redirected to `/` and now appears logged in.

## 3) Home Page Rendering Flow

File: `app/page.tsx`

1. Create server Supabase client via `lib/supabase/server.ts`.
2. Call `supabase.auth.getUser()` on the server.
3. If user exists:
   - render `components/bookmark-app.tsx`.
4. If no user:
   - render login prompt.

## 4) Bookmark Data Flow

### Read bookmarks

```text
BookmarkApp -> GET /api/bookmarks -> validate user -> select bookmarks -> return JSON
```

File: `app/api/bookmarks/route.ts` (`GET`)

1. Server validates current user from session.
2. Reads rows from `public.bookmarks`.
3. Returns `id, title, url, created_at` sorted by newest.

### Add bookmark

```text
BookmarkApp form submit -> POST /api/bookmarks -> validate body -> normalize URL -> insert row
```

File: `app/api/bookmarks/route.ts` (`POST`)

1. Validate auth.
2. Validate `title` and `url`.
3. Normalize URL with `new URL(url)`.
4. Insert with `user_id = current user`.

### Delete bookmark

```text
BookmarkApp delete -> DELETE /api/bookmarks/:id -> validate auth -> delete row
```

File: `app/api/bookmarks/[id]/route.ts`

1. Validate auth.
2. Delete bookmark by `id`.
3. Row-Level Security ensures users can only delete their own rows.

## 5) Realtime + Cross-Tab Sync

File: `components/bookmark-app.tsx`

1. Component subscribes to Supabase `postgres_changes` on `bookmarks` filtered by `user_id`.
2. On DB change, it re-fetches `/api/bookmarks`.
3. It also uses `BroadcastChannel("bookmark-app-sync")`:
   - after add/delete, it broadcasts `bookmarks:changed`,
   - other tabs listen and re-fetch immediately.
4. `cache: "no-store"` is used on fetch to avoid stale bookmark lists.

## 6) Supabase Client Responsibilities

### Browser client
File: `lib/supabase/client.ts`

- Creates client-side Supabase instance for UI actions (OAuth/realtime/client calls).

### Server client
File: `lib/supabase/server.ts`

- Creates server-side Supabase instance bound to Next.js cookies for authenticated page/API work.

### Session middleware helper
File: `supabase/middleware.ts`

- Keeps auth cookies fresh on each request so server components/routes receive correct session state.

## 7) Security Model

1. App checks session on server before reading/writing bookmarks.
2. Supabase Row-Level Security (RLS) protects data at DB level by `user_id`.
3. Even if API is called directly, unauthorized users receive `401`, and cross-user DB access is blocked by RLS.

## 8) Suggested Reading Order

1. `app/page.tsx`
2. `components/bookmark-app.tsx`
3. `app/api/bookmarks/route.ts`
4. `app/api/bookmarks/[id]/route.ts`
5. `components/auth-controls.tsx`
6. `app/auth/callback/route.ts`
7. `middleware.ts` and `supabase/middleware.ts`
8. `lib/supabase/client.ts` and `lib/supabase/server.ts`
