import { format } from "date-fns";

export function InvoiceTemplate({ order }: { order: any }) {
  if (!order) return null;

  return (
    <div className="bg-white text-black p-8 max-w-4xl mx-auto font-sans print:p-0 print:m-0 print:shadow-none min-h-[1056px] shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-gray-200 pb-6 mb-6">
        <div>
          <h1 className="text-4xl font-black text-green-700 tracking-tight">KAKINADA FRESH</h1>
          <p className="text-sm text-gray-500 mt-1">GSTIN: 37ABCDE1234F1Z5</p>
          <p className="text-sm text-gray-500 mt-1">Main Road, Kakinada, AP - 533001</p>
          <p className="text-sm text-gray-500">support@kakinadafresh.com | +91 9000000000</p>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold text-gray-800 uppercase tracking-widest">Tax Invoice</h2>
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <span className="text-gray-500 text-left">Invoice No:</span>
            <span className="font-semibold text-right">INV-{order.id.substring(0, 8).toUpperCase()}</span>
            <span className="text-gray-500 text-left">Order Date:</span>
            <span className="font-semibold text-right">{format(new Date(order.created_at), "dd MMM yyyy")}</span>
            <span className="text-gray-500 text-left">Payment:</span>
            <span className="font-semibold text-right">{order.payment_method}</span>
          </div>
        </div>
      </div>

      {/* Bill To */}
      <div className="mb-8">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Billed & Shipped To:</h3>
        <p className="text-lg font-bold text-gray-800">
          {order.delivery_address_details?.recipient_name || order.profiles?.full_name || "Guest"}
        </p>
        <p className="text-gray-600 w-2/3 mt-1 leading-relaxed">
          {order.delivery_address || "No Address Provided"}
        </p>
        <p className="text-gray-600 mt-1">
          Phone: {order.delivery_address_details?.recipient_phone || order.profiles?.phone_number || "N/A"}
        </p>
      </div>

      {/* Items Table */}
      <table className="w-full text-left border-collapse mb-8">
        <thead>
          <tr className="border-b-2 border-gray-800 text-gray-800">
            <th className="py-3 font-bold w-12 text-center">#</th>
            <th className="py-3 font-bold">Item Description</th>
            <th className="py-3 font-bold text-center">Qty</th>
            <th className="py-3 font-bold text-right">Rate</th>
            <th className="py-3 font-bold text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="text-gray-600">
          {order.order_items?.map((item: any, idx: number) => (
            <tr key={item.id} className="border-b border-gray-200">
              <td className="py-4 text-center">{idx + 1}</td>
              <td className="py-4 font-medium text-gray-800">{item.product_name || item.product?.name || "Product"}</td>
              <td className="py-4 text-center">{item.quantity}</td>
              <td className="py-4 text-right">₹{item.unit_price.toFixed(2)}</td>
              <td className="py-4 text-right font-medium text-gray-800">₹{item.total_price.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-12">
        <div className="w-64 space-y-3 text-gray-600">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>₹{(order.total_amount - 40).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery Charge:</span>
            <span>₹40.00</span>
          </div>
          <div className="flex justify-between">
            <span>GST (Included):</span>
            <span>₹0.00</span>
          </div>
          <div className="flex justify-between text-xl font-bold text-gray-900 border-t-2 border-gray-800 pt-3 mt-3">
            <span>Grand Total:</span>
            <span>₹{order.total_amount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 pt-6 text-sm text-gray-500 flex justify-between items-end">
        <div>
          <p className="font-bold text-gray-800 mb-1">Terms & Conditions</p>
          <p>1. Returns accepted within 24 hours for fresh items.</p>
          <p>2. This is a computer generated invoice and requires no signature.</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-gray-800 mb-1">Thank you for shopping with us!</p>
          <p>www.kakinadafresh.com</p>
        </div>
      </div>
    </div>
  );
}
