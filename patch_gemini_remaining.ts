import fs from 'fs';

let text = fs.readFileSync('server/gemini.ts', 'utf-8');
text = text.replace(/clientContext\.activeSpaceId/g, '_clientContext.activeSpaceId');

// Add types for acc and t
text = text.replace(
  `const spent = transactionsThisMonth.reduce((acc, t) => acc + t.amount, 0);`,
  `const spent = transactionsThisMonth.reduce((acc: any, t: any) => acc + t.amount, 0);`
);

fs.writeFileSync('server/gemini.ts', text);
console.log('patched gemini remaining errors');
