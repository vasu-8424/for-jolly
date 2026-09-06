"use client";

import { useState } from "react";
import { PageTransition } from "@/components/layout/page-transition";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, Image as ImageIcon, Link as LinkIcon, Trash2, Pencil, Loader2, Sparkles, ExternalLink } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBanners, createBanner, updateBanner, deleteBanner, BannerRecord } from "@/actions/banners";
import { ImageUpload } from "@/components/shared/image-upload";
import toast from "react-hot-toast";
import type { ColumnDef } from "@tanstack/react-table";

export default function BannerManagerPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerRecord | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkTarget, setLinkTarget] = useState("");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  // Queries
  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["banners"],
    queryFn: getBanners,
  });

  const openCreateDialog = () => {
    setTitle("");
    setSubtitle("");
    setImageUrl("");
    setLinkTarget("");
    setDisplayOrder(banners.length);
    setIsActive(true);
    setEditingBanner(null);
    setIsCreateOpen(true);
  };

  const openEditDialog = (banner: BannerRecord) => {
    setEditingBanner(banner);
    setTitle(banner.title || "");
    setSubtitle(banner.subtitle || "");
    setImageUrl(banner.image_url || "");
    setLinkTarget(banner.link_target || "");
    setDisplayOrder(banner.display_order ?? 0);
    setIsActive(banner.is_active ?? true);
    setIsCreateOpen(true);
  };

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!imageUrl) {
        throw new Error("Please upload a banner image.");
      }

      const payload = {
        title: title || undefined,
        subtitle: subtitle || undefined,
        image_url: imageUrl,
        link_target: linkTarget || undefined,
        display_order: displayOrder,
        is_active: isActive,
      };

      if (editingBanner?.id) {
        const res = await updateBanner(editingBanner.id, payload);
        if (!res.success) throw new Error(res.error || "Failed to update banner");
        return res;
      } else {
        const res = await createBanner(payload);
        if (!res.success) throw new Error(res.error || "Failed to create banner");
        return res;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      toast.success(editingBanner ? "Banner updated successfully!" : "Banner uploaded and published!");
      setIsCreateOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save banner");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteBanner(id);
      if (!res.success) throw new Error(res.error || "Failed to delete banner");
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      toast.success("Banner deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete banner");
    },
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const res = await updateBanner(id, { is_active });
      if (!res.success) throw new Error(res.error || "Failed to toggle status");
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      toast.success("Banner status updated");
    },
  });

  const columns: ColumnDef<BannerRecord>[] = [
    {
      accessorKey: "image_url",
      header: "Banner Preview",
      cell: ({ row }) => {
        const b = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="w-24 h-12 bg-muted rounded-lg border overflow-hidden flex-shrink-0 shadow-sm">
              {b.image_url ? (
                <img src={b.image_url} alt={b.title || "Banner"} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <ImageIcon className="w-4 h-4" />
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-foreground text-sm">{b.title || "Untitled Banner"}</span>
              {b.subtitle && (
                <span className="text-xs text-muted-foreground line-clamp-1">{b.subtitle}</span>
              )}
              <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                {b.link_target ? (
                  <>
                    <LinkIcon className="w-3 h-3 text-primary" />
                    <span className="truncate max-w-[200px]">{b.link_target}</span>
                  </>
                ) : (
                  "No link attached"
                )}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "display_order",
      header: "Carousel Order",
      cell: ({ row }) => (
        <span className="font-mono text-sm font-semibold">#{row.original.display_order ?? 0}</span>
      ),
    },
    {
      accessorKey: "is_active",
      header: "App Visibility",
      cell: ({ row }) => {
        const active = row.original.is_active ?? true;
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={active}
              onCheckedChange={(checked) =>
                toggleVisibilityMutation.mutate({ id: row.original.id, is_active: checked })
              }
            />
            <span className="text-xs font-medium text-muted-foreground">
              {active ? "Active" : "Hidden"}
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const banner = row.original;
        return (
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="icon" onClick={() => openEditDialog(banner)} title="Edit Banner">
              <Pencil className="w-4 h-4 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hover:text-destructive"
              onClick={() => {
                if (confirm("Are you sure you want to delete this promotional banner?")) {
                  deleteMutation.mutate(banner.id);
                }
              }}
              title="Delete Banner"
            >
              <Trash2 className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <PageTransition>
      <div className="space-y-6 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold tracking-tight">Banner Manager</h1>
            <p className="text-muted-foreground mt-2">
              Upload and organize auto-scrolling promotional banners displayed at the top of your mobile app homepage.
            </p>
          </div>
          <Button onClick={openCreateDialog} className="gap-2 shadow-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
            <Plus className="w-4 h-4" /> Upload Banner
          </Button>
        </div>

        {/* Live Top Carousel Preview Banner Bar */}
        {banners.length > 0 && (
          <div className="p-4 bg-gradient-to-r from-emerald-950/40 via-card to-emerald-950/20 border border-emerald-500/30 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Live App Hero Banner Carousel ({banners.filter((b) => b.is_active).length} Active)
                </span>
              </div>
              <span className="text-xs text-muted-foreground">Ordered by Carousel Order #</span>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
              {banners.map((b, idx) => {
                return (
                  <div
                    key={b.id}
                    className={`relative w-72 h-36 rounded-xl overflow-hidden border flex-shrink-0 shadow-md transition-all ${
                      b.is_active ? "border-emerald-500/50" : "opacity-40 grayscale"
                    }`}
                  >
                    {b.image_url ? (
                      <img src={b.image_url} alt={b.title || "Banner"} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-3 text-white">
                      <p className="text-xs font-bold truncate">{b.title || "Untitled Banner"}</p>
                      {b.subtitle && <p className="text-[10px] text-white/80 line-clamp-1">{b.subtitle}</p>}
                      <p className="text-[10px] text-emerald-400 font-mono mt-0.5">Order #{b.display_order}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="h-64 flex items-center justify-center border rounded-xl bg-card">
            <p className="text-muted-foreground animate-pulse">Loading banners from Supabase...</p>
          </div>
        ) : banners.length === 0 ? (
          <div className="h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center bg-card/50">
            <ImageIcon className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-bold">No Banners Uploaded</h3>
            <p className="text-muted-foreground mt-2 max-w-md text-center text-sm">
              Upload your first promotional banner to display in the top scrolling carousel of your mobile app homepage.
            </p>
            <Button onClick={openCreateDialog} className="mt-6 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
              <Plus className="w-4 h-4" /> Upload Banner
            </Button>
          </div>
        ) : (
          <DataTable columns={columns} data={banners} searchKey="title" />
        )}
      </div>

      {/* Upload / Edit Banner Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-emerald-600" />
              {editingBanner ? "Edit Promotional Banner" : "Upload New Promotional Banner"}
            </DialogTitle>
            <DialogDescription>
              This banner will appear in the auto-scrolling carousel at the top of your mobile app homepage.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Banner Title / Campaign Heading</label>
              <Input
                placeholder="e.g. 50% Off Fresh Vegetables"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Subtitle / Tagline (Optional)</label>
              <Input
                placeholder="e.g. Organic & Handpicked Daily"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Banner Image</label>
              <ImageUpload
                value={imageUrl ? [imageUrl] : []}
                onChange={(urls) => setImageUrl(urls[0] || "")}
                bucket="banners"
                maxFiles={1}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Tap Action / Link Target (Optional)</label>
                <Input
                  placeholder="e.g. /category/sea-food"
                  value={linkTarget}
                  onChange={(e) => setLinkTarget(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Display Order</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
              <div className="space-y-0.5">
                <span className="text-sm font-medium">Publish to App</span>
                <p className="text-xs text-muted-foreground">Make this banner active in the mobile app carousel immediately.</p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
              {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingBanner ? "Update Banner" : "Upload & Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
