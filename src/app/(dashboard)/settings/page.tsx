import { getAuthor } from "@/lib/auth/get-author";
import { AuthorProfileForm } from "@/components/dashboard/author-profile-form";

export const metadata = {
  title: "Settings — LeafBooks",
};

export default async function SettingsPage() {
  const author = await getAuthor();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Author Profile</h1>
      <p className="mt-1 text-sm text-gray-600">
        Manage how you appear to readers on your storefront.
      </p>
      <div className="mt-8 max-w-lg">
        <AuthorProfileForm
          author={{
            displayName: author.displayName,
            slug: author.slug,
            bio: author.bio,
            avatarUrl: author.avatarUrl,
          }}
        />
      </div>
    </div>
  );
}
