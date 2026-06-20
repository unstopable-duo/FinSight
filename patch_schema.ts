import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

const accountSchemaRegex = /const accountSchema = new mongoose\.Schema\(\{([\s\S]*?)\}\);/;
content = content.replace(accountSchemaRegex, `const accountSchema = new mongoose.Schema({$1, payday: { type: Number }});`);

const modelDecls = `const Account = mongoose.model('Account', accountSchema);`;
const newModelDecls = `const Account = mongoose.model('Account', accountSchema);

const debtSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  friend_name: { type: String, required: true },
  amount: { type: Number, required: true },
  description: { type: String },
  status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  date: { type: Date, default: Date.now }
});
const Debt = mongoose.model('Debt', debtSchema);
`;
content = content.replace(modelDecls, newModelDecls);

fs.writeFileSync('server.ts', content, 'utf8');
