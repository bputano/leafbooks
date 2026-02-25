import { redirect } from "next/navigation";
import { getAuthor } from "@/lib/auth/get-author";
import { db } from "@/lib/db";

export const metadata = {
  title: "New Title — LeafBooks",
};

export default async function NewTitlePage() {
  const author = await getAuthor();

  // Create a new draft book and redirect to the wizard
  // Uses a unique slug based on timestamp to avoid conflicts
  const book = await db.book.create({
    data: {
      authorId: author.id,
      title: "Untitled",
      slug: `untitled-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      wizardStep: 1,
    },
  });

  redirect(`/titles/${book.id}/edit?step=2`);
}
