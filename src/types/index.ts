// LeafBooks shared type definitions
// Types will be generated from Prisma schema + custom types defined here

export type PlatformFeeConfig = {
  freePercent: number; // 20% for free tier
  paidPercent: number; // 0% for paid tiers (only processing fees)
};
