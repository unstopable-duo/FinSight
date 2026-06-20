import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

const replacement = `
      const totalIncome = incomeMonthlyTotal[0]?.total || 0;
      const totalSpent = expenseMonthlyTotal[0]?.total || 0;
      const savingsRateNum = totalIncome > 0 ? ((totalIncome - totalSpent) / totalIncome) : 0;
      const savingsRate = (savingsRateNum * 100).toFixed(0);
      
      let score = 60;
      if (savingsRateNum > 0.2) score += 20;
      else if (savingsRateNum > 0) score += 10;
      else score -= 20;

      const overBudgetCount = budgets.filter(b => {
         // rough approximation, we could fetch categories but this is demo
         return false; 
      }).length;
      
      score = Math.max(0, Math.min(100, (score)));
      let healthScore = {
         score: Math.floor(score),
         label: score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Needs Attention"
      };
      
      res.json({ transactions, budgets, goals, account, currentMonth, dailySpending, savingsRate, healthScore });`;

content = content.replace(/const totalIncome = incomeMonthlyTotal.*?res\.json\([^)]+\);/s, replacement);

// Also add a prediction field for predicted month-end spend
const predStr = `
      const daysInMonthToDate = new Date().getDate();
      const totalDaysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
      const predictedEndSpend = (totalSpent / daysInMonthToDate) * totalDaysInMonth;
      
      res.json({ transactions, budgets, goals, account, currentMonth, dailySpending, savingsRate, healthScore, predictedEndSpend });
`;

content = content.replace(/res\.json\(\{ transactions,.*healthScore \}\);/, predStr);

fs.writeFileSync('server.ts', content, 'utf8');
