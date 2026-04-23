"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { complianceApi, type Alert, type AlertList } from "@/lib/api";
import { AlertsList } from "@/components/AlertsList";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, RefreshCw, Shield, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

export default function AlertsPage() {
  const { token } = useAuth();
  const [alertData, setAlertData] = useState<AlertList | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const fetchAlerts = async () => {
    if (!token) return;
    try {
      const res = await complianceApi.getAlerts(token, 100);
      setAlertData(res);
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    if (!token) return;
    setAnalyzing(true);
    try {
      await complianceApi.analyzePatterns(token, 7);
      await fetchAlerts();
    } catch (err) {
      console.error("Failed to analyze patterns:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
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
        className="mb-8 flex items-start justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">
            Compliance <span className="gradient-text">Alerts</span>
          </h1>
          <p className="mt-1 text-white/50">
            Monitor your diet compliance and health patterns
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAlerts}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={runAnalysis}
            disabled={analyzing}
          >
            {analyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Run Analysis
              </>
            )}
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8 grid grid-cols-3 gap-4"
      >
        <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/10">
          <CardContent className="flex items-center gap-3 p-4">
            <Shield className="h-8 w-8 text-emerald-400" />
            <div>
              <div className="text-2xl font-bold text-white">
                {alertData ? alertData.total - alertData.unread_count : 0}
              </div>
              <div className="text-xs text-white/50">Resolved</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10">
          <CardContent className="flex items-center gap-3 p-4">
            <ShieldAlert className="h-8 w-8 text-amber-400" />
            <div>
              <div className="text-2xl font-bold text-white">
                {alertData?.unread_count ?? 0}
              </div>
              <div className="text-xs text-white/50">Unread</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10">
          <CardContent className="flex items-center gap-3 p-4">
            <Search className="h-8 w-8 text-blue-400" />
            <div>
              <div className="text-2xl font-bold text-white">
                {alertData?.total ?? 0}
              </div>
              <div className="text-xs text-white/50">Total Alerts</div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Alerts List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <AlertsList
          alerts={alertData?.alerts ?? []}
          onAlertRead={fetchAlerts}
        />
      </motion.div>
    </div>
  );
}
