import fs from 'fs';

let content = fs.readFileSync('server/gemini.ts', 'utf8');

// Replace everything inside the `try` block of the action handler switch
const oldSwitchStartRegex = /if \(!process\.env\.MONGODB_URI.*?throw new Error\("Database connection is not active"\);\s*/s;
content = content.replace(oldSwitchStartRegex, ``);

content = content.replace(/new Transaction\({ user_id, \.\.\.args, date.*?}\);\s*await t\.save\(\);/s, `await DB.insert('transactions', { user_id, ...args, date: args.date ? new Date(args.date).toISOString() : new Date().toISOString() });`);

content = content.replace(/const avg.*?if \(avg\[0\]/s, `const expenses = await DB.find('transactions', { user_id, category: args.category, type: 'expense' });
        const avgAmt = expenses.length ? expenses.reduce((acc: number, x: any) => acc + x.amount, 0) / expenses.length : 0;
        if (avgAmt > 0 && args.amount > avgAmt * 2) {
          callResult.anomaly = \`⚠️ This is \${(args.amount / avgAmt).toFixed(1)}× your usual \${args.category} spend.\`;
        }
        if (avgAmt > 0 `);

content = content.replace(/const budget = await Budget\.findOne.*?if \(budget\) \{.*?monthlyTotal = await Transaction\.aggregate.*?\};/s, `
        const budget = await DB.findOne('budgets', { user_id, month: currentMonth, category: args.category });
        if (budget) {
          const allEx = await DB.find('transactions', { user_id, category: args.category, type: 'expense' });
          const spent = allEx.reduce((a: number, c: any) => a + c.amount, 0); // Include the new transaction ? actually it was already recorded
          const pct = spent / budget.limit;
          if (pct >= 0.8) {
            callResult.budgetWarning = \`🚨 You've used \${(pct * 100).toFixed(0)}% of your \${args.category} budget (\${budget.currency || 'ZAR'} \${spent.toFixed(0)} / \${budget.limit}).\`;
          }
        }
`);

content = content.replace(/account\.save\(\)/g, `DB.update('accounts', account._id, account)`);

content = content.replace(/Transaction\.find\(query\)/, `DB.find('transactions', query)`);

content = content.replace(/Budget\.find/g, `DB.find('budgets', `);
content = content.replace(/Goal\.find\(/g, `DB.find('goals', `);
content = content.replace(/Debt\.find/g, `DB.find('debts', `);

content = content.replace(/new Debt\(\{([\s\S]*?)status: 'pending'([\s\S]*?)\}\);\s*await debt\.save\(\);/s, `await DB.insert('debts', { $1 status: 'pending' $2 });`);

content = content.replace(/const debt = await Debt\.findById\(args\.debtId\);/g, `const debt = await DB.findOne('debts', { _id: args.debtId });`);
content = content.replace(/debt\.status = 'paid';\s*await debt\.save\(\);/g, `debt.status = 'paid'; await DB.update('debts', debt._id, debt);`);

content = content.replace(/Transaction\.aggregate\(\[([\s\S]*?)\]\)/s, `DB.find('transactions', { user_id, type: 'expense' })`); // simplified

content = content.replace(/Budget\.findOneAndUpdate\(\{ user_id, month: args\.month, category: args\.category \}, \{ limit: args\.limit, currency: args\.currency \|\| 'ZAR' \}, \{ upsert: true, new: true \}\)/, `DB.insert('budgets', { user_id, month: args.month, category: args.category, limit: args.limit, currency: args.currency || 'ZAR' })`);

content = content.replace(/const result = await Goal\.findByIdAndUpdate\(args\.goal_id, \{ \$inc: \{ current_amount: args\.amount \} \}, \{ new: true \}\);/g, `const result = await DB.findOne('goals', { _id: args.goal_id }); if (result) { result.current_amount += args.amount; await DB.update('goals', result._id, result); }`);

content = content.replace(/const g = new Goal\(\{ user_id, \.\.\.args \}\);\s*await g\.save\(\);/g, `const g = await DB.insert('goals', { user_id, ...args });`);

content = content.replace(/account = new Account\(\{ user_id, balance: args\.balance, currency: args\.currency \|\| 'ZAR' \}\);\s*await account\.save\(\);/g, `account = await DB.insert('accounts', { user_id, balance: args.balance, currency: args.currency || 'ZAR' });`);

fs.writeFileSync('server/gemini.ts', content, 'utf8');
