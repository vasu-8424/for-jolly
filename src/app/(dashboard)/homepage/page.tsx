"use client";

import { useState } from "react";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  GripVertical, 
  Image as ImageIcon, 
  LayoutGrid, 
  Sparkles, 
  Plus, 
  Trash2, 
  Pencil, 
  ArrowUp, 
  ArrowDown, 
  Smartphone, 
  Tag, 
  Zap, 
  Layers, 
  Loader2,
  ExternalLink
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getHomepageSections, 
  createHomepageSection, 
  updateHomepageSection, 
  deleteHomepageSection, 
  getBanners 
} from "@/actions/homepage";
import { getCategories } from "@/actions/categories";
import { MobilePreview } from "@/components/shared/mobile-preview";
import Link from "next/link";
import toast from "react-hot-toast";

export default function HomepageBuilder() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<any>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Carousel");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [sortOrder, setSortOrder] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Queries
  const { data: sections = [], isLoading: sectionsLoading } = useQuery({
    queryKey: ["homepage-sections"],
    queryFn: getHomepageSections,
  });

  const { data: banners = [] } = useQuery({
    queryKey: ["banners"],
    queryFn: getBanners,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const openCreateDialog = () => {
    setTitle("");
    setType("Carousel");
    setSelectedCategory("");
    setBgColor("#ffffff");
    setSortOrder(sections.length);
    setIsVisible(true);
    setEditingSection(null);
    setIsCreateOpen(true);
  };

  const openEditDialog = (section: any) => {
    setEditingSection(section);
    setTitle(section.title || "");
    setType(section.type || "Carousel");
    setSelectedCategory(section.data_config?.category_id || "");
    setBgColor(section.background_color || "#ffffff");
    setSortOrder(section.sort_order ?? 0);
    setIsVisible(section.is_visible ?? true);
    setIsCreateOpen(true);
  };

  // Mutations
  const saveSectionMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim()) {
        throw new Error("Section title is required.");
      }

      const payload = {
        title: title.trim(),
        type,
        sort_order: sortOrder,
        is_visible: isVisible,
        background_color: bgColor,
        data_config: {
          category_id: selectedCategory || null,
          limit: 10,
        },
      };

      if (editingSection?.id) {
        const res = await updateHomepageSection(editingSection.id, payload);
        if (!res.success) throw new Error(res.error || "Failed to update section");
        return res;
      } else {
        const res = await createHomepageSection(payload);
        if (!res.success) throw new Error(res.error || "Failed to create section");
        return res;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homepage-sections"] });
      toast.success(editingSection ? "Section updated!" : "New section added below banners!");
      setIsCreateOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save section");
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteHomepageSection(id);
      if (!res.success) throw new Error(res.error || "Failed to delete section");
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homepage-sections"] });
      toast.success("Section removed");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete section");
    },
  });

  const toggleVisibility = async (id: string, currentVal: boolean) => {
    await updateHomepageSection(id, { is_visible: !currentVal });
    queryClient.invalidateQueries({ queryKey: ["homepage-sections"] });
    toast.success("Section visibility updated");
  };

  const moveSection = async (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === sections.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const currentItem = sections[index];
    const targetItem = sections[targetIndex];

    await updateHomepageSection(currentItem.id, { sort_order: targetItem.sort_order });
    await updateHomepageSection(targetItem.id, { sort_order: currentItem.sort_order });
    queryClient.invalidateQueries({ queryKey: ["homepage-sections"] });
  };

  const getTypeIcon = (secType: string) => {
    switch (secType) {
      case "Categories":
        return <Tag className="w-4 h-4 text-emerald-500" />;
      case "Flash Sale":
        return <Zap className="w-4 h-4 text-amber-500" />;
      case "Banner":
        return <ImageIcon className="w-4 h-4 text-pink-500" />;
      case "Grid":
        return <LayoutGrid className="w-4 h-4 text-blue-500" />;
      default:
        return <Layers className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <PageTransition>
      <div className="flex gap-6 h-full max-w-7xl mx-auto pb-8">
        <div className="flex-1 min-w-0 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-heading font-bold tracking-tight">Homepage Builder</h1>
              <p className="text-muted-foreground mt-2">
                Configure your app layout: top banner carousel and dynamic product sections below.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild className="gap-2">
                <Link href="/marketing/banners">
                  <ImageIcon className="w-4 h-4" /> Manage Banners
                </Link>
              </Button>
              <Button onClick={openCreateDialog} className="gap-2 shadow-md">
                <Plus className="w-4 h-4" /> Add Section
              </Button>
            </div>
          </div>

          {/* Top Banner Carousel Overview Card */}
          <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-card to-card shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold">1. Top Scrolling Banner Carousel</CardTitle>
                    <CardDescription className="text-xs">
                      Always appears at the very top of the customer app home screen.
                    </CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="sm" asChild className="gap-1 text-emerald-600 dark:text-emerald-400">
                  <Link href="/marketing/banners">
                    Edit Banners <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {banners.length === 0 ? (
                <div className="p-4 border-2 border-dashed rounded-xl flex items-center justify-between bg-muted/20">
                  <span className="text-xs text-muted-foreground">No hero banners uploaded yet.</span>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/marketing/banners">+ Upload Banner</Link>
                  </Button>
                </div>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
                  {banners.map((b: any, idx: number) => {
                    const img = b.image_url || b.mobile_image_url || b.desktop_image_url;
                    return (
                      <div key={b.id} className="relative w-44 h-24 rounded-lg overflow-hidden border flex-shrink-0 bg-muted shadow-sm">
                        {img && <img src={img} alt={b.title} className="w-full h-full object-cover" />}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-2 text-white">
                          <p className="text-[11px] font-bold truncate">{b.title}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sections List immediately below Banners */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span>2. Homepage Sections</span>
                <span className="text-xs font-normal text-muted-foreground">(Placed immediately below top banners)</span>
              </h2>
              <span className="text-xs text-muted-foreground font-medium">{sections.length} Sections Configured</span>
            </div>

            {sectionsLoading ? (
              <div className="h-64 flex items-center justify-center border rounded-xl bg-card">
                <p className="text-muted-foreground animate-pulse">Loading homepage layout...</p>
              </div>
            ) : sections.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-xl bg-card/50">
                <LayoutGrid className="w-10 h-10 text-muted-foreground/40 mb-3" />
                <h3 className="font-bold text-base text-foreground">No dynamic sections created</h3>
                <p className="text-xs text-muted-foreground max-w-sm mt-1">
                  Add product carousels, category shortcuts, or flash sale grids that will display below your banner carousel.
                </p>
                <Button onClick={openCreateDialog} className="mt-4 gap-2">
                  <Plus className="w-4 h-4" /> Create First Section
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {sections.map((section: any, idx: number) => (
                  <Card key={section.id} className="border-border shadow-sm bg-card/90 backdrop-blur-xl group hover:border-primary/40 transition-all">
                    <CardContent className="p-4 flex items-center gap-4">
                      {/* Reorder Buttons */}
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          disabled={idx === 0}
                          onClick={() => moveSection(idx, "up")}
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          disabled={idx === sections.length - 1}
                          onClick={() => moveSection(idx, "down")}
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      {/* Icon */}
                      <div className="w-11 h-11 rounded-xl bg-muted border flex items-center justify-center flex-shrink-0 shadow-sm">
                        {getTypeIcon(section.type)}
                      </div>

                      {/* Section Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground truncate">{section.title}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {section.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Order: #{idx + 1} • {section.is_visible ? "Visible on App" : "Hidden"}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(section)}
                          title="Edit Section"
                        >
                          <Pencil className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:text-destructive"
                          onClick={() => {
                            if (confirm(`Delete section "${section.title}"?`)) {
                              deleteSectionMutation.mutate(section.id);
                            }
                          }}
                          title="Delete Section"
                        >
                          <Trash2 className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        <div className="border-l pl-3 flex items-center gap-2">
                          <Switch
                            checked={section.is_visible}
                            onCheckedChange={() => toggleVisibility(section.id, section.is_visible)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Button
                  variant="outline"
                  onClick={openCreateDialog}
                  className="w-full border-dashed border-2 bg-transparent hover:bg-muted/50 h-14 mt-4 gap-2 font-medium"
                >
                  <Plus className="w-4 h-4" /> Add Another Homepage Section
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Live Mobile App Simulation Preview */}
        <MobilePreview title="App Homepage Live Preview">
          <div className="flex flex-col bg-slate-50 dark:bg-slate-900 min-h-full pb-8">
            {/* Top App Header */}
            <div className="bg-emerald-700 text-white p-4 pt-6 rounded-b-2xl shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-emerald-200 uppercase font-bold tracking-wider">Delivering To</span>
                  <p className="text-xs font-bold truncate">Main Road, Kakinada 📍</p>
                </div>
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                  KF
                </div>
              </div>
              <div className="bg-white text-muted-foreground px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 shadow-inner">
                🔍 <span>Search fresh vegetables, fruits...</span>
              </div>
            </div>

            {/* 1. TOP SCROLLING BANNERS IN APP */}
            <div className="p-3">
              {banners.filter((b: any) => b.is_visible).length > 0 ? (
                <div className="relative aspect-[2/1] rounded-xl overflow-hidden shadow-md bg-muted">
                  <img
                    src={
                      banners.filter((b: any) => b.is_visible)[0]?.image_url ||
                      banners.filter((b: any) => b.is_visible)[0]?.mobile_image_url
                    }
                    alt="Banner"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 bg-black/40 px-2 py-0.5 rounded-full">
                    {banners.filter((b: any) => b.is_visible).map((_: any, i: number) => (
                      <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full ${i === 0 ? "bg-white" : "bg-white/40"}`}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="aspect-[2/1] rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-center p-3 text-emerald-600 text-xs">
                  Upload top banner in Banner Manager
                </div>
              )}
            </div>

            {/* 2. DYNAMIC HOMEPAGE SECTIONS IMMEDIATELY BELOW BANNERS */}
            <div className="space-y-4 px-3 pt-1">
              {sections.filter((s: any) => s.is_visible).length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  No visible sections below banner.
                </div>
              ) : (
                sections.filter((s: any) => s.is_visible).map((section: any) => (
                  <div key={section.id} className="space-y-2 bg-white dark:bg-card p-3 rounded-xl border shadow-sm">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-foreground">{section.title}</h4>
                      <span className="text-[10px] text-emerald-600 font-semibold cursor-pointer">View All</span>
                    </div>

                    {/* Section Layout Rendering Mock */}
                    {section.type === "Categories" ? (
                      <div className="grid grid-cols-4 gap-2 pt-1">
                        {categories.slice(0, 4).map((c: any) => (
                          <div key={c.id} className="flex flex-col items-center gap-1">
                            <div className="w-10 h-10 rounded-full bg-emerald-50 border flex items-center justify-center text-[10px] overflow-hidden">
                              {c.image ? <img src={c.image} alt={c.name} className="w-full h-full object-cover" /> : "🥗"}
                            </div>
                            <span className="text-[9px] font-medium text-center truncate w-full">{c.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : section.type === "Flash Sale" ? (
                      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        <div className="w-24 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-amber-600">⚡ 40% OFF</span>
                          <p className="text-[10px] truncate mt-1">Fresh Tomatoes</p>
                          <p className="text-[10px] font-bold">₹24</p>
                        </div>
                        <div className="w-24 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-amber-600">⚡ 30% OFF</span>
                          <p className="text-[10px] truncate mt-1">Organic Onions</p>
                          <p className="text-[10px] font-bold">₹35</p>
                        </div>
                      </div>
                    ) : (
                      /* Carousel / Grid product card mock */
                      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        <div className="w-28 p-2 border rounded-lg bg-background flex-shrink-0">
                          <div className="h-14 bg-muted rounded-md mb-1 flex items-center justify-center text-xs">🥦</div>
                          <p className="text-[10px] font-semibold truncate">Fresh Farm Item</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] font-bold text-emerald-600">₹40</span>
                            <span className="text-[8px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-bold">+</span>
                          </div>
                        </div>
                        <div className="w-28 p-2 border rounded-lg bg-background flex-shrink-0">
                          <div className="h-14 bg-muted rounded-md mb-1 flex items-center justify-center text-xs">🍎</div>
                          <p className="text-[10px] font-semibold truncate">Apples Box</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] font-bold text-emerald-600">₹120</span>
                            <span className="text-[8px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-bold">+</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </MobilePreview>
      </div>

      {/* Create / Edit Section Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-primary" />
              {editingSection ? "Edit Homepage Section" : "Add New Homepage Section"}
            </DialogTitle>
            <DialogDescription>
              This section will appear dynamically on your mobile app homepage below the top banners.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Section Title</label>
              <Input
                placeholder="e.g. Fresh Vegetables, Trending Deals, Daily Essentials"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Section Layout Type</label>
                <Select value={type} onValueChange={(val) => setType(val || "Carousel")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Carousel">Carousel (Horizontal Scroll)</SelectItem>
                    <SelectItem value="Grid">Grid (2/4 Column Grid)</SelectItem>
                    <SelectItem value="Categories">Categories (Icon List)</SelectItem>
                    <SelectItem value="Flash Sale">Flash Sale (Discount Deals)</SelectItem>
                    <SelectItem value="Collection">Collection (Curated List)</SelectItem>
                    <SelectItem value="Banner">Banner Strip</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Filter by Category</label>
                <Select value={selectedCategory} onValueChange={(val) => setSelectedCategory(val || "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Display Sort Order</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Background Color</label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    className="w-12 h-10 p-1 cursor-pointer"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                  />
                  <Input
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    placeholder="#ffffff"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
              <div className="space-y-0.5">
                <span className="text-sm font-medium">Publish Section to App</span>
                <p className="text-xs text-muted-foreground">Display this section on customer devices.</p>
              </div>
              <Switch checked={isVisible} onCheckedChange={setIsVisible} />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => saveSectionMutation.mutate()} disabled={saveSectionMutation.isPending}>
              {saveSectionMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingSection ? "Save Changes" : "Create Section"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
