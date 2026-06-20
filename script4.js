import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/stroke="#E5E2D9"/g, 'stroke="var(--color-border)"');
content = content.replace(/fill: '#8C8980'/g, "fill: 'var(--color-muted)'");

fs.writeFileSync('src/App.tsx', content);
