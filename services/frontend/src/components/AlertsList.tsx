"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertTriangle, AlertCircle, Info, Check } from "lucide-react";
import { complianceApi, type Alert } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface AlertsListProps {
  alerts: Alert[];
  onAlertRead: () => void;
}

const severityConfig: Record<string, { icon: typeof AlertTriangle; variant: "warning" | "danger" | "info" | "success"; color: string }> = {
  critical: { icon: AlertCircle, variant: "danger", color: "text-red-400" },
  warning: { icon: AlertTriangle, variant: "warning", color: "text-amber-400" },
  info: { icon: Info, variant: "info", color: "text-blue-400" },
};

const alertTypeLabels: Record<string, string> = {
  protein_deficiency: "Protein Deficiency",
  calorie_surplus: "Calorie Surplus",
  calorie_deficit: "Calorie Deficit",
  pattern_detected: "Pattern Detected",
};

export function AlertsList({ alerts, onAlertRead }: AlertsListProps) {
  const { token } = useAuth();

  const handleMarkRead = async (alertId: string) => {
    if (!token) return;
    try {
      await complianceApi.markAlertRead(token, alertId);
      onAlertRead();
    } catch (err) {
      console.error("Failed to mark alert as read:", err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
            <Bell className="h-4 w-4 text-white" />
          </div>
          Compliance Alerts
          {alerts.filter((a) => !a.is_read).length > 0 && (
            <Badge variant="danger" className="ml-auto">
              {alerts.filter((a) => !a.is_read).length} unread
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-white/40">
            <Check className="h-12 w-12 mb-3 text-emerald-500/30" />
            <p className="text-sm">All clear! No alerts.</p>
            <p className="text-xs mt-1">Your diet compliance is looking great!</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {alerts.map((alert, index) => {
                const config = severityConfig[alert.severity] || severityConfig.info;
                const Icon = config.icon;

                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.05 }}
                    className={`rounded-xl border p-4 transition-all duration-200 ${
                      alert.is_read
                        ? "border-white/5 bg-white/[0.01] opacity-60"
                        : "border-white/10 bg-white/[0.03]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 ${config.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-white text-sm">
                            {alert.title}
                          </span>
                          <Badge variant={config.variant} className="text-[10px]">
                            {alert.severity}
                          </Badge>
                          <Badge variant="default" className="text-[10px]">
                            {alertTypeLabels[alert.alert_type] || alert.alert_type}
                          </Badge>
                        </div>

                        <p className="mt-1 text-xs text-white/60 leading-relaxed">
                          {alert.message}
                        </p>

                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-[10px] text-white/30">
                            {formatDate(alert.created_at)}
                          </span>
                          {!alert.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkRead(alert.id)}
                              className="text-xs text-white/50 hover:text-white"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Mark read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
