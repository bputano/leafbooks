"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signIn } from "@/lib/auth";
import { z } from "zod";
import { isRedirectError } from "next/dist/client/components/redirect-error";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function register(formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { name, email, password } = parsed.data;

  // Check if email already exists
  const existingEmail = await db.userEmail.findUnique({
    where: { email },
  });

  if (existingEmail) {
    return { error: "An account with this email already exists" };
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  // Create User + UserEmail + Author in nested create (implicit transaction)
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  let finalSlug = slug || "author";
  let counter = 1;
  while (await db.author.findUnique({ where: { slug: finalSlug } })) {
    finalSlug = `${slug}-${counter++}`;
  }

  await db.user.create({
    data: {
      name,
      password: hashedPassword,
      emails: {
        create: {
          email,
          isPrimary: true,
          verified: false,
        },
      },
      author: {
        create: {
          displayName: name,
          slug: finalSlug,
        },
      },
    },
  });

  // Sign in after registration
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/titles",
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: "Account created but sign-in failed. Please log in manually." };
  }
}

export async function loginWithCredentials(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/titles",
    });
  } catch (error: unknown) {
    if (isRedirectError(error)) throw error;
    return { error: "Invalid email or password" };
  }
}

export async function loginWithGoogle(_formData: FormData) {
  await signIn("google", { redirectTo: "/titles" });
}
