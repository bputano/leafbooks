import { getAuthor } from "@/lib/auth/get-author";
import { db } from "@/lib/db";

export const metadata = {
  title: "Sales — LeafBooks",
};

export default async function SalesPage() {
  const author = await getAuthor();

  const orders = await db.order.findMany({
    where: {
      book: { authorId: author.id },
      status: { in: ["PAID", "FULFILLED"] },
    },
    include: {
      book: { select: { title: true } },
      bookFormat: { select: { type: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const totalRevenue = orders.reduce((sum, o) => sum + o.amount - o.platformFee, 0);
  const totalOrders = orders.length;

  const subscribers = await db.emailSubscriber.count({
    where: { authorId: author.id },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
      <p className="mt-1 text-sm text-gray-600">
        Track your sales, revenue, and audience growth.
      </p>

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-600">Revenue</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            ${(totalRevenue / 100).toFixed(2)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-600">Orders</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{totalOrders}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-600">Email Subscribers</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{subscribers}</p>
        </div>
      </div>

      {/* Recent orders */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
        {orders.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">
            No orders yet. Once you publish a book and make sales, they&apos;ll
            appear here.
          </p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Book
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Format
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Buyer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                      {order.book.title}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {order.bookFormat?.type || order.format}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {order.buyerEmail}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                      ${(order.amount / 100).toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          order.status === "FULFILLED"
                            ? "bg-green-100 text-green-700"
                            : order.status === "PAID"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {order.status.toLowerCase()}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
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
