import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(/ZAR \{d.amount/g, '{dashboard.account?.currency || "ZAR"} {d.amount');
fs.writeFileSync('src/App.tsx', content);
