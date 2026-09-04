const fs = require('fs');
const file = 'D:/AervoApp/lib/core/repositories/order_repository.dart';
let content = fs.readFileSync(file, 'utf8');

const target = `'status': 'Unread',`;
const replacement = `'status': 'Sent',`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully replaced status in order_repository.dart');
} else {
  console.log('Target status string not found, current occurrences:');
  const lines = content.split('\n');
  lines.forEach((l, i) => {
    if (l.includes('status')) console.log(i + ': ' + l);
  });
}
