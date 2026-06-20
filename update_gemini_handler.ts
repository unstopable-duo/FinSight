import fs from 'fs';

let content = fs.readFileSync('server/gemini.ts', 'utf8');

const goalHandler = "} else if (name === 'createGoal') {";
const contributeHandler = `} else if (name === 'contributeToGoal') {
        const result = await Goal.findByIdAndUpdate(args.goal_id, { $inc: { current_amount: args.amount } }, { new: true });
        if (result) {
           let account = await Account.findOne({ user_id });
           if (account) {
             account.balance -= args.amount;
             await account.save();
           }
           callResult = { message: 'Contributed to goal and updated balance.', new_current_amount: result.current_amount };
        } else {
           throw new Error('Goal not found');
        }
      } else if (name === 'createGoal') {`;

content = content.replace(goalHandler, contributeHandler);
fs.writeFileSync('server/gemini.ts', content, 'utf8');
