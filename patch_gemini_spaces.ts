import fs from 'fs';

let gData = fs.readFileSync('server/gemini.ts', 'utf-8');

gData = gData.replace(`const recordTransactionDecl: FunctionDeclaration = {
  name: "recordTransaction",
  description: "Log a new transaction (expense or income) to the database.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      amount: { type: Type.NUMBER, description: "Amount of the transaction" },`,
`const recordTransactionDecl: FunctionDeclaration = {
  name: "recordTransaction",
  description: "Log a new transaction (expense or income) to the database. Uses correct space_id.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      space_id: { type: Type.STRING, description: "The ID of the space" },
      amount: { type: Type.NUMBER, description: "Amount of the transaction" },`);

gData = gData.replace(`required: ["amount", "category", "merchant", "type"]`, `required: ["space_id", "amount", "category", "merchant", "type"]`);

const transferFundsDecl = `
const transferFundsDecl: FunctionDeclaration = {
  name: "transferFunds",
  description: "Transfer funds from one space to another.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      from_space_id: { type: Type.STRING, description: "The ID of the source space" },
      to_space_id: { type: Type.STRING, description: "The ID of the destination space" },
      amount: { type: Type.NUMBER, description: "Amount to transfer" }
    },
    required: ["from_space_id", "to_space_id", "amount"]
  }
};
`;

gData = gData.replace(`const setBudgetDecl: FunctionDeclaration = {`, transferFundsDecl + `\nconst setBudgetDecl: FunctionDeclaration = {`);

gData = gData.replace(`setBudgetDecl,`, `setBudgetDecl, transferFundsDecl,`);

gData = gData.replace(`const { user_id, message, image, history, workspaceToken, clientContext } = req.body;`, `const { user_id, message, image, history, workspaceToken, clientContext } = req.body;\n      const activeSpaceId = clientContext.activeSpaceId;\n      const allSpaces = clientContext.spaces || [];`);

// Replace context building
gData = gData.replace(
`const fullMessageText = contextInfo + (message || "Analyze this image.");`,
`const spacesInfo = _clientContext.spaces ? JSON.stringify(_clientContext.spaces) : '[]';
const activeSpaceId = _clientContext.activeSpaceId || '';
const newContextInfo = \`[System Context: Today's date is \${new Date().toISOString()}.
Available Spaces: \${spacesInfo}
Currently Active Space ID: \${activeSpaceId}
NOTE: When logging a transaction, ALWAYS specify the correct space_id! If the user mentions a specific project or business context, use that space's ID. Otherwise, use the currently active space ID.
NOTE: If the user transfers money between spaces, use transferFunds tool.
For transactions, ensure you use the context of the active space to map the category (e.g., AWS in Business Space -> Infrastructure; AWS in Personal Space -> Technology).
Active Budgets in Space: \${JSON.stringify(_clientContext.budgets || [])}
Active Goals in Space: \${JSON.stringify(_clientContext.goals || [])}
Current Space Balance: \${_clientContext.account ? _clientContext.account.balance : 0}\]\`;

const fullMessageText = newContextInfo + (message || "Analyze this image.");`
);

// We need to implement transferFunds in handleChatMessage switch
gData = gData.replace(
`if (name === 'recordTransaction') {
        const t = await DB.insert('transactions', { user_id, ...args, date: args.date ? new Date(args.date).toISOString() : new Date().toISOString() });`,
`if (name === 'transferFunds') {
        const fromSpace = await DB.findOne('spaces', { _id: args.from_space_id });
        const toSpace = await DB.findOne('spaces', { _id: args.to_space_id });
        if (fromSpace && toSpace) {
          fromSpace.balance -= args.amount;
          toSpace.balance += args.amount;
          await DB.update('spaces', fromSpace._id, fromSpace);
          await DB.update('spaces', toSpace._id, toSpace);
          await DB.insert('transactions', { user_id, space_id: fromSpace._id, amount: args.amount, category: 'Transfer', merchant: 'To ' + toSpace.name, date: new Date().toISOString(), type: 'expense', currency: fromSpace.currency });
          await DB.insert('transactions', { user_id, space_id: toSpace._id, amount: args.amount, category: 'Transfer', merchant: 'From ' + fromSpace.name, date: new Date().toISOString(), type: 'income', currency: toSpace.currency });
          callResult = { message: 'Transfer successful' };
        } else {
          callResult = { status: 'failed', error: 'Space not found' };
        }
      } else if (name === 'recordTransaction') {
        let space = await DB.findOne('spaces', { _id: args.space_id });
        if (space) {
           if (args.type === 'expense') space.balance -= args.amount;
           else space.balance += args.amount;
           await DB.update('spaces', space._id, space);
        }
        const t = await DB.insert('transactions', { user_id, ...args, date: args.date ? new Date(args.date).toISOString() : new Date().toISOString() });`
);

gData = gData.replace(
`let personaInstruction = '';
  if (persona === 'founder') {`,
`let personaInstruction = 'You are a multi-space financial AI. Provide intelligent insights on patterns ("Your advertising costs increased 27%", "At your current spend rate..."). Explain patterns rather than merely display charts.';\n  if (false) {`
);

fs.writeFileSync('server/gemini.ts', gData);
console.log('patched gemini');
