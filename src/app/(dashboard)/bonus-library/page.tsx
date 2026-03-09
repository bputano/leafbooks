import { getAuthor } from "@/lib/auth/get-author";
import { db } from "@/lib/db";
import { BonusLibraryClient } from "@/components/dashboard/bonus-library/bonus-library-client";

export const metadata = {
  title: "Bonus Library — Canopy",
};

export default async function BonusLibraryPage() {
  const author = await getAuthor();

  const materials = await db.bonusMaterial.findMany({
    where: { authorId: author.id },
    orderBy: { order: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bonus Library</h1>
          <p className="mt-1 text-sm text-gray-600">
            Upload bonus resources to bundle with your books — PDFs, videos,
            courses, templates, and more.
          </p>
        </div>
      </div>
      <div className="mt-8">
        <BonusLibraryClient initialMaterials={materials} />
      </div>
    </div>
  );
}
