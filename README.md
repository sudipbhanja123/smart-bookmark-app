# Smart Bookmark App

## Problems Encountered and How I Solved Them

1. Problem: Session persistence can be inconsistent in App Router without middleware refresh.
   Solution: Added Supabase middleware (`middleware.ts` + `supabase/middleware.ts`) to keep auth cookies synced.

2. Problem: Realtime list drift between tabs after local optimistic operations.
   Solution: Re-fetched `/api/bookmarks` after insert/delete and on realtime events to keep state consistent.

3. Problem: Keeping same-browser tabs in sync and avoiding stale reads.
   Solution: Used `BroadcastChannel("bookmark-app-sync")` for same-browser tab updates and `cache: "no-store"` for fresh reads.
   Demo: Open two tabs, add/delete in one tab, and verify immediate update in the second tab.
