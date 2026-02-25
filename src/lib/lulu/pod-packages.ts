// Maps UI selections to Lulu's Pod Package IDs
// See: https://developers.lulu.com/print-shipping-api/pod-packages
//
// Pod Package IDs are opaque strings that identify a specific print configuration.
// The best approach is to query the Lulu API for available packages and match by attributes.
// This module provides a fallback lookup for known common configurations.

import { getLuluAuthToken } from "./client";

interface PodPackageParams {
  trimSize: string;
  bindingType: string;
  paperType: string;
  interiorColor: string;
  coverFinish?: string;
  printQuality?: string;
}

// Cache for API-fetched pod packages
let podPackageCache: PodPackage[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

interface PodPackage {
  id: string;
  size: string;
  binding: string;
  interior: string;
  cover: string;
}

/**
 * Look up a Pod Package ID from the Lulu API by matching print specifications.
 * Falls back to a local lookup table if the API is unavailable.
 */
export async function findPodPackageId(
  params: PodPackageParams
): Promise<string | null> {
  try {
    const packages = await fetchPodPackages();
    if (packages.length > 0) {
      const match = matchPackage(packages, params);
      if (match) return match.id;
    }
  } catch (error) {
    console.warn("Failed to fetch pod packages from Lulu API:", error);
  }

  // Fall back to local lookup
  return buildPodPackageIdLocal(params);
}

async function fetchPodPackages(): Promise<PodPackage[]> {
  const now = Date.now();
  if (podPackageCache && now - cacheTimestamp < CACHE_TTL) {
    return podPackageCache;
  }

  const token = await getLuluAuthToken();
  const baseUrl = process.env.LULU_SANDBOX === "true"
    ? "https://api.sandbox.lulu.com"
    : "https://api.lulu.com";

  const res = await fetch(`${baseUrl}/pod-packages/`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Lulu API error: ${res.status}`);
  }

  const data = await res.json();
  podPackageCache = (data.results || []).map((pkg: Record<string, unknown>) => ({
    id: pkg.id,
    size: pkg.size,
    binding: pkg.binding,
    interior: pkg.interior,
    cover: pkg.cover,
  }));
  cacheTimestamp = now;
  return podPackageCache!;
}

function matchPackage(
  packages: PodPackage[],
  params: PodPackageParams
): PodPackage | undefined {
  // Map our UI values to Lulu's naming conventions
  const bindingMap: Record<string, string> = {
    perfect_bound: "PB",
    hardcover_casewrap: "CW",
    hardcover_dustjacket: "DJ",
  };

  const binding = bindingMap[params.bindingType];
  if (!binding) return undefined;

  // Try to match by trim size and binding at minimum
  return packages.find((pkg) => {
    const sizeMatch = pkg.size?.includes(params.trimSize.replace("x", "X"));
    const bindingMatch = pkg.binding === binding;
    return sizeMatch && bindingMatch;
  });
}

// Local fallback — these are common Lulu pod package IDs
// Updated from Lulu's documentation
const KNOWN_PACKAGES: Record<string, string> = {
  // 6x9 Perfect Bound, B&W, Cream, Glossy
  "6x9_perfect_bound_bw_cream_glossy": "0600X0900BWSTDCW060UW444GXX",
  // 6x9 Perfect Bound, B&W, White, Glossy
  "6x9_perfect_bound_bw_white_glossy": "0600X0900BWSTDPB060UW444GXX",
  // 6x9 Hardcover Casewrap, B&W, Cream
  "6x9_hardcover_casewrap_bw_cream_glossy": "0600X0900BWSTDCW060UW444GXX",
  // 5.5x8.5 Perfect Bound, B&W, Cream, Glossy
  "5.5x8.5_perfect_bound_bw_cream_glossy": "0550X0850BWSTDPB060UW444GXX",
};

function buildPodPackageIdLocal(params: PodPackageParams): string | null {
  const key = `${params.trimSize}_${params.bindingType}_${params.interiorColor}_${params.paperType}_${params.coverFinish || "glossy"}`;
  return KNOWN_PACKAGES[key] || null;
}

export function describePodPackage(params: PodPackageParams): string {
  const parts = [];
  if (params.trimSize) parts.push(`${params.trimSize}"`);
  if (params.bindingType)
    parts.push(params.bindingType.replace(/_/g, " "));
  if (params.paperType) parts.push(`${params.paperType} paper`);
  if (params.interiorColor)
    parts.push(params.interiorColor === "bw" ? "B&W" : "Color");
  if (params.coverFinish) parts.push(`${params.coverFinish} cover`);
  return parts.join(", ");
}
