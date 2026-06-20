import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

const helpers = `
  const getPrimaryMetricLabel = (p: string) => {
    if (p === 'founder') return 'Net Burn';
    if (p === 'freelancer') return 'Effective Rate';
    if (p === 'side_project') return 'Profit Margin';
    return 'Savings Rate';
  };
  const getPrimaryMetricValue = (p: string) => {
    const cur = dashboard?.account?.currency || "ZAR";
    if (p === 'founder') return \`\${cur} \${(totalSpent - totalIncome).toFixed(0)}\`;
    if (p === 'freelancer') return \`\${cur} \${dashboard?.healthScore?.score || 0}\`;
    return \`\${dashboard?.savingsRate || '0'}%\`;
  };
  const getHealthCardTitle = (p: string) => {
    if (p === 'founder') return 'Startup Runway';
    if (p === 'freelancer') return 'Effective Hourly Rate';
    if (p === 'side_project') return 'Project P&L';
    return 'Financial Health';
  };
`;

// Insert the helpers right before the return statement inside App component
const returnIdx = content.indexOf('return (\n    <div className="flex h-screen');
if (returnIdx !== -1) {
    content = content.slice(0, returnIdx) + helpers + "\n  " + content.slice(returnIdx);
}

// Replace the JSX chunks
content = content.replace(
    /\{dashboard\.account\?\.persona === 'founder' \? 'Net Burn' :[\s\S]*?dashboard\.account\?\.persona === 'side_project' \? 'Profit Margin' : 'Savings Rate'\}/g,
    "{getPrimaryMetricLabel(dashboard.account?.persona)}"
);

content = content.replace(
    /\{dashboard\.account\?\.persona === 'founder' \? \`\$\{dashboard\.account\?\.currency \|\| "ZAR"\} \$\{\(totalSpent - totalIncome\)\.toFixed\(0\)\}\` :[\s\S]*?\`\$\{dashboard\.savingsRate \|\| '0'\}%\`\}/g,
    "{getPrimaryMetricValue(dashboard.account?.persona)}"
);

content = content.replace(
    /\{dashboard\?\.account\?\.persona === 'founder' \? 'Startup Runway' :[\s\S]*?dashboard\?\.account\?\.persona === 'side_project' \? 'Project P&L' : 'Financial Health'\}/g,
    "{getHealthCardTitle(dashboard.account?.persona)}"
);

// Tidy up aesthetics
// Change 3xl to 2xl, adjust shadows, borders
content = content.replace(/rounded-3xl/g, 'rounded-2xl');
content = content.replace(/shadow-xl/g, 'shadow-md');
content = content.replace(/p-8/g, 'p-6');
content = content.replace(/px-10/g, 'px-8');

// Update chat bubbles for "tidiness"
content = content.replace(/bg-gray-100 dark:bg-[#333]/g, 'bg-surface-hover dark:bg-surface-hover');
content = content.replace(/bg-[#1A1A1A] text-white/g, 'bg-primary text-primary-foreground');
content = content.replace(/bg-blue-50 dark:bg-blue-900\/30/g, 'bg-surface-hover');
content = content.replace(/text-blue-700 dark:text-blue-400/g, 'text-foreground font-medium');
content = content.replace(/bg-surface\/80 backdrop-blur-md/g, 'bg-surface/90 backdrop-blur-xl border-b border-border');

content = content.replace(/className="max-w-7xl mx-auto space-y-12"/g, 'className="max-w-6xl mx-auto space-y-10"');

fs.writeFileSync('src/App.tsx', content);
