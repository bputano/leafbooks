import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

// Custom adapter overrides to work with UserEmail model (User has no email field)
const prismaAdapter = PrismaAdapter(db);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: {
    ...prismaAdapter,
    getUserByEmail: async (email: string) => {
      const userEmail = await db.userEmail.findUnique({
        where: { email },
        include: { user: true },
      });
      if (!userEmail?.user) return null;
      // Return user with email attached (NextAuth expects email on the user object)
      return {
        ...userEmail.user,
        email: userEmail.email,
        emailVerified: userEmail.verified ? new Date() : null,
      };
    },
    createUser: async (data: { email?: string | null; emailVerified?: Date | null; name?: string | null; image?: string | null }) => {
      const user = await db.user.create({
        data: {
          name: data.name,
          image: data.image,
          ...(data.email
            ? {
                emails: {
                  create: {
                    email: data.email,
                    isPrimary: true,
                    verified: !!data.emailVerified,
                  },
                },
              }
            : {}),
        },
      });
      return {
        ...user,
        email: data.email ?? "",
        emailVerified: data.emailVerified ?? null,
      };
    },
  },
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    newUser: "/titles",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;

        const userEmail = await db.userEmail.findUnique({
          where: { email },
          include: { user: true },
        });

        if (!userEmail?.user?.password) return null;

        const isValid = await bcrypt.compare(password, userEmail.user.password);
        if (!isValid) return null;

        return {
          id: userEmail.user.id,
          name: userEmail.user.name,
          email: userEmail.email,
          image: userEmail.user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      // On OAuth sign-in, create Author profile if needed
      if (account && account.provider !== "credentials" && user?.id) {
        const author = await db.author.findUnique({
          where: { userId: user.id as string },
        });
        if (!author) {
          const name = user.name || user.email?.split("@")[0] || "author";
          const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
          let finalSlug = slug || "author";
          let counter = 1;
          while (await db.author.findUnique({ where: { slug: finalSlug } })) {
            finalSlug = `${slug}-${counter++}`;
          }
          await db.author.create({
            data: {
              userId: user.id as string,
              displayName: user.name || name,
              slug: finalSlug,
            },
          });
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
