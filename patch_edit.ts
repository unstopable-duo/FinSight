import fs from 'fs';
let content = fs.readFileSync('server/gemini.ts', 'utf8');

const editDecl = `
const editTransactionDecl: FunctionDeclaration = {
  name: 'editTransaction',
  description: 'Edits an existing transaction based on a search description, or by specifying exact fields. Use this when the user wants to correct a previous transaction.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      searchMerchant: { type: Type.STRING, description: 'The merchant name to search for (e.g. Woolworths)' },
      searchAmount: { type: Type.NUMBER, description: 'The approximate old amount of the transaction' },
      newAmount: { type: Type.NUMBER, description: 'The corrected amount' },
      newCategory: { type: Type.STRING, description: 'The corrected category' },
      newMerchant: { type: Type.STRING, description: 'The corrected merchant' }
    },
    required: ['searchMerchant']
  }
};`;

content = content.replace('const createCalendarEventDecl', editDecl + '\n\nconst createCalendarEventDecl');
content = content.replace('createCalendarEventDecl\n        ]', 'createCalendarEventDecl,\n          editTransactionDecl\n        ]');

const editHandler = `
      } else if (name === 'editTransaction') {
        const query: any = { user_id, type: 'expense' };
        if (args.searchMerchant) {
          query.merchant = { $regex: new RegExp(args.searchMerchant, 'i') };
        }
        if (args.searchAmount) {
          query.amount = { $gte: args.searchAmount * 0.8, $lte: args.searchAmount * 1.2 };
        }
        
        const tx = await Transaction.findOne(query).sort({ date: -1 });
        if (tx) {
            const oldAmount = tx.amount;
            if (args.newAmount) tx.amount = args.newAmount;
            if (args.newCategory) tx.category = args.newCategory;
            if (args.newMerchant) tx.merchant = args.newMerchant;
            await tx.save();

            let account = await Account.findOne({ user_id });
            if (account) {
                 account.balance += oldAmount;
                 account.balance -= tx.amount;
                 await account.save();
            }

            callResult = { id: tx._id, message: \`Updated transaction for \${tx.merchant}. New amount: \${tx.amount}\` };
        } else {
            callResult = { status: 'failed', error: 'No matching transaction found.' };
        }
`;

content = content.replace("      } else if (name === 'setBudget') {", editHandler + "      } else if (name === 'setBudget') {");

fs.writeFileSync('server/gemini.ts', content, 'utf8');
