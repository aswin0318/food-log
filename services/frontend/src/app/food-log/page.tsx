"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { foodApi, type Meal } from "@/lib/api";
import { MealForm } from "@/components/MealForm";
import { MealHistory } from "@/components/MealHistory";
import { getToday } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function FoodLogPage() {
  const { token } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMeals = async () => {
    if (!token) return;
    try {
      const today = getToday();
      const res = await foodApi.listMeals(token, { date: today, limit: 100 });
      setMeals(res.meals);
    } catch (err) {
      console.error("Failed to fetch meals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeals();
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-white">
          Food <span className="gradient-text">Log</span>
        </h1>
        <p className="mt-1 text-white/50">
          Log your meals and track your daily intake
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <MealForm onMealAdded={fetchMeals} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <MealHistory meals={meals} onMealDeleted={fetchMeals} />
      </motion.div>
    </div>
  );
}
