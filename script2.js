import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Other colors: 
// from-[#1A1A1A] to-[#333333] -> from-primary to-primary-hover
content = content.replace(/from-\[#1A1A1A\]/g, 'from-primary-gradient');
content = content.replace(/to-\[#333333\]/g, 'to-primary-gradient-end');

fs.writeFileSync('src/App.tsx', content);
