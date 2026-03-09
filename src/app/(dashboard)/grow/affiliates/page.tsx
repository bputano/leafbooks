import { Handshake } from "lucide-react";

export const metadata = {
  title: "Affiliates — Grow — Canopy",
};

export default function AffiliatesPage() {
  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Affiliate Program</h1>
        <p className="mt-1 text-sm text-gray-600">
          Give influencers, podcasters, and partners trackable links with
          commission.
        </p>
      </div>

      <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <Handshake className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Affiliate Program
            </h2>
          </div>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
            Coming Soon
          </span>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-gray-600">
          Let other people sell your book for you. Create affiliate links for
          podcasters, bloggers, newsletter writers, and other influencers. They
          promote your book, you pay them a commission on every sale.
        </p>
        <ul className="mt-4 space-y-2">
          <li className="flex items-center gap-2 text-sm text-gray-500">
            <div className="h-1.5 w-1.5 rounded-full bg-gray-300" />
            Custom commission rates per affiliate
          </li>
          <li className="flex items-center gap-2 text-sm text-gray-500">
            <div className="h-1.5 w-1.5 rounded-full bg-gray-300" />
            Trackable links with real-time stats
          </li>
          <li className="flex items-center gap-2 text-sm text-gray-500">
            <div className="h-1.5 w-1.5 rounded-full bg-gray-300" />
            Automatic payout tracking
          </li>
          <li className="flex items-center gap-2 text-sm text-gray-500">
            <div className="h-1.5 w-1.5 rounded-full bg-gray-300" />
            Affiliate signup page for your partners
          </li>
        </ul>
      </div>
    </div>
  );
}
