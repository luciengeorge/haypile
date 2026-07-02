/**
 * Whether a nav item is active for the current path. Shared by the desktop sidebar and
 * the mobile tab bar. `exact` items (e.g. the Search root "/app") match only their own
 * path; others also match nested routes ("/app/settings" → "/app/settings/billing").
 */
export function isNavActive(to: string, pathname: string, exact = false): boolean {
  if (exact) return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
}
