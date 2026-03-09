// Demo mode constants — single source of truth
export const DEMO_USER_ID = process.env.DEMO_USER_ID ?? "";
export const DEMO_TOKEN = process.env.DEMO_TOKEN ?? "";
export const WAITLIST_URL =
  process.env.NEXT_PUBLIC_WAITLIST_URL ?? "https://forms.gle/placeholder";

export function isDemoUser(userId: string | undefined | null): boolean {
  return !!userId && !!DEMO_USER_ID && userId === DEMO_USER_ID;
}
