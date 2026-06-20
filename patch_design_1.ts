import fs from 'fs';

let appData = fs.readFileSync('src/App.tsx', 'utf-8');

// Header formatting
appData = appData.replace(
  `            <h1 className="text-4xl font-serif italic tracking-tight mb-1 text-foreground">FinSight</h1>`,
  `            <h1 className="text-2xl font-bold tracking-tight mb-1 text-foreground">FinSight</h1>`
);
appData = appData.replace(
  `          <div className="bg-surface/90 backdrop-blur-xl border-b border-border border-b border-border px-8 pl-20 py-5 flex items-center gap-6 shadow-sm sticky top-0 z-10">`,
  `          <div className="bg-surface/90 backdrop-blur-xl border-b border-border px-6 pl-[4.5rem] py-3 flex items-center gap-6 shadow-sm sticky top-0 z-10">`
);

appData = appData.replace(
  `         <div className="p-10 min-h-full max-w-5xl mx-auto w-full flex flex-col">`,
  `         <div className="p-6 lg:p-8 min-h-full max-w-6xl mx-auto w-full flex flex-col">`
);

// Month Summary Text
appData = appData.replace(
  `               <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted mb-3">Month Summary</span>
                  <h2 className="text-5xl lg:text-7xl font-serif italic leading-none tracking-tighter text-foreground">
                     {dashboard.currentMonth ? format(new Date(dashboard.currentMonth + '-01'), 'MMMM yyyy') : 'Loading...'}
                  </h2>
               </div>`,
  `               <div className="flex flex-col justify-center">
                  <span className="text-xs uppercase tracking-wider font-semibold text-muted mb-1">Financial Overview</span>
                  <h2 className="text-2xl lg:text-3xl font-semibold tracking-tight text-foreground">
                     {dashboard.currentMonth ? format(new Date(dashboard.currentMonth + '-01'), 'MMMM yyyy') : 'Loading...'}
                  </h2>
               </div>`
);

// Overview Cards Container
appData = appData.replace(
  `               <div className="flex flex-col sm:flex-row gap-10 sm:gap-14 lg:text-right bg-surface p-6 rounded-2xl border border-border shadow-sm">`,
  `               <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-surface p-5 rounded-xl border border-border shadow-sm flex-1 lg:max-w-3xl justify-items-start lg:justify-items-end items-center">`
);

// Metrics
appData = appData.replace(
  `                     <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted mb-2 block">
                        {getPrimaryMetricLabel(dashboard.account?.type)}
                     </span>
                     <p className="text-3xl lg:text-4xl font-light tabular-nums text-foreground font-medium">`,
  `                     <span className="text-xs uppercase tracking-wider font-medium text-muted mb-1 block">
                        {getPrimaryMetricLabel(dashboard.account?.type)}
                     </span>
                     <p className="text-xl tabular-nums text-foreground font-semibold">`
);

appData = appData.replace(
  `                     <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted mb-2 flex items-center justify-between">
                       Account Balance 
                       {dashboard.account?.payday && <span className="font-normal normal-case tracking-normal">Payday: {dashboard.account.payday}th</span>}
                     </span>
                     <p className="text-3xl lg:text-4xl font-light tabular-nums text-foreground">
                        <span className="text-xl text-muted mr-1">{dashboard.account?.currency || 'ZAR'}</span>{dashboard.account?.balance?.toFixed(2) || '0.00'}`,
  `                     <span className="text-xs uppercase tracking-wider font-medium text-muted mb-1 block">
                       Balance {dashboard.account?.payday && <span className="font-normal normal-case tracking-normal opacity-70 ml-1">({dashboard.account.payday}th)</span>}
                     </span>
                     <p className="text-xl tabular-nums text-foreground font-semibold">
                        <span className="text-sm text-muted mr-1 font-normal">{dashboard.account?.currency || 'ZAR'}</span>{dashboard.account?.balance?.toFixed(2) || '0.00'}`
);

appData = appData.replace(
  `                     <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted mb-2 block">Total Income</span>
                     <p className="text-3xl lg:text-4xl font-light tabular-nums text-green-700">
                        <span className="text-xl text-muted mr-1">{dashboard.account?.currency || "ZAR"}</span>{totalIncome.toFixed(2)}`,
  `                     <span className="text-xs uppercase tracking-wider font-medium text-muted mb-1 block">Income</span>
                     <p className="text-xl tabular-nums text-green-600 dark:text-green-500 font-semibold">
                        <span className="text-sm text-muted/70 mr-1 font-normal">{dashboard.account?.currency || "ZAR"}</span>{totalIncome.toFixed(2)}`
);

appData = appData.replace(
  `                     <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted mb-2 block">Total Spent</span>
                     <p className="text-3xl lg:text-4xl font-light tabular-nums text-foreground">
                        <span className="text-xl text-muted mr-1">{dashboard.account?.currency || "ZAR"}</span>{totalSpent.toFixed(2)}`,
  `                     <span className="text-xs uppercase tracking-wider font-medium text-muted mb-1 block">Spent</span>
                     <p className="text-xl tabular-nums text-foreground font-semibold">
                        <span className="text-sm text-muted mr-1 font-normal">{dashboard.account?.currency || "ZAR"}</span>{totalSpent.toFixed(2)}`
);

// We need to also tackle other huge titles like Goals, Budgets, Health, Predictive

appData = appData.replace(
  /\<h3 className="text-2xl font-serif italic mb-6 text-foreground"\>/g,
  `<h3 className="text-lg font-semibold tracking-tight mb-4 text-foreground">`
);

appData = appData.replace(
  /\<h3 className="text-2xl font-serif italic mb-2 text-foreground"\>/g,
  `<h3 className="text-lg font-semibold tracking-tight mb-2 text-foreground">`
);

appData = appData.replace(
  /\<h3 className="text-3xl font-serif italic text-foreground"\>/g,
  `<h3 className="text-xl font-semibold tracking-tight text-foreground">`
);

appData = appData.replace(
  /\<h3 className="text-3xl md:text-5xl font-serif italic leading-tight text-foreground mb-4"\>/g,
  `<h3 className="text-2xl md:text-3xl font-semibold tracking-tight leading-tight text-foreground mb-3">`
);

// The actual dashboard grid
appData = appData.replace(
  `              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 flex-1">`,
  `              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 flex-1">`
);

// Settings modal
appData = appData.replace(
  /\<h2 className="text-2xl lg:text-4xl font-serif italic mb-8 text-foreground"\>/g,
  `<h2 className="text-xl font-semibold mb-6 text-foreground">`
);

// Space Modal
appData = appData.replace(
  /\<h2 className="text-2xl font-serif italic mb-6 text-foreground"\>/g,
  `<h2 className="text-xl font-semibold tracking-tight mb-6 text-foreground">`
);

fs.writeFileSync('src/App.tsx', appData);
console.log('patched UI elements');
