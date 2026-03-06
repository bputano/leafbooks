import { getAuthor } from "@/lib/auth/get-author";
import { db } from "@/lib/db";
import { ReadersTable } from "@/components/dashboard/readers/readers-table";

export const metadata = {
  title: "Readers — Canopy",
};

export default async function ReadersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const author = await getAuthor();
  const params = await searchParams;

  const status = params.status;
  const source = params.source;
  const search = params.search;
  const page = parseInt(params.page || "1");
  const limit = 50;

  const where: Record<string, unknown> = { authorId: author.id };
  if (status) where.status = status;
  if (source) where.source = source;
  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
    ];
  }

  const [readers, total, stats] = await Promise.all([
    db.reader.findMany({
      where,
      orderBy: { lastActiveAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        orders: {
          where: { status: { in: ["PAID", "FULFILLED"] } },
          select: {
            book: { select: { title: true } },
          },
        },
      },
    }),
    db.reader.count({ where }),
    getReaderStats(author.id),
  ]);

  const books = await db.book.findMany({
    where: { authorId: author.id, status: "PUBLISHED" },
    select: { id: true, title: true },
    orderBy: { title: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Readers</h1>
          <p className="mt-1 text-sm text-gray-600">
            Your customer database. Track subscribers, buyers, and engagement.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-600">Total Readers</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {stats.total}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-600">Customers</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {stats.customers}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-600">Subscribers</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {stats.subscribers}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-600">New This Month</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {stats.newThisMonth}
          </p>
        </div>
      </div>

      {/* Table with filters */}
      <div className="mt-8">
        <ReadersTable
          readers={readers}
          total={total}
          page={page}
          totalPages={Math.ceil(total / limit)}
          books={books}
          currentFilters={{
            status: status || "",
            source: source || "",
            search: search || "",
          }}
        />
      </div>
    </div>
  );
}

async function getReaderStats(authorId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [total, customers, subscribers, newThisMonth] = await Promise.all([
    db.reader.count({ where: { authorId } }),
    db.reader.count({ where: { authorId, status: "CUSTOMER" } }),
    db.reader.count({ where: { authorId, status: "SUBSCRIBER" } }),
    db.reader.count({
      where: { authorId, createdAt: { gte: startOfMonth } },
    }),
  ]);

  return { total, customers, subscribers, newThisMonth };
}
