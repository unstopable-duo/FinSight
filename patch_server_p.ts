import fs from 'fs';
let serverData = fs.readFileSync('server.ts', 'utf-8');
serverData = serverData.replace(
`      const persona = account.persona || 'founder';`,
``
);
fs.writeFileSync('server.ts', serverData);
console.log('patched server.ts duplicate const');
