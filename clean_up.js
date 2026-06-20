import fs from 'fs';
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');
lines.splice(1003, 1149 - 1003 + 1); // delete 1004 to 1149 (inclusive, lines are 0-indexed)
// actually: indices are 1003 to 1148
fs.writeFileSync('src/App.tsx', lines.join('\n'));
