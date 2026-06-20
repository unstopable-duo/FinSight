import fs from 'fs';

let serverData = fs.readFileSync('server.ts', 'utf-8');

serverData = serverData.replace(
  /await DB\.insert\('accounts', \{ user_id, balance: Math\.floor\(Math\.random\(\) \* 80000\) \+ 10000, currency, persona \}\);/g,
  `const space = await DB.insert('spaces', { user_id, name: 'Demo Space', type: persona === 'professional' ? 'Business' : 'Personal', balance: Math.floor(Math.random() * 80000) + 10000, currency });\n      const space_id = space._id;`
);

serverData = serverData.replace(
  /await DB.insert\('transactions', \{ user_id/g,
  `await DB.insert('transactions', { user_id, space_id`
);

serverData = serverData.replace(
  /await DB.insert\('budgets', \{ user_id/g,
  `await DB.insert('budgets', { user_id, space_id`
);

serverData = serverData.replace(
  /await DB.insert\('goals', \{ user_id/g,
  `await DB.insert('goals', { user_id, space_id`
);

fs.writeFileSync('server.ts', serverData);
console.log('patched seed logic');
