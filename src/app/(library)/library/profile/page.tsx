import { db } from "@/lib/db";
import { getReaderSession } from "@/lib/reader/reader-session";
import { redirect } from "next/navigation";
import { ProfileActions } from "./profile-actions";

export const metadata = {
  title: "Profile — Canopy",
};

export default async function ProfilePage() {
  const email = await getReaderSession();
  if (!email) redirect("/library/login");

  // Get reader name from any Reader record with this email
  const reader = await db.reader.findFirst({
    where: { email },
    select: { name: true },
  });

  // Get gift links sent
  const giftLinks = await db.giftLink.findMany({
    where: { createdBy: email },
    include: {
      book: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 font-serif text-2xl font-semibold text-ink">
        Profile
      </h1>

      <div className="space-y-6">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-ink-muted">
            Email
          </label>
          <p className="mt-1 text-sm text-ink">{email}</p>
        </div>

        {/* Name */}
        <ProfileActions name={reader?.name || ""} />

        {/* Gift links */}
        {giftLinks.length > 0 && (
          <div>
            <h2 className="mb-3 text-sm font-medium text-ink-muted">
              Gift Links Sent
            </h2>
            <div className="space-y-2">
              {giftLinks.map((gift) => (
                <div
                  key={gift.id}
                  className="flex items-center justify-between rounded-md border border-ink/[0.06] bg-paper px-4 py-3"
                >
                  <span className="text-sm text-ink">{gift.book.title}</span>
                  <span
                    className={`text-xs font-medium ${
                      gift.claimedBy
                        ? "text-green-600"
                        : "text-ink-muted"
                    }`}
                  >
                    {gift.claimedBy ? "Claimed" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
