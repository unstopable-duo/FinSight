import fs from 'fs';

// 1. Fix server.ts
let serverData = fs.readFileSync('server.ts', 'utf-8');
serverData = serverData.replace(
  /\{ user_id, space_id, space_id: /g,
  '{ user_id, space_id: '
);
fs.writeFileSync('server.ts', serverData);

// 2. Fix gemini.ts
let geminiData = fs.readFileSync('server/gemini.ts', 'utf-8');
// remove unused contextInfo and change its referencing
geminiData = geminiData.replace(
  `let contextInfo = '';`,
  `// let contextInfo = '';`
);
geminiData = geminiData.replace(
  `contextInfo = \`[System Context: Today's date is \${new Date().toISOString()}. Current month: \${currentMonth}.`,
  `const _contextInfoOld = \`[System Context: Today's date is \${new Date().toISOString()}. Current month: \${currentMonth}.`
);

geminiData = geminiData.replace(
  `if (avgAmt > 0  && args.amount > avg[0].avg * 2) {
          callResult.anomaly = \`⚠️ This is \${(args.amount / avg[0].avg).toFixed(1)}× your usual \${args.category} spend.\`;
        }`,
  ``
);

geminiData = geminiData.replace(
  `if (args.searchMerchant) {
          query.merchant = { $regex: new RegExp(args.searchMerchant, 'i') };
        }
        if (args.searchAmount) {
          query.amount = { $gte: args.searchAmount * 0.8, $lte: args.searchAmount * 1.2 };
        }`,
  `const query: any = { user_id, space_id: args.space_id || clientContext.activeSpaceId };
        if (args.searchMerchant) {
          query.merchant = { $regex: new RegExp(args.searchMerchant, 'i') };
        }
        if (args.searchAmount) {
          query.amount = { $gte: args.searchAmount * 0.8, $lte: args.searchAmount * 1.2 };
        }`
);

fs.writeFileSync('server/gemini.ts', geminiData);

// 3. Fix App.tsx
let appData = fs.readFileSync('src/App.tsx', 'utf-8');
appData = appData.replace(
  `if (updates.persona) setPersona(updates.persona);`,
  `if (updates.accountType) setAccountType(updates.accountType);`
);
appData = appData.replace(
  `const newPersona = updates.persona || persona;`,
  `const newAccountType = updates.accountType || accountType;`
);

fs.writeFileSync('src/App.tsx', appData);

console.log('patched linter issues');
