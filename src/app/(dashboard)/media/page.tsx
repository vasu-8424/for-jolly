"use client";

import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UploadCloud, Search, Folder, Image as ImageIcon, Trash2 } from "lucide-react";

export default function MediaLibraryPage() {
  // Mock grid
  const assets = Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    name: `product_image_${i + 1}.webp`,
    size: "120 KB",
    type: "image"
  }));

  return (
    <PageTransition>
      <div className="space-y-6 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold tracking-tight">Media Library</h1>
            <p className="text-muted-foreground mt-2">Centralized asset management backed by Supabase Storage.</p>
          </div>
          <Button className="gap-2">
            <UploadCloud className="w-4 h-4" /> Upload Files
          </Button>
        </div>

        <div className="flex items-center gap-4 py-4 border-y">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search media by name..." />
          </div>
          <Button variant="outline" className="gap-2">
            <Folder className="w-4 h-4 text-primary" /> Banners
          </Button>
          <Button variant="outline" className="gap-2">
            <Folder className="w-4 h-4 text-primary" /> Products
          </Button>
          <Button variant="outline" className="gap-2">
            <Folder className="w-4 h-4 text-primary" /> Categories
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 pt-4">
          {assets.map((asset) => (
            <div key={asset.id} className="group relative border rounded-xl overflow-hidden bg-card hover:shadow-md transition-all">
              <div className="aspect-square bg-muted flex items-center justify-center p-4">
                <ImageIcon className="w-12 h-12 text-muted-foreground/30" />
              </div>
              <div className="p-3 border-t bg-card/80 backdrop-blur-sm">
                <p className="text-sm font-medium truncate" title={asset.name}>{asset.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{asset.size}</p>
              </div>

              {/* Hover actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full">
                  <Search className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageTransition>
  );
}
