import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { DB } from "./server/db";
import { handleChatMessage } from "./server/gemini";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Connect to DB
  

  // API constraints: everything under /api/
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/dashboard", async (req, res) => {
    try {
      const user_id = req.query.user_id as string;
      const space_id = req.query.space_id as string;
      if (!user_id || user_id === 'default_user') {
        return res.status(401).json({ error: 'Authentication required' });
      }
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      
      
      const currentMonthStart = new Date(currentMonth + '-01');
      const nextMonthStart = new Date(currentMonthStart);
      nextMonthStart.setMonth(nextMonthStart.getMonth() + 1);

      let spaces = await DB.find('spaces', { user_id });
      let isNewAccount = false;
      if (spaces.length === 0) {
        isNewAccount = true;
        const initialSpace = await DB.insert('spaces', { user_id, name: 'Personal Space', type: 'Personal', currency: req.query.currency || 'ZAR', balance: 0 });
        spaces = [initialSpace];
      }
      
      const activeSpaceId = space_id && space_id !== 'undefined' ? space_id : spaces[0]._id;
      const activeSpace = spaces.find((s:any) => s._id === activeSpaceId) || spaces[0];

      const transactions = await DB.find('transactions', { user_id, space_id: activeSpace._id, date: { $gte: currentMonthStart, $lt: nextMonthStart } });
      const budgets = await DB.find('budgets', { user_id, space_id: activeSpace._id, month: currentMonth });
      const goals = await DB.find('goals', { user_id, space_id: activeSpace._id, status: 'active' });
      // Use active space for balances
      let userAccount = await DB.findOne('accounts', { user_id });
      const persona = userAccount?.persona || 'personal';
      const userCurrency = userAccount?.currency || activeSpace.currency || 'ZAR';
      const account = { ...activeSpace, ...userAccount, persona, account_type: persona, currency: userCurrency }; 

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

      let scoreLabel = "";
      let scoreNum = 0;

      if (persona === 'founder') {
         // Runway in months = Balance / (Expenses - Incomes)
         const netBurn = totalSpent - totalIncome;
         scoreNum = netBurn > 0 ? account.balance / netBurn : 99;
         scoreLabel = netBurn > 0 ? "Months" : "Infinite!";
      } else if (persona === 'freelancer') {
         // Effective Hourly Rate assuming 160 hrs
         scoreNum = totalIncome / 160;
         scoreLabel = (account.currency || "ZAR") + " / hr";
      } else if (persona === 'side_project') {
         // Profit
         const profit = totalIncome - totalSpent;
         scoreNum = profit;
         scoreLabel = profit >= 0 ? "Profit" : "Loss";
      } else {
         scoreNum = savingsRateNum > 0 ? savingsRateNum * 100 : 0;
         scoreLabel = "Health Score";
      }

      let healthScore = {
         score: Math.floor(scoreNum),
         label: scoreLabel,
         persona: persona
      };
      
      const daysInMonthToDate = new Date().getDate();
      const totalDaysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
      const predictedEndSpend = (totalSpent / daysInMonthToDate) * totalDaysInMonth;

      res.json({ transactions, budgets, goals, account, currentMonth, dailySpending, savingsRate, healthScore, predictedEndSpend, isNewAccount, spaces, activeSpaceId });




    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/transactions/:id", async (req, res) => {
    try {
      const user_id = req.query.user_id as string;
      const { id } = req.params;
      if (!user_id || !id) return res.status(400).json({ error: 'Missing params' });
      
      
      
      const t = await DB.findOne('transactions', { _id: id });
      if (t) {
        let space = await DB.findOne('spaces', { _id: t.space_id });
        if (space) {
          if (t.type === 'expense') space.balance += t.amount;
          else space.balance -= t.amount;
          await DB.update('spaces', space._id, space);
        }
        await DB.delete('transactions', id);
      }

      res.json({ success: true });
    } catch(err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  
  app.post("/api/spaces", async (req, res) => {
    try {
      const user_id = req.query.user_id as string;
      const { name, type, currency, startingBalance } = req.body;
      if (!user_id) return res.status(401).json({ error: 'Auth required' });
      const space = await DB.insert('spaces', { user_id, name, type, currency: currency || 'ZAR', balance: startingBalance || 0 });
      res.json({ space });
    } catch(err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/transfer", async (req, res) => {
    try {
      const user_id = req.query.user_id as string;
      const { from_space_id, to_space_id, amount } = req.body;
      const fromSpace = await DB.findOne('spaces', { _id: from_space_id });
      const toSpace = await DB.findOne('spaces', { _id: to_space_id });
      
      if (!fromSpace || !toSpace) return res.status(404).json({ error: 'Space not found' });
      
      fromSpace.balance -= amount;
      toSpace.balance += amount;
      await DB.update('spaces', fromSpace._id, fromSpace);
      await DB.update('spaces', toSpace._id, toSpace);
      
      await DB.insert('transactions', { user_id, space_id: fromSpace._id, amount, category: 'Transfer', merchant: 'To ' + toSpace.name, date: new Date().toISOString(), type: 'expense', currency: fromSpace.currency });
      await DB.insert('transactions', { user_id, space_id: toSpace._id, amount, category: 'Transfer', merchant: 'From ' + fromSpace.name, date: new Date().toISOString(), type: 'income', currency: toSpace.currency });
      
      res.json({ success: true });
    } catch(err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const user_id = req.query.user_id as string;
      if (!user_id) return res.status(401).json({ error: 'Auth required' });
      
      const { persona, currency } = req.body;
      let account = await DB.findOne('accounts', { user_id });
      if (account) {
         if (persona) account.persona = persona;
         
         if (currency && account.currency !== currency) {
            const oldCurrency = account.currency || 'ZAR';
            const newCurrency = currency;
            let rate = 1;
            
            // Fetch exchange rate
            try {
              const erRes = await fetch(`https://open.er-api.com/v6/latest/${oldCurrency}`);
              const erData = await erRes.json();
              if (erData && erData.rates && erData.rates[newCurrency]) {
                rate = erData.rates[newCurrency];
              }
            } catch(e) {
               console.error("Failed fetching exchange rate", e);
            }
            
            account.currency = newCurrency;
            
            // Convert Spaces balances
            const spaces = await DB.find('spaces', { user_id });
            for(let sp of spaces) {
               sp.balance = (sp.balance || 0) * rate;
               sp.currency = newCurrency;
               await DB.update('spaces', sp._id, sp);
            }
            
            // Convert Transactions
            const txs = await DB.find('transactions', { user_id });
            for(let tx of txs) {
                 tx.amount = (tx.amount || 0) * rate;
                 tx.currency = newCurrency;
                 await DB.update('transactions', tx._id, tx);
            }
            
            // Convert Budgets
            const budgets = await DB.find('budgets', { user_id });
            for(let b of budgets) {
               b.limit = (b.limit || 0) * rate;
               b.currentAmount = (b.currentAmount || 0) * rate;
               await DB.update('budgets', b._id, b);
            }
            
            // Convert Goals
            const goals = await DB.find('goals', { user_id });
            for(let g of goals) {
               g.targetAmount = (g.targetAmount || 0) * rate;
               g.currentAmount = (g.currentAmount || 0) * rate;
               await DB.update('goals', g._id, g);
            }
         }
         
         await DB.update('accounts', account._id, account);
      } else {
         await DB.insert('accounts', { user_id, balance: 0, currency: currency || 'ZAR', persona: persona || 'personal' });
      }
      res.json({ success: true });
    } catch(err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/seed", async (req, res) => {

    try {
      const user_id = req.query.user_id as string;
      if (!user_id || user_id === 'default_user') return res.status(401).json({ error: 'Auth required' });
      
      let existingAccount = await DB.findOne('accounts', { user_id });
      const persona = existingAccount?.persona || req.body.persona || 'personal';
      const currency = existingAccount?.currency || req.body.currency || 'ZAR';

      await DB.deleteMany('transactions', { user_id });
      await DB.deleteMany('budgets', { user_id });
      await DB.deleteMany('goals', { user_id });
      await DB.deleteMany('spaces', { user_id });

      const space = await DB.insert('spaces', { user_id, name: 'Demo Space', type: persona === 'professional' ? 'Business' : 'Personal', balance: Math.floor(Math.random() * 80000) + 10000, currency });
      const space_id = space._id;
      
      const d = new Date();
      const currentMonth = d.toISOString().slice(0, 7);
      
      const randomDate = () => {
         const past = new Date(d.getTime() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000);
         return past.toISOString();
      };

      if (persona === 'founder') {
         await DB.insert('budgets', { user_id, space_id, category: 'Software', limit: 8000, currentAmount: 0, month: currentMonth });
         await DB.insert('budgets', { user_id, space_id, category: 'Advertising', limit: 15000, currentAmount: 0, month: currentMonth });
         const saas = ['Vercel', 'AWS', 'Google Workspace', 'Notion', 'Linear', 'OpenAI', 'Stripe'];
         for(let i=0; i<40; i++) {
            await DB.insert('transactions', { user_id, space_id, amount: Math.floor(Math.random() * 2000) + 50, currency, category: 'Software', merchant: saas[Math.floor(Math.random()*saas.length)], date: randomDate(), type: 'expense' });
         }
         for(let i=0; i<10; i++) {
            await DB.insert('transactions', { user_id, space_id, amount: Math.floor(Math.random() * 5000) + 1000, currency, category: 'Advertising', merchant: 'Meta Ads', date: randomDate(), type: 'expense' });
         }
         for(let i=0; i<8; i++) {
            await DB.insert('transactions', { user_id, space_id, amount: Math.floor(Math.random() * 20000) + 5000, currency, category: 'Revenue', merchant: 'Stripe Payout', date: randomDate(), type: 'income' });
         }
      } else if (persona === 'freelancer') {
         await DB.insert('clients', { user_id, name: 'TechNova', hourly_rate: 150, payment_terms_days: 30, avg_payment_delay_days: 3 });
         await DB.insert('clients', { user_id, name: 'CreativeCo', hourly_rate: 120, payment_terms_days: 15, avg_payment_delay_days: 12 });
         const expenses = ['Adobe CC', 'Figma', 'Upwork Fee', 'WeWork Desk', 'Coffee Shop', 'Internet'];
         for(let i=0; i<30; i++) {
            await DB.insert('transactions', { user_id, space_id, amount: Math.floor(Math.random() * 400) + 20, currency, category: 'Business', merchant: expenses[Math.floor(Math.random()*expenses.length)], date: randomDate(), type: 'expense' });
         }
         const clients = ['TechNova', 'CreativeCo', 'Acme Corp', 'Startup Inc'];
         for(let i=0; i<15; i++) {
            await DB.insert('transactions', { user_id, space_id, amount: Math.floor(Math.random() * 8000) + 2000, currency, category: 'Consulting', merchant: clients[Math.floor(Math.random()*clients.length)], date: randomDate(), type: 'income' });
         }
      } else if (persona === 'side_project') {
         await DB.insert('projects', { user_id, name: 'Taskify App', status: 'active', mrr: 850, total_users: 124 });
         const infra = ['DigitalOcean', 'Vercel', 'Render', 'Mailgun', 'Pusher'];
         for(let i=0; i<25; i++) {
            await DB.insert('transactions', { user_id, space_id, amount: Math.floor(Math.random() * 150) + 10, currency, category: 'Hosting', merchant: infra[Math.floor(Math.random()*infra.length)], date: randomDate(), type: 'expense', project_id: 'taskify' });
         }
         for(let i=0; i<12; i++) {
            await DB.insert('transactions', { user_id, space_id, amount: Math.floor(Math.random() * 300) + 100, currency, category: 'Subscriptions', merchant: 'App Store Connect', date: randomDate(), type: 'income' });
         }
      } else if (persona === 'student') {
         await DB.insert('budgets', { user_id, space_id, category: 'Food', limit: 3000, currentAmount: 0, month: currentMonth });
         await DB.insert('budgets', { user_id, space_id, category: 'Entertainment', limit: 1500, currentAmount: 0, month: currentMonth });
         await DB.insert('goals', { user_id, space_id, name: 'Pay off Loan', targetAmount: 25000, currentAmount: 2000, targetDate: '2027-12-31' });
         const merchants = ['Campus Cafe', 'Subway', 'University Bookstore', 'Uber', 'Spotify', 'Netflix', 'Local Bar', 'Grocery Store'];
         for(let i=0; i<45; i++) {
            await DB.insert('transactions', { user_id, space_id, amount: Math.floor(Math.random() * 200) + 15, currency, category: Math.random() > 0.5 ? 'Food' : 'Entertainment', merchant: merchants[Math.floor(Math.random()*merchants.length)], date: randomDate(), type: 'expense' });
         }
         for(let i=0; i<5; i++) {
            await DB.insert('transactions', { user_id, space_id, amount: Math.floor(Math.random() * 3000) + 1000, currency, category: 'Job', merchant: 'Campus Tutoring', date: randomDate(), type: 'income' });
         }
      } else if (persona === 'family') {
         await DB.insert('budgets', { user_id, space_id, category: 'Groceries', limit: 8000, currentAmount: 0, month: currentMonth });
         await DB.insert('budgets', { user_id, space_id, category: 'Childcare', limit: 5000, currentAmount: 0, month: currentMonth });
         await DB.insert('goals', { user_id, space_id, name: 'College Fund', targetAmount: 150000, currentAmount: 25000, targetDate: '2035-08-01' });
         await DB.insert('goals', { user_id, space_id, name: 'Family Vacation', targetAmount: 30000, currentAmount: 12000, targetDate: '2026-12-01' });
         const merchants = ['Costco', 'Walmart', 'Target', 'Local Daycare', 'Pediatrician', 'Gas Station', 'Home Depot', 'Amazon'];
         const categories = ['Groceries', 'Childcare', 'Health', 'Transport', 'Home'];
         for(let i=0; i<50; i++) {
            await DB.insert('transactions', { user_id, space_id, amount: Math.floor(Math.random() * 1500) + 50, currency, category: categories[Math.floor(Math.random()*categories.length)], merchant: merchants[Math.floor(Math.random()*merchants.length)], date: randomDate(), type: 'expense' });
         }
         for(let i=0; i<6; i++) {
            await DB.insert('transactions', { user_id, space_id, amount: Math.floor(Math.random() * 45000) + 30000, currency, category: 'Salary', merchant: 'Tech Corp', date: randomDate(), type: 'income' });
         }
      } else if (persona === 'digital_nomad') {
         await DB.insert('budgets', { user_id, space_id, category: 'Travel', limit: 12000, currentAmount: 0, month: currentMonth });
         await DB.insert('budgets', { user_id, space_id, category: 'Accommodation', limit: 15000, currentAmount: 0, month: currentMonth });
         await DB.insert('goals', { user_id, space_id, name: 'Next Country Fund', targetAmount: 20000, currentAmount: 8000, targetDate: '2026-09-01' });
         const merchants = ['Airbnb', 'Booking.com', 'Uber', 'Local Flight', 'WeWork', 'Selina Hostel', 'Street Food Hub', 'SIM Card Provider'];
         const categories = ['Travel', 'Accommodation', 'Food', 'Work'];
         for(let i=0; i<40; i++) {
            await DB.insert('transactions', { user_id, space_id, amount: Math.floor(Math.random() * 2000) + 100, currency, category: categories[Math.floor(Math.random()*categories.length)], merchant: merchants[Math.floor(Math.random()*merchants.length)], date: randomDate(), type: 'expense' });
         }
         for(let i=0; i<6; i++) {
            await DB.insert('transactions', { user_id, space_id, amount: Math.floor(Math.random() * 25000) + 10000, currency, category: 'Client Work', merchant: 'Remote Corp', date: randomDate(), type: 'income' });
         }
      } else {
         await DB.insert('budgets', { user_id, space_id, category: 'Food & Dining', limit: 6000, currentAmount: 0, month: currentMonth });
         await DB.insert('budgets', { user_id, space_id, category: 'Entertainment', limit: 3000, currentAmount: 0, month: currentMonth });
         await DB.insert('budgets', { user_id, space_id, category: 'Transport', limit: 2500, currentAmount: 0, month: currentMonth });
         
         await DB.insert('goals', { user_id, space_id, name: 'Emergency Fund', targetAmount: 60000, currentAmount: 45000, targetDate: '2027-12-31' });
         await DB.insert('goals', { user_id, space_id, name: 'New Car Deposit', targetAmount: 40000, currentAmount: 12500, targetDate: '2026-10-01' });
         await DB.insert('goals', { user_id, space_id, name: 'Europe Vacation', targetAmount: 35000, currentAmount: 34000, targetDate: '2026-08-15' });

         const expensesList = [
            { c: 'Food & Dining', m: ['Uber Eats', 'Starbucks', 'Woolworths', 'Checkers', 'Local Cafe', 'Nandos', 'KFC'] },
            { c: 'Entertainment', m: ['Netflix', 'Spotify', 'Prime Video', 'Cinema', 'Steam Games', 'Concert Tickets'] },
            { c: 'Transport', m: ['Uber', 'Shell Gas Station', 'BP', 'Gautrain', 'Flight Tickets'] },
            { c: 'Health', m: ['Pharmacy', 'Gym Membership', 'Doctor Visit', 'Health Insurance'] },
            { c: 'Shopping', m: ['Amazon', 'Takealot', 'H&M', 'Zara', 'Apple Shop', 'Superbalist'] },
            { c: 'Housing', m: ['Rent', 'Electricity', 'Water Bill', 'Internet Fibre'] }
         ];

         for(let i=0; i<80; i++) {
            const expenseItem = expensesList[Math.floor(Math.random() * expensesList.length)];
            await DB.insert('transactions', { 
               user_id, 
               space_id, 
               amount: Math.floor(Math.random() * 1200) + 20, 
               currency, 
               category: expenseItem.c, 
               merchant: expenseItem.m[Math.floor(Math.random() * expenseItem.m.length)], 
               date: randomDate(), 
               type: 'expense' 
            });
         }
         
         // Insert some fresh data today
         await DB.insert('transactions', { user_id, space_id, amount: 65.50, currency, category: 'Food & Dining', merchant: 'Coffee Shop', date: new Date().toISOString(), type: 'expense' });
         await DB.insert('transactions', { user_id, space_id, amount: 450.00, currency, category: 'Transport', merchant: 'Uber Ride', date: new Date().toISOString(), type: 'expense' });
         
         // Insert income
         for(let i=0; i<5; i++) {
            await DB.insert('transactions', { user_id, space_id, amount: Math.floor(Math.random() * 5000) + 40000, currency, category: 'Salary', merchant: 'Acme Corp', date: randomDate(), type: 'income' });
         }
      }

      const allTx = await DB.find('transactions', { user_id });
      const currentMonthTx = allTx.filter((t: any) => t.date.startsWith(currentMonth) && t.type === 'expense');
      const budgets = await DB.find('budgets', { user_id, month: currentMonth });
      for (const b of budgets) {
         const spent = currentMonthTx.filter((t: any) => t.category.toLowerCase() === b.category.toLowerCase()).reduce((acc: number, t: any) => acc + t.amount, 0);
         b.currentAmount = spent;
         await DB.update('budgets', b._id, b);
      }
    
      res.json({ success: true, message: 'Database seeded' });

    } catch(err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  
  app.post("/api/clear", async (req, res) => {
    try {
      const user_id = req.query.user_id as string;
      if (!user_id || user_id === 'default_user') return res.status(401).json({ error: 'Auth required' });
      await DB.deleteMany('transactions', { user_id });
      await DB.deleteMany('budgets', { user_id });
      await DB.deleteMany('goals', { user_id });
      await DB.deleteMany('spaces', { user_id });
      res.json({ success: true, message: 'All data cleared' });
    } catch(err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/chat", handleChatMessage);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
