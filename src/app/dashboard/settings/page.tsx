"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import * as Avatar from "@radix-ui/react-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { SexSelector } from "@/components/ui/sex-selector";
import { cn } from "@/lib/utils";
import { User, UserCircle, Calendar } from "lucide-react";

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
  const [profileLoading, setProfileLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProfileLoading(true);
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
      .catch(() => {})
      .finally(() => setProfileLoading(false));
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

  const inputClass = cn(
    "w-full rounded-2xl border-2 border-border/60 bg-muted/30 px-4 py-3.5 text-foreground placeholder:text-muted-foreground transition-all duration-200",
    "focus:border-violet-400/60 focus:outline-none focus:ring-2 focus:ring-violet-400/20 focus:bg-background/80 hover:border-violet-400/30 hover:bg-muted/40"
  );

  if (profileLoading) {
    return (
      <div className="relative mx-auto max-w-2xl px-3 py-6 sm:px-4 sm:py-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32 rounded-lg" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <div className="mt-10 space-y-8">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-56 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="relative mx-auto max-w-2xl px-3 py-6 sm:px-4 sm:py-8"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-violet-500/5 to-transparent" />
      <div className="relative">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Manage your profile and preferences. Only you and your partner can see your linked profile.</p>

      <div className="mt-10 space-y-8">
        <Card className="card-hover border-border/60 bg-card/80 shadow-lg shadow-violet-500/5">
          <CardHeader>
            <CardTitle className="font-serif">Profile photo</CardTitle>
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
                {avatarLoading ? (
                  <>
                    <LoadingSpinner className="h-3.5 w-3.5 border-2" />
                    Uploading…
                  </>
                ) : (
                  "Change photo"
                )}
              </Button>
              <p className="text-xs text-muted-foreground">JPEG, PNG, GIF or WebP. Max 2MB.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover border-border/60 bg-card/80 shadow-lg shadow-violet-500/5">
          <CardHeader>
            <CardTitle className="font-serif">Profile</CardTitle>
            <CardDescription>Your name and username — your partner finds you by username.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-violet-400" />
                  <label htmlFor="username" className="text-sm font-medium text-foreground">Username</label>
                </div>
                <input
                  id="username"
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value.replace(/\s/g, "") }))}
                  placeholder="e.g. alex_loves"
                  minLength={3}
                  maxLength={30}
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <UserCircle className="h-4 w-4 text-violet-400" />
                  <label htmlFor="full_name" className="text-sm font-medium text-foreground">Full name</label>
                </div>
                <input
                  id="full_name"
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  placeholder="How should we call you?"
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-violet-400" />
                  <label htmlFor="age" className="text-sm font-medium text-foreground">Age</label>
                </div>
                <input
                  id="age"
                  type="number"
                  min={1}
                  max={120}
                  value={form.age}
                  onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
                  placeholder="Optional"
                  className={inputClass}
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-violet-400" />
                  <label htmlFor="sex" className="text-sm font-medium text-foreground">Sex</label>
                  <span className="text-xs text-muted-foreground">(Optional)</span>
                </div>
                <SexSelector value={form.sex} onChange={(v) => setForm((f) => ({ ...f, sex: v }))} />
              </div>
              {error && <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
              {success && <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">Profile saved.</p>}
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <LoadingSpinner className="h-3.5 w-3.5 border-2" />
                    Saving…
                  </>
                ) : (
                  "Save profile"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="card-hover border-border/60 bg-card/80 shadow-lg shadow-violet-500/5">
          <CardHeader>
            <CardTitle className="font-serif">Notifications</CardTitle>
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
              {loading ? (
                <>
                  <LoadingSpinner className="h-3.5 w-3.5 border-2" />
                  Saving…
                </>
              ) : (
                "Save notification preferences"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
      </div>
    </motion.div>
  );
}
