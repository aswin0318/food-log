"use client";

import { MacroRing } from "./MacroChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Drumstick, Wheat, Droplet } from "lucide-react";
import { motion } from "framer-motion";

interface DailySummaryProps {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  calorieTarget: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
  mealCount: number;
}

export function DailySummary({
  calories,
  protein,
  carbs,
  fat,
  calorieTarget,
  proteinTarget,
  carbsTarget,
  fatTarget,
  mealCount,
}: DailySummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-500">
            <Flame className="h-4 w-4 text-white" />
          </div>
          Today&apos;s Macros
          <span className="ml-auto text-sm font-normal text-white/50">
            {mealCount} meal{mealCount !== 1 ? "s" : ""} logged
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <MacroRing
              label="Calories"
              value={calories}
              target={calorieTarget}
              color="#f97316"
              unit="kcal"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <MacroRing
              label="Protein"
              value={protein}
              target={proteinTarget}
              color="#8b5cf6"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <MacroRing
              label="Carbs"
              value={carbs}
              target={carbsTarget}
              color="#06b6d4"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <MacroRing
              label="Fat"
              value={fat}
              target={fatTarget}
              color="#f472b6"
            />
          </motion.div>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-4 gap-3">
          {[
            { icon: Flame, label: "Calories", value: `${Math.round(calories)} kcal`, gradient: "from-orange-500/20 to-red-500/20" },
            { icon: Drumstick, label: "Protein", value: `${Math.round(protein)}g`, gradient: "from-violet-500/20 to-purple-500/20" },
            { icon: Wheat, label: "Carbs", value: `${Math.round(carbs)}g`, gradient: "from-cyan-500/20 to-teal-500/20" },
            { icon: Droplet, label: "Fat", value: `${Math.round(fat)}g`, gradient: "from-pink-500/20 to-rose-500/20" },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`rounded-xl bg-gradient-to-br ${stat.gradient} border border-white/5 p-3 text-center`}
            >
              <stat.icon className="mx-auto h-4 w-4 text-white/50 mb-1" />
              <div className="text-sm font-semibold text-white">{stat.value}</div>
              <div className="text-xs text-white/40">{stat.label}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
