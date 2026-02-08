"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SEX_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const ageNum = age ? parseInt(age, 10) : undefined;
    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (!fullName.trim()) {
      setError("Name is required.");
      return;
    }
    if (age && (isNaN(ageNum!) || ageNum! < 1 || ageNum! > 120)) {
      setError("Age must be between 1 and 120.");
      return;
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
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute -top-[30%] left-1/2 h-[60vmax] w-[60vmax] -translate-x-1/2 rounded-full bg-[#a78bfa]/8 blur-[120px]" />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="rounded-3xl border border-border/60 bg-card/70 p-8 shadow-xl backdrop-blur-xl">
            <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
              Welcome — tell us a bit about you
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              This helps your partner find you and personalizes your experience.
            </p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="username" className="mb-1 block text-sm font-medium text-foreground">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
                  placeholder="e.g. alex_loves"
                  required
                  minLength={3}
                  maxLength={30}
                  className={cn(
                    "w-full rounded-2xl border border-border bg-background/80 px-4 py-3 text-foreground placeholder:text-muted-foreground",
                    "focus:border-violet-400/40 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                  )}
                />
                <p className="mt-1 text-xs text-muted-foreground">Letters, numbers, underscores or hyphens. Your partner will use this to send you an invite.</p>
              </div>
              <div>
                <label htmlFor="fullName" className="mb-1 block text-sm font-medium text-foreground">
                  Full name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="How should we call you?"
                  required
                  className={cn(
                    "w-full rounded-2xl border border-border bg-background/80 px-4 py-3 text-foreground placeholder:text-muted-foreground",
                    "focus:border-violet-400/40 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                  )}
                />
              </div>
              <div>
                <label htmlFor="age" className="mb-1 block text-sm font-medium text-foreground">
                  Age
                </label>
                <input
                  id="age"
                  type="number"
                  min={1}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Optional"
                  className={cn(
                    "w-full rounded-2xl border border-border bg-background/80 px-4 py-3 text-foreground placeholder:text-muted-foreground",
                    "focus:border-violet-400/40 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                  )}
                />
              </div>
              <div>
                <label htmlFor="sex" className="mb-1 block text-sm font-medium text-foreground">
                  Sex
                </label>
                <select
                  id="sex"
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                  className={cn(
                    "w-full rounded-2xl border border-border bg-background/80 px-4 py-3 text-foreground",
                    "focus:border-violet-400/40 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                  )}
                >
                  <option value="">Optional</option>
                  {SEX_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Saving…" : "Continue"}
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
