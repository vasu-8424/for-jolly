const fs = require('fs');
const filePath = 'D:\\AervoApp\\lib\\core\\repositories\\delivery_agent_repository.dart';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  "final updatePayload = <String, dynamic>{\n        'agent_id': agentId,\n        'driver_id': agentId, // Sync legacy column for backward compatibility\n      };",
  "final updatePayload = <String, dynamic>{\n        'agent_id': agentId,\n      };"
);

content = content.replace(
  "final updatePayload = <String, dynamic>{\n        'agent_id': null,\n        'driver_id': null,\n      };",
  "final updatePayload = <String, dynamic>{\n        'agent_id': null,\n      };"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Cleaned up updatePayload in delivery_agent_repository.dart');
