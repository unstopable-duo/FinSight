import fs from 'fs';

let text = fs.readFileSync('server/gemini.ts', 'utf-8');
text = text.replace(/\\*\//g, '});');
text = text.replace(/\\/\*/g, `allTransactions.filter((t:any) => t.type === 'expense').forEach((t:any) => {`);

fs.writeFileSync('server/gemini.ts', text);
console.log('fixed comments');
