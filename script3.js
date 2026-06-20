import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/text-blue-700/g, 'text-blue-700 dark:text-blue-400');
content = content.replace(/text-green-600/g, 'text-green-600 dark:text-green-400');
content = content.replace(/text-red-500/g, 'text-red-500 dark:text-red-400');
content = content.replace(/text-red-600/g, 'text-red-600 dark:text-red-400');
content = content.replace(/text-amber-500/g, 'text-amber-500 dark:text-amber-400');
content = content.replace(/text-amber-600/g, 'text-amber-600 dark:text-amber-400');

// There are also bg-blue-50/bg-green-50/bg-red-50 etc.
content = content.replace(/bg-blue-50/g, 'bg-blue-50 dark:bg-blue-900/30');
content = content.replace(/bg-green-50/g, 'bg-green-50 dark:bg-green-900/30');
content = content.replace(/bg-red-50/g, 'bg-red-50 dark:bg-red-900/30');
content = content.replace(/bg-amber-50/g, 'bg-amber-50 dark:bg-amber-900/30');

// Fix border-white/20 and border-white/10 to border-primary-foreground/20
content = content.replace(/border-white\/20/g, 'border-primary-foreground/20');
content = content.replace(/border-white\/10/g, 'border-primary-foreground/10');

fs.writeFileSync('src/App.tsx', content);
