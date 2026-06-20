import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

// Replace imports
const oldImports = `import { connectDB, Transaction, Budget, Goal, Account, getLastDbError } from "./server/db";`;
const newImports = `import { DB } from "./server/db";`;
content = content.replace(oldImports, newImports);

// Remove DB connection
const dbConn = /await connectDB\(\);/;
content = content.replace(dbConn, '');

// Clean MONGODB checks
content = content.replace(/if \(!process\.env\.MONGODB_URI\) \{[\s\S]*?mongoose\.connection\.readyState !== 1\) \{[\s\S]*?\}\n/g, '');

// Replace queries for dashboard
const newDashboardQueryStr = `
      const currentMonthStart = new Date(currentMonth + '-01');
      const nextMonthStart = new Date(currentMonthStart);
      nextMonthStart.setMonth(nextMonthStart.getMonth() + 1);

      const transactions = await DB.find('transactions', { user_id, date: { $gte: currentMonthStart, $lt: nextMonthStart } });
      const budgets = await DB.find('budgets', { user_id, month: currentMonth });
      const goals = await DB.find('goals', { user_id, status: 'active' });
      const debts = await DB.find('debts', { user_id, status: 'pending' });
      const clients = await DB.find('clients', { user_id });
      const projects = await DB.find('projects', { user_id });
      
      let account = await DB.findOne('accounts', { user_id });
      if (!account) {
        account = await DB.insert('accounts', { user_id, balance: 0, currency: 'ZAR', persona: 'founder' });
      }

      const expenses = transactions.filter((t: any) => t.type === 'expense');
      const incomes = transactions.filter((t: any) => t.type === 'income');
      
      const totalIncome = incomes.reduce((acc: number, t: any) => acc + (t.amount || 0), 0);
      const totalSpent = expenses.reduce((acc: number, t: any) => acc + (t.amount || 0), 0);
      
      // Calculate daily spending by grouping in JS
      const dailySpendingMap: any = {};
      expenses.forEach((t: any) => {
         const dateStr = new Date(t.date).toISOString().slice(0, 10);
         dailySpendingMap[dateStr] = (dailySpendingMap[dateStr] || 0) + t.amount;
      });
      const dailySpending = Object.keys(dailySpendingMap).sort().map(k => ({ _id: k, total: dailySpendingMap[k] }));

      const savingsRateNum = totalIncome > 0 ? ((totalIncome - totalSpent) / totalIncome) : 0;
      const savingsRate = (savingsRateNum * 100).toFixed(0);
      
      let score = 60;
      if (savingsRateNum > 0.2) score += 20;
      else if (savingsRateNum > 0) score += 10;
      else score -= 20;

      score = Math.max(0, Math.min(100, (score)));
      let healthScore = {
         score: Math.floor(score),
         label: score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Needs Attention"
      };
      
      const daysInMonthToDate = new Date().getDate();
      const totalDaysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
      const predictedEndSpend = (totalSpent / daysInMonthToDate) * totalDaysInMonth;

      res.json({ transactions, budgets, goals, account, currentMonth, dailySpending, savingsRate, healthScore, predictedEndSpend, debts, clients, projects });
`;

content = content.replace(/const currentMonthStart = new Date.*?res\.json\(\{ transactions, budgets, goals, account, currentMonth, dailySpending, savingsRate, healthScore, predictedEndSpend, debts \}\);/s, newDashboardQueryStr);

// Deal with DELETE
const delTx = `
      const id = req.params.id;
      const t = await DB.findOne('transactions', { _id: id });
      if (t) {
        let account = await DB.findOne('accounts', { user_id });
        if (account) {
          if (t.type === 'expense') account.balance += t.amount;
          else account.balance -= t.amount;
          await DB.update('accounts', account._id, account);
        }
        await DB.delete('transactions', id);
      }
`;
content = content.replace(/const t = await Transaction\.findById.*?findByIdAndDelete\(id\);\s*\}/s, delTx);

