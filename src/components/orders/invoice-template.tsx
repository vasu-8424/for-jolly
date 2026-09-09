import React from "react";
import { format } from "date-fns";

function numberToWordsINR(amount: number): string {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  function inWords(num: number): string {
    if (num <= 0) return '';
    const strNum = ('000000000' + num).substr(-9);
    const match = strNum.match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!match) return '';
    let str = '';
    str += (Number(match[1]) !== 0) ? (a[Number(match[1])] || b[Number(match[1][0])] + ' ' + a[Number(match[1][1])]) + ' Crore ' : '';
    str += (Number(match[2]) !== 0) ? (a[Number(match[2])] || b[Number(match[2][0])] + ' ' + a[Number(match[2][1])]) + ' Lakh ' : '';
    str += (Number(match[3]) !== 0) ? (a[Number(match[3])] || b[Number(match[3][0])] + ' ' + a[Number(match[3][1])]) + ' Thousand ' : '';
    str += (Number(match[4]) !== 0) ? (a[Number(match[4])] || b[Number(match[4][0])] + ' ' + a[Number(match[4][1])]) + ' Hundred ' : '';
    str += (Number(match[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(match[5])] || b[Number(match[5][0])] + ' ' + a[Number(match[5][1])]) + ' ' : '';
    return str.trim();
  }

  const intPart = Math.floor(amount);
  const paisePart = Math.round((amount - intPart) * 100);
  
  let result = inWords(intPart);
  if (result) result += ' Rupees';
  if (paisePart > 0) result += (result ? ' and ' : '') + inWords(paisePart) + ' Paise';
  return (result ? result + ' Only' : 'Zero Rupees Only').replace(/\s+/g, ' ');
}

