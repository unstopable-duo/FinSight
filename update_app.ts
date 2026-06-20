import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Savings Rate
const accountBalanceDiv = '                  <div>\n                     <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#8C8980] mb-2 block">Account Balance</span>';
const savingsRateDiv = `                  <div>
                     <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#8C8980] mb-2 block">Savings Rate</span>
                     <p className="text-3xl lg:text-4xl font-light tabular-nums text-blue-700">
                        {dashboard.savingsRate || '0'}%
                     </p>
                  </div>
                  <div>
                     <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#8C8980] mb-2 block">Account Balance</span>`;

content = content.replace(accountBalanceDiv, savingsRateDiv);


// 2. Bar Chart Data
const barChartLine = '<BarChart data={dashboard.transactions.slice().reverse()}>';
const newBarChartLine = '<BarChart data={dashboard.dailySpending || []}>';
content = content.replace(barChartLine, newBarChartLine);

const xAxisLine = '<XAxis dataKey="date" tickFormatter={d => format(new Date(d), \'MMM d\')} tick={{ fontSize: 10, fill: \'#8C8980\' }} axisLine={false} tickLine={false} dy={10} />';
const newXAxisLine = '<XAxis dataKey="_id" tickFormatter={d => format(new Date(d), \'MMM d\')} tick={{ fontSize: 10, fill: \'#8C8980\' }} axisLine={false} tickLine={false} dy={10} />';
content = content.replace(xAxisLine, newXAxisLine);

const barLine = '<Bar dataKey="amount" fill="#1A1A1A" radius={[4, 4, 0, 0]} maxBarSize={40} />';
const newBarLine = '<Bar dataKey="total" fill="#1A1A1A" radius={[4, 4, 0, 0]} maxBarSize={40} />';
content = content.replace(barLine, newBarLine);

fs.writeFileSync('src/App.tsx', content, 'utf8');
