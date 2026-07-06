"use client";

import { use, useEffect, useState } from "react";
import { getOrderById } from "@/actions/orders";
import { InvoiceTemplate } from "@/components/orders/invoice-template";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function InvoicePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      let data = await getOrderById(resolvedParams.id);
      if (!data) {
        // Fallback for UI demo
        data = {
          id: resolvedParams.id,
          created_at: new Date().toISOString(),
          status: "Delivered",
          total_amount: 1240.50,
          payment_status: "Paid",
          payment_method: "UPI",
          profiles: { full_name: "Rahul Sharma", phone_number: "+91 9876543210", email: "rahul@example.com" },
          delivery_address: "Flat 402, Sunshine Apartments, Main Road, Kakinada, AP - 533001",
          order_items: [
            { id: 1, product: { name: "Fresh Tomatoes" }, quantity: 2, unit_price: 40, total_price: 80 },
            { id: 2, product: { name: "Aashirvaad Atta 5kg" }, quantity: 1, unit_price: 240, total_price: 240 },
            { id: 3, product: { name: "Fortune Sunflower Oil 1L" }, quantity: 2, unit_price: 150, total_price: 300 }
          ]
        };
      }
      setOrder(data);
      // Wait for React to render, then open print dialog
      setTimeout(() => {
        window.print();
      }, 500);
    };
    fetchOrder();
  }, [resolvedParams.id]);

  if (!order) return <div className="p-8">Loading Invoice...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8 print:p-0 print:bg-white">
      {/* Controls - Hidden when printing */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <Button variant="outline" asChild className="bg-white">
          <Link href={`/orders/${resolvedParams.id}`}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Order
          </Link>
        </Button>
        <Button onClick={() => window.print()} className="gap-2">
          <Printer className="w-4 h-4" /> Print / Save PDF
        </Button>
      </div>

      <InvoiceTemplate order={order} />
    </div>
  );
}
