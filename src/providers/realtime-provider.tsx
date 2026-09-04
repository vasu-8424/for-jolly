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
              const amount = payload.new.grand_total || payload.new.subtotal || payload.new.total_amount || 0;
              const rawAddress = payload.new.delivery_address || "Kakinada, Andhra Pradesh";
              const searchAddr = rawAddress.toLowerCase().includes("kakinada")
                ? rawAddress
                : `${rawAddress}, Kakinada, Andhra Pradesh`;
              const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchAddr)}`;
              const waText = encodeURIComponent(
                `🚨 NEW ORDER #${orderNo} (₹${amount})!\n📍 Address: ${rawAddress}\n🗺️ Maps: ${mapsUrl}`
              );
              const waUrl = `https://api.whatsapp.com/send?phone=919030982289&text=${waText}`;

              toast.custom(
                (t) => (
                  <div className={`${t.visible ? "animate-enter" : "animate-leave"} max-w-md w-full bg-slate-900 text-white shadow-2xl rounded-2xl border-2 border-emerald-500 p-4.5 flex flex-col gap-3 pointer-events-auto`}>
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">🚨</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-emerald-400 text-sm tracking-wide">NEW ORDER RECEIVED!</p>
                          <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                            ₹{amount}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 mt-1 font-semibold">Order #{orderNo}</p>
                        <p className="text-[12px] text-slate-300 mt-1 line-clamp-2">📍 {rawAddress}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2 px-3 rounded-lg text-center transition-colors shadow-sm"
                      >
                        🗺️ Google Maps
                      </a>
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2 px-3 rounded-lg text-center transition-colors shadow-sm"
                      >
                        💬 WhatsApp Alert
                      </a>
                      <button
                        onClick={() => toast.dismiss(t.id)}
                        className="text-slate-400 hover:text-white text-xs px-2.5 py-2 rounded-lg bg-slate-800 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ),
                { duration: 15000, id: `order-${payload.new.id}` }
              );
            }
          } else if (table === "notifications") {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            if (payload.eventType === "INSERT") {
              playNewOrderSound();
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
