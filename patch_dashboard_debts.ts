import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

const regex = /res\.json\(\{\s*transactions,\s*budgets,\s*goals,\s*account,\s*currentMonth,\s*dailySpending,\s*savingsRate,\s*healthScore,\s*predictedEndSpend\s*\}\);/;

const newStr = `
      const debts = await Debt.find({ user_id, status: 'pending' });
      res.json({ transactions, budgets, goals, account, currentMonth, dailySpending, savingsRate, healthScore, predictedEndSpend, debts });
`;
content = content.replace(regex, newStr);

fs.writeFileSync('server.ts', content, 'utf8');
