"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Flame } from "lucide-react";
import { motion } from "framer-motion";

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 shadow-2xl shadow-violet-500/30">
          <Flame className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold gradient-text">NutriTrack</h1>
        <div className="h-1 w-8 animate-pulse rounded-full bg-gradient-to-r from-violet-500 to-cyan-500" />
      </motion.div>
    </div>
  );
}
