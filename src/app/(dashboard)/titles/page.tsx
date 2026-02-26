import Link from "next/link";
import { getAuthor } from "@/lib/auth/get-author";
import { db } from "@/lib/db";
import { Plus, BookOpen, Edit, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Titles — LeafBooks",
};

export default async function TitlesPage() {
  const author = await getAuthor();
  const books = await db.book.findMany({
    where: { authorId: author.id },
    include: { formats: true, _count: { select: { sections: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Titles</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your books and their formats.
          </p>
        </div>
        <Link href="/titles/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Title
          </Button>
        </Link>
      </div>

      {books.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <BookOpen className="h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No titles yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create your first title to start selling.
          </p>
          <Link href="/titles/new" className="mt-4">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create your first title
            </Button>
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {books.map((book) => (
            <Link
              key={book.id}
              href={`/titles/${book.id}/edit`}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-gray-300"
            >
              <div className="flex items-center gap-4">
                {book.coverImageUrl ? (
                  <div className="h-16 w-11 overflow-hidden rounded bg-gray-100">
                    <img
                      src={book.coverImageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-16 w-11 items-center justify-center rounded bg-gray-100">
                    <BookOpen className="h-5 w-5 text-gray-400" />
                  </div>
                )}
                <div>
                  <h3 className="font-medium text-gray-900">{book.title}</h3>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 font-medium ${
                        book.status === "PUBLISHED"
                          ? "bg-green-100 text-green-700"
                          : book.status === "ARCHIVED"
                            ? "bg-gray-100 text-gray-600"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {book.status.toLowerCase()}
                    </span>
                    <span>
                      {book.formats.length} format{book.formats.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {book.status === "PUBLISHED" && book._count.sections > 0 && (
                  <Link
                    href={`/${author.slug}/${book.slug}/read`}
                    className="relative z-10 flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-leaf-300 hover:bg-leaf-50 hover:text-leaf-700"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview Reader
                  </Link>
                )}
                <Edit className="h-4 w-4 text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
