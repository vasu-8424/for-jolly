"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Safely ignore when called outside Next.js request context
  }
}

export interface OnboardingScreenRecord {
  id?: string;
  display_order: number;
  image_url: string;
  title: string;
  subtitle: string;
  updated_at?: string;
}

const DEFAULT_ONBOARDING_SCREENS: OnboardingScreenRecord[] = [
  {
    display_order: 1,
    image_url: "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?auto=format&fit=crop&w=1200&q=80",
    title: "Fresh Sea Food - Catch Of The Day",
    subtitle: "Direct from the Bay of Bengal to your kitchen. Premium quality prawns, fish & crab delivered fresh daily.",
  },
  {
    display_order: 2,
    image_url: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=1200&q=80",
    title: "Prime Cut Meat - Hygienic & Tender",
    subtitle: "100% antibiotic-free, expertly cut chicken, mutton, and fresh meats handled with supreme safety.",
  },
  {
    display_order: 3,
    image_url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80",
    title: "Farm Fresh Greens - Organic Vegetables",
    subtitle: "Hand-picked crisp vegetables and essentials sourced directly from local organic farms every morning.",
  },
];

export async function getOnboardingScreens(): Promise<OnboardingScreenRecord[]> {
  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from("onboarding_screens")
      .select("*")
      .order("display_order", { ascending: true });

    if (error || !data || data.length === 0) {
      return DEFAULT_ONBOARDING_SCREENS;
    }

    // Ensure all 3 slots (1, 2, 3) are represented
    return [1, 2, 3].map((slot) => {
      const found = data.find((d: any) => d.display_order === slot);
      return found || DEFAULT_ONBOARDING_SCREENS[slot - 1];
    });
  } catch (err) {
    console.error("Error fetching onboarding screens:", err);
    return DEFAULT_ONBOARDING_SCREENS;
  }
}

export async function updateOnboardingScreen(
  displayOrder: number,
  values: {
    image_url: string;
    title: string;
    subtitle: string;
  }
) {
  try {
    const supabase = await createAdminClient();

    const payload = {
      display_order: displayOrder,
      image_url: values.image_url.trim(),
      title: values.title.trim(),
      subtitle: values.subtitle.trim(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("onboarding_screens")
      .upsert(payload, { onConflict: "display_order" })
      .select()
      .single();

    if (error) {
      console.error("Error updating onboarding screen:", error);
      return { success: false, error: error.message };
    }

    safeRevalidatePath("/marketing/onboarding");
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update onboarding screen" };
  }
}
