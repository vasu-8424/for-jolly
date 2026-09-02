"use client";

import { useEffect, useState } from "react";
import { getPayments, initiateRefundAction } from "@/actions/payments";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPayments = async () => {
    setLoading(true);
    const data = await getPayments();
    setPayments(data);
    setLoading(false);
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const handleRefund = async (paymentId: string, amount: number) => {
    if (confirm("Are you sure you want to initiate a refund for this payment?")) {
      const res = await initiateRefundAction(paymentId, amount, "Admin requested");
      if (res.success) {
        toast.success("Refund initiated successfully!");
        loadPayments();
      } else {
        toast.error(res.error || "Failed to initiate refund");
      }
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold tracking-tight">Payments & Transactions</h1>
            <p className="text-muted-foreground mt-2">View real-time customer payments and handle refunds.</p>
          </div>
          <Button variant="outline" size="sm" onClick={loadPayments} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center border rounded-xl bg-card">
            <p className="text-muted-foreground animate-pulse">Loading transaction records...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center bg-card/50">
            <CreditCard className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-bold">No Transactions Found</h3>
            <p className="text-muted-foreground mt-2 max-w-md text-center text-sm">Customer payments will appear here in real-time as orders are placed.</p>
          </div>
        ) : (
          <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Method</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Transaction ID</th>
                    <th className="px-6 py-3.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                        {payment.orders?.order_number || `#${payment.order_id?.slice(0, 8)}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{payment.users?.full_name || "Customer"}</span>
                        {payment.users?.phone && (
                          <span className="block text-xs text-muted-foreground">{payment.users.phone}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-foreground">
                        ₹{payment.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {payment.payment_method || payment.payment_provider || "Online"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={
                          payment.status === "Paid" ? "default" :
                          payment.status === "Failed" ? "destructive" :
                          payment.status === "Refunded" ? "secondary" : "outline"
                        }>
                          {payment.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-muted-foreground">
                        {payment.transaction_id || payment.gateway_order_id || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {payment.status === "Paid" && (
                          <Button 
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRefund(payment.id, payment.amount)}
                          >
                            Refund
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
