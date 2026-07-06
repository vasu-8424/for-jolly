"use client";

import { motion } from "framer-motion";
import { Hand } from "lucide-react";
import dayjs from "dayjs";

export function WelcomeBanner() {
  const currentHour = dayjs().hour();
  let greeting = "Good Evening";
  if (currentHour < 12) greeting = "Good Morning";
  else if (currentHour < 17) greeting = "Good Afternoon";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/90 to-primary p-8 text-primary-foreground shadow-xl"
    >
      <div className="relative z-10">
        <h2 className="flex items-center gap-2 text-3xl font-heading font-bold">
          {greeting}, Admin <Hand className="h-8 w-8 animate-pulse text-accent" />
        </h2>
        <p className="mt-2 text-primary-foreground/80 max-w-lg">
          Here is what's happening with your store today. You have pending orders that need attention, and your revenue is tracking 15% higher than yesterday.
        </p>
      </div>

      {/* Decorative Background Elements */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-20 right-40 h-40 w-40 rounded-full bg-accent/20 blur-2xl" />
    </motion.div>
  );
}