// Deal with seed
const newSeed = `
      await DB.deleteMany('transactions', { user_id });
      await DB.deleteMany('budgets', { user_id });
      await DB.deleteMany('goals', { user_id });
      await DB.deleteMany('accounts', { user_id });
      await DB.deleteMany('projects', { user_id });
      await DB.deleteMany('clients', { user_id });

      const persona = req.body.persona || 'founder';
      await DB.insert('accounts', { user_id, balance: 45000, currency: 'ZAR', persona });
      
      const d = new Date();
      const currentMonth = d.toISOString().slice(0, 7);
      
      if (persona === 'founder') {
         // Seed founder stuff
         for(let i=0; i<30; i++) {
            await DB.insert('transactions', { user_id, amount: Math.floor(Math.random() * 5000), currency: 'ZAR', category: 'Software', category_type: 'opex', merchant: 'Vercel', date: new Date().toISOString(), type: 'expense' });
         }
      } else if (persona === 'freelancer') {
         await DB.insert('clients', { user_id, name: 'Retrovibe Studio', hourly_rate: 800, payment_terms_days: 30, avg_payment_delay_days: 47 });
         for(let i=0; i<10; i++) {
            await DB.insert('transactions', { user_id, amount: Math.floor(Math.random() * 500), currency: 'ZAR', category: 'Software', merchant: 'Adobe', date: new Date().toISOString(), type: 'expense' });
         }
      } else if (persona === 'side_project') {
         await DB.insert('projects', { user_id, name: 'ReceiptBot', status: 'active', mrr: 450, total_users: 38 });
         for(let i=0; i<15; i++) {
            await DB.insert('transactions', { user_id, amount: Math.floor(Math.random() * 200), currency: 'ZAR', category: 'Hosting', merchant: 'AWS', date: new Date().toISOString(), type: 'expense', project_id: 'receiptbot' });
         }
      }
      res.json({ success: true, message: 'Database seeded' });
`;
content = content.replace(/await Transaction\.deleteMany.*?res\.json\(\{ success: true, message: 'Database seeded' \}\);/s, newSeed);

fs.writeFileSync('server.ts', content, 'utf8');

