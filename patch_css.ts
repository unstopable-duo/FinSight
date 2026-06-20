import fs from 'fs';

let css = fs.readFileSync('src/index.css', 'utf-8');

css = css.replace(/--bg-main: #F9F7F2;/g, '--bg-main: #F4F4F5;');
css = css.replace(/--bg-surface-hover: #F3F1EB;/g, '--bg-surface-hover: #F4F4F5;');
css = css.replace(/--text-muted: #8C8980;/g, '--text-muted: #71717A;');
css = css.replace(/--border-main: #E5E2D9;/g, '--border-main: #E4E4E7;');

css = css.replace(/--bg-main: #121212;/g, '--bg-main: #09090B;');
css = css.replace(/--bg-surface: #1e1e1e;/g, '--bg-surface: #18181B;');
css = css.replace(/--bg-surface-hover: #2c2c2c;/g, '--bg-surface-hover: #27272A;');
css = css.replace(/--text-muted: #a0a0a0;/g, '--text-muted: #A1A1AA;');
css = css.replace(/--border-main: #333333;/g, '--border-main: #27272A;');

fs.writeFileSync('src/index.css', css);
console.log('patched index css colors');
