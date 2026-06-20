import fs from 'fs';

let appData = fs.readFileSync('src/App.tsx', 'utf-8');

appData = appData.replace(
  `const getPrimaryMetricLabel = (p: string) => {
    if (p === 'founder') return 'Net Burn';
    if (p === 'freelancer') return 'Effective Rate';
    if (p === 'side_project') return 'Profit Margin';
    return 'Savings Rate';
  };`,
  `const getPrimaryMetricLabel = (p: string) => {
    if (p === 'Business') return 'Profit Margin';
    if (p === 'Project') return 'Budget Remaining';
    if (p === 'Investment') return 'ROI';
    return 'Savings Rate';
  };`
);

appData = appData.replace(
  `const getPrimaryMetricValue = (p: string) => {
    const cur = dashboard?.account?.currency || "ZAR";
    if (p === 'founder') return \`\${cur} \${(totalSpent - totalIncome).toFixed(0)}\`;
    if (p === 'freelancer') return \`\${cur} \${dashboard?.healthScore?.score || 0}\`;
    return \`\${dashboard?.savingsRate || '0'}%\`;
  };`,
  `const getPrimaryMetricValue = (p: string) => {
    const cur = dashboard?.account?.currency || "ZAR";
    if (p === 'Business') return \`\${cur} \${(totalIncome - totalSpent).toFixed(0)}\`;
    if (p === 'Project') {
       const budgetTotal = dashboard?.budgets?.reduce((a:any, b:any) => a + b.limit, 0) || 0;
       return \`\${cur} \${Math.max(0, budgetTotal - totalSpent).toFixed(0)}\`;
    }
    return \`\${dashboard?.savingsRate || '0'}%\`;
  };`
);

appData = appData.replace(
  `const getHealthCardTitle = (p: string) => {
    if (p === 'founder') return 'Startup Runway';
    if (p === 'freelancer') return 'Effective Hourly Rate';
    if (p === 'side_project') return 'Project P&L';
    return 'Financial Health';
  };`,
  `const getHealthCardTitle = (p: string) => {
    if (p === 'Business') return 'Business Health';
    if (p === 'Project') return 'Project Status';
    if (p === 'Investment') return 'Portfolio Health';
    return 'Financial Health';
  };`
);

// We should replace `dashboard.account?.persona` with `dashboard.account?.type` in the render calls
appData = appData.replace(/getPrimaryMetricLabel\(dashboard.account\?.persona\)/g, "getPrimaryMetricLabel(dashboard.account?.type)");
appData = appData.replace(/getPrimaryMetricValue\(dashboard.account\?.persona\)/g, "getPrimaryMetricValue(dashboard.account?.type)");
appData = appData.replace(/getHealthCardTitle\(dashboard.account\?.persona\)/g, "getHealthCardTitle(dashboard.account?.type)");

fs.writeFileSync('src/App.tsx', appData);
console.log('patched app metrics!');
