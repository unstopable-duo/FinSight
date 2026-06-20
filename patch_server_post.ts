import fs from 'fs';

let serverData = fs.readFileSync('server.ts', 'utf-8');

serverData = serverData.replace(
`  app.post("/api/chat", async (req, res) => {
    try {
      const { user_id, message, image, history, workspaceToken, clientContext } = req.body;
      
      if (!user_id || user_id === 'default_user') {
        return res.status(401).json({ error: 'Authentication required' });
      }
      const response = await handleChatMessage(user_id, message, image, history, workspaceToken, clientContext);
      res.json(response);
    } catch (err: any) {
      if (err.message && (err.message.includes('API_KEY_INVALID') || err.message.includes('API key not valid') || err.message.includes('GEMINI_API_KEY') || err.message.includes('GEMINI_API_KEYZ'))) {
        res.status(400).json({ error: "API key not valid. Please pass a valid API key." });
      } else if (err.message && (err.message.includes('429') || err.message.includes('quota') || err.message.includes('RESOURCE_EXHAUSTED'))) {
        res.status(429).json({ error: "You've exceeded your Gemini API quota. Please check your billing or rate limits." });
      } else if (err.message && (err.message.includes('503') || err.message.includes('UNAVAILABLE') || err.message.includes('high demand'))) {
        res.status(503).json({ error: "The AI model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later." });
      } else {
        console.error('Chat error:', err);
        res.status(500).json({ error: err.message });
      }
    }
  });`,
`  app.post("/api/chat", handleChatMessage);`
);

fs.writeFileSync('server.ts', serverData);
console.log('patched chat post API');
