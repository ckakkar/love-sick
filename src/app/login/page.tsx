"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Heart } from "lucide-react";
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
    await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
    setOauthLoading(null);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Layered ambient glows */}
      <div className="pointer-events-none absolute inset-0 gradient-mesh" />
      <div className="pointer-events-none absolute -top-[20%] left-1/2 h-[60vmax] w-[60vmax] -translate-x-1/2 rounded-full bg-[#a78bfa]/16 blur-[140px]" />
      <div className="pointer-events-none absolute top-[30%] right-[-5%] h-[40vmax] w-[40vmax] rounded-full bg-[#f472b6]/10 blur-[110px]" />
      <div className="pointer-events-none absolute bottom-[-5%] left-[10%] h-[35vmax] w-[35vmax] rounded-full bg-[#7c3aed]/10 blur-[100px]" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-sm text-muted-foreground transition-all hover:bg-white/5 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
          <Link href="/" className="font-serif text-lg font-semibold tracking-tight text-foreground">
            Love Sick
          </Link>
          <div className="w-16" />
        </header>

        <main className="flex flex-1 items-center justify-center px-6 pb-20 pt-4">
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[400px]"
          >
            {/* Glow ring behind card */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/8 blur-[80px]" />

            <div className="relative overflow-hidden rounded-3xl border border-white/8 shadow-2xl shadow-black/60"
              style={{
                background: "linear-gradient(160deg, rgba(26,20,44,0.95) 0%, rgba(18,14,30,0.98) 100%)",
                boxShadow: "0 32px 64px -16px rgba(0,0,0,0.7), 0 0 0 1px rgba(167,139,250,0.12), inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
            >
              {/* Subtle top shimmer */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />

              {/* Rose accent line */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-rose-400/20 to-transparent" />

              <div className="px-8 pb-10 pt-10 sm:px-10 sm:pt-12">
                {/* Icon */}
                <div className="mb-6 flex justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-rose-500/15 ring-1 ring-white/8">
                    <Heart className="h-6 w-6 text-rose-300/90" />
                  </div>
                </div>

                <h1 className="text-center font-serif text-2xl font-semibold leading-snug tracking-tight text-foreground sm:text-3xl">
                  Enter the garden
                </h1>
                <p className="mt-3 text-center text-sm leading-relaxed text-muted-foreground">
                  Sign in to build your love language profile and connect with your partner.
                </p>

                <div className="mt-9">
                  <button
                    type="button"
                    onClick={() => handleOAuth("google")}
                    disabled={!!oauthLoading}
                    className="group relative flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm font-medium text-foreground transition-all duration-200 hover:border-white/15 hover:bg-white/8 disabled:opacity-60"
                    style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)" }}
                  >
                    {oauthLoading === "google" ? (
                      <>
                        <LoadingSpinner className="h-4 w-4 border-2" />
                        <span className="text-muted-foreground">Redirecting…</span>
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v2.96h3.86c2.26-2.09 3.56-5.17 3.56-8.78z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.65-.35-1.35-.35-2.09s.13-1.44.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        </svg>
                        Continue with Google
                      </>
                    )}
                  </button>
                </div>

                <p className="mt-7 text-center text-xs leading-relaxed text-muted-foreground/60">
                  Private by design. Only you and your partner see each other's data.
                </p>
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
