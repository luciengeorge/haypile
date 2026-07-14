export const WAITLIST_ENABLED = import.meta.env.VITE_WAITLIST_ENABLED === "true";

// Optional obscurity for /login while the waitlist is live: when set, /login redirects to
// /waitlist unless reached as /login?key=<this>. The real signup block is server-side
// (convex/betterAuth/auth.ts refuses new accounts), so this is UX, not the security boundary.
export const WAITLIST_BYPASS_KEY = import.meta.env.VITE_WAITLIST_BYPASS_KEY ?? "";
