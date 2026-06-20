import fs from 'fs';

let serverData = fs.readFileSync('server.ts', 'utf-8');

serverData = serverData.replace(
  /app.post\("\/api\/clear", async \(req, res\) => \{/g,
  `app.post("/api/seed", async (req, res) => {\n` // Rename it to seed
);

// We need to recreate /api/clear explicitly.
const clearEndpoint = `
  app.post("/api/clear", async (req, res) => {
    try {
      const user_id = req.query.user_id as string;
      if (!user_id || user_id === 'default_user') return res.status(401).json({ error: 'Auth required' });
      await DB.deleteMany('transactions', { user_id });
      await DB.deleteMany('budgets', { user_id });
      await DB.deleteMany('goals', { user_id });
      await DB.deleteMany('spaces', { user_id });
      res.json({ success: true, message: 'All data cleared' });
    } catch(err: any) { res.status(500).json({ error: err.message }); }
  });
`;

serverData = serverData.replace(
  `app.post("/api/chat", async (req, res) => {`,
  clearEndpoint + `\n  app.post("/api/chat", async (req, res) => {`
);

fs.writeFileSync('server.ts', serverData);
console.log('patched seed/clear endpoint');
