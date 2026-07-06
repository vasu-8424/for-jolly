"use client";

import { PageTransition } from "@/components/layout/page-transition";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Image as ImageIcon, Link as LinkIcon, Power } from "lucide-react";
import { format } from "date-fns";

export default function BannerManagerPage() {
  // Fetch banners from Supabase in production
  const banners: any[] = [];
  const columns = [
    {
      accessorKey: "title",
      header: "Banner Title",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-3">
          <div className="w-16 h-8 bg-muted rounded-md border flex items-center justify-center">
            <ImageIcon className="w-4 h-4 text-muted-foreground" />
          </div>
          <span className="font-medium">{row.getValue("title")}</span>
        </div>
      )
    },
    {
      accessorKey: "type",
      header: "Placement",
    },
    {
      accessorKey: "end_date",
      header: "Expires On",
      cell: ({ row }: any) => <span className="text-sm">{format(new Date(row.getValue("end_date")), "MMM dd, yyyy")}</span>
    },
    {
      accessorKey: "active",
      header: "Status",
      cell: ({ row }: any) => (
        <Badge variant={row.getValue("active") ? "success" : "secondary"}>
          {row.getValue("active") ? "Active" : "Disabled"}
        </Badge>
      )
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }: any) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="icon" title="Edit Link">
            <LinkIcon className="w-4 h-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" title="Toggle Active">
            <Power className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <PageTransition>
      <div className="space-y-6 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold tracking-tight">Banner Manager</h1>
            <p className="text-muted-foreground mt-2">Upload and schedule promotional banners across the app.</p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> Create Banner
          </Button>
        </div>

        {banners.length === 0 ? (
          <div className="h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center bg-card/50">
            <ImageIcon className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-bold">No Banners Uploaded</h3>
            <p className="text-muted-foreground mt-2 max-w-md text-center text-sm">Upload your first promotional banner to display on the Flutter homepage.</p>
            <Button className="mt-6 gap-2">
              <Plus className="w-4 h-4" /> Create Banner
            </Button>
          </div>
        ) : (
          <DataTable columns={columns} data={banners} searchKey="title" />
        )}
      </div>
    </PageTransition>
  );
}
