"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search, Plus, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { AddReaderModal } from "./add-reader-modal";

type ReaderRow = {
  id: string;
  email: string;
  name: string | null;
  status: string;
  source: string;
  totalSpent: number;
  orderCount: number;
  firstSeenAt: string | Date;
  lastActiveAt: string | Date;
  tags: string[];
  orders: {
    book: { title: string };
  }[];
};

const STATUS_COLORS: Record<string, string> = {
  SUBSCRIBER: "bg-blue-100 text-blue-700",
  SAMPLE: "bg-purple-100 text-purple-700",
  CUSTOMER: "bg-green-100 text-green-700",
  VIP: "bg-amber-100 text-amber-700",
  CHURNED: "bg-gray-100 text-gray-600",
};

const SOURCE_LABELS: Record<string, string> = {
  PURCHASE: "Purchase",
  SAMPLE_REQUEST: "Sample",
  EMAIL_SIGNUP: "Email signup",
  GIFT: "Gift",
  REFERRAL: "Referral",
  MANUAL: "Manual",
};

export function ReadersTable({
  readers,
  total,
  page,
  totalPages,
  books,
  currentFilters,
}: {
  readers: ReaderRow[];
  total: number;
  page: number;
  totalPages: number;
  books: { id: string; title: string }[];
  currentFilters: { status: string; source: string; search: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchInput, setSearchInput] = useState(currentFilters.search);

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page"); // reset to page 1
    router.push(`/readers?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateFilter("search", searchInput);
  }

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/readers?${params.toString()}`);
  }

  async function exportCsv() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", "10000");
    const res = await fetch(`/api/readers?${params.toString()}`);
    const data = await res.json();
    const rows = data.readers as ReaderRow[];

    const csv = [
      ["Email", "Name", "Status", "Source", "Total Spent", "Orders", "Books Purchased", "First Seen", "Tags"].join(","),
      ...rows.map((r) =>
        [
          r.email,
          r.name || "",
          r.status,
          SOURCE_LABELS[r.source] || r.source,
          `$${(r.totalSpent / 100).toFixed(2)}`,
          r.orderCount,
          `"${[...new Set(r.orders.map((o) => o.book.title))].join("; ")}"`,
          new Date(r.firstSeenAt).toLocaleDateString(),
          `"${r.tags.join(", ")}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `readers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Deduplicate book titles for each reader
  function bookTitles(orders: { book: { title: string } }[]) {
    const titles = [...new Set(orders.map((o) => o.book.title))];
    if (titles.length === 0) return "—";
    if (titles.length <= 2) return titles.join(", ");
    return `${titles[0]} +${titles.length - 1} more`;
  }

  return (
    <>
      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-leaf-500 focus:outline-none focus:ring-1 focus:ring-leaf-500"
          />
        </form>

        <select
          value={currentFilters.status}
          onChange={(e) => updateFilter("status", e.target.value)}
          className="rounded-lg border border-gray-300 py-2 pl-3 pr-8 text-sm focus:border-leaf-500 focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="SUBSCRIBER">Subscriber</option>
          <option value="SAMPLE">Sample</option>
          <option value="CUSTOMER">Customer</option>
          <option value="VIP">VIP</option>
          <option value="CHURNED">Churned</option>
        </select>

        <select
          value={currentFilters.source}
          onChange={(e) => updateFilter("source", e.target.value)}
          className="rounded-lg border border-gray-300 py-2 pl-3 pr-8 text-sm focus:border-leaf-500 focus:outline-none"
        >
          <option value="">All sources</option>
          <option value="PURCHASE">Purchase</option>
          <option value="EMAIL_SIGNUP">Email signup</option>
          <option value="GIFT">Gift</option>
          <option value="REFERRAL">Referral</option>
          <option value="MANUAL">Manual</option>
        </select>

        <button
          onClick={exportCsv}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Download className="h-4 w-4" />
          Export
        </button>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-lg bg-leaf-600 px-3 py-2 text-sm font-medium text-white hover:bg-leaf-700"
        >
          <Plus className="h-4 w-4" />
          Add Reader
        </button>
      </div>

      {/* Table */}
      {readers.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500">
          No readers yet. Once people subscribe or buy your books, they&apos;ll
          appear here.
        </p>
      ) : (
        <>
          <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Reader
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Source
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Books
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Spent
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Last Active
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {readers.map((reader) => (
                  <tr
                    key={reader.id}
                    onClick={() => router.push(`/readers/${reader.id}`)}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">
                        {reader.name || reader.email}
                      </div>
                      {reader.name && (
                        <div className="text-xs text-gray-500">
                          {reader.email}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          STATUS_COLORS[reader.status] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {reader.status.toLowerCase()}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {SOURCE_LABELS[reader.source] || reader.source}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {bookTitles(reader.orders)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                      {reader.totalSpent > 0
                        ? `$${(reader.totalSpent / 100).toFixed(2)}`
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {new Date(reader.lastActiveAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {(page - 1) * 50 + 1}–{Math.min(page * 50, total)} of{" "}
                {total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className="rounded-lg border border-gray-300 p-2 text-sm disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                  className="rounded-lg border border-gray-300 p-2 text-sm disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {showAddModal && (
        <AddReaderModal onClose={() => setShowAddModal(false)} />
      )}
    </>
  );
}
