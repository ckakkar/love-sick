"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Stepper, { Step } from "@/components/stepper";
import { SexSelector } from "@/components/ui/sex-selector";
import { cn } from "@/lib/utils";
import {
  AtSign,
  UserCircle,
  Calendar,
  Heart,
  MapPin,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import {
  getBrowserTimezone,
  TIMEZONE_GROUPS,
  ALL_TIMEZONE_VALUES,
  isValidTimezone,
} from "@/lib/timezones";

const TOTAL_STEPS = 5;
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/;

const inputClass = cn(
  "w-full rounded-2xl border-2 border-border/50 bg-muted/20 px-4 py-3.5 text-foreground placeholder:text-muted-foreground/80 transition-all duration-300",
  "focus:border-violet-400/70 focus:outline-none focus:ring-2 focus:ring-violet-400/25 focus:bg-background/60",
  "hover:border-violet-400/30 hover:bg-muted/30",
  "text-[15px] sm:text-base"
);

const labelClass =
  "block text-xs font-medium uppercase tracking-wider text-muted-foreground/90 mb-2";

export default function OnboardingPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [timezone, setTimezone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (!timezone) setTimezone(getBrowserTimezone());
  }, []);

  /** Validate current step before allowing "Continue". Return false to block advancing. */
  async function validateBeforeNext(step: number): Promise<boolean> {
    setError(null);
    if (step === 1) {
      const raw = username.trim();
      if (raw.length < 3) {
        setError("Username must be at least 3 characters.");
        return false;
      }
      if (!USERNAME_REGEX.test(raw)) {
        setError("Username must be 3–30 characters: letters, numbers, underscores or hyphens only.");
        return false;
      }
      const res = await fetch(`/api/profile/check-username?username=${encodeURIComponent(raw)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Username is unavailable.");
        return false;
      }
      return true;
    }
    if (step === 2) {
      if (!fullName.trim()) {
        setError("Name is required.");
        return false;
      }
      return true;
    }
    if (step === 3) {
      if (age.trim() !== "") {
        const ageNum = parseInt(age, 10);
        if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
          setError("Age must be between 1 and 120.");
          return false;
        }
      }
      return true;
    }
    if (step === 4) return true; // sex optional
    return true;
  }

  async function handleComplete(): Promise<void | false> {
    setError(null);
    const ageNum = age ? parseInt(age, 10) : undefined;

    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters.");
      return false;
    }
    if (!USERNAME_REGEX.test(username.trim())) {
      setError("Username must be 3–30 characters: letters, numbers, underscores or hyphens only.");
      return false;
    }
    const usernameCheck = await fetch(`/api/profile/check-username?username=${encodeURIComponent(username.trim())}`);
    const usernameData = await usernameCheck.json().catch(() => ({}));
    if (!usernameCheck.ok) {
      setError(usernameData.error || "Username is unavailable.");
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
        timezone: timezone && isValidTimezone(timezone) ? timezone : null,
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
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 gradient-mesh" />
      <div className="pointer-events-none absolute -top-[40%] left-1/2 h-[80vmax] w-[80vmax] -translate-x-1/2 rounded-full bg-[#a78bfa]/8 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-violet-950/20 to-transparent" />

      <div className="relative z-10 flex min-h-screen flex-col px-4 py-6 sm:px-6 sm:py-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-1 flex-col items-center justify-center"
        >
          <div className="mx-auto w-full max-w-[420px]">
            {/* Welcome */}
            <div className="mb-6 text-center sm:mb-8">
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Welcome to Love Sick
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mt-3 font-serif text-lg text-muted-foreground sm:text-xl"
              >
                A few details to personalize your experience
              </motion.p>
            </div>

            {/* Progress */}
            <div className="mb-4 flex flex-col items-center gap-2 sm:mb-5">
              <p className="text-xs font-medium tabular-nums text-muted-foreground">
                Step {currentStep} of {TOTAL_STEPS}
              </p>
              <div className="h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-muted/60">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400"
                  initial={false}
                  animate={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              </div>
            </div>

            <Stepper
              initialStep={1}
              onStepChange={setCurrentStep}
              onBeforeNext={validateBeforeNext}
              onFinalStepCompleted={handleComplete}
              backButtonText="Back"
              nextButtonText="Continue"
              completeButtonText={loading ? "Saving…" : "Get started"}
              disableStepIndicators={true}
              stepContainerClassName="!mb-0 !hidden"
              contentClassName="pt-2"
              footerClassName="mt-8 sm:mt-10"
              nextButtonProps={{ disabled: loading }}
              className="!p-0"
              stepCircleContainerClassName="rounded-3xl border border-border/40 bg-card/60 shadow-2xl shadow-violet-500/5 backdrop-blur-2xl p-6 sm:p-8 min-h-[320px]"
            >
              {/* Step 1: Username */}
              <Step>
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 text-violet-400 ring-1 ring-violet-400/20">
                      <AtSign className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                        Choose your username
                      </h2>
                      <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                        Letters, numbers, underscores. Your partner uses this to invite you.
                      </p>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="username" className={labelClass}>
                      Username
                    </label>
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
                      placeholder="e.g. alex_loves"
                      minLength={3}
                      maxLength={30}
                      className={inputClass}
                      autoComplete="username"
                    />
                  </div>
                </div>
              </Step>

              {/* Step 2: Name */}
              <Step>
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 text-violet-400 ring-1 ring-violet-400/20">
                      <UserCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                        What should we call you?
                      </h2>
                      <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                        Your name so your partner sees who they're connecting with.
                      </p>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="fullName" className={labelClass}>
                      Display name
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your name"
                      className={inputClass}
                      autoComplete="name"
                    />
                  </div>
                </div>
              </Step>

              {/* Step 3: Age */}
              <Step>
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 text-violet-400 ring-1 ring-violet-400/20">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                        How old are you?
                      </h2>
                      <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                        Optional — helps us tailor the experience.
                      </p>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="age" className={labelClass}>
                      Age (optional)
                    </label>
                    <input
                      id="age"
                      type="number"
                      min={1}
                      max={120}
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="e.g. 28"
                      className={inputClass}
                    />
                  </div>
                </div>
              </Step>

              {/* Step 4: Sex */}
              <Step>
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 text-violet-400 ring-1 ring-violet-400/20">
                      <Heart className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                        How do you identify?
                      </h2>
                      <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                        Optional — for personalization only. Choose what feels right.
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Sex (optional)</label>
                    <SexSelector value={sex} onChange={setSex} className="mt-1" />
                  </div>
                </div>
              </Step>

              {/* Step 5: Timezone */}
              <Step>
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 text-violet-400 ring-1 ring-violet-400/20">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                        Where are you?
                      </h2>
                      <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                        We'll show your local time and, when linked, the time difference with your partner.
                      </p>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="timezone" className={labelClass}>
                      Timezone
                    </label>
                    <select
                      id="timezone"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className={inputClass}
                      aria-label="Your timezone"
                    >
                      {timezone &&
                        !ALL_TIMEZONE_VALUES.includes(timezone) &&
                        isValidTimezone(timezone) && (
                          <optgroup label="Detected">
                            <option value={timezone}>
                              Your location: {timezone.replace(/_/g, " ")}
                            </option>
                          </optgroup>
                        )}
                      {TIMEZONE_GROUPS.map((group) => (
                        <optgroup key={group.label} label={group.label}>
                          {group.zones.map((z) => (
                            <option key={z.value} value={z.value}>
                              {z.label}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <p className="mt-2 text-xs text-muted-foreground/80">
                      We've detected your timezone. You can change it above if needed.
                    </p>
                  </div>
                </div>
              </Step>
            </Stepper>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200"
              role="alert"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                {error}
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
