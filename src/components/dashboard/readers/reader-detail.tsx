"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  DollarSign,
  ShoppingBag,
  BookOpen,
  Calendar,
  Save,
} from "lucide-react";

type ReaderData = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  status: string;
  source: string;
  tags: string[];
  notes: string | null;
  totalSpent: number;
  orderCount: number;
  firstSeenAt: string | Date;
  lastActiveAt: string | Date;
  orders: {
    id: string;
    amount: number;
    status: string;
    createdAt: string | Date;
    book: { id: string; title: string; coverImageUrl: string | null };
    bookFormat: { type: string } | null;
  }[];
  events: {
    id: string;
    type: string;
    createdAt: string | Date;
    metadata: unknown;
    book: { title: string } | null;
  }[];
};

const STATUS_OPTIONS = ["SUBSCRIBER", "SAMPLE", "CUSTOMER", "VIP", "CHURNED"];

const STATUS_COLORS: Record<string, string> = {
  SUBSCRIBER: "bg-blue-100 text-blue-700",
  SAMPLE: "bg-purple-100 text-purple-700",
  CUSTOMER: "bg-green-100 text-green-700",
  VIP: "bg-amber-100 text-amber-700",
  CHURNED: "bg-gray-100 text-gray-600",
};

const EVENT_LABELS: Record<string, string> = {
  SUBSCRIBED: "Subscribed",
  SAMPLE_REQUESTED: "Requested sample",
  PURCHASED: "Purchased",
  GIFT_RECEIVED: "Received gift",
  GIFT_SENT: "Sent gift",
  REFUNDED: "Refunded",
};

const SOURCE_LABELS: Record<string, string> = {
  PURCHASE: "Purchase",
  SAMPLE_REQUEST: "Sample request",
  EMAIL_SIGNUP: "Email signup",
  GIFT: "Gift",
  REFERRAL: "Referral",
  MANUAL: "Manually added",
};

export function ReaderDetail({ reader }: { reader: ReaderData }) {
  const router = useRouter();
  const [status, setStatus] = useState(reader.status);
  const [notes, setNotes] = useState(reader.notes || "");
  const [name, setName] = useState(reader.name || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/readers/${reader.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        notes: notes || undefined,
        name: name || undefined,
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  }

  // Unique books from orders
  const booksOwned = [
    ...new Map(
      reader.orders.map((o) => [o.book.id, o.book])
    ).values(),
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => router.push("/readers")}
          className="mt-1 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {reader.name || reader.email}
            </h1>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                STATUS_COLORS[reader.status] || "bg-gray-100 text-gray-600"
              }`}
            >
              {reader.status.toLowerCase()}
            </span>
          </div>
          {reader.name && (
            <p className="mt-1 text-sm text-gray-500">{reader.email}</p>
          )}
          <p className="mt-0.5 text-xs text-gray-400">
            Source: {SOURCE_LABELS[reader.source] || reader.source} · First
            seen {new Date(reader.firstSeenAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4">
          <DollarSign className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-xs text-gray-500">Total Spent</p>
            <p className="text-lg font-bold text-gray-900">
              ${(reader.totalSpent / 100).toFixed(2)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4">
          <ShoppingBag className="h-5 w-5 text-blue-600" />
          <div>
            <p className="text-xs text-gray-500">Orders</p>
            <p className="text-lg font-bold text-gray-900">
              {reader.orderCount}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4">
          <BookOpen className="h-5 w-5 text-purple-600" />
          <div>
            <p className="text-xs text-gray-500">Books Owned</p>
            <p className="text-lg font-bold text-gray-900">
              {booksOwned.length}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4">
          <Calendar className="h-5 w-5 text-gray-600" />
          <div>
            <p className="text-xs text-gray-500">Last Active</p>
            <p className="text-lg font-bold text-gray-900">
              {new Date(reader.lastActiveAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Left column: editable fields */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-900">Details</h2>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Add name..."
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-leaf-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500">
                  Email
                </label>
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-700">
                  <Mail className="h-4 w-4 text-gray-400" />
                  {reader.email}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-leaf-500 focus:outline-none"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0) + s.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Private notes about this reader..."
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-leaf-500 focus:outline-none"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-leaf-600 px-4 py-2 text-sm font-medium text-white hover:bg-leaf-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
              </button>
            </div>
          </div>

          {/* Books owned */}
          {booksOwned.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-gray-900">
                Books Owned
              </h2>
              <ul className="mt-3 space-y-2">
                {booksOwned.map((book) => (
                  <li key={book.id} className="flex items-center gap-3">
                    {book.coverImageUrl ? (
                      <img
                        src={book.coverImageUrl}
                        alt=""
                        className="h-10 w-7 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-7 items-center justify-center rounded bg-gray-100">
                        <BookOpen className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                    <span className="text-sm text-gray-700">{book.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right column: activity + orders */}
        <div className="space-y-6 lg:col-span-2">
          {/* Orders */}
          {reader.orders.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-gray-900">Orders</h2>
              <div className="mt-3 overflow-hidden rounded border border-gray-100">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                        Book
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                        Format
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                        Amount
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {reader.orders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-3 py-2 text-sm text-gray-700">
                          {order.book.title}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-500">
                          {order.bookFormat?.type || "—"}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          ${(order.amount / 100).toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Activity timeline */}
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-900">Activity</h2>
            {reader.events.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">No activity yet.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {reader.events.map((event) => (
                  <li key={event.id} className="flex gap-3">
                    <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-leaf-400" />
                    <div>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">
                          {EVENT_LABELS[event.type] || event.type}
                        </span>
                        {event.book && (
                          <span className="text-gray-500">
                            {" "}
                            — {event.book.title}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(event.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
