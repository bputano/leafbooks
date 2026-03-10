import { getAuthor } from "@/lib/auth/get-author";
import { db } from "@/lib/db";
import { DashboardClient } from "@/components/dashboard/dashboard/dashboard-client";

export const metadata = {
  title: "Dashboard — Canopy",
};

export default async function DashboardPage() {
  const author = await getAuthor();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const paidStatuses: ("PAID" | "FULFILLED")[] = ["PAID", "FULFILLED"];
  const orderWhere = { book: { authorId: author.id }, status: { in: paidStatuses } };

  // Build 6-month boundaries for email growth chart
  const emailMonths: { label: string; start: Date; end: Date }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    emailMonths.push({
      label: d.toLocaleDateString("en-US", { month: "short" }),
      start: d,
      end,
    });
  }

  // Run all queries in parallel
  const [
    revenueThisMonth,
    revenueLastMonth,
    recentOrders,
    topBooksRaw,
    totalEmailSubs,
    totalReaders,
    newReadersThisMonth,
    publishedBooks,
    topReferrersRaw,
    customerCount,
    emailMonth0,
    emailMonth1,
    emailMonth2,
    emailMonth3,
    emailMonth4,
    emailMonth5,
  ] = await Promise.all([
    db.order.aggregate({
      where: { ...orderWhere, createdAt: { gte: startOfMonth } },
      _sum: { amount: true, platformFee: true },
    }),
    db.order.aggregate({
      where: { ...orderWhere, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
      _sum: { amount: true, platformFee: true },
    }),
    db.order.findMany({
      where: orderWhere,
      include: {
        book: { select: { title: true, coverImageUrl: true } },
        bookFormat: { select: { type: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    db.order.groupBy({
      by: ["bookId"],
      where: orderWhere,
      _count: { id: true },
      _sum: { amount: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
    db.emailSubscriber.count({ where: { authorId: author.id } }),
    db.reader.count({ where: { authorId: author.id } }),
    db.reader.count({ where: { authorId: author.id, createdAt: { gte: startOfMonth } } }),
    db.book.count({ where: { authorId: author.id, status: "PUBLISHED" } }),
    db.referral.groupBy({
      by: ["referrerEmail"],
      where: { authorId: author.id, status: "CONVERTED" },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
    db.reader.count({ where: { authorId: author.id, status: "CUSTOMER" } }),
    db.emailSubscriber.count({ where: { authorId: author.id, createdAt: { gte: emailMonths[0].start, lte: emailMonths[0].end } } }),
    db.emailSubscriber.count({ where: { authorId: author.id, createdAt: { gte: emailMonths[1].start, lte: emailMonths[1].end } } }),
    db.emailSubscriber.count({ where: { authorId: author.id, createdAt: { gte: emailMonths[2].start, lte: emailMonths[2].end } } }),
    db.emailSubscriber.count({ where: { authorId: author.id, createdAt: { gte: emailMonths[3].start, lte: emailMonths[3].end } } }),
    db.emailSubscriber.count({ where: { authorId: author.id, createdAt: { gte: emailMonths[4].start, lte: emailMonths[4].end } } }),
    db.emailSubscriber.count({ where: { authorId: author.id, createdAt: { gte: emailMonths[5].start, lte: emailMonths[5].end } } }),
  ]);

  const emailCountsArr = [emailMonth0, emailMonth1, emailMonth2, emailMonth3, emailMonth4, emailMonth5];

  // Fetch book details for top books
  const topBookIds = topBooksRaw.map((b) => b.bookId);
  const topBookDetails = topBookIds.length > 0
    ? await db.book.findMany({
        where: { id: { in: topBookIds } },
        select: { id: true, title: true, coverImageUrl: true },
      })
    : [];

  const topBooks = topBooksRaw.map((b) => {
    const book = topBookDetails.find((d) => d.id === b.bookId);
    return {
      bookId: b.bookId,
      title: book?.title ?? "Unknown",
      coverImageUrl: book?.coverImageUrl ?? null,
      orders: b._count?.id ?? 0,
      revenue: b._sum?.amount ?? 0,
    };
  });

  // Calculate revenue
  const thisMonthRevenue = (revenueThisMonth._sum?.amount ?? 0) - (revenueThisMonth._sum?.platformFee ?? 0);
  const lastMonthRevenue = (revenueLastMonth._sum?.amount ?? 0) - (revenueLastMonth._sum?.platformFee ?? 0);

  // Email growth data
  const emailGrowth = emailMonths.map((m, i) => ({
    month: m.label,
    subscribers: emailCountsArr[i],
  }));

  // Top referrers — get click counts too
  const topReferrers = await Promise.all(
    topReferrersRaw.map(async (r) => {
      const clicks = await db.referral.aggregate({
        where: { authorId: author.id, referrerEmail: r.referrerEmail },
        _sum: { clickCount: true },
      });
      return {
        email: r.referrerEmail,
        conversions: r._count?.id ?? 0,
        clicks: clicks._sum?.clickCount ?? 0,
      };
    })
  );

  // Conversion rate: customers / total readers
  const conversionRate = totalReaders > 0 ? Math.round((customerCount / totalReaders) * 100) : 0;

  // Format recent orders for client
  const formattedOrders = recentOrders.map((o) => ({
    id: o.id,
    bookTitle: o.book.title,
    coverImageUrl: o.book.coverImageUrl,
    format: o.bookFormat?.type ?? o.format,
    buyerName: o.buyerName,
    buyerEmail: o.buyerEmail,
    amount: o.amount,
    platformFee: o.platformFee,
    status: o.status,
    createdAt: o.createdAt.toISOString(),
  }));

  const isEmpty = recentOrders.length === 0 && totalEmailSubs === 0 && publishedBooks === 0;

  return (
    <DashboardClient
      authorName={author.displayName}
      isEmpty={isEmpty}
      revenue={{
        thisMonth: thisMonthRevenue,
        lastMonth: lastMonthRevenue,
      }}
      stats={{
        totalReaders,
        newReadersThisMonth,
        publishedBooks,
        totalEmailSubs,
        conversionRate,
      }}
      emailGrowth={emailGrowth}
      recentOrders={formattedOrders}
      topBooks={topBooks}
      topReferrers={topReferrers}
    />
  );
}
