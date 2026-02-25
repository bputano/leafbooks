"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getAuthor } from "@/lib/auth/get-author";
import { revalidatePath } from "next/cache";

const updateProfileSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  slug: z
    .string()
    .min(1, "URL slug is required")
    .regex(
      /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
      "Slug must be lowercase alphanumeric with hyphens, no leading/trailing hyphens"
    ),
  bio: z.string().optional(),
});

export async function updateAuthorProfile(formData: FormData) {
  const author = await getAuthor();

  const parsed = updateProfileSchema.safeParse({
    displayName: formData.get("displayName"),
    slug: formData.get("slug"),
    bio: formData.get("bio"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { displayName, slug, bio } = parsed.data;

  // Check slug uniqueness (exclude current author)
  if (slug !== author.slug) {
    const existing = await db.author.findUnique({ where: { slug } });
    if (existing) {
      return { error: "This URL slug is already taken" };
    }
  }

  await db.author.update({
    where: { id: author.id },
    data: { displayName, slug, bio: bio || null },
  });

  revalidatePath("/settings");
  return { success: true };
}
