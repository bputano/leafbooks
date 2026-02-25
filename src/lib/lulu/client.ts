import type { LuluTokenResponse } from "./types";

const LULU_AUTH_URL = "https://api.lulu.com/auth/realms/glasstree/protocol/openid-connect/token";
const LULU_SANDBOX_AUTH_URL = "https://api.sandbox.lulu.com/auth/realms/glasstree/protocol/openid-connect/token";

const LULU_API_URL = "https://api.lulu.com";
const LULU_SANDBOX_API_URL = "https://api.sandbox.lulu.com";

let cachedToken: { token: string; expiresAt: number } | null = null;
let tokenPromise: Promise<string> | null = null;

function isSandbox() {
  return process.env.LULU_SANDBOX === "true";
}

function getAuthUrl() {
  return isSandbox() ? LULU_SANDBOX_AUTH_URL : LULU_AUTH_URL;
}

export function getApiUrl() {
  return isSandbox() ? LULU_SANDBOX_API_URL : LULU_API_URL;
}

export async function getLuluAuthToken(): Promise<string> {
  return getAccessToken();
}

async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken.token;
  }

  // If another request is already fetching a token, wait for it
  if (tokenPromise) {
    return tokenPromise;
  }

  tokenPromise = fetchNewToken();
  try {
    const token = await tokenPromise;
    return token;
  } finally {
    tokenPromise = null;
  }
}

async function fetchNewToken(): Promise<string> {
  const res = await fetch(getAuthUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.LULU_CLIENT_KEY!,
      client_secret: process.env.LULU_CLIENT_SECRET!,
    }),
  });

  if (!res.ok) {
    throw new Error(`Lulu auth failed: ${res.status}`);
  }

  const data: LuluTokenResponse = await res.json();

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return data.access_token;
}

export async function luluFetch(path: string, options: RequestInit = {}) {
  const token = await getAccessToken();
  const baseUrl = getApiUrl();

  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  return res;
}
