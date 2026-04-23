"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { macroApi, complianceApi, type DailySummary as DailySummaryType, type WeeklySummary, type AlertList } from "@/lib/api";
import { DailySummary } from "@/components/DailySummary";
import { WeeklyTrends } from "@/components/WeeklyTrends";
import { AlertsList } from "@/components/AlertsList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getToday, getWeekStart } from "@/lib/utils";
import { BarChart3, TrendingUp, RefreshCw, Loader2, Activity } from "lucide-react";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const { token, user } = useAuth();
  const [dailyData, setDailyData] = useState<DailySummaryType | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklySummary | null>(null);
  const [alerts, setAlerts] = useState<AlertList | null>(null);
  const [targets, setTargets] = useState({
    daily_calorie_target: 2000,
    daily_protein_target: 150,
    daily_carbs_target: 250,
    daily_fat_target: 65,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!token) return;

    try {
      const today = getToday();
      const weekStart = getWeekStart();

      const [daily, weekly, targetRes, alertRes] = await Promise.allSettled([
        macroApi.getDailySummary(token, today),
        macroApi.getWeeklySummary(token, weekStart),
        macroApi.getTargets(token),
        complianceApi.getUnreadAlerts(token),
      ]);

      if (daily.status === "fulfilled") setDailyData(daily.value);
      if (weekly.status === "fulfilled") setWeeklyData(weekly.value);
      if (targetRes.status === "fulfilled") {
        setTargets({
          daily_calorie_target: targetRes.value.daily_calorie_target,
          daily_protein_target: targetRes.value.daily_protein_target,
          daily_carbs_target: targetRes.value.daily_carbs_target,
          daily_fat_target: targetRes.value.daily_fat_target,
        });
      }
      if (alertRes.status === "fulfilled") setAlerts(alertRes.value);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
          <p className="text-sm text-white/50">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},{" "}
            <span className="gradient-text">{user?.username}</span>
          </h1>
          <p className="mt-1 text-white/50">
            Here&apos;s your nutrition overview for today
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </motion.div>

      {/* Quick Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4"
      >
        {[
          {
            label: "Today's Meals",
            value: dailyData?.meal_count ?? 0,
            icon: Activity,
            gradient: "from-violet-500/20 to-purple-500/20",
          },
          {
            label: "Weekly Meals",
            value: weeklyData?.total_meals ?? 0,
            icon: BarChart3,
            gradient: "from-cyan-500/20 to-teal-500/20",
          },
          {
            label: "Avg Calories",
            value: weeklyData
              ? `${Math.round(weeklyData.weekly_averages.total_calories)}`
              : "—",
            icon: TrendingUp,
            gradient: "from-orange-500/20 to-red-500/20",
          },
          {
            label: "Unread Alerts",
            value: alerts?.unread_count ?? 0,
            icon: Activity,
            gradient:
              (alerts?.unread_count ?? 0) > 0
                ? "from-red-500/20 to-rose-500/20"
                : "from-emerald-500/20 to-green-500/20",
          },
        ].map((stat) => (
          <Card key={stat.label} className={`bg-gradient-to-br ${stat.gradient}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <stat.icon className="h-5 w-5 text-white/40" />
                <div>
                  <div className="text-lg font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-white/50">{stat.label}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Daily Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <DailySummary
          calories={dailyData?.total_calories ?? 0}
          protein={dailyData?.total_protein ?? 0}
          carbs={dailyData?.total_carbs ?? 0}
          fat={dailyData?.total_fat ?? 0}
          calorieTarget={targets.daily_calorie_target}
          proteinTarget={targets.daily_protein_target}
          carbsTarget={targets.daily_carbs_target}
          fatTarget={targets.daily_fat_target}
          mealCount={dailyData?.meal_count ?? 0}
        />
      </motion.div>

      {/* Weekly Trends */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              Weekly Trends
              {weeklyData && (
                <Badge variant="info" className="ml-auto">
                  {weeklyData.start_date} — {weeklyData.end_date}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyData && weeklyData.daily_breakdowns.length > 0 ? (
              <WeeklyTrends data={weeklyData.daily_breakdowns} />
            ) : (
              <div className="flex items-center justify-center py-16 text-white/40">
                <p>No data for this week yet. Start logging meals!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Alerts */}
      {alerts && alerts.alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <AlertsList alerts={alerts.alerts.slice(0, 5)} onAlertRead={fetchData} />
        </motion.div>
      )}
    </div>
  );
}
