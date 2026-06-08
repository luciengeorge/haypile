// Avatar initials from a display name, falling back to email, then "?".
export function getInitials(name?: string | null, email?: string | null): string {
  const trimmedName = name?.trim();
  if (trimmedName) {
    const initials = trimmedName
      .split(/\s+/)
      .map((part) => part.charAt(0))
      .filter(Boolean)
      .slice(0, 2)
      .join("");
    if (initials) return initials.toUpperCase();
  }
  const trimmedEmail = email?.trim();
  return trimmedEmail ? trimmedEmail.charAt(0).toUpperCase() : "?";
}
