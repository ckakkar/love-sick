"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import * as Avatar from "@radix-ui/react-avatar";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { SexSelector } from "@/components/ui/sex-selector";
import { cn } from "@/lib/utils";
import { User, UserCircle, Calendar, Unlink, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const UNLINK_MIN_WORDS = 50;

function wordCount(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((s) => s.length > 0).length;
}

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

  const [hasPartner, setHasPartner] = useState(false);
  const [unlinkModalOpen, setUnlinkModalOpen] = useState(false);
  const [unlinkReason, setUnlinkReason] = useState("");
  const [unlinkLoading, setUnlinkLoading] = useState(false);
  const [unlinkError, setUnlinkError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteUnderstand, setDeleteUnderstand] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<{ id: string; type: string; payload: { reason?: string }; read_at: string | null; created_at: string }[]>([]);

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

  useEffect(() => {
    fetch("/api/couple")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.hasPartner !== undefined) setHasPartner(d.hasPartner);
      })
      .catch(() => {});
    fetch("/api/notifications")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.notifications) setNotifications(d.notifications);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = window.location.hash?.slice(1);
    if (id !== "notifications") return;
    const t = setTimeout(() => {
      document.getElementById("notifications")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
    return () => clearTimeout(t);
  }, [notifications.length]);

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

  const unlinkWords = wordCount(unlinkReason);
  const unlinkValid = unlinkWords >= UNLINK_MIN_WORDS;

  const handleUnlinkSubmit = async () => {
    if (!unlinkValid || unlinkLoading) return;
    setUnlinkLoading(true);
    setUnlinkError(null);
    const res = await fetch("/api/partner-unlink", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: unlinkReason.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    setUnlinkLoading(false);
    if (res.ok) {
      setUnlinkModalOpen(false);
      setUnlinkReason("");
      setHasPartner(false);
      router.push("/dashboard");
      router.refresh();
    } else {
      setUnlinkError(data.error || "Something went wrong.");
    }
  };

  const handleDeleteSubmit = async () => {
    if (deleteConfirm.trim().toUpperCase() !== "DELETE" || !deleteUnderstand || deleteLoading) return;
    setDeleteLoading(true);
    setDeleteError(null);
    const res = await fetch("/api/account/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: deleteConfirm.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    setDeleteLoading(false);
    if (res.ok) {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } else {
      setDeleteError(data.error || "Something went wrong.");
    }
  };

  const markNotificationRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
  };

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

        {notifications.length > 0 && (
          <Card id="notifications" className="card-hover border-amber-500/20 bg-amber-500/5 scroll-mt-24">
            <CardHeader>
              <CardTitle className="font-serif">Relationship messages</CardTitle>
              <CardDescription>Messages from your partner or about your link.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "rounded-xl border p-4",
                    n.type === "partner_left_app"
                      ? "border-amber-500/30 bg-amber-500/10"
                      : "border-violet-500/20 bg-violet-500/5"
                  )}
                >
                  {n.type === "partner_left_app" ? (
                    <>
                      <p className="font-medium text-foreground">Your partner is no longer on the app</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        They have deleted their account. You are no longer linked.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-foreground">Message from your former partner</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                        {n.payload?.reason ?? ""}
                      </p>
                    </>
                  )}
                  {!n.read_at && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-muted-foreground"
                      onClick={() => markNotificationRead(n.id)}
                    >
                      Mark as read
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {hasPartner && (
          <Card className="card-hover border-border/60 bg-card/80 shadow-lg shadow-violet-500/5">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <Unlink className="h-5 w-5 text-violet-400" />
                Relationship
              </CardTitle>
              <CardDescription>
                Unlinking will send a message to your partner with your reason. They will see it in Settings. You can connect again later by sending a new invite.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="border-amber-500/40 text-amber-200 hover:bg-amber-500/10"
                onClick={() => {
                  setUnlinkModalOpen(true);
                  setUnlinkError(null);
                  setUnlinkReason("");
                }}
              >
                Unlink from partner
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="card-hover border-red-500/20 bg-red-500/5">
          <CardHeader>
            <CardTitle className="font-serif flex items-center gap-2 text-red-200">
              <Trash2 className="h-5 w-5" />
              Danger zone
            </CardTitle>
            <CardDescription>
              Delete your account permanently. All your data (profile, assessment, prologue) will be removed. If you are linked to a partner, they will be unlinked and notified that you are no longer on the app.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="border-red-500/40 text-red-200 hover:bg-red-500/10"
              onClick={() => {
                setDeleteModalOpen(true);
                setDeleteError(null);
                setDeleteConfirm("");
                setDeleteUnderstand(false);
              }}
            >
              Delete my account
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog.Root open={unlinkModalOpen} onOpenChange={setUnlinkModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-[100] w-full max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-2xl border border-border/60 border-violet-500/20 bg-card p-6 shadow-2xl shadow-violet-500/10">
            <Dialog.Title className="font-serif text-xl font-semibold tracking-tight text-foreground">
              Unlink from partner
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-muted-foreground">
              Write at least {UNLINK_MIN_WORDS} words explaining why you are unlinking. This will be sent to your partner so they can read it in Settings.
            </Dialog.Description>
            <textarea
              value={unlinkReason}
              onChange={(e) => setUnlinkReason(e.target.value)}
              placeholder="Share what you feel they should know..."
              className="mt-4 min-h-[160px] w-full resize-none rounded-2xl border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-violet-400/40 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
              maxLength={2000}
              rows={6}
            />
            <div className="mt-2 flex items-center justify-between">
              <span className={cn("text-xs tabular-nums", unlinkValid ? "text-emerald-400" : "text-muted-foreground")}>
                {unlinkWords} / {UNLINK_MIN_WORDS} words
              </span>
            </div>
            {unlinkError && <p className="mt-2 text-sm text-red-400">{unlinkError}</p>}
            <div className="mt-6 flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setUnlinkModalOpen(false)} disabled={unlinkLoading}>
                Cancel
              </Button>
              <Button onClick={handleUnlinkSubmit} disabled={!unlinkValid || unlinkLoading}>
                {unlinkLoading ? (
                  <>
                    <LoadingSpinner className="h-3.5 w-3.5 border-2" />
                    Sending…
                  </>
                ) : (
                  "Send and unlink"
                )}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-[100] w-full max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-2xl border border-border/60 border-red-500/20 bg-card p-6 shadow-2xl shadow-red-500/10">
            <Dialog.Title className="font-serif text-xl font-semibold tracking-tight text-red-200">
              Delete account
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-muted-foreground">
              This will permanently delete your account and all your data. If you are linked, your partner will be unlinked and notified that you are no longer on the app. This cannot be undone.
            </Dialog.Description>
            <label className="mt-4 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={deleteUnderstand}
                onChange={(e) => setDeleteUnderstand(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border accent-red-500"
              />
              <span className="text-sm text-muted-foreground">
                I understand that my data will be permanently deleted and my partner will be notified if I am linked.
              </span>
            </label>
            <p className="mt-3 text-sm text-muted-foreground">Type <strong className="text-foreground">DELETE</strong> to confirm:</p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
              className="mt-1 w-full rounded-2xl border border-input bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-red-400/40 focus:outline-none focus:ring-2 focus:ring-red-400/20"
            />
            {deleteError && <p className="mt-2 text-sm text-red-400">{deleteError}</p>}
            <div className="mt-6 flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={deleteLoading}>
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-500 text-white"
                onClick={handleDeleteSubmit}
                disabled={
                  deleteConfirm.trim().toUpperCase() !== "DELETE" || !deleteUnderstand || deleteLoading
                }
              >
                {deleteLoading ? (
                  <>
                    <LoadingSpinner className="h-3.5 w-3.5 border-2 border-white/50 border-t-white" />
                    Deleting…
                  </>
                ) : (
                  "Delete my account"
                )}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      </div>
    </motion.div>
  );
}
