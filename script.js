import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/bg-\[#F9F7F2\]/g, 'bg-background');
content = content.replace(/text-\[#1A1A1A\]/g, 'text-foreground');
content = content.replace(/border-\[#E5E2D9\]/g, 'border-border');
content = content.replace(/text-\[#8C8980\]/g, 'text-muted');
content = content.replace(/bg-\[#1A1A1A\]/g, 'bg-primary');
content = content.replace(/border-\[#1A1A1A\]/g, 'border-primary');
content = content.replace(/bg-\[#F3F1EB\]/g, 'bg-surface-hover');
content = content.replace(/bg-white/g, 'bg-surface');
content = content.replace(/text-white/g, 'text-primary-foreground');

fs.writeFileSync('src/App.tsx', content);
