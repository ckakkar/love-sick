"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as Avatar from "@radix-ui/react-avatar";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { Settings, LayoutDashboard, LogOut } from "lucide-react";

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
  const displayName = profile.full_name || profile.display_name || profile.username || "there";

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur-xl supports-backdrop-filter:bg-background/80">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="font-serif text-lg font-semibold tracking-tight text-foreground">
            Love Sick
          </Link>

          <div className="flex items-center gap-3">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full outline-none ring-violet-400 focus:ring-2"
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
                  <span className="max-w-[120px] truncate text-left text-sm font-medium text-foreground sm:max-w-[180px]">
                    Hi, {displayName}
                  </span>
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={8}
                  className="min-w-[200px] rounded-xl border border-border/80 bg-card/95 p-1 shadow-xl shadow-violet-500/5 backdrop-blur-xl"
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
      <main>{children}</main>
    </div>
  );
}
