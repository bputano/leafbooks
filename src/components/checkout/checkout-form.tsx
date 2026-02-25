"use client";

import { useState, useEffect } from "react";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface CheckoutFormProps {
  bookId: string;
  formatId: string;
  formatType: string;
  price: number;
  currency: string;
  bookTitle: string;
}

function PaymentForm({
  onSuccess,
  bookTitle,
  amount,
}: {
  onSuccess: () => void;
  bookTitle: string;
  amount: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}${window.location.pathname.replace("/checkout", "/success")}`,
      },
    });

    if (submitError) {
      setError(submitError.message || "Payment failed");
      setLoading(false);
    } else {
      onSuccess();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">{bookTitle}</span>
          <span className="font-medium">${(amount / 100).toFixed(2)}</span>
        </div>
      </div>

      <PaymentElement />

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" loading={loading} disabled={!stripe}>
        Pay ${(amount / 100).toFixed(2)}
      </Button>
    </form>
  );
}

export function CheckoutForm({
  bookId,
  formatId,
  formatType,
  price,
  currency,
  bookTitle,
}: CheckoutFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [step, setStep] = useState<"info" | "payment">("info");
  const isPrint = formatType !== "EBOOK" && formatType !== "LEAF_EDITION";

  // Shipping state
  const [shipping, setShipping] = useState({
    name: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "US",
  });

  async function createPaymentIntent() {
    setError(null);
    try {
      const res = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId,
          formatId,
          buyerEmail: email,
          buyerName: name,
          ...(isPrint ? { shippingAddress: shipping } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }

      setClientSecret(data.clientSecret);
      setStep("payment");
    } catch {
      setError("Failed to initialize checkout");
    }
  }

  if (step === "info") {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
        </div>

        {isPrint && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">
              Shipping Address
            </h3>
            <Input
              label="Full name"
              value={shipping.name}
              onChange={(e) =>
                setShipping({ ...shipping, name: e.target.value })
              }
              required
            />
            <Input
              label="Address line 1"
              value={shipping.line1}
              onChange={(e) =>
                setShipping({ ...shipping, line1: e.target.value })
              }
              required
            />
            <Input
              label="Address line 2"
              value={shipping.line2}
              onChange={(e) =>
                setShipping({ ...shipping, line2: e.target.value })
              }
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="City"
                value={shipping.city}
                onChange={(e) =>
                  setShipping({ ...shipping, city: e.target.value })
                }
                required
              />
              <Input
                label="State"
                value={shipping.state}
                onChange={(e) =>
                  setShipping({ ...shipping, state: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Postal code"
                value={shipping.postal_code}
                onChange={(e) =>
                  setShipping({ ...shipping, postal_code: e.target.value })
                }
                required
              />
              <Input
                label="Country"
                value={shipping.country}
                onChange={(e) =>
                  setShipping({ ...shipping, country: e.target.value })
                }
                required
              />
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Button onClick={createPaymentIntent} className="w-full" disabled={!email}>
          Continue to Payment
        </Button>
      </div>
    );
  }

  if (!clientSecret) {
    return <div className="p-4 text-center text-gray-500">Loading...</div>;
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{ clientSecret, appearance: { theme: "stripe" } }}
    >
      <PaymentForm
        onSuccess={() => {}}
        bookTitle={bookTitle}
        amount={price}
      />
    </Elements>
  );
}
