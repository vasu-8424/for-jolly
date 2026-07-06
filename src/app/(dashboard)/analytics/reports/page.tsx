"use client";

import { PageTransition } from "@/components/layout/page-transition";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";

export default function FinancialReportsPage() {
  // Empty in production until connected to Supabase
  const reports: any[] = [];

  const columns = [
    {
      accessorKey: "id",
      header: "Report ID",
      cell: ({ row }: any) => <span className="font-mono">{row.getValue("id")}</span>
    },
    {
      accessorKey: "date",
      header: "Date Range",
      cell: ({ row }: any) => <span className="text-sm">{format(new Date(row.getValue("date")), "MMM dd, yyyy")}</span>
    },
    {
      accessorKey: "type",
      header: "Report Type",
    },
    {
      accessorKey: "orders",
      header: "Total Orders",
    },
    {
      accessorKey: "revenue",
      header: "Net Revenue",
      cell: ({ row }: any) => <span className="font-semibold text-primary">₹{row.getValue("revenue").toLocaleString()}</span>
    },
    {
      id: "actions",
      header: () => <div className="text-right">Export</div>,
      cell: ({ row }: any) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="icon" title="Download CSV">
            <FileSpreadsheet className="w-4 h-4 text-muted-foreground hover:text-success" />
          </Button>
          <Button variant="ghost" size="icon" title="Download PDF">
            <Download className="w-4 h-4 text-muted-foreground hover:text-primary" />
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
            <h1 className="text-3xl font-heading font-bold tracking-tight">Financial Reports</h1>
            <p className="text-muted-foreground mt-2">Export tabular data for accounting and compliance.</p>
          </div>
          <Button className="gap-2 shadow-md">
            <Download className="w-4 h-4" /> Export All (CSV)
          </Button>
        </div>

        {reports.length === 0 ? (
          <div className="h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center bg-card/50">
            <FileSpreadsheet className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-bold">No Reports Generated</h3>
            <p className="text-muted-foreground mt-2 max-w-md text-center text-sm">Financial reports will appear here once orders start coming in.</p>
          </div>
        ) : (
          <DataTable columns={columns} data={reports} searchKey="id" />
        )}
      </div>
    </PageTransition>
  );
}
