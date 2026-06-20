import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

// 1. Fix /api/dashboard and calculate savings rate / daily spending
const dashboardStart = '  app.get("/api/dashboard", async (req, res) => {\n    try {\n      const user_id = req.query.user_id as string || \'default_user\';';
const newDashboardStart = `  app.get("/api/dashboard", async (req, res) => {
    try {
      const user_id = req.query.user_id as string;
      if (!user_id || user_id === 'default_user') {
        return res.status(401).json({ error: 'Authentication required' });
      }`;

content = content.replace(dashboardStart, newDashboardStart);

// At the end of the dashboard endpoint, before returning, calculate the fields
const returnData = 'res.json({ transactions, budgets, goals, account, currentMonth });';
const newReturnData = `
      const dailySpending = await Transaction.aggregate([
        { $match: { user_id, type: 'expense', date: { $gte: currentMonthStart, $lt: nextMonthStart } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, total: { $sum: '$amount' } } },
        { $sort: { _id: 1 } }
      ]);
      
      const incomeMonthlyTotal = await Transaction.aggregate([
        { $match: { user_id, type: 'income', date: { $gte: currentMonthStart, $lt: nextMonthStart } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const expenseMonthlyTotal = await Transaction.aggregate([
        { $match: { user_id, type: 'expense', date: { $gte: currentMonthStart, $lt: nextMonthStart } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      
      const totalIncome = incomeMonthlyTotal[0]?.total || 0;
      const totalSpent = expenseMonthlyTotal[0]?.total || 0;
      const savingsRate = totalIncome > 0 ? ((totalIncome - totalSpent) / totalIncome * 100).toFixed(0) : 0;
      
      res.json({ transactions, budgets, goals, account, currentMonth, dailySpending, savingsRate });
`;
content = content.replace(returnData, newReturnData);


// 2. Fix api/chat user_id
const chatUserId = 'const response = await handleChatMessage(user_id || \'default_user\', message, image, history, workspaceToken, clientContext);';
const newChatUserId = `
      if (!user_id || user_id === 'default_user') {
        return res.status(401).json({ error: 'Authentication required' });
      }
      const response = await handleChatMessage(user_id, message, image, history, workspaceToken, clientContext);`;

content = content.replace(chatUserId, newChatUserId);


// 3. Add seed endpoint
const seedEndpoint = `
  app.post("/api/seed", async (req, res) => {
    try {
      const user_id = req.query.user_id as string;
      if (!user_id || user_id === 'default_user') return res.status(401).json({ error: 'Auth required' });
      
      await Transaction.deleteMany({ user_id });
      await Budget.deleteMany({ user_id });
      await Goal.deleteMany({ user_id });

      const currentMonth = new Date().toISOString().slice(0, 7);
      
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
        { user_id, name: 'Emergency Savings', target_amount: 30000, current_amount: 12000, deadline: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), status: 'active', currency: 'ZAR' },
      ]);
      
      // Transactions (Last 90 days)
      const categories = ['Groceries', 'Transport', 'Entertainment', 'Utilities', 'Dining', 'Shopping'];
      const merchants = ['Woolworths', 'Uber', 'Netflix', 'City Power', 'Nandos', 'Takealot'];
      const txs = [];
      
      for(let i=0; i<60; i++) {
         const date = new Date();
         date.setDate(date.getDate() - Math.floor(Math.random() * 90));
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
      
      // Add incomes
      for(let i=0; i<3; i++) {
         const date = new Date();
         date.setMonth(date.getMonth() - i);
         date.setDate(25);
         txs.push({ user_id, amount: 25000, currency: 'ZAR', category: 'Salary', merchant: 'Employer', type: 'income', date });
      }
      
      await Transaction.insertMany(txs);
      res.json({ success: true, message: 'Database seeded' });
    } catch(err: any) {
      res.status(500).json({ error: err.message });
    }
  });
`;

content = content.replace('app.post("/api/chat",', seedEndpoint + '\n  app.post("/api/chat",');

fs.writeFileSync('server.ts', content, 'utf8');
