import { ArrowLeftRight } from "lucide-react";

export const metadata = {
  title: "Cross-Promote — Grow — Canopy",
};

export default function CrossPromotePage() {
  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Author Cross-Promotion
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Team up with other Canopy authors to recommend each other's books.
        </p>
      </div>

      <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Cross-Promotion Network
            </h2>
          </div>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
            Coming Soon
          </span>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-gray-600">
          A built-in, community-powered discovery network. Find authors in
          complementary genres, agree to recommend each other's books on your
          sales pages, and tap into each other's audiences. The network grows
          more valuable as more authors join.
        </p>
        <ul className="mt-4 space-y-2">
          <li className="flex items-center gap-2 text-sm text-gray-500">
            <div className="h-1.5 w-1.5 rounded-full bg-gray-300" />
            Browse and connect with compatible authors
          </li>
          <li className="flex items-center gap-2 text-sm text-gray-500">
            <div className="h-1.5 w-1.5 rounded-full bg-gray-300" />
            Mutual book recommendations on sales pages
          </li>
          <li className="flex items-center gap-2 text-sm text-gray-500">
            <div className="h-1.5 w-1.5 rounded-full bg-gray-300" />
            Shared audience insights
          </li>
          <li className="flex items-center gap-2 text-sm text-gray-500">
            <div className="h-1.5 w-1.5 rounded-full bg-gray-300" />
            Genre and topic matching
          </li>
        </ul>
      </div>
    </div>
  );
}
