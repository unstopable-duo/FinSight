import fs from 'fs';

let content = fs.readFileSync('server/gemini.ts', 'utf8');

// Replace model:
content = content.replace('model: "gemini-2.5-flash",', 
  'model: "gemini-3.1-flash",\n    history: history.map(m => ({ role: m.role, parts: [{ text: m.text }] })),');

// Fix System Instruction
const oldSysInst = 'Always respond concisely and conversationally.`,';
const newSysInst = 'Always respond concisely and conversationally.\nIf callResult contains an \'anomaly\' field, lead your response with that warning.\nIf callResult contains a \'budgetWarning\', always mention it prominently.`,';
content = content.replace(oldSysInst, newSysInst);

// Add contributeToGoalDecl
const contributeToGoalDecl = `
const contributeToGoalDecl: FunctionDeclaration = {
  name: "contributeToGoal",
  description: "Add an amount to a savings goal's current progress.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      goal_id: { type: Type.STRING, description: "The ID of the goal" },
      amount: { type: Type.NUMBER, description: "Amount to contribute" }
    },
    required: ["goal_id", "amount"]
  }
};
`;
content = content.replace('const createGoalDecl', contributeToGoalDecl + '\nconst createGoalDecl');
content = content.replace('createGoalDecl,', 'createGoalDecl,\n          contributeToGoalDecl,');

// Delete the old history re-playing loops. Find it carefully.
const historyLoop = `  // Restore history without executing tools from history
  for (const msg of history) {
    if (msg.role === 'user') {
       try { await chat.sendMessage({ message: msg.text }); } catch(err) {}
    }
  }
`;
if (content.includes(historyLoop)) {
  content = content.replace(historyLoop, '');
} else {
  console.log("Could not find history loop!");
}

fs.writeFileSync('server/gemini.ts', content, 'utf8');
