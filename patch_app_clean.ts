import fs from 'fs';
let app = fs.readFileSync('src/App.tsx', 'utf-8');
app = app.replace(/const \[isSeeding, setIsSeeding\] = useState\(false\);\\n  const handleSeed = /g, '/* @ts-ignore */\n  const handleSeed_removed = ');
fs.writeFileSync('src/App.tsx', app);
