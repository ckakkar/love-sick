"use client";

import { motion } from "framer-motion";
import { User, Users, Heart, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export type SexOption = {
  value: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
};

const DEFAULT_OPTIONS: SexOption[] = [
  {
    value: "male",
    label: "Male",
    icon: <User className="h-5 w-5" />,
  },
  {
    value: "female",
    label: "Female",
    icon: <User className="h-5 w-5" />,
  },
  {
    value: "other",
    label: "Other",
    icon: <Users className="h-5 w-5" />,
    description: "Non-binary, genderfluid, or other",
  },
  {
    value: "prefer_not_to_say",
    label: "Prefer not to say",
    icon: <EyeOff className="h-5 w-5" />,
  },
];

export function SexSelector({
  value,
  onChange,
  options = DEFAULT_OPTIONS,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options?: SexOption[];
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-3", className)}>
      {options.map((option) => {
        const isSelected = value === option.value;
        const isEmpty = value === "";
        const isOptional = option.value === "prefer_not_to_say" || option.value === "";

        return (
          <motion.button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "group relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all duration-200",
              isSelected
                ? "border-violet-400 bg-violet-500/20 shadow-lg shadow-violet-500/10"
                : "border-border/60 bg-muted/30 hover:border-violet-400/40 hover:bg-violet-500/10"
            )}
          >
            <motion.div
              animate={{
                scale: isSelected ? 1.1 : 1,
                color: isSelected ? "var(--primary)" : "var(--muted-foreground)",
              }}
              transition={{ duration: 0.2 }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-background/50"
            >
              {option.icon}
            </motion.div>
            <span
              className={cn(
                "text-sm font-medium",
                isSelected ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {option.label}
            </span>
            {option.description && (
              <span className="text-[10px] leading-tight text-muted-foreground/70">
                {option.description}
              </span>
            )}
            {isSelected && (
              <motion.div
                layoutId="sexSelectorIndicator"
                className="absolute right-2 top-2 h-2 w-2 rounded-full bg-violet-400"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
