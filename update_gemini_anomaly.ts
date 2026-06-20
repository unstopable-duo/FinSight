import fs from 'fs';

let content = fs.readFileSync('server/gemini.ts', 'utf8');

const tSaveLine = '        await t.save();';
const anomalyAndBudgetWarnings = `
        const avg = await Transaction.aggregate([
          { $match: { user_id, category: args.category, type: 'expense' } },
          { $group: { _id: null, avg: { $avg: '$amount' } } }
        ]);
        if (avg[0] && args.amount > avg[0].avg * 2) {
          callResult.anomaly = \`⚠️ This is \${(args.amount / avg[0].avg).toFixed(1)}× your usual \${args.category} spend.\`;
        }

        const budget = await Budget.findOne({ user_id, month: currentMonth, category: args.category });
        if (budget) {
          const monthlyTotal = await Transaction.aggregate([
            { $match: { user_id, category: args.category, type: 'expense', date: { $gte: new Date(currentMonth + '-01') } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
          ]);
          const spent = (monthlyTotal[0]?.total || 0) + args.amount; // Include the new transaction
          const pct = spent / budget.limit;
          if (pct >= 0.8) {
            callResult.budgetWarning = \`🚨 You've used \${(pct * 100).toFixed(0)}% of your \${args.category} budget (\${budget.currency || 'ZAR'} \${spent.toFixed(0)} / \${budget.limit}).\`;
          }
        }
`;

content = content.replace(tSaveLine, tSaveLine + '\n' + anomalyAndBudgetWarnings);
fs.writeFileSync('server/gemini.ts', content);
