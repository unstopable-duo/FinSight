import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { DB } from "./db";
import { pendoTrack } from "./pendo";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const recordTransactionDecl: FunctionDeclaration = {
  name: "recordTransaction",
  description: "Log a new transaction (expense or income) to the database. Uses correct space_id.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      space_id: { type: Type.STRING, description: "The ID of the space" },
      amount: { type: Type.NUMBER, description: "Amount of the transaction" },
      category: { type: Type.STRING, description: "Category of the transaction" },
      merchant: { type: Type.STRING, description: "Merchant or place" },
      type: { type: Type.STRING, description: "'expense' or 'income'" },
      date: { type: Type.STRING, description: "ISO date string" },
      currency: { type: Type.STRING, description: "Currency like ZAR or USD" }
    },
    required: ["space_id", "amount", "category", "merchant", "type"]
  }
};

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

const setBudgetDecl: FunctionDeclaration = {
  name: "setBudget",
  description: "Set a budget for a category",
  parameters: {
    type: Type.OBJECT,
    properties: {
      space_id: { type: Type.STRING, description: "The ID of the space" },
      category: { type: Type.STRING, description: "Category" },
      limit: { type: Type.NUMBER, description: "Budget limit amount" },
      month: { type: Type.STRING, description: "YYYY-MM format" },
      currency: { type: Type.STRING, description: "Currency" }
    },
    required: ["space_id", "category", "limit", "month"]
  }
};

const createGoalDecl: FunctionDeclaration = {
  name: "createGoal",
  description: "Create a savings goal",
  parameters: {
    type: Type.OBJECT,
    properties: {
      space_id: { type: Type.STRING, description: "The ID of the space" },
      name: { type: Type.STRING, description: "Name of the goal" },
      target_amount: { type: Type.NUMBER, description: "Amount needed" },
      target_date: { type: Type.STRING, description: "ISO Date for goal" }
    },
    required: ["space_id", "name", "target_amount", "target_date"]
  }
};

export async function handleChatMessage(req: any, res: any) {
  try {
    const { user_id, message, image, history, clientContext } = req.body;
    const activeSpaceId = clientContext.activeSpaceId || '';
    const spacesInfo = clientContext.spaces ? JSON.stringify(clientContext.spaces) : '[]';
    
    const newContextInfo = `[System Context: Today's date is ${new Date().toISOString()}.
Available Spaces: ${spacesInfo}
Currently Active Space ID: ${activeSpaceId}
NOTE: When logging a transaction, ALWAYS specify the correct space_id! If the user mentions a specific project or business context, use that space's ID. Otherwise, use the currently active space ID.
NOTE: If the user transfers money between spaces, use transferFunds tool.
Active Budgets in Space: ${JSON.stringify(clientContext.budgets || [])}
Active Goals in Space: ${JSON.stringify(clientContext.goals || [])}
Current Space Balance: ${clientContext.account ? clientContext.account.balance : 0}]`;

    const fullMessageText = newContextInfo + '\n\nUser message: ' + (message || "Analyze this image.");

    let messagePayload: any = fullMessageText;
    if (image) {
      const [mimeInfo, dataPart] = image.split(',');
      const mimeType = mimeInfo.split(':')[1].split(';')[0];
      messagePayload = [
        { text: fullMessageText },
        { inlineData: { data: dataPart, mimeType } }
      ];
    }

    const formattedHistory = (history || []).map((h: any) => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: Array.isArray(h.text) ? h.text : [{ text: h.text }]
    }));

    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: "You are a multi-space financial AI. Provide intelligent insights on patterns. Explain patterns rather than merely display charts.",
        tools: [{
          functionDeclarations: [
            recordTransactionDecl,
            transferFundsDecl,
            setBudgetDecl,
            createGoalDecl
          ]
        }],
        temperature: 0.2
      }
    });

    let response = await chat.sendMessage({ message: messagePayload, history: formattedHistory } as any);
    
    const actionResults = [];
    if (response.functionCalls && response.functionCalls.length > 0) {
      for (const call of response.functionCalls) {
        const { name, args } = call;
        let callResult: any = { status: 'success' };
        
        try {
          if (name === 'transferFunds') {
             const fromSpace = await DB.findOne('spaces', { _id: (args as any).from_space_id });
             const toSpace = await DB.findOne('spaces', { _id: (args as any).to_space_id });
             if (fromSpace && toSpace) {
               fromSpace.balance -= (args as any).amount;
               toSpace.balance += (args as any).amount;
               await DB.update('spaces', fromSpace._id, fromSpace);
               await DB.update('spaces', toSpace._id, toSpace);
               await DB.insert('transactions', { user_id, space_id: fromSpace._id, amount: (args as any).amount, category: 'Transfer', merchant: 'To ' + toSpace.name, date: new Date().toISOString(), type: 'expense', currency: fromSpace.currency });
               await DB.insert('transactions', { user_id, space_id: toSpace._id, amount: (args as any).amount, category: 'Transfer', merchant: 'From ' + fromSpace.name, date: new Date().toISOString(), type: 'income', currency: toSpace.currency });
               await pendoTrack("ai_funds_transferred", user_id, {
                 from_space_id: (args as any).from_space_id,
                 to_space_id: (args as any).to_space_id,
                 amount: (args as any).amount,
                 from_space_name: fromSpace.name,
                 to_space_name: toSpace.name,
                 success: true
               });
               callResult = { message: 'Transfer successful' };
             } else {
               callResult = { status: 'failed', error: 'Space not found' };
             }
          } else if (name === 'recordTransaction') {
             let space = await DB.findOne('spaces', { _id: (args as any).space_id });
             if (space) {
                if ((args as any).type === 'expense') space.balance -= (args as any).amount;
                else space.balance += (args as any).amount;
                await DB.update('spaces', space._id, space);
             }
             await DB.insert('transactions', { user_id, ...(args as any), date: (args as any).date ? new Date((args as any).date).toISOString() : new Date().toISOString() });
             await pendoTrack("ai_transaction_recorded", user_id, {
               amount: (args as any).amount,
               category: (args as any).category,
               merchant: (args as any).merchant,
               transaction_type: (args as any).type,
               space_id: (args as any).space_id,
               currency: (args as any).currency || ""
             });
          } else if (name === 'setBudget') {
             await DB.insert('budgets', { user_id, ...(args as any) });
             await pendoTrack("ai_budget_created", user_id, {
               category: (args as any).category,
               limit: (args as any).limit,
               month: (args as any).month,
               space_id: (args as any).space_id,
               currency: (args as any).currency || ""
             });
          } else if (name === 'createGoal') {
             await DB.insert('goals', { user_id, ...(args as any), current_amount: 0 });
             await pendoTrack("ai_goal_created", user_id, {
               goal_name: (args as any).name,
               target_amount: (args as any).target_amount,
               target_date: (args as any).target_date,
               space_id: (args as any).space_id
             });
          }
        } catch (err: any) {
           callResult = { status: 'failed', error: err.message };
        }
        
        actionResults.push({ name, args, callResult });
      }
      
      response = await chat.sendMessage([{
        functionResponse: {
          name: actionResults[0].name || '',
          response: actionResults[0].callResult as any
        }
      } as any]);
    }

    res.json({
      text: response.text,
      actions: actionResults
    });

  } catch (err: any) {
    console.error('Chat error:', err);
    res.status(500).json({ error: err.message });
  }
}
