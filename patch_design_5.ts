import fs from 'fs';

let appData = fs.readFileSync('src/App.tsx', 'utf-8');

appData = appData.replace(/text-\[11px\] uppercase tracking-\[0\.2em\] font-bold/g, 'text-xs uppercase tracking-wider font-semibold');
appData = appData.replace(/text-\[10px\] uppercase tracking-\[0\.2em\] font-bold/g, 'text-xs uppercase tracking-wider font-semibold');
appData = appData.replace(/text-\[10px\] font-bold uppercase tracking-widest/g, 'text-xs font-semibold uppercase tracking-wider');

appData = appData.replace(/text-2xl font-sans  text-primary-foreground/g, 'text-3xl font-bold tracking-tight text-primary-foreground');
appData = appData.replace(/font-sans  text-foreground/g, 'font-medium text-foreground');

appData = appData.replace(/rounded-full/g, 'rounded-lg');
// But inputs or avatars sometimes need full rounding. 
// A banking app input looks fine with rounded-lg. Wait, buttons might look weird. We just replaced all `rounded-full` with `rounded-lg`

fs.writeFileSync('src/App.tsx', appData);
console.log('patched typography tags');
