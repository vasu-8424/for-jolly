"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

interface RealtimeContextType {
  isConnected: boolean;
}

const RealtimeContext = createContext<RealtimeContextType>({ isConnected: false });

function playNewOrderSound() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
    osc.frequency.setValueAtTime(1174.66, audioCtx.currentTime + 0.3); // D6

    gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.8);
  } catch (e) {
    console.error("Audio chime error:", e);
  }
}

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("admin-realtime-global")
      .on(
        "postgres_changes",
        { event: "*", schema: "public" },
        (payload) => {
          const table = payload.table;

          // Invalidate relevant React Query caches based on modified table
          if (table === "orders") {
            queryClient.invalidateQueries({ queryKey: ["orders"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
            if (payload.eventType === "INSERT") {
              playNewOrderSound();
              const orderNo = payload.new.order_number || payload.new.id;
              const amount = payload.new.grand_total || payload.new.subtotal || 0;
              toast.custom(
                (t) => (
                  <div className={`${t.visible ? "animate-enter" : "animate-leave"} max-w-md w-full bg-emerald-950 text-white shadow-2xl rounded-xl border-2 border-emerald-500 p-4 flex items-start gap-3 pointer-events-auto`}>
                    <div className="text-3xl">🚨</div>
                    <div className="flex-1">
                      <p className="font-bold text-emerald-300 text-sm">NEW ORDER RECEIVED!</p>
                      <p className="text-xs text-white mt-0.5">Order #{orderNo} • Total: ₹{amount}</p>
                      <p className="text-[11px] text-emerald-400 mt-1">Alert dispatched to kakinadafresh@gmail.com & 7989948996</p>
                    </div>
                  </div>
                ),
                { duration: 12000, id: `order-${payload.new.id}` }
              );
            }
          } else if (table === "products" || table === "product_images") {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
          } else if (table === "categories" || table === "subcategories") {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
          } else if (table === "users" || table === "profiles" || table === "wallets") {
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
          } else {
            // General query cache invalidation for any other table update
            queryClient.invalidateQueries();
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setIsConnected(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return (
    <RealtimeContext.Provider value={{ isConnected }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtimeStatus() {
  return useContext(RealtimeContext);
}
