import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { InviteClient } from "./invite-client";

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  if (!code) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: couple } = await supabase
    .from("couples")
    .select("id, profile_a_id, profile_b_id, status")
    .eq("invite_code", code)
    .single();

  const invalid = !couple || couple.status === "active" || (couple.profile_b_id && couple.profile_b_id !== user?.id);
  const isPartner = user && couple?.profile_a_id !== user.id;

  return (
    <InviteClient
      code={code}
      invalid={!!invalid}
      isPartner={!!isPartner}
      isLoggedIn={!!user}
    />
  );
}
