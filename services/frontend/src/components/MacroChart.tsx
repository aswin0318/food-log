"use client";

import { motion } from "framer-motion";

interface MacroRingProps {
  label: string;
  value: number;
  target: number;
  color: string;
  unit?: string;
}

export function MacroRing({ label, value, target, color, unit = "g" }: MacroRingProps) {
  const percentage = target > 0 ? Math.min((value / target) * 100, 100) : 0;
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const statusColor =
    percentage >= 80 && percentage <= 120
      ? "text-emerald-400"
      : percentage < 80
      ? "text-amber-400"
      : "text-red-400";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-28 w-28">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-lg font-bold ${statusColor}`}>
            {Math.round(percentage)}%
          </span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-sm font-medium text-white/80">{label}</div>
        <div className="text-xs text-white/50">
          {Math.round(value)}{unit} / {target}{unit}
        </div>
      </div>
    </div>
  );
}
