"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { LoginDialog } from "@/components/auth/login-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function InviteClient({
  code,
  invalid,
  isPartner,
  isLoggedIn,
}: {
  code: string;
  invalid: boolean;
  isPartner: boolean;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [loginOpen, setLoginOpen] = useState(false);
  const [linking, setLinking] = useState(false);

  const [alreadyLinkedError, setAlreadyLinkedError] = useState(false);

  useEffect(() => {
    if (invalid) return;
    if (isLoggedIn && isPartner) {
      queueMicrotask(() => {
        setLinking(true);
        setAlreadyLinkedError(false);
      });
      fetch("/api/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })
        .then(async (res) => {
          const data = await res.json().catch(() => ({}));
          if (res.status === 409 && data.error === "already_linked") {
            setAlreadyLinkedError(true);
            return;
          }
          if (data.ok) {
            router.push("/assess?from=invite");
          } else {
            router.push("/dashboard");
          }
        })
        .catch(() => router.push("/dashboard"))
        .finally(() => setLinking(false));
    }
  }, [code, invalid, isLoggedIn, isPartner, router]);

  if (invalid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background gradient-mesh p-6">
        <Card className="glass max-w-md border-purple-500/10">
          <CardHeader>
            <CardTitle>Invalid or used link</CardTitle>
            <CardDescription>
              This invite link is invalid or has already been used.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard">
              <Button>Go to dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background gradient-mesh p-6">
        <Card className="glass max-w-md border-purple-500/10">
          <CardHeader>
            <CardTitle>Sign in to join</CardTitle>
            <CardDescription>
              Your partner invited you. Sign in, take the assessment, and you’ll be able to compare your love languages and learn how to love each other better.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLoginOpen(true)} className="w-full">
              Get Started
            </Button>
          </CardContent>
        </Card>
        <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
      </div>
    );
  }

  if (alreadyLinkedError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background gradient-mesh p-6">
        <Card className="glass max-w-md border-purple-500/10">
          <CardHeader>
            <CardTitle>Already linked</CardTitle>
            <CardDescription>
              You’re already linked with a partner. Only two people can connect at a time. Go to your dashboard to view your comparison.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard">
              <Button>Go to dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (linking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background gradient-mesh p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-muted-foreground"
        >
          Connecting you with your partner…
        </motion.div>
      </div>
    );
  }

  return null;
}
