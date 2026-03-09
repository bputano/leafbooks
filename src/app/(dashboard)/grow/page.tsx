import { getAuthor } from "@/lib/auth/get-author";
import { db } from "@/lib/db";
import { Mail } from "lucide-react";

export const metadata = {
  title: "Email Subscribers — Grow — Canopy",
};

function SourceBadge({ source }: { source: string | null }) {
  const labels: Record<string, string> = {
    book_page: "Book Page",
    author_page: "Author Page",
    reader_share: "Reader Share",
    purchase: "Purchase",
  };

  const label = source ? labels[source] || source : "Unknown";

  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
      {label}
    </span>
  );
}

export default async function GrowPage() {
  const author = await getAuthor();

  const subscribers = await db.emailSubscriber.findMany({
    where: { authorId: author.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Email Subscribers</h1>
        <p className="mt-1 text-sm text-gray-600">
          Everyone who has subscribed through your book pages and author page.
          {subscribers.length > 0 && (
            <span className="ml-1 font-medium text-gray-900">
              {subscribers.length}{" "}
              {subscribers.length === 1 ? "subscriber" : "subscribers"}
            </span>
          )}
        </p>
      </div>

      <div className="mt-8">
        {subscribers.length === 0 ? (
          <div className="rounded-lg bg-gray-50 p-12 text-center">
            <Mail className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-gray-500">
              No subscribers yet. Email capture forms on your book pages and
              author page will collect subscribers here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Source
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {subscribers.map((sub) => (
                  <tr key={sub.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                      {sub.email}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {sub.name || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <SourceBadge source={sub.source} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
