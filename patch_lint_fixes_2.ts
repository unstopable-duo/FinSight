import fs from 'fs';

// 1. Fix gemini.ts
let geminiData = fs.readFileSync('server/gemini.ts', 'utf-8');
geminiData = geminiData.replace(
  `const _contextInfoOld = \`[System Context: Today's date is \${new Date().toISOString()}. Current month: \${currentMonth}.`,
  `// old context`
);
geminiData = geminiData.replace(
  `clientContext.activeSpaceId`,
  `_clientContext.activeSpaceId`
);
geminiData = geminiData.replace(/const t = await DB\.insert\('transactions'/g, `await DB.insert('transactions'`);
geminiData = geminiData.replace(/const tx = await DB\.insert\('transactions', \{\n              user_id/g, `await DB.insert('transactions', {\n              user_id`);
geminiData = geminiData.replace(
  `const spent = allEx.reduce((a, c) => a + c.amount, 0); // Include the new transaction ? actually it was already recorded`,
  `const spent = allEx.reduce((a: any, c: any) => a + c.amount, 0); // Include the new transaction ? actually it was already recorded`
);
geminiData = geminiData.replace(
  `const tx = await DB.insert('transactions', {
              user_id, type: 'income', amount: debt.amount, category: 'Transfer', merchant: debt.friend_name, date: new Date(), currency: 'ZAR'
           });`,
  `await DB.insert('transactions', {
              user_id, type: 'income', amount: debt.amount, category: 'Transfer', merchant: debt.friend_name, date: new Date().toISOString(), currency: 'ZAR'
           });`
);
geminiData = geminiData.replace(
  `const spent = allEx.reduce((a, c) => a + c.amount, 0);`,
  `const spent = allEx.reduce((a: any, c: any) => a + c.amount, 0);`
);

fs.writeFileSync('server/gemini.ts', geminiData);

// 2. Fix App.tsx
let appData = fs.readFileSync('src/App.tsx', 'utf-8');
appData = appData.replace(
  `body: JSON.stringify({ persona: newPersona, currency: newCurrency })`,
  `body: JSON.stringify({ persona: newAccountType, currency: newCurrency })`
);
appData = appData.replace(
  `import { Send, LogOut, Target, Activity, Database, Trash2, FileSpreadsheet, Calendar, PanelLeftClose, PanelLeftOpen, Camera, Moon, Sun, Settings as SettingsIcon, X } from 'lucide-react';`,
  `import { Send, LogOut, Activity, Database, Trash2, FileSpreadsheet, Calendar, PanelLeftClose, PanelLeftOpen, Camera, Moon, Sun, Settings as SettingsIcon, X } from 'lucide-react';`
);
appData = appData.replace(
  `const topExpense = pieData.length > 0 ? pieData[0] : null;\n  const incomeData = Object.keys(incomeCategoryTotals).map(k => ({ name: k, value: incomeCategoryTotals[k] })).sort((a,b) => b.value - a.value);\n  const topIncome = incomeData.length > 0 ? incomeData[0] : null;`,
  `const incomeData = Object.keys(incomeCategoryTotals).map(k => ({ name: k, value: incomeCategoryTotals[k] })).sort((a,b) => b.value - a.value);`
);

fs.writeFileSync('src/App.tsx', appData);

console.log('patched linter issues 2');
