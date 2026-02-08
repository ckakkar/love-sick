import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, full_name, display_name, avatar_url")
    .eq("id", user.id)
    .single();

  if (!profile?.username) {
    redirect("/onboarding");
  }

  const shellProfile = {
    id: profile.id,
    username: profile.username ?? null,
    full_name: profile.full_name ?? null,
    display_name: profile.display_name ?? null,
    avatar_url: profile.avatar_url ?? null,
    notify_partner_request: true,
    notify_partner_online: true,
  };

  return <DashboardShell profile={shellProfile}>{children}</DashboardShell>;
}
