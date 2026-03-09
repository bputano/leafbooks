"use client";

import { useState } from "react";
import {
  Users,
  MousePointerClick,
  ArrowRightLeft,
  Percent,
  Plus,
  Trash2,
  Gift,
  FileText,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BonusMaterial {
  id: string;
  title: string;
  type: string;
}

interface ReferralTier {
  id: string;
  referralsNeeded: number;
  rewardType: "DISCOUNT" | "BONUS_MATERIAL" | "CUSTOM";
  discountPct: number | null;
  bonusMaterialId: string | null;
  bonusMaterial: BonusMaterial | null;
  customTitle: string | null;
  customDescription: string | null;
}

interface Referral {
  id: string;
  referrerEmail: string;
  referredEmail: string | null;
  referralCode: string;
  source: string;
  status: string;
  clickCount: number;
  createdAt: string;
  book: { title: string };
}

interface Stats {
  totalReferrals: number;
  totalClicks: number;
  totalConverted: number;
  conversionRate: number;
}

interface ReferralsClientProps {
  initialReferralEnabled: boolean;
  initialTiers: ReferralTier[];
  initialReferrals: Referral[];
  bonusMaterials: BonusMaterial[];
  stats: Stats;
}

const REWARD_ICONS = {
  DISCOUNT: Percent,
  BONUS_MATERIAL: Gift,
  CUSTOM: Wrench,
};

export function ReferralsClient({
  initialReferralEnabled,
  initialTiers,
  initialReferrals,
  bonusMaterials,
  stats,
}: ReferralsClientProps) {
  const [enabled, setEnabled] = useState(initialReferralEnabled);
  const [tiers, setTiers] = useState<ReferralTier[]>(initialTiers);
  const [showAddTier, setShowAddTier] = useState(false);
  const [saving, setSaving] = useState(false);

  async function toggleEnabled() {
    const newVal = !enabled;
    setEnabled(newVal);
    await fetch("/api/referrals/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: newVal }),
    });
  }

  async function deleteTier(id: string) {
    const res = await fetch(`/api/referral-tiers/${id}`, { method: "DELETE" });
    if (res.ok) {
      setTiers((prev) => prev.filter((t) => t.id !== id));
    }
  }

  return (
    <div className="mt-8 space-y-8">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Referral Links"
          value={stats.totalReferrals}
        />
        <StatCard
          icon={<MousePointerClick className="h-5 w-5" />}
          label="Total Clicks"
          value={stats.totalClicks}
        />
        <StatCard
          icon={<ArrowRightLeft className="h-5 w-5" />}
          label="Conversions"
          value={stats.totalConverted}
        />
        <StatCard
          icon={<Percent className="h-5 w-5" />}
          label="Conversion Rate"
          value={`${stats.conversionRate}%`}
        />
      </div>

      {/* Settings */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
            <p className="text-sm text-gray-500">
              Control whether readers see referral sharing options
            </p>
          </div>
          <button
            onClick={toggleEnabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              enabled ? "bg-leaf-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </section>

      {/* Reward Tiers */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Reward Tiers
            </h2>
            <p className="text-sm text-gray-500">
              Set rewards readers earn for reaching referral milestones
            </p>
          </div>
          {!showAddTier && (
            <Button
              variant="outline"
              onClick={() => setShowAddTier(true)}
              size="sm"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add Tier
            </Button>
          )}
        </div>

        {tiers.length === 0 && !showAddTier && (
          <div className="mt-6 rounded-lg bg-gray-50 p-8 text-center">
            <Gift className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">
              No reward tiers configured. Add tiers to motivate readers to share
              your books.
            </p>
          </div>
        )}

        {tiers.length > 0 && (
          <div className="mt-6 space-y-3">
            {tiers.map((tier) => {
              const Icon = REWARD_ICONS[tier.rewardType] || Gift;
              return (
                <div
                  key={tier.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {tier.referralsNeeded}{" "}
                        {tier.referralsNeeded === 1 ? "referral" : "referrals"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {tier.rewardType === "DISCOUNT" &&
                          `${tier.discountPct}% off next purchase`}
                        {tier.rewardType === "BONUS_MATERIAL" &&
                          tier.bonusMaterial &&
                          `Unlock: ${tier.bonusMaterial.title}`}
                        {tier.rewardType === "CUSTOM" &&
                          (tier.customTitle || "Custom reward")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteTier(tier.id)}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {showAddTier && (
          <AddTierForm
            bonusMaterials={bonusMaterials}
            onSave={(tier) => {
              setTiers((prev) =>
                [...prev, tier].sort(
                  (a, b) => a.referralsNeeded - b.referralsNeeded
                )
              );
              setShowAddTier(false);
            }}
            onCancel={() => setShowAddTier(false)}
          />
        )}
      </section>

      {/* Recent Activity */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Recent Activity
        </h2>

        {initialReferrals.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">
            No referral activity yet. Once readers start sharing, their activity
            will appear here.
          </p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Referrer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Book
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Clicks
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {initialReferrals.map((ref) => (
                  <tr key={ref.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                      {ref.referrerEmail}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {ref.book.title}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {ref.source === "GIFT" ? "Gift" : "Link"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {ref.clickCount}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusBadge status={ref.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {new Date(ref.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2 text-gray-500">{icon}</div>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-gray-100 text-gray-600",
    CLICKED: "bg-blue-100 text-blue-700",
    CONVERTED: "bg-green-100 text-green-700",
    EXPIRED: "bg-red-100 text-red-600",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        styles[status] || styles.PENDING
      }`}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

function AddTierForm({
  bonusMaterials,
  onSave,
  onCancel,
}: {
  bonusMaterials: BonusMaterial[];
  onSave: (tier: ReferralTier) => void;
  onCancel: () => void;
}) {
  const [referralsNeeded, setReferralsNeeded] = useState("1");
  const [rewardType, setRewardType] = useState<
    "DISCOUNT" | "BONUS_MATERIAL" | "CUSTOM"
  >("DISCOUNT");
  const [discountPct, setDiscountPct] = useState("20");
  const [bonusMaterialId, setBonusMaterialId] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/referral-tiers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        referralsNeeded: parseInt(referralsNeeded),
        rewardType,
        ...(rewardType === "DISCOUNT"
          ? { discountPct: parseInt(discountPct) }
          : {}),
        ...(rewardType === "BONUS_MATERIAL" ? { bonusMaterialId } : {}),
        ...(rewardType === "CUSTOM" ? { customTitle, customDescription } : {}),
      }),
    });
    if (res.ok) {
      const { tier } = await res.json();
      onSave(tier);
    }
    setSaving(false);
  }

  return (
    <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <h3 className="text-sm font-medium text-gray-900">Add Reward Tier</h3>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Input
          label="Referrals Needed"
          type="number"
          min="1"
          value={referralsNeeded}
          onChange={(e) => setReferralsNeeded(e.target.value)}
        />
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Reward Type
          </label>
          <select
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={rewardType}
            onChange={(e) =>
              setRewardType(
                e.target.value as "DISCOUNT" | "BONUS_MATERIAL" | "CUSTOM"
              )
            }
          >
            <option value="DISCOUNT">Discount (%)</option>
            <option value="BONUS_MATERIAL">Bonus Material</option>
            <option value="CUSTOM">Custom Reward</option>
          </select>
        </div>
      </div>

      {rewardType === "DISCOUNT" && (
        <div className="mt-4">
          <Input
            label="Discount Percentage"
            type="number"
            min="1"
            max="100"
            value={discountPct}
            onChange={(e) => setDiscountPct(e.target.value)}
          />
        </div>
      )}

      {rewardType === "BONUS_MATERIAL" && (
        <div className="mt-4 space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Bonus Material
          </label>
          <select
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={bonusMaterialId}
            onChange={(e) => setBonusMaterialId(e.target.value)}
          >
            <option value="">Select a bonus material...</option>
            {bonusMaterials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
          {bonusMaterials.length === 0 && (
            <p className="text-xs text-gray-400">
              Add bonus materials in the Bonus Library first.
            </p>
          )}
        </div>
      )}

      {rewardType === "CUSTOM" && (
        <div className="mt-4 space-y-4">
          <Input
            label="Reward Title"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="e.g., Free 1-on-1 coaching call"
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Description / Fulfillment Details
            </label>
            <textarea
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              rows={2}
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              placeholder="How will this reward be delivered?"
            />
          </div>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Add Tier"}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
