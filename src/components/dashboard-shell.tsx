"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import * as Avatar from "@radix-ui/react-avatar";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Dialog from "@radix-ui/react-dialog";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeNotifications } from "@/hooks/use-realtime-notifications";
import { Settings, LayoutDashboard, LogOut, Bell, Home, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PartnerNotification = {
  id: string;
  type: "unlink_reason" | "partner_left_app";
  payload: { reason?: string };
  read_at: string | null;
};

export type DashboardProfile = {
  id: string;
  username: string | null;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  notify_partner_request?: boolean;
  notify_partner_online?: boolean;
};

export function DashboardShell({
  profile,
  children,
}: {
  profile: DashboardProfile;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const displayName = profile.full_name || profile.display_name || profile.username || "there";
  const [notifications, setNotifications] = useState<PartnerNotification[]>([]);
  const unreadCount = notifications.filter((n) => !n.read_at).length;
  const unlinkNotification = notifications.find(
    (n) => !n.read_at && (n.type === "unlink_reason" || n.type === "partner_left_app")
  ) ?? null;

  const refetchNotifications = useCallback(() => {
    fetch("/api/notifications")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const list = (d?.notifications ?? []) as PartnerNotification[];
        setNotifications(list);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refetchNotifications();
  }, [refetchNotifications]);

  useRealtimeNotifications(refetchNotifications);

  async function handleCloseUnlinkModal() {
    if (!unlinkNotification) return;
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: unlinkNotification.id }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === unlinkNotification.id ? { ...n, read_at: new Date().toISOString() } : n))
    );
    router.refresh();
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const isDashboard = pathname === "/dashboard";
  const isSettings = pathname?.startsWith("/dashboard/settings");
  const notificationsHref = "/dashboard/settings#notifications";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-30 shrink-0 border-b border-border/60 bg-background/95 backdrop-blur-xl supports-backdrop-filter:bg-background/80">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-3 sm:px-6">
          <Link href="/dashboard" className="font-serif text-lg font-semibold tracking-tight text-foreground">
            Love Sick
          </Link>

          <div className="flex items-center gap-1 sm:gap-3">
            <Link
              href={notificationsHref}
              className="relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              aria-label={unreadCount ? `${unreadCount} unread notifications` : "Notifications"}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-violet-500 px-1 text-[10px] font-semibold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  type="button"
                  className="flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-full py-2 pl-1 pr-2 outline-none ring-violet-400 focus:ring-2 sm:pr-3"
                  aria-label="Open menu"
                >
                  <Avatar.Root className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-muted ring-2 ring-transparent transition hover:border-violet-400/40">
                    <Avatar.Image
                      src={profile.avatar_url ?? undefined}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <Avatar.Fallback className="flex h-full w-full items-center justify-center bg-violet-500/20 text-sm font-medium text-violet-300">
                      {(displayName === "there" ? "?" : displayName).charAt(0).toUpperCase()}
                    </Avatar.Fallback>
                  </Avatar.Root>
                  <span className="hidden max-w-[120px] truncate text-left text-sm font-medium text-foreground sm:block sm:max-w-[180px]">
                    Hi, {displayName}
                  </span>
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={8}
                  className="z-[100] min-w-[200px] rounded-xl border border-border/80 bg-card/95 p-1 shadow-xl shadow-violet-500/5 backdrop-blur-xl"
                >
                  <div className="border-b border-border/80 px-3 py-2">
                    <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
                    {profile.username && (
                      <p className="text-xs text-muted-foreground">@{profile.username}</p>
                    )}
                  </div>
                  <DropdownMenu.Item asChild>
                    <Link href="/dashboard" className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none hover:bg-muted">
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item asChild>
                    <Link href="/dashboard/settings" className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none hover:bg-muted">
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className="my-1 h-px bg-border" />
                  <DropdownMenu.Item
                    onSelect={handleSignOut}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 outline-none hover:bg-muted hover:text-red-300"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>
      </header>
      <main className="min-h-0 flex-1 pb-20 md:pb-0">{children}</main>

      {/* Bottom nav — mobile only, app-style */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-border/60 bg-background/95 backdrop-blur-xl safe-area-bottom md:hidden"
        aria-label="Main navigation"
      >
        <div className="mx-auto flex h-14 max-w-lg items-center justify-around">
          <Link
            href="/dashboard"
            className={cn(
              "flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-lg px-4 transition-colors",
              isDashboard ? "text-violet-400" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Home className="h-5 w-5" />
            <span className="text-[10px] font-medium">Home</span>
          </Link>
          <Link
            href={notificationsHref}
            className="relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-lg px-4 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Bell className="h-5 w-5" />
            <span className="text-[10px] font-medium">Alerts</span>
            {unreadCount > 0 && (
              <span className="absolute right-2 top-1.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-violet-500 px-1 text-[9px] font-semibold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
          <Link
            href="/dashboard/settings"
            className={cn(
              "flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-lg px-4 transition-colors",
              isSettings ? "text-violet-400" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <User className="h-5 w-5" />
            <span className="text-[10px] font-medium">Profile</span>
          </Link>
        </div>
      </nav>

      <Dialog.Root open={!!unlinkNotification} onOpenChange={(open) => !open && handleCloseUnlinkModal()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-[100] w-full max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-2xl border border-border/60 bg-card p-6 shadow-2xl shadow-violet-500/10">
            <Dialog.Title className="font-serif text-xl font-semibold tracking-tight text-foreground">
              {unlinkNotification?.type === "partner_left_app"
                ? "Your partner left the app"
                : "You've been unlinked"}
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-muted-foreground">
              {unlinkNotification?.type === "partner_left_app" ? (
                "They have deleted their account. You are no longer linked."
              ) : (
                <>
                  Your former partner has ended the link. They left you this note:
                </>
              )}
            </Dialog.Description>
            {unlinkNotification?.type === "unlink_reason" && unlinkNotification.payload?.reason && (
              <div className="mt-4 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {unlinkNotification.payload.reason}
                </p>
              </div>
            )}
            <div className="mt-6 flex justify-end">
              <Button onClick={handleCloseUnlinkModal}>OK</Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
