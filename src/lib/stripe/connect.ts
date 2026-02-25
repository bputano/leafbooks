import { stripe } from "./index";

export async function createExpressAccount(authorEmail: string) {
  const account = await stripe.accounts.create({
    type: "express",
    email: authorEmail,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    settings: {
      payouts: {
        schedule: {
          interval: "manual",
        },
      },
    },
  });

  return account;
}

export async function createOnboardingLink(
  accountId: string,
  returnUrl: string,
  refreshUrl: string
) {
  const link = await stripe.accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    return_url: returnUrl,
    refresh_url: refreshUrl,
  });

  return link;
}

export async function getAccountStatus(accountId: string) {
  const account = await stripe.accounts.retrieve(accountId);

  return {
    id: account.id,
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
    requirements: account.requirements,
  };
}

export async function createLoginLink(accountId: string) {
  const link = await stripe.accounts.createLoginLink(accountId);
  return link;
}
