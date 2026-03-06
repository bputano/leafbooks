"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ProfileActionsProps {
  name: string;
}

export function ProfileActions({ name: initialName }: ProfileActionsProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function saveName() {
    setSaving(true);
    try {
      await fetch("/api/reader/auth/session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/reader/auth/logout", { method: "POST" });
    router.push("/library/login");
  }

  return (
    <>
      {/* Name */}
      <div>
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
        />
        <div className="mt-2 flex items-center gap-2">
          <Button size="sm" onClick={saveName} loading={saving}>
            {saved ? "Saved" : "Save"}
          </Button>
        </div>
      </div>

      {/* Logout */}
      <div className="pt-4 border-t border-ink/[0.06]">
        <Button variant="ghost" onClick={handleLogout}>
          Sign out
        </Button>
      </div>
    </>
  );
}
