import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthor } from "@/lib/auth/get-author";
import { db } from "@/lib/db";
import { Eye } from "lucide-react";
import { WizardShell } from "@/components/dashboard/title-wizard/wizard-shell";
import type { Book } from "@/hooks/use-title-wizard";

export const metadata = {
  title: "Edit Title — LeafBooks",
};

export default async function EditTitlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const author = await getAuthor();
  const { id } = await params;

  const book = await db.book.findFirst({
    where: { id, authorId: author.id },
    include: { formats: true, _count: { select: { sections: true } } },
  });

  if (!book) notFound();

  const readerUrl = book.status === "PUBLISHED" && book._count.sections > 0
    ? `/${author.slug}/${book.slug}/read`
    : null;

  // Serialize for client component — strip Date objects and extra fields
  const serializedBook: Book = {
    id: book.id,
    title: book.title,
    subtitle: book.subtitle,
    description: book.description,
    slug: book.slug,
    isbn: book.isbn,
    keywords: book.keywords,
    bisacCodes: book.bisacCodes,
    wizardStep: book.wizardStep,
    manuscriptFileUrl: book.manuscriptFileUrl,
    manuscriptFileType: book.manuscriptFileType,
    coverFileUrl: book.coverFileUrl,
    coverImageUrl: book.coverImageUrl,
    launchDate: book.launchDate?.toISOString() || null,
    preOrderDate: book.preOrderDate?.toISOString() || null,
    isPreOrder: book.isPreOrder,
    status: book.status,
    formats: book.formats.map((f) => ({
      id: f.id,
      type: f.type as "HARDCOVER" | "PAPERBACK" | "EBOOK",
      price: f.price,
      isActive: f.isActive,
      trimSize: f.trimSize,
      paperType: f.paperType,
      bindingType: f.bindingType,
      interiorColor: f.interiorColor,
      printQuality: f.printQuality,
      coverFinish: f.coverFinish,
      pageCount: f.pageCount,
      printingCostCents: f.printingCostCents,
      shippingEstimateCents: f.shippingEstimateCents,
      isbn: f.isbn,
    })),
  };

  return (
    <div>
      {readerUrl && (
        <div className="mb-6 flex items-center justify-between rounded-lg border border-leaf-200 bg-leaf-50 px-4 py-3">
          <span className="text-sm text-leaf-800">
            Leaf Reader is live for this title.
          </span>
          <Link
            href={readerUrl}
            className="flex items-center gap-1.5 rounded-md bg-leaf-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-leaf-700"
          >
            <Eye className="h-4 w-4" />
            Preview Reader
          </Link>
        </div>
      )}
      <WizardShell book={serializedBook} />
    </div>
  );
}
