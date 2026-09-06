"use client";

import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/shared/image-upload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Sparkles, Save, CheckCircle2, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOnboardingScreens, updateOnboardingScreen, OnboardingScreenRecord } from "@/actions/onboarding";
import toast from "react-hot-toast";

export default function OnboardingScreensPage() {
  const queryClient = useQueryClient();
  const [activeSlot, setActiveSlot] = useState<number>(1);
  const [formData, setFormData] = useState<Record<number, { title: string; subtitle: string; image_url: string }>>({
    1: { title: "", subtitle: "", image_url: "" },
    2: { title: "", subtitle: "", image_url: "" },
    3: { title: "", subtitle: "", image_url: "" },
  });

  const { data: screens = [], isLoading } = useQuery({
    queryKey: ["onboarding_screens"],
    queryFn: getOnboardingScreens,
  });

  useEffect(() => {
    if (screens && screens.length > 0) {
      const initial: Record<number, { title: string; subtitle: string; image_url: string }> = {};
      screens.forEach((s) => {
        initial[s.display_order] = {
          title: s.title || "",
          subtitle: s.subtitle || "",
          image_url: s.image_url || "",
        };
      });
      setFormData((prev) => ({ ...prev, ...initial }));
    }
  }, [screens]);

  const updateMutation = useMutation({
    mutationFn: async ({ slot, data }: { slot: number; data: { title: string; subtitle: string; image_url: string } }) => {
      const res = await updateOnboardingScreen(slot, data);
      if (!res.success) throw new Error(res.error || "Failed to update screen");
      return res;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["onboarding_screens"] });
      toast.success(`Screen #${variables.slot} saved successfully!`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save screen");
    },
  });

  const currentForm = formData[activeSlot] || { title: "", subtitle: "", image_url: "" };

  const handleFieldChange = (field: "title" | "subtitle" | "image_url", value: string) => {
    setFormData((prev) => ({
      ...prev,
      [activeSlot]: {
        ...prev[activeSlot],
        [field]: value,
      },
    }));
  };

  const handleSaveCurrent = () => {
    if (!currentForm.title.trim() || !currentForm.image_url.trim()) {
      toast.error("Please provide both a title and an image.");
      return;
    }
    updateMutation.mutate({ slot: activeSlot, data: currentForm });
  };

  const slotLabels: Record<number, { name: string; tag: string }> = {
    1: { name: "Screen 1: Fresh Seafood", tag: "Daily Catch" },
    2: { name: "Screen 2: Prime Meat", tag: "Hygienic Cuts" },
    3: { name: "Screen 3: Farm Greens", tag: "Organic Produce" },
  };

  return (
    <PageTransition>
      <div className="space-y-8 pb-12 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-heading font-bold tracking-tight">Onboarding Screens</h1>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">
                Live App Introduction (3 Slides)
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              Customize the 3 visual walkthrough screens shown to new customers when they open the mobile app.
            </p>
          </div>
          <Button
            onClick={handleSaveCurrent}
            disabled={updateMutation.isPending || isLoading}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md font-semibold"
          >
            <Save className="w-4 h-4" />
            {updateMutation.isPending ? "Saving Changes..." : `Save Screen #${activeSlot}`}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Editor Form */}
          <div className="lg:col-span-7 space-y-6">
            <Tabs value={String(activeSlot)} onValueChange={(v) => setActiveSlot(Number(v))}>
              <TabsList className="grid grid-cols-3 w-full h-12 bg-muted/60 p-1">
                <TabsTrigger value="1" className="font-semibold text-xs sm:text-sm">
                  Slide #1
                </TabsTrigger>
                <TabsTrigger value="2" className="font-semibold text-xs sm:text-sm">
                  Slide #2
                </TabsTrigger>
                <TabsTrigger value="3" className="font-semibold text-xs sm:text-sm">
                  Slide #3
                </TabsTrigger>
              </TabsList>

              {[1, 2, 3].map((slot) => (
                <TabsContent key={slot} value={String(slot)} className="mt-6 space-y-6">
                  <Card className="shadow-sm border-border">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <span>{slotLabels[slot].name}</span>
                          </CardTitle>
                          <CardDescription>
                            Configure image and messaging for Step {slot} of 3.
                          </CardDescription>
                        </div>
                        <Badge variant="secondary">{slotLabels[slot].tag}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {/* Image Upload */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold">Hero Background Image</label>
                        <ImageUpload
                          value={formData[slot]?.image_url ? [formData[slot].image_url] : []}
                          onChange={(urls) => handleFieldChange("image_url", urls[0] || "")}
                          bucket="banners"
                          maxFiles={1}
                        />
                        <p className="text-xs text-muted-foreground">
                          Recommended ratio: 4:3 or 16:9 high resolution landscape/square photograph.
                        </p>
                      </div>

                      {/* Title */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold">Slide Title / Headline</label>
                        <Input
                          value={formData[slot]?.title || ""}
                          onChange={(e) => handleFieldChange("title", e.target.value)}
                          placeholder="e.g. Fresh Sea Food - Catch Of The Day"
                          className="font-medium"
                        />
                      </div>

                      {/* Subtitle */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold">Description / Subtitle</label>
                        <Textarea
                          value={formData[slot]?.subtitle || ""}
                          onChange={(e) => handleFieldChange("subtitle", e.target.value)}
                          placeholder="Short description highlighting your freshness guarantee..."
                          className="h-24 resize-none leading-relaxed"
                        />
                      </div>

                      <div className="pt-2 flex justify-end">
                        <Button
                          onClick={handleSaveCurrent}
                          disabled={updateMutation.isPending}
                          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Save & Publish Slide #{slot}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          {/* Interactive Mobile Mockup Preview */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="text-center mb-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5" /> Customer App Real-Time Preview
              </span>
            </div>

            <div className="relative w-[320px] h-[640px] bg-black rounded-[3rem] border-8 border-black shadow-2xl overflow-hidden flex flex-col">
              {/* Top Notch */}
              <div className="absolute top-0 inset-x-0 h-6 bg-black z-30 rounded-b-3xl w-36 mx-auto" />

              {/* Status Bar */}
              <div className="h-8 bg-transparent w-full flex items-center justify-between px-6 absolute top-0 z-20 text-[10px] font-semibold text-white/90">
                <span>9:41</span>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-2 bg-white/90 rounded-sm" />
                </div>
              </div>

              {/* Skip Button */}
              {activeSlot < 3 && (
                <div className="absolute top-10 right-4 z-20 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full shadow-sm text-xs font-bold text-slate-800">
                  Skip
                </div>
              )}

              {/* Onboarding Screen Content */}
              <div className="flex-1 flex flex-col bg-[#F9F6EA] relative overflow-hidden">
                {/* Image Section (Top 42%) */}
                <div className="h-[42%] w-full relative bg-slate-200">
                  {currentForm.image_url ? (
                    <img
                      src={currentForm.image_url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-slate-300">
                      <span className="text-xs font-semibold">Upload Image</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#F9F6EA] via-transparent to-black/20" />
                </div>

                {/* Logo Badge in Center */}
                <div className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-16 h-16 rounded-2xl bg-white shadow-lg p-2 border flex items-center justify-center">
                  <div className="w-full h-full rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xs text-center leading-none">
                    Kakinada Fresh
                  </div>
                </div>

                {/* Bottom Sheet Card */}
                <div className="flex-1 px-6 pt-10 pb-6 flex flex-col justify-between text-center">
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-[#0D3B16] leading-tight">
                      {currentForm.title || `Onboarding Slide #${activeSlot}`}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {currentForm.subtitle || "Handpicked daily freshness direct from local farms and coastal waters."}
                    </p>
                  </div>

                  {/* Feature Badges Mock */}
                  <div className="flex justify-center gap-3 my-2">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 text-xs font-bold">
                        100%
                      </div>
                      <span className="text-[9px] font-bold text-slate-700 mt-1">Fresh</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 text-xs font-bold">
                        ⚡
                      </div>
                      <span className="text-[9px] font-bold text-slate-700 mt-1">Express</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 text-xs font-bold">
                        🛡️
                      </div>
                      <span className="text-[9px] font-bold text-slate-700 mt-1">Hygienic</span>
                    </div>
                  </div>

                  {/* Slide Indicators & Action */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-1.5">
                      {[1, 2, 3].map((dot) => (
                        <div
                          key={dot}
                          onClick={() => setActiveSlot(dot)}
                          className={`h-1.5 rounded-full transition-all cursor-pointer ${
                            dot === activeSlot ? "w-6 bg-[#0D3B16]" : "w-1.5 bg-slate-300"
                          }`}
                        />
                      ))}
                    </div>

                    {activeSlot === 3 ? (
                      <Button className="w-full bg-[#F27427] hover:bg-[#d9631c] text-white font-bold rounded-full py-5 text-xs shadow-md">
                        Get Started <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => setActiveSlot((prev) => Math.min(3, prev + 1))}
                        className="w-full rounded-full py-5 text-xs font-bold border-slate-300 text-slate-700"
                      >
                        Next Slide
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
