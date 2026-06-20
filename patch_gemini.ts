import fs from 'fs';
let content = fs.readFileSync('server/gemini.ts', 'utf8');

const imports = `import { Transaction, Budget, Goal, Account, Debt } from './db';`;
content = content.replace(/import \{ Transaction, Budget, Goal, Account \} from \'\.\/db\';/, imports);

const contextContext = `
        const debts = await Debt.find({ user_id });
        
        contextInfo = \`[System Context: Today's date is \${new Date().toISOString()}. Current month: \${currentMonth}. 
Current Account Balance: \${currentBalance} \${accountCurrency}
Payday Date (day of month): \${account ? account.payday : 'Not set'}
Active Budgets: \${JSON.stringify(budgets)}
Spending this month: \${JSON.stringify(spending)}
Active Goals: \${JSON.stringify(goals)}
Pending Debts: \${JSON.stringify(debts)}]\`;
`;
content = content.replace(/contextInfo = `\[System Context[\s\S]*?\]`;/, contextContext);

const newDecls = `
const querySpendingDecl: FunctionDeclaration = {
  name: "querySpending",
  description: "Query the user's spending data for a specific date range and/or category. Use this when the user asks questions like 'How much did I spend on food last quarter?' or 'Compare my spending in April vs May'. You must provide the resolved date ranges.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      startDate: { type: Type.STRING, description: "ISO 8601 string for the start date" },
      endDate: { type: Type.STRING, description: "ISO 8601 string for the end date" },
      category: { type: Type.STRING, description: "Optional category to filter by" }
    },
    required: ["startDate", "endDate"]
  }
};

const detectRecurringDecl: FunctionDeclaration = {
  name: "detectRecurring",
  description: "Detects potential recurring transactions (subscriptions, rent, etc.) over the last few months by finding same merchants with similar amounts hitting periodically.",
  parameters: { type: Type.OBJECT, properties: {} }
};

const getPaydayPlanDecl: FunctionDeclaration = {
  name: "getPaydayPlan",
  description: "Generates a payday plan based on the user's active goals, pending debts, and budgets.",
  parameters: { type: Type.OBJECT, properties: {} }
};

const setPaydayDecl: FunctionDeclaration = {
  name: "setPayday",
  description: "Sets the user's payday (the day of the month they get paid, 1-31).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      dayOfMonth: { type: Type.NUMBER, description: "The day of the month (1-31)" }
    },
    required: ["dayOfMonth"]
  }
};

const recordDebtDecl: FunctionDeclaration = {
  name: "recordDebt",
  description: "Records a debt owed to the user by a friend after splitting an expense.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      friendName: { type: Type.STRING, description: "Name of the friend" },
      amount: { type: Type.NUMBER, description: "Amount owed" },
      description: { type: Type.STRING, description: "What the debt is for" }
    },
    required: ["friendName", "amount"]
  }
};

const markDebtPaidDecl: FunctionDeclaration = {
  name: "markDebtPaid",
  description: "Marks an existing pending debt as paid.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      debtId: { type: Type.STRING, description: "The _id of the debt to mark as paid" }
    },
    required: ["debtId"]
  }
};

const sendEmailDecl: FunctionDeclaration = {
  name: "sendMonthlySummaryEmail",
  description: "Sends a monthly summary email to the user using the Gmail API. Provides a personalized tip, income vs expenses, etc.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      subject: { type: Type.STRING, description: "Subject of the email" },
      body: { type: Type.STRING, description: "HTML or plain text body of the email" }
    },
    required: ["subject", "body"]
  }
};
`;

content = content.replace("const createCalendarEventDecl", newDecls + "\nconst createCalendarEventDecl");

// Add them to the tools array
const oldToolsList = `createCalendarEventDecl,
          editTransactionDecl
        ]`;
const newToolsList = `createCalendarEventDecl,
          editTransactionDecl,
          querySpendingDecl,
          detectRecurringDecl,
          getPaydayPlanDecl,
          setPaydayDecl,
          recordDebtDecl,
          markDebtPaidDecl,
          sendEmailDecl
        ]`;
content = content.replace(oldToolsList, newToolsList);

const newHandlers = `
      } else if (name === 'sendMonthlySummaryEmail') {
        if (!workspaceToken) {
          throw new Error("Email integration requires user to sign in with Google with Gmail permissions.");
        }
        
        let tokenData;
        try {
           const infoRes = await fetch('https://oauth2.googleapis.com/tokeninfo?access_token=' + workspaceToken);
           tokenData = await infoRes.json();
        } catch(e) {}
        
        const email = tokenData?.email || 'user@example.com';
        
        const messageParts = [
          \`To: \${email}\`,
          \`Subject: \${args.subject}\`,
          \`Content-Type: text/html; charset=utf-8\`,
          '',
          args.body.replace(/\n/g, '<br>')
        ];
        const rawMessage = Buffer.from(messageParts.join('\\n')).toString('base64').replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '');
        
        const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
           method: 'POST',
           headers: {
             'Authorization': \`Bearer \${workspaceToken}\`,
             'Content-Type': 'application/json'
           },
           body: JSON.stringify({ raw: rawMessage })
        });
        
        const resData = await res.json();
        if (resData.error) throw new Error(resData.error.message);
        callResult = { status: 'success', message: "Email sent successfully" };

      } else if (name === 'querySpending') {
        const start = new Date(args.startDate);
        const end = new Date(args.endDate);
        const query: any = { user_id, date: { $gte: start, $lte: end }, type: 'expense' };
        if (args.category) query.category = args.category;
        
        const txs = await Transaction.find(query);
        const total = txs.reduce((acc, t) => acc + (t.amount || 0), 0);
        
        callResult = { total_spent: total, transaction_count: txs.length, transactions: txs };

      } else if (name === 'setPayday') {
        let account = await Account.findOne({ user_id });
        if (!account) {
           account = new Account({ user_id, balance: 0, payday: args.dayOfMonth });
        } else {
           account.payday = args.dayOfMonth;
        }
        await account.save();
        callResult = { status: 'success', payday: account.payday };

      } else if (name === 'getPaydayPlan') {
        let account = await Account.findOne({ user_id });
        const budgets = await Budget.find({ user_id, month: currentMonth });
        const goals = await Goal.find({ user_id, status: 'active' });
        const debts = await Debt.find({ user_id, status: 'pending' });
        
        callResult = {
           status: 'success',
           currentBalance: account?.balance || 0,
           nextPaydayDate: account?.payday || null,
           budgetsRemaining: budgets,
           goalsPending: goals,
           debtsOwedToYou: debts
        };

      } else if (name === 'recordDebt') {
        const debt = new Debt({
           user_id,
           friend_name: args.friendName,
           amount: args.amount,
           description: args.description || '',
           status: 'pending'
        });
        await debt.save();
        callResult = { status: 'success', debtId: debt._id };

      } else if (name === 'markDebtPaid') {
        const debt = await Debt.findById(args.debtId);
        if (debt) {
           debt.status = 'paid';
           await debt.save();
           
           // Optionally add back to balance
           let account = await Account.findOne({ user_id });
           if (account) {
              account.balance += debt.amount;
              await account.save();
           }
           
           // Also optionally log as income? We won't log it as income for now, or maybe yes
           const tx = new Transaction({
              user_id, type: 'income', amount: debt.amount, category: 'Transfer', merchant: debt.friend_name, date: new Date(), currency: 'ZAR'
           });
           await tx.save();
           
           callResult = { status: 'success', message: 'Debt marked as paid and added to balance.' };
        } else {
           callResult = { status: 'failed', message: 'Debt not found.' };
        }
        
      } else if (name === 'detectRecurring') {
        // Find subscriptions: group by merchant & amount, count > 1
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        
        const recurring = await Transaction.aggregate([
           { $match: { user_id, type: 'expense', date: { $gte: threeMonthsAgo } } },
           { $group: { _id: { merchant: "$merchant", amount: "$amount" }, count: { $sum: 1 }, latestDate: { $max: "$date" } } },
           { $match: { count: { $gt: 1 } } },
           { $sort: { "_id.amount": -1 } }
        ]);
        callResult = { recurring_transactions_found: recurring };
`;

content = content.replace("      } else if (name === 'setBudget') {", newHandlers + "\n      } else if (name === 'setBudget') {");

fs.writeFileSync('server/gemini.ts', content, 'utf8');
