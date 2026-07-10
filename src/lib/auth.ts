export const ADMIN_COOKIE = "admin_auth";

export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function isValidAdminCookie(cookieValue: string | undefined) {
  if (!cookieValue) return false;
  const expected = await hashPassword(process.env.ADMIN_PASSWORD ?? "");
  return cookieValue === expected;
}
