"use client";

import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { GripVertical, Image as ImageIcon, LayoutGrid, Smartphone, Monitor } from "lucide-react";

import { useEffect, useState } from "react";
import { getHomepageSections, updateHomepageSection } from "@/actions/homepage";

export default function HomepageBuilder() {
  const [sections, setSections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSections() {
      setIsLoading(true);
      const data = await getHomepageSections();
      setSections(data);
      setIsLoading(false);
    }
    loadSections();
  }, []);

  const handleToggleVisibility = async (id: string, currentVal: boolean) => {
    // optimistic update
    setSections(sections.map(s => s.id === id ? { ...s, is_visible: !currentVal } : s));
    await updateHomepageSection(id, { is_visible: !currentVal });
  };

  return (
    <PageTransition>
      <div className="space-y-6 pb-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold tracking-tight">Homepage Builder</h1>
            <p className="text-muted-foreground mt-2">Design and organize the mobile app and website homepage.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon"><Smartphone className="w-4 h-4" /></Button>
            <Button variant="outline" size="icon"><Monitor className="w-4 h-4" /></Button>
            <Button className="ml-4">Publish Changes</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Builder Canvas */}
          <div className="lg:col-span-2 space-y-4">
            {isLoading ? (
              <div className="h-64 flex items-center justify-center border border-dashed rounded-xl border-border/50 bg-muted/20">
                <p className="text-muted-foreground animate-pulse">Loading sections...</p>
              </div>
            ) : sections.length === 0 ? (
               <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed rounded-xl border-border/50 bg-muted/20">
                <LayoutGrid className="w-8 h-8 text-muted-foreground/50 mb-3" />
                <h3 className="font-semibold text-foreground">No sections created</h3>
                <p className="text-sm text-muted-foreground max-w-sm mt-1">Start building your homepage by adding banners, carousels, and grids.</p>
              </div>
            ) : (
              sections.map((section) => (
                <Card key={section.id} className="border-border shadow-sm bg-card/80 backdrop-blur-xl group cursor-move">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="cursor-grab text-muted-foreground hover:text-foreground">
                      <GripVertical className="w-5 h-5" />
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-secondary/30 flex items-center justify-center text-primary flex-shrink-0">
                      {section.type === "Banner" || section.type === "Carousel" ? <ImageIcon className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <Input defaultValue={section.title} className="font-semibold h-8 bg-transparent border-transparent hover:border-border focus:border-primary px-2 -ml-2" />
                      <p className="text-xs text-muted-foreground mt-1 px-1">Layout: {section.type}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Button variant="ghost" size="sm" className="hidden group-hover:flex">Edit Content</Button>
                      <Switch 
                        checked={section.is_visible} 
                        onCheckedChange={() => handleToggleVisibility(section.id, section.is_visible)} 
                      />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
            
            <Button variant="outline" className="w-full border-dashed border-2 bg-transparent hover:bg-muted/50 h-16 mt-4">
              + Add New Section
            </Button>
          </div>

          {/* Builder Sidebar Settings */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle>Global Settings</CardTitle>
                <CardDescription>App-wide homepage settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Pull to Refresh</span>
                  <Switch defaultChecked={true} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Sticky Search Bar</span>
                  <Switch defaultChecked={true} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Auto-play Banners</span>
                  <Switch defaultChecked={true} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
