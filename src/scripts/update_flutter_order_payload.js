const fs = require('fs');
const file = 'D:/AervoApp/lib/core/repositories/order_repository.dart';
let content = fs.readFileSync(file, 'utf8');

const target = `      final orderPayload = <String, dynamic>{
        'order_number': orderNumber,
        'user_id': validUserUuid,
        'address_id': addrId,
        'status': 'Pending',
        'payment_status': order.paymentMethod.toLowerCase().contains('cod') ? 'Pending' : 'Paid',
        'payment_method': order.paymentMethod.isEmpty ? 'Cash on Delivery' : order.paymentMethod,
        'grand_total': grandTotalVal,
        'subtotal': subtotalVal,
      };`;

const replacement = `      final orderPayload = <String, dynamic>{
        'order_number': orderNumber,
        'user_id': validUserUuid,
        'address_id': addrId,
        'status': 'Pending',
        'payment_status': order.paymentMethod.toLowerCase().contains('cod') ? 'Pending' : 'Paid',
        'payment_method': order.paymentMethod.isEmpty ? 'Cash on Delivery' : order.paymentMethod,
        'grand_total': grandTotalVal,
        'subtotal': subtotalVal,
        'delivery_notes': 'Delivery OTP: \$generatedOtp',
      };`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully added delivery_notes with OTP to Flutter orderPayload!');
} else {
  console.log('Target string not found');
}
