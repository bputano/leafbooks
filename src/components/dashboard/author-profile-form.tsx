"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateAuthorProfile } from "@/app/(dashboard)/settings/actions";

interface AuthorProfileFormProps {
  author: {
    displayName: string;
    slug: string;
    bio: string | null;
    avatarUrl: string | null;
  };
}

export function AuthorProfileForm({ author }: AuthorProfileFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [slug, setSlug] = useState(author.slug);
  const [displayName, setDisplayName] = useState(author.displayName);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      const result = await updateAuthorProfile(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
          Profile updated successfully.
        </div>
      )}

      <Input
        name="displayName"
        label="Display name"
        value={displayName}
        onChange={(e) => {
          setDisplayName(e.target.value);
          // Auto-generate slug if user hasn't customized it
          if (slug === generateSlug(displayName)) {
            setSlug(generateSlug(e.target.value));
          }
        }}
        placeholder="Your author name"
        required
      />

      <div className="space-y-1">
        <Input
          name="slug"
          label="URL slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="your-name"
          required
        />
        <p className="text-xs text-gray-500">
          Your storefront will be at{" "}
          <span className="font-mono">leafbooks.com/{slug || "..."}</span>
        </p>
      </div>

      <Textarea
        name="bio"
        label="Bio"
        defaultValue={author.bio || ""}
        placeholder="Tell readers about yourself..."
        rows={4}
      />

      <Button type="submit" loading={loading}>
        Save changes
      </Button>
    </form>
  );
}
