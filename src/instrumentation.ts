export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initRealtimeOrderListener } = await import("@/services/realtime-order-listener");
    initRealtimeOrderListener();
    console.log("[Instrumentation] Realtime Order Alert Service initialized.");
  }
}
