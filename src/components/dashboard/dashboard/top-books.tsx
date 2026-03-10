import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface TopBooksProps {
  books: {
    bookId: string;
    title: string;
    coverImageUrl: string | null;
    orders: number;
    revenue: number;
  }[];
}

export function TopBooks({ books }: TopBooksProps) {
  if (books.length === 0) {
    return (
      <div className="rounded-xl border border-[rgba(44,40,37,0.08)] bg-white p-6 shadow-warm-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-base text-ink">Top Books</h2>
          <Link
            href="/titles"
            className="flex items-center gap-1 text-xs font-medium text-leaf-700 hover:text-leaf-800"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <p className="mt-6 text-center text-sm text-ink-muted">
          Publish your first book to see how it performs.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[rgba(44,40,37,0.08)] bg-white p-6 shadow-warm-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-base text-ink">Top Books</h2>
        <Link
          href="/titles"
          className="flex items-center gap-1 text-xs font-medium text-leaf-700 hover:text-leaf-800"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="mt-4 space-y-3">
        {books.map((book, i) => (
          <div key={book.bookId} className="flex items-center gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-paper-warm text-xs font-medium text-ink-muted">
              {i + 1}
            </span>
            {book.coverImageUrl ? (
              <img
                src={book.coverImageUrl}
                alt=""
                className="h-10 w-7 rounded object-cover"
              />
            ) : (
              <div className="flex h-10 w-7 items-center justify-center rounded bg-paper-warm text-xs text-ink-faint">
                B
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{book.title}</p>
              <p className="text-xs text-ink-muted">
                {book.orders} order{book.orders !== 1 ? "s" : ""}
              </p>
            </div>
            <p className="text-sm font-medium text-ink">
              ${(book.revenue / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
