import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const seedEndpointRegex = /app\.post\("\/api\/seed", async \(req, res\) => \{[\s\S]*?res\.json\(\{ success: true, message: 'Database seeded' \}\);\s*\} catch\(err: any\) \{\s*res\.status\(500\)\.json\(\{ error: err\.message \}\);\s*\}\s*\}\);/g;

const newSeedEndpoint = `app.post("/api/seed", async (req, res) => {
    try {
      const user_id = req.query.user_id as string;
      if (!user_id || user_id === 'default_user') return res.status(401).json({ error: 'Auth required' });
      
      await Transaction.deleteMany({ user_id });
      await Budget.deleteMany({ user_id });
      await Goal.deleteMany({ user_id });
      await Account.deleteMany({ user_id });

      await Account.create({ user_id, balance: 45000, currency: 'ZAR' });

      const d = new Date();
      const currentMonth = d.toISOString().slice(0, 7);
      
      // Budgets
      await Budget.insertMany([
        { user_id, month: currentMonth, category: 'Groceries', limit: 4000, currency: 'ZAR' },
        { user_id, month: currentMonth, category: 'Transport', limit: 2000, currency: 'ZAR' },
        { user_id, month: currentMonth, category: 'Entertainment', limit: 1500, currency: 'ZAR' },
        { user_id, month: currentMonth, category: 'Utilities', limit: 2500, currency: 'ZAR' },
        { user_id, month: currentMonth, category: 'Dining', limit: 1800, currency: 'ZAR' },
      ]);
      
      // Goals
      await Goal.insertMany([
        { user_id, name: 'Holiday Fund', target_amount: 15000, current_amount: 5000, deadline: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), status: 'active', currency: 'ZAR' },
        { user_id, name: 'Emergency Savings', target_amount: 30000, current_amount: 22000, deadline: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), status: 'active', currency: 'ZAR' },
      ]);
      
      const categories = ['Groceries', 'Transport', 'Entertainment', 'Utilities', 'Dining', 'Shopping'];
      const merchants = ['Woolworths', 'Uber', 'Netflix', 'City Power', 'Nandos', 'Takealot'];
      const txs = [];
      
      // Generate 100 transactions for the CURRENT month so the dashboard looks full!
      const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      for(let i=0; i<100; i++) {
         const date = new Date(d.getFullYear(), d.getMonth(), Math.floor(Math.random() * Math.min(d.getDate(), daysInMonth)) + 1);
         const category = categories[Math.floor(Math.random() * categories.length)];
         const amount = Math.floor(Math.random() * 500) + 50;
         txs.push({
           user_id,
           amount,
           currency: 'ZAR',
           category,
           merchant: merchants[Math.floor(Math.random() * merchants.length)],
           date,
           type: 'expense'
         });
      }

      // Generate some older transactions just in case
      for(let i=0; i<20; i++) {
         const date = new Date();
         date.setDate(date.getDate() - (Math.floor(Math.random() * 60) + 30));
         const category = categories[Math.floor(Math.random() * categories.length)];
         const amount = Math.floor(Math.random() * 800) + 50;
         txs.push({
           user_id,
           amount,
           currency: 'ZAR',
           category,
           merchant: merchants[Math.floor(Math.random() * merchants.length)],
           date,
           type: 'expense'
         });
      }
      
      // Add incomes (Current month and 2 previous months)
      for(let i=0; i<3; i++) {
         const date = new Date(d.getFullYear(), d.getMonth() - i, 25);
         txs.push({ user_id, amount: 25000, currency: 'ZAR', category: 'Salary', merchant: 'Employer', type: 'income', date });
      }
      
      await Transaction.insertMany(txs);
      res.json({ success: true, message: 'Database seeded' });
    } catch(err: any) {
      res.status(500).json({ error: err.message });
    }
  });`;

content = content.replace(seedEndpointRegex, newSeedEndpoint);
fs.writeFileSync('server.ts', content, 'utf8');
