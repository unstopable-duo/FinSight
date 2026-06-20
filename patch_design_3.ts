import fs from 'fs';

let appData = fs.readFileSync('src/App.tsx', 'utf-8');

appData = appData.replace(/rounded-2xl/g, 'rounded-xl');
appData = appData.replace(/rounded-3xl/g, 'rounded-2xl');
appData = appData.replace(/shadow-xl/g, 'shadow-md');
appData = appData.replace(/shadow-2xl/g, 'shadow-lg');

// We also change some text sizes
appData = appData.replace(/text-4xl lg:text-5xl/g, 'text-2xl lg:text-3xl');
appData = appData.replace(/text-5xl/g, 'text-3xl');
appData = appData.replace(/text-4xl/g, 'text-2xl');

fs.writeFileSync('src/App.tsx', appData);
console.log('patched radius and shadows');
