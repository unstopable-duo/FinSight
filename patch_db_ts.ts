import fs from 'fs';
let dbData = fs.readFileSync('server/db.ts', 'utf-8');
dbData = dbData.replace(/let q = collection/g, 'let q: any = collection');
fs.writeFileSync('server/db.ts', dbData);
