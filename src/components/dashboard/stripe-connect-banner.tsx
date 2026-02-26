"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Check, AlertCircle } from "lucide-react";

interface StripeConnectSetupProps {
  connected: boolean;
  detailsSubmitted: boolean;
  accountId: string | null;
}

export function StripeConnectSetup({
  connected,
  detailsSubmitted,
  accountId,
}: StripeConnectSetupProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/connect", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(
          data.error ||
            "Unable to connect to Stripe. Please ensure Stripe is configured and try again."
        );
      }
    } catch {
      setError("Failed to connect to Stripe. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  if (connected) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
            <Check className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Stripe Connected</h3>
            <p className="text-sm text-gray-600">
              Your account is connected and ready to accept payments.
            </p>
          </div>
        </div>
        {accountId && (
          <p className="mt-3 text-xs text-gray-500">Account: {accountId}</p>
        )}
      </div>
    );
  }

  if (detailsSubmitted && !connected) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
            <AlertCircle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Action Required</h3>
            <p className="text-sm text-gray-600">
              Your Stripe account needs additional information to start accepting
              payments.
            </p>
          </div>
        </div>
        <Button onClick={handleConnect} loading={loading} className="mt-4">
          Complete Setup
        </Button>
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
          <CreditCard className="h-5 w-5 text-gray-600" />
        </div>
        <div>
          <h3 className="font-medium text-gray-900">Connect Stripe</h3>
          <p className="text-sm text-gray-600">
            Connect your Stripe account to receive payouts from book sales.
          </p>
        </div>
      </div>
      <Button onClick={handleConnect} loading={loading} className="mt-4">
        Connect Stripe Account
      </Button>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