export function InvoiceTemplate({ order }: { order: any }) {
  if (!order) return null;

  // Pricing calculations
  const items = Array.isArray(order.order_items) ? order.order_items : [];
  
  const itemsSubtotal = items.length > 0
    ? items.reduce((sum: number, it: any) => {
        const itemTotal = Number(it.total_price) || ((Number(it.unit_price) || 0) * (Number(it.quantity) || 1));
        return sum + itemTotal;
      }, 0)
    : Number(order.items_subtotal ?? order.subtotal ?? order.total_amount ?? 0);

  // Free delivery threshold check (Free Delivery above ₹499 or if stored delivery charge is 0)
  const isFreeDelivery = itemsSubtotal > 499 || Number(order.delivery_charge) === 0;
  const deliveryCharge = isFreeDelivery ? 0 : (Number(order.delivery_charge) > 0 ? Number(order.delivery_charge) : 40);
  const handlingFee = 10.0;
  const discountAmount = Number(order.discount_amount) || 0;
  const taxAmount = Number(order.tax_amount) || 0;

  // Stored grand total or computed total
  const storedTotal = Number(order.grand_total ?? order.total_amount ?? 0);
  const grandTotal = storedTotal > 0 ? storedTotal : (itemsSubtotal + handlingFee + deliveryCharge - discountAmount);

  // Formatted date & invoice id
  const orderDate = order.created_at ? new Date(order.created_at) : new Date();
  const invoiceNo = order.invoice_number || `INV-${order.id ? order.id.substring(0, 8).toUpperCase() : "92653E68"}`;
  const orderNo = order.order_number || `ORD-${order.id ? order.id.substring(0, 8).toUpperCase() : "001"}`;

  // Customer details
  const customerName =
    order.delivery_address_details?.recipient_name ||
    order.profiles?.full_name ||
    order.users?.full_name ||
    "Valued Customer";

  const customerPhone =
    order.delivery_address_details?.recipient_phone ||
    order.profiles?.phone_number ||
    order.users?.phone ||
    "N/A";

  const customerEmail =
    order.delivery_address_details?.recipient_email ||
    order.profiles?.email ||
    order.users?.email ||
    "";

  const deliveryAddress =
    order.delivery_address ||
    order.delivery_address_details?.full_address ||
    "Main Road, Kakinada, Andhra Pradesh - 533001";

  const deliverySlot = order.delivery_slot || "15-Min Express Delivery";

  return (
    <div className="bg-white text-gray-900 p-8 sm:p-12 max-w-4xl mx-auto font-sans print:p-6 print:m-0 print:shadow-none print:max-w-none shadow-2xl rounded-xl border border-gray-200">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b-2 border-green-700/30 pb-6 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl sm:text-4xl font-black text-green-700 tracking-tight">KAKINADA FRESH</h1>
            <span className="text-[10px] font-bold bg-green-100 text-green-800 border border-green-300 px-2 py-0.5 rounded uppercase">
              100% Fresh
            </span>
          </div>
          <p className="text-xs text-gray-600 font-semibold mt-1">Premium Sea Food, Fresh Fish & Country Meat</p>
          <div className="mt-2 text-xs text-gray-500 space-y-0.5 leading-relaxed">
            <p><span className="font-semibold text-gray-700">GSTIN:</span> 37ABCDE1234F1Z5</p>
            <p><span className="font-semibold text-gray-700">Store:</span> Main Road, Kakinada, AP - 533001</p>
            <p><span className="font-semibold text-gray-700">Contact:</span> kakinadafresh@gmail.com | +91 9030982289</p>
          </div>
        </div>

        <div className="text-left sm:text-right bg-gray-50 print:bg-transparent p-4 sm:p-0 rounded-lg border sm:border-0 w-full sm:w-auto">
          <div className="inline-block bg-green-700 text-white font-black text-xs px-3 py-1 rounded tracking-wider uppercase mb-2">
            TAX INVOICE
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <span className="text-gray-500 text-left">Invoice No:</span>
            <span className="font-bold text-gray-900 text-right font-mono">{invoiceNo}</span>
            <span className="text-gray-500 text-left">Order No:</span>
            <span className="font-bold text-gray-900 text-right font-mono">{orderNo}</span>
            <span className="text-gray-500 text-left">Order Date:</span>
            <span className="font-semibold text-gray-800 text-right">{format(orderDate, "dd MMM yyyy, hh:mm a")}</span>
            <span className="text-gray-500 text-left">Payment Mode:</span>
            <span className="font-bold text-green-700 text-right">{order.payment_method || "COD"}</span>
            <span className="text-gray-500 text-left">Payment Status:</span>
            <span className={`font-bold text-right ${order.payment_status === "Paid" ? "text-green-700" : "text-amber-600"}`}>
              {order.payment_status || "Pending"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Billed & Shipped To + Delivery Info Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Customer Address */}
        <div className="bg-gray-50 print:bg-gray-50/50 p-4 rounded-xl border border-gray-200">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            📍 Billed & Shipped To:
          </h3>
          <p className="text-base font-bold text-gray-900 uppercase">
            {customerName}
          </p>
          <p className="text-xs text-gray-700 mt-1 leading-relaxed whitespace-pre-line">
            {deliveryAddress}
          </p>
          <div className="mt-3 pt-2 border-t border-gray-200 text-xs text-gray-700 space-y-1">
            <p><span className="font-semibold text-gray-900">Phone:</span> {customerPhone}</p>
            {customerEmail && <p><span className="font-semibold text-gray-900">Email:</span> {customerEmail}</p>}
          </div>
        </div>

        {/* Delivery Slot & Instructions */}
        <div className="bg-gray-50 print:bg-gray-50/50 p-4 rounded-xl border border-gray-200 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              🚚 Delivery & Order Fulfillment:
            </h3>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Delivery Slot:</span>
                <span className="font-semibold text-gray-900">{deliverySlot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Order Status:</span>
                <span className="font-bold text-green-700 uppercase">{order.status || "Completed"}</span>
              </div>
            </div>
          </div>
          {order.delivery_notes && !order.delivery_notes.toLowerCase().includes("delivery otp") && (
            <div className="mt-2 text-[11px] text-gray-600 bg-white p-2 rounded border">
              <span className="font-semibold text-gray-700">Notes: </span>{order.delivery_notes}
            </div>
          )}
        </div>
      </div>

      {/* 3. Items Table */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-left border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100 print:bg-gray-100 text-gray-800 text-xs uppercase tracking-wider border-b-2 border-gray-400">
              <th className="py-3 px-3 font-bold w-10 text-center border-r border-gray-300">#</th>
              <th className="py-3 px-3 font-bold border-r border-gray-300">Item Description</th>
              <th className="py-3 px-3 font-bold text-center w-16 border-r border-gray-300">Qty</th>
              <th className="py-3 px-3 font-bold text-right w-24 border-r border-gray-300">Rate (₹)</th>
              <th className="py-3 px-3 font-bold text-right w-28">Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="text-xs divide-y divide-gray-200">
            {items.map((item: any, idx: number) => {
              const prepName = item.selected_prep_option?.name;
              const prepAdj = Number(item.selected_prep_option?.price_adjustment) || 0;
              const extras = Array.isArray(item.selected_extras) ? item.selected_extras : [];
              const unitPrice = Number(item.unit_price) || 0;
              const qty = Number(item.quantity) || 1;
              const totalPrice = Number(item.total_price) || (unitPrice * qty);

              return (
                <tr key={item.id || idx} className="hover:bg-gray-50/80">
                  <td className="py-3.5 px-3 text-center font-semibold text-gray-500 border-r border-gray-200">
                    {idx + 1}
                  </td>
                  <td className="py-3.5 px-3 border-r border-gray-200">
                    <p className="font-bold text-gray-900 text-sm">
                      {item.product_name || item.product?.name || "Fresh Item"}
                    </p>
                    
                    {/* Cut / Prep Option & Extras */}
                    {(prepName || extras.length > 0 || item.variant_name) && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {item.variant_name && (
                          <span className="inline-block text-[10px] font-semibold bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded border border-gray-300">
                            {item.variant_name}
                          </span>
                        )}
                        {prepName && (
                          <span className="inline-block text-[10px] font-semibold bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-300">
                            Cut: {prepName} {prepAdj > 0 ? `(+₹${prepAdj})` : ""}
                          </span>
                        )}
                        {extras.map((ex: any, exIdx: number) => {
                          const exName = typeof ex === "string" ? ex : ex?.name;
                          const exAdj = typeof ex === "object" ? Number(ex?.price_adjustment) : 0;
                          return (
                            <span key={exIdx} className="inline-block text-[10px] font-semibold bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded border border-blue-300">
                              + {exName} {exAdj > 0 ? `(+₹${exAdj})` : ""}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-center font-bold text-gray-900 border-r border-gray-200">
                    {qty}
                  </td>
                  <td className="py-3.5 px-3 text-right font-medium text-gray-700 border-r border-gray-200">
                    ₹{unitPrice.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-3 text-right font-bold text-gray-900">
                    ₹{totalPrice.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 4. Bill Breakdown Summary */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-t-2 border-gray-800 pt-4 mb-6">
        {/* Amount in words & Bank note */}
        <div className="flex-1 space-y-3">
          <div className="bg-gray-50 print:bg-gray-50/50 p-3.5 rounded-lg border border-gray-200">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">
              Amount in Words:
            </span>
            <p className="text-xs font-bold text-gray-900 italic">
              {numberToWordsINR(grandTotal)}
            </p>
          </div>
          
          <div className="text-[11px] text-gray-500 leading-relaxed">
            <p><span className="font-semibold text-gray-700">GST Declaration:</span> 0% GST applicable on fresh uncooked fish, prawns, and meat under reverse charge notification.</p>
          </div>
        </div>

        {/* Pricing Totals Box */}
        <div className="w-full sm:w-80 bg-gray-50 print:bg-gray-50/50 p-4 rounded-xl border border-gray-300 space-y-2.5 text-xs text-gray-700">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-600">Items Subtotal:</span>
            <span className="font-semibold text-gray-900">₹{itemsSubtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-600">Handling Fee:</span>
            <span className="font-semibold text-gray-900">₹{handlingFee.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-600">Delivery Charge:</span>
            {isFreeDelivery ? (
              <div className="flex items-center gap-1.5">
                <span className="line-through text-gray-400 text-[11px]">₹40.00</span>
                <span className="font-bold text-green-700 bg-green-100 border border-green-300 px-1.5 py-0.5 rounded text-[10px]">
                  FREE (&gt; ₹499)
                </span>
              </div>
            ) : (
              <span className="font-semibold text-gray-900">₹{deliveryCharge.toFixed(2)}</span>
            )}
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between items-center text-green-700 font-semibold">
              <span>Coupon Discount:</span>
              <span>-₹{discountAmount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between items-center text-gray-500 text-[11px]">
            <span>GST / Taxes (Included):</span>
            <span>₹{taxAmount.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center text-base font-black text-gray-900 border-t-2 border-gray-800 pt-2.5 mt-2">
            <span>Grand Total:</span>
            <span className="text-green-800 text-lg">₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* 5. Terms & Footer */}
      <div className="border-t border-gray-300 pt-4 text-[11px] text-gray-500 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div className="space-y-1">
          <p className="font-bold text-gray-800 uppercase tracking-wider text-xs">Terms & Conditions:</p>
          <p>1. Returns & replacements accepted within 24 hours of delivery for fresh items.</p>
          <p>2. Keep products refrigerated between 0°C to 4°C to preserve maximum freshness.</p>
          <p>3. This is a computer-generated tax invoice and requires no physical signature.</p>
          <p>4. For queries or support, contact <span className="font-semibold text-gray-700">+91 9030982289</span> or <span className="font-semibold text-gray-700">support@kakinadafresh.com</span>.</p>
        </div>

        <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto">
          <p className="font-bold text-gray-800 text-xs">Thank you for shopping with us!</p>
          <p className="text-green-700 font-semibold mt-0.5">www.kakinadafresh.com</p>
          <div className="mt-3 text-[10px] text-gray-400 font-mono">
            Generated on {format(new Date(), "dd-MM-yyyy HH:mm:ss")}
          </div>
        </div>
      </div>
    </div>
  );
}
