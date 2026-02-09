"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  const [oauthLoading, setOauthLoading] = useState<"google" | null>(null);

  async function handleOAuth(provider: "google") {
    setOauthLoading(provider);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`;
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    setOauthLoading(null);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background gradient-mesh">
      <div className="pointer-events-none absolute -top-[30%] left-1/2 h-[65vmax] w-[65vmax] -translate-x-1/2 rounded-full bg-[#a78bfa]/10 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-[10%] right-[-10%] h-[45vmax] w-[45vmax] rounded-full bg-[#2d2640]/50 blur-[100px]" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-violet-500/10 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
          <span className="font-serif text-lg font-semibold tracking-tight text-foreground">
            Love Sick
          </span>
          <div className="w-16" />
        </header>

        <main className="flex flex-1 items-center justify-center px-6 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[380px]"
          >
            <div className="rounded-3xl border border-border/50 bg-card/80 p-8 sm:p-10 shadow-2xl shadow-violet-500/10 backdrop-blur-2xl glass">
              <h1 className="text-center font-serif text-2xl sm:text-3xl font-semibold leading-snug tracking-tight text-foreground">
                Enter the garden
              </h1>
              <p className="mt-3 text-center text-sm leading-relaxed text-muted-foreground">
                Sign in with your Google account to continue.
              </p>

              <div className="mt-10">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-border/80 hover:bg-violet-500/10 hover:border-violet-400/25"
                  onClick={() => handleOAuth("google")}
                  disabled={!!oauthLoading}
                >
                  {oauthLoading === "google" ? (
                    <>
                      <LoadingSpinner className="h-4 w-4 border-2" />
                      <span className="text-muted-foreground">Redirecting…</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Sign in with Google
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginPageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background gradient-mesh">
      <div className="h-10 w-10 animate-pulse rounded-full border-2 border-violet-400/30 bg-violet-500/10" />
    </div>
  );
}
