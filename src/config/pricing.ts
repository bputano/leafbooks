// Platform fee configuration

export const PLATFORM_FEES = {
  FREE: 0.2, // 20% of each sale
  STARTER: 0, // processing fees only
  PRO: 0, // processing fees only
  ENTERPRISE: 0, // processing fees only
} as const;

export const SUBSCRIPTION_PRICES = {
  FREE: 0,
  STARTER: 0, // TBD
  PRO: 0, // TBD
  ENTERPRISE: 0, // TBD
} as const;
