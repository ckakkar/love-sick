"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Stepper, { Step } from "@/components/stepper";
import { SexSelector } from "@/components/ui/sex-selector";
import { cn } from "@/lib/utils";
import { User, UserCircle, Calendar } from "lucide-react";

const inputClass = cn(
  "w-full rounded-2xl border-2 border-border/60 bg-muted/30 px-4 py-3.5 text-foreground placeholder:text-muted-foreground transition-all duration-200",
  "focus:border-violet-400/60 focus:outline-none focus:ring-2 focus:ring-violet-400/20 focus:bg-background/80 hover:border-violet-400/30 hover:bg-muted/40"
);

export default function OnboardingPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleComplete(): Promise<void | false> {
    setError(null);
    const ageNum = age ? parseInt(age, 10) : undefined;

    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters.");
      return false;
    }
    if (!fullName.trim()) {
      setError("Name is required.");
      return false;
    }
    if (age && (isNaN(ageNum!) || ageNum! < 1 || ageNum! > 120)) {
      setError("Age must be between 1 and 120.");
      return false;
    }

    setLoading(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: username.trim(),
        full_name: fullName.trim(),
        age: ageNum ?? null,
        sex: sex || null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      return false;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background gradient-mesh">
      <div className="pointer-events-none absolute -top-[30%] left-1/2 h-[65vmax] w-[65vmax] -translate-x-1/2 rounded-full bg-[#a78bfa]/10 blur-[140px]" />
      <div className="relative z-10 flex min-h-screen flex-col px-4 py-6 sm:px-6 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-1 flex-col"
        >
          <Stepper
            initialStep={1}
            onFinalStepCompleted={handleComplete}
            backButtonText="Previous"
            nextButtonText="Next"
            completeButtonText={loading ? "Saving…" : "Continue"}
            contentClassName="pt-6"
            nextButtonProps={{ disabled: loading }}
          >
            <Step>
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
                      Choose your username
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      Letters, numbers, underscores or hyphens. Your partner will use this to send you an invite.
                    </p>
                  </div>
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
                  placeholder="e.g. alex_loves"
                  minLength={3}
                  maxLength={30}
                  className={inputClass}
                />
              </div>
            </Step>

            <Step>
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400">
                    <UserCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
                      What should we call you?
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      Your name so your partner sees who they're connecting with.
                    </p>
                  </div>
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                  className={inputClass}
                />
              </div>
            </Step>

            <Step>
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
                      How old are you?
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      Optional — helps us tailor the experience.
                    </p>
                  </div>
                </div>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Age (optional)"
                  className={inputClass}
                />
              </div>
            </Step>

            <Step>
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
                      Sex
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      Optional — for personalization only. Choose what feels right for you.
                    </p>
                  </div>
                </div>
                <SexSelector value={sex} onChange={setSex} />
              </div>
            </Step>
          </Stepper>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto mt-4 max-w-md rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm text-red-300"
            >
              {error}
            </motion.p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
