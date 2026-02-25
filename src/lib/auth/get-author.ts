import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export async function getAuthor() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const author = await db.author.findUnique({
    where: { userId: session.user.id },
  });

  if (!author) {
    redirect("/login");
  }

  return author;
}

export async function getSession() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session;
}
