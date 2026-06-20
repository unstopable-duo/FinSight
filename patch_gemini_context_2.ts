import fs from 'fs';

let text = fs.readFileSync('server/gemini.ts', 'utf-8');
const lines = text.split('\\n');
const newLines = lines.filter((l, idx) => {
  if (idx >= 289 && idx <= 298) return false;
  return true;
});
fs.writeFileSync('server/gemini.ts', newLines.join('\\n'));
console.log('patched context via script');