// Update server/gemini.ts to use DB interface
let gemini = fs.readFileSync('server/gemini.ts', 'utf8');
gemini = gemini.replace(/import \{ Transaction, Budget, Goal, Account, Debt \} from \'\.\/db\';/, `import { DB } from './db';`);

gemini = gemini.replace(/const mongoose = \(await import\('mongoose'\)\)\.default;[\s\S]*?catch\(e\) \{[\s\S]*?\}/s, `
        const budgets = await DB.find('budgets', { user_id, month: currentMonth });
        const goals = await DB.find('goals', { user_id, status: 'active' });
        
        let account = await DB.findOne('accounts', { user_id });
        const currentBalance = account ? account.balance : 0;
        const accountCurrency = account ? account.currency : 'ZAR';

        const expenses = await DB.find('transactions', { user_id, type: 'expense' });
        const spendingMap: any = {};
        expenses.forEach((t: any) => { spendingMap[t.category] = (spendingMap[t.category] || 0) + t.amount; });
        const spending = Object.keys(spendingMap).map(k => ({ _id: k, total: spendingMap[k] }));

        const debts = await DB.find('debts', { user_id });
        const clients = await DB.find('clients', { user_id });
        const projects = await DB.find('projects', { user_id });
        
        contextInfo = \`[System Context: Today's date is \${new Date().toISOString()}. Current month: \${currentMonth}. 
Persona: \${account?.persona || 'founder'}
Current Account Balance: \${currentBalance} \${accountCurrency}
Payday Date (day of month): \${account ? account.payday : 'Not set'}
Active Budgets: \${JSON.stringify(budgets)}
Spending this month: \${JSON.stringify(spending)}
Active Goals: \${JSON.stringify(goals)}
Pending Debts: \${JSON.stringify(debts)}
Projects: \${JSON.stringify(projects)}
Clients: \${JSON.stringify(clients)}]\`;
`);

// Replace handlers inside gemini.ts
gemini = gemini.replace(/const tx = new Transaction\({([\s\S]*?)}\);\s*await tx\.save\(\);/g, `const tx = await DB.insert('transactions', {$1});`);
gemini = gemini.replace(/let account = await Account\.findOne\(\{ user_id \}\);/g, `let account = await DB.findOne('accounts', { user_id });`);
gemini = gemini.replace(/account\.balance \+= (.*?);\s*await account\.save\(\);/g, `account.balance += $1; await DB.update('accounts', account._id, account);`);
gemini = gemini.replace(/account\.balance -= (.*?);\s*await account\.save\(\);/g, `account.balance -= $1; await DB.update('accounts', account._id, account);`);

gemini = gemini.replace(/const tx = await Transaction\.findOne.*?sort\(\{ date: -1 \}\);/, `const allTxs = await DB.find('transactions', query); const tx = allTxs.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];`);
gemini = gemini.replace(/await tx\.save\(\);/g, `await DB.update('transactions', tx._id, tx);`);

gemini = gemini.replace(/const budget = new Budget\(\{([\s\S]*?)}\);\s*await budget\.save\(\);/, `await DB.insert('budgets', {$1});`);
gemini = gemini.replace(/const goal = new Goal\(\{([\s\S]*?)}\);\s*await goal\.save\(\);/, `await DB.insert('goals', {$1});`);
gemini = gemini.replace(/const goal = await Goal\.findById\(args\.goalId\);/, `const goal = await DB.findOne('goals', { _id: args.goalId });`);
gemini = gemini.replace(/await goal\.save\(\);/g, `await DB.update('goals', goal._id, goal);`);

gemini = gemini.replace(/account = new Account\(\{ user_id, balance: args\.balance \}\);\s*await account\.save\(\);/, `account = await DB.insert('accounts', { user_id, balance: args.balance });`);

fs.writeFileSync('server/gemini.ts', gemini, 'utf8');

// App.tsx UI setup for persona choosing
let appTsx = fs.readFileSync('src/App.tsx', 'utf8');
const personaState = `  const [persona, setPersona] = useState('founder');`;
appTsx = appTsx.replace(`  const [isLoggingIn, setIsLoggingIn] = useState(false);`, `  const [isLoggingIn, setIsLoggingIn] = useState(false);\n  const [persona, setPersona] = useState('founder');`);

// Change login to handle persona selection
const loginBox = `          <button 
            onClick={handleLogin} 
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-3 bg-[#1A1A1A] text-white hover:bg-[#333] px-4 py-4 font-bold text-[10px] uppercase tracking-widest transition-colors disabled:opacity-50"
          >`;

const newLoginBox = `
          <div className="mb-6">
             <label className="text-xs font-bold uppercase tracking-widest text-[#8C8980] block mb-2">Choose Persona</label>
             <select value={persona} onChange={e => setPersona(e.target.value)} className="w-full border border-[#E5E2D9] p-3 text-sm italic font-serif">
                <option value="founder">Founder (Runway, Burn, MRR)</option>
                <option value="freelancer">Freelancer (Hourly Rate, Profits)</option>
                <option value="side_project">Side Project (P&L, Break-even)</option>
             </select>
          </div>
          <button 
            onClick={handleLogin} 
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-3 bg-[#1A1A1A] text-white hover:bg-[#333] px-4 py-4 font-bold text-[10px] uppercase tracking-widest transition-colors disabled:opacity-50"
          >`;
appTsx = appTsx.replace(loginBox, newLoginBox);

// Change API requests to include persona
appTsx = appTsx.replace(/fetch\(\`\/api\/seed\?user_id=\$\{user\.uid\}\`, \{ method: \'POST\' \}\)/, `fetch(\`/api/seed?user_id=\${user.uid}\`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ persona }) })`);

// In Dashboard render, show something based on persona
const oldSummary = `<h3 className="text-[11px] uppercase tracking-[0.2em] font-bold border-b border-white/20 pb-2 text-white/90">Financial Health</h3>`;
const newSummary = `
   <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold border-b border-white/20 pb-2 text-white/90">
      {dashboard?.account?.persona === 'founder' ? 'Startup Runway' : 
       dashboard?.account?.persona === 'freelancer' ? 'Effective Hourly Rate' :
       dashboard?.account?.persona === 'side_project' ? 'Project P&L' : 'Financial Health'}
   </h3>`;
appTsx = appTsx.replace(oldSummary, newSummary);

fs.writeFileSync('src/App.tsx', appTsx, 'utf8');

