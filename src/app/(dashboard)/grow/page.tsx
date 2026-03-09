import { getAuthor } from "@/lib/auth/get-author";
import { db } from "@/lib/db";
import {
  Mail,
  Send,
  Route,
  Zap,
  Code,
  Plus,
  ShoppingCart,
  Star,
  Gift,
  UserPlus,
  Clock,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Email Marketing — Grow — Canopy",
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

/* ---------- Email tool cards (prototype) ---------- */

const EMAIL_TOOLS = [
  {
    title: "Engage",
    description: "Send a one-time email blast to your subscribers or a filtered segment.",
    icon: Send,
    color: "bg-blue-50 text-blue-600",
    buttonLabel: "New Email",
    examples: ["New book announcement", "Sale or discount", "Newsletter update"],
  },
  {
    title: "Campaigns",
    description: "Build multi-step email flows that send over days or weeks.",
    icon: Route,
    color: "bg-purple-50 text-purple-600",
    buttonLabel: "New Campaign",
    examples: ["Welcome series", "Launch sequence", "Re-engagement drip"],
  },
  {
    title: "Automations",
    description: "Trigger emails automatically based on reader behavior and events.",
    icon: Zap,
    color: "bg-amber-50 text-amber-600",
    buttonLabel: "New Automation",
    automations: [
      { label: "Post-Purchase", desc: "Thank readers and suggest next steps", icon: Gift },
      { label: "Abandoned Cart", desc: "Remind buyers who didn't complete checkout", icon: ShoppingCart },
      { label: "Ask for Review", desc: "Request a review after a reader finishes your book", icon: Star },
      { label: "New Subscriber", desc: "Welcome email when someone joins your list", icon: UserPlus },
    ],
  },
  {
    title: "Subscribe Forms",
    description: "Create sign-up forms for your Canopy page or embed on any website.",
    icon: Code,
    color: "bg-leaf-50 text-leaf-600",
    buttonLabel: "New Form",
    examples: ["Canopy page widget", "Embeddable HTML form", "Pop-up form"],
  },
];

function EmailToolCard({
  tool,
}: {
  tool: (typeof EMAIL_TOOLS)[number];
}) {
  const Icon = tool.icon;

  return (
    <div className="flex flex-col rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tool.color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-gray-400">
          Coming Soon
        </span>
      </div>

      <h3 className="mt-3 text-sm font-semibold text-gray-900">{tool.title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-gray-500">
        {tool.description}
      </p>

      {/* Automations get a special layout */}
      {"automations" in tool && tool.automations && (
        <div className="mt-3 space-y-2">
          {tool.automations.map((auto) => {
            const AutoIcon = auto.icon;
            return (
              <div
                key={auto.label}
                className="flex items-center gap-2.5 rounded-md bg-gray-50 px-3 py-2"
              >
                <AutoIcon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                <div>
                  <p className="text-xs font-medium text-gray-700">
                    {auto.label}
                  </p>
                  <p className="text-[11px] text-gray-400">{auto.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Examples for non-automation cards */}
      {"examples" in tool && tool.examples && (
        <ul className="mt-3 space-y-1">
          {tool.examples.map((ex) => (
            <li
              key={ex}
              className="flex items-center gap-2 text-xs text-gray-400"
            >
              <span className="h-1 w-1 shrink-0 rounded-full bg-gray-300" />
              {ex}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto pt-4">
        <button
          disabled
          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-400 cursor-not-allowed"
        >
          <Plus className="h-3.5 w-3.5" />
          {tool.buttonLabel}
        </button>
      </div>
    </div>
  );
}

/* ---------- Main page ---------- */

export default async function GrowPage() {
  const author = await getAuthor();

  const subscribers = await db.emailSubscriber.findMany({
    where: { authorId: author.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Email Marketing</h1>
        <p className="mt-1 text-sm text-gray-600">
          Reach your readers with targeted emails, automated flows, and
          embeddable sign-up forms.
        </p>
      </div>

      {/* Email tools grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {EMAIL_TOOLS.map((tool) => (
          <EmailToolCard key={tool.title} tool={tool} />
        ))}
      </div>

      {/* Subscriber list */}
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Subscribers
            {subscribers.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                {subscribers.length}
              </span>
            )}
          </h2>
        </div>

        <div className="mt-4">
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
    </div>
  );
}
