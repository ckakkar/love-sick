"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as Avatar from "@radix-ui/react-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const SEX_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

type ProfileForm = {
  username: string;
  full_name: string;
  age: string;
  sex: string;
  notify_partner_request: boolean;
  notify_partner_online: boolean;
};

export default function SettingsPage() {
  const router = useRouter();
  const [form, setForm] = useState<ProfileForm>({
    username: "",
    full_name: "",
    age: "",
    sex: "",
    notify_partner_request: true,
    notify_partner_online: true,
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setForm((f) => ({
            ...f,
            username: d.username ?? "",
            full_name: d.full_name ?? "",
            age: d.age != null ? String(d.age) : "",
            sex: d.sex ?? "",
            notify_partner_request: d.notify_partner_request !== false,
            notify_partner_online: d.notify_partner_online !== false,
          }));
          if (d.avatar_url) setAvatarUrl(d.avatar_url);
        }
      })
      .catch(() => {});
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
    setError(null);
    const fd = new FormData();
    fd.set("avatar", file);
    const res = await fetch("/api/profile/avatar", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    setAvatarLoading(false);
    if (res.ok && data.avatar_url) {
      setAvatarUrl(data.avatar_url);
      router.refresh();
    } else {
      setError(data.error || "Failed to upload photo.");
    }
    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const ageNum = form.age ? parseInt(form.age, 10) : undefined;
    if (form.username.trim().length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (!form.full_name.trim()) {
      setError("Name is required.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: form.username.trim(),
        full_name: form.full_name.trim(),
        age: ageNum ?? null,
        sex: form.sex || null,
        notify_partner_request: form.notify_partner_request,
        notify_partner_online: form.notify_partner_online,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok) {
      setSuccess(true);
      router.refresh();
    } else {
      setError(data.error || "Something went wrong.");
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">Manage your profile and preferences. Only you and your partner can see your linked profile.</p>

      <div className="mt-8 space-y-8">
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle>Profile photo</CardTitle>
            <CardDescription>Your display picture — visible to your partner when linked.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <Avatar.Root className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-muted">
              <Avatar.Image src={avatarUrl ?? undefined} alt="" className="h-full w-full object-cover" />
              <Avatar.Fallback className="flex h-full w-full items-center justify-center bg-violet-500/20 text-2xl font-medium text-violet-300">
                {(form.full_name || form.username || "?").charAt(0).toUpperCase()}
              </Avatar.Fallback>
            </Avatar.Root>
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarLoading}
              >
                {avatarLoading ? "Uploading…" : "Change photo"}
              </Button>
              <p className="text-xs text-muted-foreground">JPEG, PNG, GIF or WebP. Max 2MB.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your name and username — your partner finds you by username.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="mb-1 block text-sm font-medium text-foreground">Username</label>
                <input
                  id="username"
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value.replace(/\s/g, "") }))}
                  placeholder="e.g. alex_loves"
                  minLength={3}
                  maxLength={30}
                  className={cn(
                    "w-full rounded-2xl border border-border bg-background/80 px-4 py-3 text-foreground placeholder:text-muted-foreground",
                    "focus:border-violet-400/40 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                  )}
                />
              </div>
              <div>
                <label htmlFor="full_name" className="mb-1 block text-sm font-medium text-foreground">Full name</label>
                <input
                  id="full_name"
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  placeholder="How should we call you?"
                  className={cn(
                    "w-full rounded-2xl border border-border bg-background/80 px-4 py-3 text-foreground placeholder:text-muted-foreground",
                    "focus:border-violet-400/40 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                  )}
                />
              </div>
              <div>
                <label htmlFor="age" className="mb-1 block text-sm font-medium text-foreground">Age</label>
                <input
                  id="age"
                  type="number"
                  min={1}
                  max={120}
                  value={form.age}
                  onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
                  placeholder="Optional"
                  className={cn(
                    "w-full rounded-2xl border border-border bg-background/80 px-4 py-3 text-foreground placeholder:text-muted-foreground",
                    "focus:border-violet-400/40 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                  )}
                />
              </div>
              <div>
                <label htmlFor="sex" className="mb-1 block text-sm font-medium text-foreground">Sex</label>
                <select
                  id="sex"
                  value={form.sex}
                  onChange={(e) => setForm((f) => ({ ...f, sex: e.target.value }))}
                  className={cn(
                    "w-full rounded-2xl border border-border bg-background/80 px-4 py-3 text-foreground",
                    "focus:border-violet-400/40 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                  )}
                >
                  <option value="">Optional</option>
                  {SEX_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              {success && <p className="text-sm text-green-500">Profile saved.</p>}
              <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Save profile"}</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Choose when you want to be notified. Only you and your partner are linked — no one else sees your data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border/80 bg-muted/30 px-4 py-3">
              <span className="text-sm font-medium text-foreground">Partner invite requests</span>
              <input
                type="checkbox"
                checked={form.notify_partner_request}
                onChange={(e) => setForm((f) => ({ ...f, notify_partner_request: e.target.checked }))}
                className="h-4 w-4 rounded border-border accent-violet-500"
              />
            </label>
            <p className="text-xs text-muted-foreground">When someone sends you a partner invite (friend request).</p>
            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border/80 bg-muted/30 px-4 py-3">
              <span className="text-sm font-medium text-foreground">Partner is online</span>
              <input
                type="checkbox"
                checked={form.notify_partner_online}
                onChange={(e) => setForm((f) => ({ ...f, notify_partner_online: e.target.checked }))}
                className="h-4 w-4 rounded border-border accent-violet-500"
              />
            </label>
            <p className="text-xs text-muted-foreground">When your partner comes online (Heartbeat Sync).</p>
            <p className="text-xs text-muted-foreground">Save your profile above to apply notification changes, or use the button below.</p>
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                setLoading(true);
                setError(null);
                const res = await fetch("/api/profile", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    notify_partner_request: form.notify_partner_request,
                    notify_partner_online: form.notify_partner_online,
                  }),
                });
                setLoading(false);
                if (res.ok) {
                  setSuccess(true);
                  router.refresh();
                }
              }}
              disabled={loading}
            >
              Save notification preferences
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
