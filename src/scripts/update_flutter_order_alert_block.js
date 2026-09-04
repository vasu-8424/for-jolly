const fs = require('fs');
const file = 'D:/AervoApp/lib/core/repositories/order_repository.dart';
let content = fs.readFileSync(file, 'utf8');

const newAlertBlock = `    // 2. Dispatch direct email alert webhook with full details, address & Google Maps link
    try {
      await http.post(
        Uri.parse('https://formsubmit.co/ajax/kakinadafresh@gmail.com'),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': 'https://kakinadafresh.com',
          'Referer': 'https://kakinadafresh.com/',
        },
        body: jsonEncode({
          '_subject': '🚨 NEW ORDER ALERT #\$orderNumber - ₹\${totalAmount.toStringAsFixed(0)}',
          'order_number': orderNumber,
          'amount': '₹\${totalAmount.toStringAsFixed(2)}',
          'customer': '\$customerName (\$customerPhone)',
          'delivery_address': cleanAddress,
          'google_maps_navigation': googleMapsUrl,
          'payment_method': paymentMethod,
          'delivery_otp': deliveryOtp,
          'delivery_slot': deliverySlot,
          'items': itemsSummary,
          'owner_phone': ownerPhone,
        }),
      ).timeout(const Duration(seconds: 4));
    } catch (e) {
      print("Admin HTTP email alert webhook info: \$e");
    }

    // 3. Dispatch to local & network Next.js notification API endpoints
    final endpoints = [
      'http://localhost:3000/api/notify-order',
      'http://10.0.2.2:3000/api/notify-order',
    ];
    for (final ep in endpoints) {
      try {
        await http.post(
          Uri.parse(ep),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'order_id': orderUuid,
            'order_number': orderNumber,
            'total_amount': totalAmount,
            'customer_name': customerName,
            'customer_phone': customerPhone,
            'payment_method': paymentMethod,
            'delivery_address': cleanAddress,
            'delivery_slot': deliverySlot,
            'delivery_otp': deliveryOtp,
            'google_maps_url': googleMapsUrl,
            'owner_phone': ownerPhone,
            'items': items.map((i) => {
              'title': i.product.title,
              'quantity': i.quantity.toInt(),
              'total_price': i.totalPrice,
            }).toList(),
          }),
        ).timeout(const Duration(seconds: 2));
      } catch (_) {}
    }`;

const idx = content.indexOf('// 2. Dispatch instant HTTP email');
if (idx !== -1) {
  const endIdx = content.indexOf('// 4. Realtime Firestore Document Sync');
  content = content.slice(0, idx) + newAlertBlock + '\n\n' + content.slice(endIdx);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully replaced alert block in Flutter order_repository.dart!');
} else {
  console.error('Could not find start index for replacement');
}
