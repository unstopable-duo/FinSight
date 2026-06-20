import fs from 'fs';

let serverData = fs.readFileSync('server.ts', 'utf-8');

// 1. Fix user account resolution in /api/dashboard
serverData = serverData.replace(
`      // Use active space for balances
      const account = { ...activeSpace, account_type: 'personal' }; // mock old account config

      const expenses = transactions.filter((t: any) => t.type === 'expense');`,
`      // Use active space for balances
      let userAccount = await DB.findOne('accounts', { user_id });
      const persona = userAccount?.persona || 'personal';
      const userCurrency = userAccount?.currency || activeSpace.currency || 'ZAR';
      const account = { ...activeSpace, ...userAccount, persona, account_type: persona, currency: userCurrency }; 

      const expenses = transactions.filter((t: any) => t.type === 'expense');`
);

// 2. Improve Seed Data
// Replace the block of seed data for "else" (which is personal)
serverData = serverData.replace(
`      } else {
         await DB.insert('budgets', { user_id, space_id, category: 'Groceries', limit: 4000, currentAmount: 0, month: currentMonth });
         await DB.insert('budgets', { user_id, space_id, category: 'Entertainment', limit: 2000, currentAmount: 0, month: currentMonth });
         await DB.insert('goals', { user_id, space_id, name: 'Emergency Fund', targetAmount: 50000, currentAmount: 18000, targetDate: '2026-12-31' });
         const merchants = ['Woolworths', 'Checkers', 'Uber Eats', 'Netflix', 'Gym', 'Shell', 'Pharmacy', 'Takealot'];
         const categories = ['Groceries', 'Entertainment', 'Transport', 'Health', 'Shopping'];
         for(let i=0; i<35; i++) {
            await DB.insert('transactions', { user_id, space_id, amount: Math.floor(Math.random() * 800) + 50, currency, category: categories[Math.floor(Math.random()*categories.length)], merchant: merchants[Math.floor(Math.random()*merchants.length)], date: randomDate(), type: 'expense' });
         }
         for(let i=0; i<6; i++) {
            await DB.insert('transactions', { user_id, space_id, amount: Math.floor(Math.random() * 30000) + 20000, currency, category: 'Salary', merchant: 'Corp Inc', date: randomDate(), type: 'income' });
         }
      }`,
`      } else {
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
      }`
);

fs.writeFileSync('server.ts', serverData);
console.log('patched server settings and seed data');
