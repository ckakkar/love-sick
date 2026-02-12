import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/;

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const username = typeof searchParams.get("username") === "string" ? searchParams.get("username")!.trim() : "";

  if (!username) {
    return NextResponse.json(
      { error: "Username is required." },
      { status: 400 }
    );
  }
  if (!USERNAME_REGEX.test(username)) {
    return NextResponse.json(
      { error: "Username must be 3–30 characters, letters, numbers, underscores or hyphens only." },
      { status: 400 }
    );
  }

  const { data: available, error } = await supabase.rpc("is_username_available", {
    check_uid: user.id,
    uname: username,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (available === false) {
    return NextResponse.json(
      { error: "Username is already taken." },
      { status: 409 }
    );
  }
  return NextResponse.json({ available: true });
}
