"use client";

import { PageTransition } from "@/components/layout/page-transition";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus, Ticket, Trash2, SwitchCamera, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCoupons, createCoupon, toggleCouponStatus, deleteCoupon } from "@/actions/coupons";
import toast from "react-hot-toast";

export default function CouponManagerPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form fields
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderValue, setMinOrderValue] = useState("");
  const [tagText, setTagText] = useState("");
  const [isFirstOrderOnly, setIsFirstOrderOnly] = useState(false);

  const { data: coupons = [], isLoading, refetch } = useQuery({
    queryKey: ["coupons"],
    queryFn: getCoupons,
  });

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error("Please enter a coupon code.");
      return;
    }

    setIsCreating(true);
    const numValue = Number(discountValue) || 0;

    const res = await createCoupon({
      code: code.trim().toUpperCase(),
      title: title.trim() || code.trim().toUpperCase(),
      description: description.trim(),
      discount_percentage: discountType === "percentage" ? numValue : 0,
      discount_amount: discountType === "fixed" ? numValue : 0,
      min_order_value: Number(minOrderValue) || 0,
      is_first_order: isFirstOrderOnly,
      is_active: true,
      tag_text: tagText.trim(),
    });

    setIsCreating(false);

    if (res.success) {
      toast.success(`Coupon ${code.toUpperCase()} created successfully!`);
      setIsDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    } else {
      toast.error(res.error || "Failed to create coupon.");
    }
  };

  const resetForm = () => {
    setCode("");
    setTitle("");
    setDescription("");
    setDiscountType("percentage");
    setDiscountValue("");
    setMinOrderValue("");
    setTagText("");
    setIsFirstOrderOnly(false);
  };

  const handleToggleStatus = async (id: string, currentActive: boolean) => {
    const res = await toggleCouponStatus(id, !currentActive);
    if (res.success) {
      toast.success(`Coupon ${!currentActive ? "activated" : "deactivated"}.`);
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    } else {
      toast.error("Failed to update status.");
    }
  };

  const handleDelete = async (id: string, couponCode: string) => {
    if (!confirm(`Are you sure you want to delete coupon "${couponCode}"?`)) return;

    const res = await deleteCoupon(id);
    if (res.success) {
      toast.success(`Coupon ${couponCode} deleted.`);
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    } else {
      toast.error("Failed to delete coupon.");
    }
  };

  const columns = [
    {
      accessorKey: "code",
      header: "Coupon Code",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <Ticket className="w-4 h-4 text-emerald-600" />
          <span className="font-bold text-emerald-700 tracking-wider text-sm">{row.getValue("code")}</span>
        </div>
      )
    },
    {
      accessorKey: "title",
      header: "Title & Details",
      cell: ({ row }: any) => (
        <div>
          <p className="font-semibold text-sm">{row.original.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-1">{row.original.description || "No description"}</p>
        </div>
      )
    },
    {
      accessorKey: "discount",
      header: "Discount",
      cell: ({ row }: any) => {
        const item = row.original;
        if (item.discountPercentage > 0) {
          return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">{item.discountPercentage}% OFF</Badge>;
        }
        if (item.discountAmount > 0) {
          return <Badge className="bg-blue-100 text-blue-800 border-blue-200">₹{item.discountAmount} OFF</Badge>;
        }
        return <Badge variant="outline">Promo</Badge>;
      }
    },
    {
      accessorKey: "minOrderValue",
      header: "Min. Order",
      cell: ({ row }: any) => (
        <span className="text-sm font-medium">
          {row.original.minOrderValue > 0 ? `₹${row.original.minOrderValue}` : "No min"}
        </span>
      )
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }: any) => {
        const isActive = row.original.isActive;
        return (
          <Badge variant={isActive ? "success" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        );
      }
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }: any) => {
        const item = row.original;
        return (
          <div className="flex items-center justify-end gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleToggleStatus(item.id, item.isActive)}
              className="text-xs gap-1"
            >
              <SwitchCamera className="w-3 h-3" />
              {item.isActive ? "Deactivate" : "Activate"}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => handleDelete(item.id, item.code)}
              className="hover:text-destructive hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        );
      }
    }
  ];

  return (
    <PageTransition>
      <div className="space-y-6 pb-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold tracking-tight">Coupon Engine</h1>
            <p className="text-muted-foreground mt-2">Create and manage discount codes and promotional offers for customer app.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button onClick={() => setIsDialogOpen(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md">
              <Plus className="w-4 h-4" /> Create Coupon
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="h-64 border rounded-xl flex items-center justify-center text-sm text-muted-foreground animate-pulse">
            Loading coupons from database...
          </div>
        ) : coupons.length === 0 ? (
          <div className="h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center bg-card/50">
            <Ticket className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-bold">No Coupons Created</h3>
            <p className="text-muted-foreground mt-2 max-w-md text-center text-sm">Create your first discount code for customers to use at checkout.</p>
            <Button onClick={() => setIsDialogOpen(true)} className="mt-6 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              <Plus className="w-4 h-4" /> Create Coupon Now
            </Button>
          </div>
        ) : (
          <DataTable columns={columns} data={coupons} searchKey="code" />
        )}

        {/* Create Coupon Modal Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Create New Coupon Code</DialogTitle>
              <DialogDescription>Add a new promotional code for customer app users.</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateCoupon} className="space-y-4 py-2">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-muted-foreground">Coupon Code *</label>
                <Input 
                  value={code} 
                  onChange={(e) => setCode(e.target.value.toUpperCase())} 
                  placeholder="E.g., WELCOME10 or FREESHIP" 
                  className="font-mono uppercase font-bold tracking-wider"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-muted-foreground">Title</label>
                <Input 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="E.g., 10% Off First Order" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-muted-foreground">Description</label>
                <Textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="E.g., Get flat 10% discount on all fresh catch orders..." 
                  className="h-20 resize-none text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Discount Type</label>
                  <select 
                    value={discountType} 
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm font-medium"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Discount Value *</label>
                  <Input 
                    type="number" 
                    value={discountValue} 
                    onChange={(e) => setDiscountValue(e.target.value)} 
                    placeholder={discountType === "percentage" ? "10" : "50"} 
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Min. Order Value (₹)</label>
                  <Input 
                    type="number" 
                    value={minOrderValue} 
                    onChange={(e) => setMinOrderValue(e.target.value)} 
                    placeholder="E.g., 299" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Badge Tag Text</label>
                  <Input 
                    value={tagText} 
                    onChange={(e) => setTagText(e.target.value)} 
                    placeholder="E.g., POPULAR" 
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="firstOrderOnly" 
                  checked={isFirstOrderOnly} 
                  onChange={(e) => setIsFirstOrderOnly(e.target.checked)} 
                  className="rounded border-gray-300 w-4 h-4 accent-emerald-600"
                />
                <label htmlFor="firstOrderOnly" className="text-sm font-medium cursor-pointer">
                  First order only (new customers)
                </label>
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {isCreating ? "Saving..." : "Create Coupon"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
