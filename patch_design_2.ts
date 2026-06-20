import fs from 'fs';

let appData = fs.readFileSync('src/App.tsx', 'utf-8');

appData = appData.replace(/font-serif/g, 'font-sans');
appData = appData.replace(/italic/g, '');

fs.writeFileSync('src/App.tsx', appData);
console.log('patched fonts');
