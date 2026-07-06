"use client";

import { PageTransition } from "@/components/layout/page-transition";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Pencil, Globe } from "lucide-react";
import { format } from "date-fns";
import type { ColumnDef } from "@tanstack/react-table";

// Static mock data
const MOCK_DATE = new Date("2026-07-01T00:00:00Z").getTime();
const pages = [
  { id: 1, title: "Privacy Policy", slug: "/privacy-policy", updated_at: new Date(MOCK_DATE).toISOString(), status: "Published" },
  { id: 2, title: "Terms & Conditions", slug: "/terms", updated_at: new Date(MOCK_DATE - 86400000).toISOString(), status: "Published" },
  { id: 3, title: "Refund Policy", slug: "/refunds", updated_at: new Date(MOCK_DATE - 186400000).toISOString(), status: "Draft" },
  { id: 4, title: "About Us", slug: "/about", updated_at: new Date(MOCK_DATE - 886400000).toISOString(), status: "Published" },
];

type PageData = typeof pages[0];

const columns: ColumnDef<PageData>[] = [
  {
    accessorKey: "title",
    header: "Page Title",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-muted-foreground" />
        <span className="font-bold">{String(row.getValue("title"))}</span>
      </div>
    )
  },
  {
    accessorKey: "slug",
    header: "App Slug",
    cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground bg-muted p-1 rounded">{String(row.getValue("slug"))}</span>
  },
  {
    accessorKey: "updated_at",
    header: "Last Edited",
    cell: ({ row }) => <span className="text-sm">{format(new Date(String(row.getValue("updated_at"))), "MMM dd, yyyy")}</span>
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.getValue("status") === "Published" ? "success" : "secondary"}>
        {String(row.getValue("status"))}
      </Badge>
    )
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: () => (
      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" size="icon" title="View Web Page">
          <Globe className="w-4 h-4 text-muted-foreground hover:text-primary" />
        </Button>
        <Button variant="ghost" size="icon" title="Edit Content">
          <Pencil className="w-4 h-4 text-muted-foreground hover:text-primary" />
        </Button>
      </div>
    )
  }
];

export default function CMSPage() {
  return (
    <PageTransition>
      <div className="space-y-6 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold tracking-tight">CMS Manager</h1>
            <p className="text-muted-foreground mt-2">Manage static pages like Privacy, Terms, and About Us.</p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> Create New Page
          </Button>
        </div>

        <DataTable columns={columns} data={pages} searchKey="title" />
      </div>
    </PageTransition>
  );
}
