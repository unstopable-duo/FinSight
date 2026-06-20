import fs from 'fs';

let serverData = fs.readFileSync('server.ts', 'utf-8');

serverData = serverData.replace(
  `const user_id = req.query.user_id as string;`,
  `const user_id = req.query.user_id as string;\n      const space_id = req.query.space_id as string;`
);

serverData = serverData.replace(
  `const transactions = await DB.find('transactions', { user_id, date: { $gte: currentMonthStart, $lt: nextMonthStart } });
      const budgets = await DB.find('budgets', { user_id, month: currentMonth });
      const goals = await DB.find('goals', { user_id, status: 'active' });
      const debts = await DB.find('debts', { user_id, status: 'pending' });
      const clients = await DB.find('clients', { user_id });
      const projects = await DB.find('projects', { user_id });
      
      let account = await DB.findOne('accounts', { user_id });
      let isNewAccount = false;
      if (!account) {
        isNewAccount = true;
        account = await DB.insert('accounts', { user_id, balance: 0, currency: req.query.currency || 'ZAR', persona: req.query.persona || 'personal' });
      }`,
  `let spaces = await DB.find('spaces', { user_id });
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
      const account = { ...activeSpace, account_type: 'personal' }; // mock old account config`
);

serverData = serverData.replace(
  `let account = await DB.findOne('accounts', { user_id });
        if (account) {
          if (t.type === 'expense') account.balance += t.amount;
          else account.balance -= t.amount;
          await DB.update('accounts', account._id, account);
        }`,
  `let space = await DB.findOne('spaces', { _id: t.space_id });
        if (space) {
          if (t.type === 'expense') space.balance += t.amount;
          else space.balance -= t.amount;
          await DB.update('spaces', space._id, space);
        }`
);

// We need to return spaces and activeSpaceId
serverData = serverData.replace(
  `res.json({ transactions, budgets, goals, account, currentMonth, dailySpending, savingsRate, healthScore, predictedEndSpend, debts, clients, projects, isNewAccount });`,
  `res.json({ transactions, budgets, goals, account, currentMonth, dailySpending, savingsRate, healthScore, predictedEndSpend, isNewAccount, spaces, activeSpaceId });`
);

// Delete / clear changes
serverData = serverData.replace(
      `await DB.deleteMany('transactions', { user_id });
      await DB.deleteMany('budgets', { user_id });
      await DB.deleteMany('goals', { user_id });
      await DB.deleteMany('accounts', { user_id });
      await DB.deleteMany('projects', { user_id });
      await DB.deleteMany('clients', { user_id });`,
      
      `await DB.deleteMany('transactions', { user_id });
      await DB.deleteMany('budgets', { user_id });
      await DB.deleteMany('goals', { user_id });
      await DB.deleteMany('spaces', { user_id });`
);

// Adding new space endpoint
const newEndpoints = `
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
`;

serverData = serverData.replace(`app.post("/api/settings"`, newEndpoints + `\n  app.post("/api/settings"`);

fs.writeFileSync('server.ts', serverData);
console.log('patched server.ts');
