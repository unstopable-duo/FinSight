import fs from 'fs';

let appData = fs.readFileSync('src/App.tsx', 'utf-8');

appData = appData.replace(
  `         <div className="p-6 border-t border-border bg-background space-y-4">`,
  `         <div className="p-4 border-t border-border bg-background space-y-3">`
);

appData = appData.replace(
  `className="w-full bg-surface border border-border rounded-full py-4 px-6 pr-24 text-sm  focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted outline-none transition-all"`,
  `className="w-full bg-surface border border-border rounded-lg py-3 px-4 pr-16 text-sm focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted outline-none transition-all"`
);

appData = appData.replace(
  `                  <span className="text-xs uppercase tracking-wider font-semibold text-muted mb-1">Financial Overview</span>
                  <h2 className="text-2xl lg:text-3xl font-semibold tracking-tight text-foreground">`,
  `                  <span className="text-xs uppercase tracking-wider font-semibold text-muted mb-1">Financial Overview</span>
                  <h2 className="text-xl lg:text-2xl font-bold tracking-tight text-foreground">`
);

appData = appData.replace(
  `               <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-surface p-5 rounded-xl border border-border shadow-sm flex-1 lg:max-w-3xl justify-items-start lg:justify-items-end items-center">`,
  `               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-surface p-5 rounded-xl border border-border shadow-sm flex-1 lg:max-w-3xl justify-items-start lg:justify-items-end items-center">`
);

appData = appData.replace(
  `              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 flex-1">`,
  `              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 flex-1">`
);

// Sidebar widths
appData = appData.replace(
  `const [sidebarWidth, setSidebarWidth] = useState(450);`,
  `const [sidebarWidth, setSidebarWidth] = useState(380);`
);

// Login page
appData = appData.replace(
  `        <div className="bg-surface border border-border rounded-xl p-10 lg:p-12 shadow-md max-w-md w-full relative z-10">`,
  `        <div className="bg-surface border border-border rounded-xl p-8 lg:p-10 shadow-md max-w-sm w-full relative z-10">`
);

fs.writeFileSync('src/App.tsx', appData);
console.log('patched padding and sizes');
