import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');
content = content.replace(/currency: 'ZAR'/g, "currency: currency || 'ZAR'");
content = content.replace(/currency: "ZAR"/g, "currency: currency || 'ZAR'");
content = content.replace(/balance: 0, currency: currency \|\| 'ZAR', persona: req.query.persona \|\| 'personal'/g, "balance: 0, currency: req.query.currency || 'ZAR', persona: req.query.persona || 'personal'");
fs.writeFileSync('server.ts', content);
