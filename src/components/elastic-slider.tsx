"use client";

import React, { useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
} from "framer-motion";

const MAX_OVERFLOW = 50;

function decay(value: number, max: number): number {
  if (max === 0) return 0;
  const entry = value / max;
  const sigmoid = 2 * (1 / (1 + Math.exp(-entry)) - 0.5);
  return sigmoid * max;
}

export interface ElasticSliderProps {
  value?: number;
  defaultValue?: number;
  startingValue?: number;
  maxValue?: number;
  className?: string;
  isStepped?: boolean;
  stepSize?: number;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onChange?: (value: number) => void;
  label?: string;
  showValue?: boolean;
}

interface SliderProps {
  value: number;
  startingValue: number;
  maxValue: number;
  isStepped: boolean;
  stepSize: number;
  leftIcon: React.ReactNode;
  rightIcon: React.ReactNode;
  onChange?: (value: number) => void;
  showValue: boolean;
}

const Slider: React.FC<SliderProps> = ({
  value,
  startingValue,
  maxValue,
  isStepped,
  stepSize,
  leftIcon,
  rightIcon,
  onChange,
  showValue,
}) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [region, setRegion] = useState<"left" | "middle" | "right">("middle");
  const clientX = useMotionValue(0);
  const overflow = useMotionValue(0);
  const scale = useMotionValue(1);

  useMotionValueEvent(clientX, "change", (latest: number) => {
    if (sliderRef.current) {
      const { left, right } = sliderRef.current.getBoundingClientRect();
      let newValue: number;
      if (latest < left) {
        setRegion("left");
        newValue = left - latest;
      } else if (latest > right) {
        setRegion("right");
        newValue = latest - right;
      } else {
        setRegion("middle");
        newValue = 0;
      }
      overflow.jump(decay(newValue, MAX_OVERFLOW));
    }
  });

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons > 0 && sliderRef.current) {
      const { left, width } = sliderRef.current.getBoundingClientRect();
      let newValue =
        startingValue + (e.clientX - left) / width * (maxValue - startingValue);
      if (isStepped) {
        newValue = Math.round(newValue / stepSize) * stepSize;
      }
      newValue = Math.min(Math.max(newValue, startingValue), maxValue);
      onChange?.(newValue);
      clientX.jump(e.clientX);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    handlePointerMove(e);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerUp = () => {
    animate(overflow, 0, { type: "spring", bounce: 0.5 });
  };

  const getRangePercentage = (): number => {
    const totalRange = maxValue - startingValue;
    if (totalRange === 0) return 0;
    return ((value - startingValue) / totalRange) * 100;
  };

  const decrement = () => {
    const next = Math.max(startingValue, value - stepSize);
    const snapped = isStepped ? Math.round(next / stepSize) * stepSize : next;
    if (snapped !== value) onChange?.(Math.max(startingValue, snapped));
  };
  const increment = () => {
    const next = Math.min(maxValue, value + stepSize);
    const snapped = isStepped ? Math.round(next / stepSize) * stepSize : next;
    if (snapped !== value) onChange?.(Math.min(maxValue, snapped));
  };

  return (
    <>
      <motion.div
        onHoverStart={() => animate(scale, 1.2)}
        onHoverEnd={() => animate(scale, 1)}
        onTouchStart={() => animate(scale, 1.2)}
        onTouchEnd={() => animate(scale, 1)}
        style={{
          scale,
          opacity: useTransform(scale, [1, 1.2], [0.7, 1]),
        }}
        className="flex w-full touch-none select-none items-center justify-center gap-4"
      >
        <motion.button
          type="button"
          animate={{
            scale: region === "left" ? [1, 1.4, 1] : 1,
            transition: { duration: 0.25 },
          }}
          style={{
            x: useTransform(
              () => (region === "left" ? -overflow.get() / scale.get() : 0)
            ),
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            decrement();
          }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-violet-400/50"
          aria-label="Decrease value"
        >
          {leftIcon}
        </motion.button>

        <div
          ref={sliderRef}
          className="relative flex w-full max-w-xs grow cursor-grab touch-none select-none items-center py-4 active:cursor-grabbing"
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        >
          <motion.div
            style={{
              scaleX: useTransform(() => {
                if (sliderRef.current) {
                  const { width } = sliderRef.current.getBoundingClientRect();
                  return 1 + overflow.get() / width;
                }
                return 1;
              }),
              scaleY: useTransform(overflow, [0, MAX_OVERFLOW], [1, 0.8]),
              transformOrigin: useTransform(() => {
                if (sliderRef.current) {
                  const { left, width } = sliderRef.current.getBoundingClientRect();
                  return clientX.get() < left + width / 2 ? "right" : "left";
                }
                return "center";
              }),
              height: useTransform(scale, [1, 1.2], [6, 12]),
              marginTop: useTransform(scale, [1, 1.2], [0, -3]),
              marginBottom: useTransform(scale, [1, 1.2], [0, -3]),
            }}
            className="flex grow"
          >
            <div className="relative h-full w-full grow overflow-hidden rounded-full bg-muted">
              <div
                className="absolute h-full rounded-full bg-gradient-to-r from-[#7c3aed] to-[#a78bfa]"
                style={{ width: `${getRangePercentage()}%` }}
              />
            </div>
          </motion.div>
        </div>

        <motion.button
          type="button"
          animate={{
            scale: region === "right" ? [1, 1.4, 1] : 1,
            transition: { duration: 0.25 },
          }}
          style={{
            x: useTransform(
              () => (region === "right" ? overflow.get() / scale.get() : 0)
            ),
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            increment();
          }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-violet-400/50"
          aria-label="Increase value"
        >
          {rightIcon}
        </motion.button>
      </motion.div>
      {showValue && (
        <p className="mt-1 text-center text-xs font-medium tabular-nums tracking-wide text-muted-foreground">
          {Math.round(value)}
        </p>
      )}
    </>
  );
};

const ElasticSlider: React.FC<ElasticSliderProps> = ({
  value: controlledValue,
  defaultValue = 50,
  startingValue = 0,
  maxValue = 100,
  className = "",
  isStepped = false,
  stepSize = 1,
  leftIcon = <>−</>,
  rightIcon = <>+</>,
  onChange,
  label,
  showValue = true,
}) => {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;

  const handleChange = (v: number) => {
    if (!isControlled) setUncontrolledValue(v);
    onChange?.(v);
  };

  return (
    <div
      className={`flex w-full flex-col items-stretch gap-2 ${className}`.trim()}
    >
      {label && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          {showValue && (
            <span className="font-medium tabular-nums text-foreground">
              {Math.round(value)}
            </span>
          )}
        </div>
      )}
      <Slider
        value={value}
        startingValue={startingValue}
        maxValue={maxValue}
        isStepped={isStepped}
        stepSize={stepSize}
        leftIcon={leftIcon}
        rightIcon={rightIcon}
        onChange={handleChange}
        showValue={!label && showValue}
      />
    </div>
  );
};

export default ElasticSlider;
