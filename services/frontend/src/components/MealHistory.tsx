"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Clock, UtensilsCrossed } from "lucide-react";
import { foodApi, type Meal } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatTime } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface MealHistoryProps {
  meals: Meal[];
  onMealDeleted: () => void;
}

const mealTypeEmoji: Record<string, string> = {
  breakfast: "🌅",
  lunch: "☀️",
  dinner: "🌙",
  snack: "🍎",
};

export function MealHistory({ meals, onMealDeleted }: MealHistoryProps) {
  const { token } = useAuth();

  const handleDelete = async (mealId: string) => {
    if (!token) return;
    if (!confirm("Delete this meal?")) return;

    try {
      await foodApi.deleteMeal(token, mealId);
      onMealDeleted();
    } catch (err) {
      console.error("Failed to delete meal:", err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500">
            <UtensilsCrossed className="h-4 w-4 text-white" />
          </div>
          Meal History
          <Badge variant="info" className="ml-auto">{meals.length} meals</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {meals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-white/40">
            <UtensilsCrossed className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">No meals logged yet</p>
            <p className="text-xs mt-1">Start by adding your first meal above</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {meals.map((meal, index) => (
                <motion.div
                  key={meal.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="group flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all duration-200 hover:bg-white/[0.05] hover:border-white/10"
                >
                  {/* Emoji */}
                  <div className="text-2xl">
                    {mealTypeEmoji[meal.meal_type] || "🍽️"}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white truncate">
                        {meal.name}
                      </span>
                      <Badge variant="default" className="text-[10px] capitalize">
                        {meal.meal_type}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-white/50">
                      <Clock className="h-3 w-3" />
                      {formatTime(meal.logged_at)}
                    </div>
                  </div>

                  {/* Macros */}
                  <div className="hidden sm:grid grid-cols-4 gap-3 text-center">
                    <div>
                      <div className="text-xs text-orange-400 font-semibold">
                        {Math.round(meal.calories)}
                      </div>
                      <div className="text-[10px] text-white/30">kcal</div>
                    </div>
                    <div>
                      <div className="text-xs text-violet-400 font-semibold">
                        {Math.round(meal.protein)}g
                      </div>
                      <div className="text-[10px] text-white/30">protein</div>
                    </div>
                    <div>
                      <div className="text-xs text-cyan-400 font-semibold">
                        {Math.round(meal.carbs)}g
                      </div>
                      <div className="text-[10px] text-white/30">carbs</div>
                    </div>
                    <div>
                      <div className="text-xs text-pink-400 font-semibold">
                        {Math.round(meal.fat)}g
                      </div>
                      <div className="text-[10px] text-white/30">fat</div>
                    </div>
                  </div>

                  {/* Delete */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(meal.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
