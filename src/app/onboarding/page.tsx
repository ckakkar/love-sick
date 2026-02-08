"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Stepper, { Step } from "@/components/stepper";
import { cn } from "@/lib/utils";

const SEX_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

const inputClass = cn(
  "w-full rounded-2xl border border-border bg-background/80 px-4 py-3 text-foreground placeholder:text-muted-foreground",
  "focus:border-violet-400/40 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
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
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute -top-[30%] left-1/2 h-[60vmax] w-[60vmax] -translate-x-1/2 rounded-full bg-[#a78bfa]/8 blur-[120px]" />
      <div className="relative z-10 flex min-h-screen flex-col py-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
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
              <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">
                Choose your username
              </h2>
              <p className="text-sm text-muted-foreground">
                Letters, numbers, underscores or hyphens. Your partner will use this to send you an invite.
              </p>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
                placeholder="e.g. alex_loves"
                minLength={3}
                maxLength={30}
                className={inputClass}
              />
            </Step>

            <Step>
              <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">
                What should we call you?
              </h2>
              <p className="text-sm text-muted-foreground">
                Your name so your partner sees who they’re connecting with.
              </p>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                className={inputClass}
              />
            </Step>

            <Step>
              <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">
                How old are you?
              </h2>
              <p className="text-sm text-muted-foreground">
                Optional — helps us tailor the experience.
              </p>
              <input
                type="number"
                min={1}
                max={120}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Age (optional)"
                className={inputClass}
              />
            </Step>

            <Step>
              <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">
                Sex
              </h2>
              <p className="text-sm text-muted-foreground">
                Optional — for personalization only.
              </p>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value)}
                className={inputClass}
              >
                <option value="">Optional</option>
                {SEX_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Step>
          </Stepper>

          {error && (
            <p className="mx-auto mt-4 max-w-md px-4 text-center text-sm text-red-400">
              {error}
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
