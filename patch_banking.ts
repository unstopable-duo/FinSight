import fs from 'fs';

let appData = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Sidebar width
appData = appData.replace(
  `const [sidebarWidth, setSidebarWidth] = useState(380);`,
  `const [sidebarWidth, setSidebarWidth] = useState(320);`
);

// 2. Sidebar Header Redesign
appData = appData.replace(
  `<header className="p-6 border-b border-border flex items-center justify-between bg-background">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1 text-foreground">FinSight</h1>
            <div className="mt-2">
              <select value={activeSpaceId || ''} onChange={e => setActiveSpaceId(e.target.value)} className="bg-surface border border-border rounded text-[10px] uppercase tracking-[0.1em] font-bold text-muted p-1 outline-none">
                {dashboard.spaces?.map((s:any) => (
                   <option key={s._id} value={s._id}>{s.name} ({s.type})</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsSpaceModalOpen(true)} className="text-xs font-semibold uppercase tracking-wider text-muted hover:text-foreground transition-colors bg-surface px-3 py-2 border border-border rounded-lg flex items-center justify-center">
              + New Space
            </button>
            <button 
              onClick={handleSeed}
              disabled={isSeeding}
              className="text-xs font-semibold uppercase tracking-wider text-muted hover:text-foreground transition-colors bg-surface px-3 py-2 border border-border rounded-lg flex items-center justify-center disabled:opacity-50"
            >
              {isSeeding ? 'Seeding...' : 'Seed Data'}
            </button>
            <button title="Log Out" onClick={handleLogout} className="text-muted hover:text-foreground transition-colors bg-surface p-2 border border-border rounded-lg">
              <LogOut className="w-4 h-4" />
            </button>
            <button 
              title="Toggle Theme" 
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} 
              className="text-muted hover:text-foreground transition-colors bg-surface p-2 border border-border rounded-lg"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <button 
              title="Settings" 
              onClick={() => setIsSettingsOpen(true)} 
              className="text-muted hover:text-foreground transition-colors bg-surface p-2 border border-border rounded-lg"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
        </header>`,
  `<header className="p-5 border-b border-border flex flex-col gap-4 bg-background">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight text-foreground">FinSight</h1>
            <div className="flex items-center gap-1.5">
              <button title="Settings" onClick={() => setIsSettingsOpen(true)} className="text-muted hover:text-foreground transition-colors p-1.5 rounded-lg"><SettingsIcon className="w-4 h-4" /></button>
              <button title="Toggle Theme" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="text-muted hover:text-foreground transition-colors p-1.5 rounded-lg">
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
              <button title="Log Out" onClick={handleLogout} className="text-muted hover:text-foreground transition-colors p-1.5 rounded-lg"><LogOut className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select value={activeSpaceId || ''} onChange={e => setActiveSpaceId(e.target.value)} className="flex-1 bg-surface border border-border rounded-lg text-sm font-medium text-foreground p-2 outline-none appearance-none">
              {dashboard.spaces?.map((s:any) => (
                 <option key={s._id} value={s._id}>{s.name} ({s.type})</option>
              ))}
            </select>
            <button onClick={() => setIsSpaceModalOpen(true)} className="bg-primary hover:bg-[#333] text-primary-foreground p-2 rounded-lg font-bold shrink-0 shadow-sm flex items-center justify-center w-9 h-9" title="New Space">
              +
            </button>
          </div>
        </header>`
);

// 3. Main Dashboard Overlap Fix
appData = appData.replace(
  `<div className="flex flex-col lg:flex-row justify-between lg:items-end mb-12 gap-6 lg:gap-0">
               <div className="flex flex-col justify-center">
                  <span className="text-xs uppercase tracking-wider font-semibold text-muted mb-1">Financial Overview</span>
                  <h2 className="text-xl lg:text-2xl font-bold tracking-tight text-foreground">
                     {dashboard.currentMonth ? format(new Date(dashboard.currentMonth + '-01'), 'MMMM yyyy') : 'Loading...'}
                  </h2>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-surface p-5 rounded-xl border border-border shadow-sm flex-1 lg:max-w-3xl justify-items-start lg:justify-items-end items-center">`,
  `<div className="flex flex-col mb-10 gap-6">
               <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                     <span className="text-sm font-medium text-muted mb-1">Financial Overview</span>
                     <h2 className="text-2xl font-bold tracking-tight text-foreground">
                        {dashboard.currentMonth ? format(new Date(dashboard.currentMonth + '-01'), 'MMMM yyyy') : 'Loading...'}
                     </h2>
                  </div>
                  <button onClick={handleSeed} disabled={isSeeding} className="text-sm font-medium text-muted hover:text-foreground transition-colors bg-surface px-4 py-2 border border-border rounded-lg flex items-center shadow-sm disabled:opacity-50">
                    {isSeeding ? 'Seeding...' : 'Seed Data'}
                  </button>
               </div>
               <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-surface p-5 rounded-xl border border-border mt-0 flex flex-col justify-center">`
);

// We need to also add the wrapper blocks around each metric, let's fix it by regexing <div> around metric items
appData = appData.replace(
  `                  <div>
                     <span className="text-xs uppercase tracking-wider font-medium text-muted mb-1 block">
                        {getPrimaryMetricLabel(dashboard.account?.type)}
                     </span>
                     <p className="text-xl tabular-nums text-foreground font-semibold">
                        {getPrimaryMetricValue(dashboard.account?.type)}
                     </p>
                  </div>`,
  `                     <span className="text-xs uppercase tracking-wider font-medium text-muted mb-1 block">
                        {getPrimaryMetricLabel(dashboard.account?.type)}
                     </span>
                     <p className="text-2xl tabular-nums text-foreground font-semibold">
                        {getPrimaryMetricValue(dashboard.account?.type)}
                     </p>
                  </div>` // we close the div we opened
);

appData = appData.replace(
  `                  <div>
                     <span className="text-xs uppercase tracking-wider font-medium text-muted mb-1 block">
                       Balance {dashboard.account?.payday && <span className="font-normal normal-case tracking-normal opacity-70 ml-1">({dashboard.account.payday}th)</span>}
                     </span>
                     <p className="text-xl tabular-nums text-foreground font-semibold">
                        <span className="text-sm text-muted mr-1 font-normal">{dashboard.account?.currency || 'ZAR'}</span>{dashboard.account?.balance?.toFixed(2) || '0.00'}
                     </p>
                  </div>`,
  `                  <div className="bg-surface p-5 rounded-xl border border-border flex flex-col justify-center">
                     <span className="text-xs uppercase tracking-wider font-medium text-muted mb-1 block">
                       Balance {dashboard.account?.payday && <span className="font-normal normal-case tracking-normal opacity-70 ml-1">({dashboard.account.payday}th)</span>}
                     </span>
                     <p className="text-2xl tabular-nums text-foreground font-semibold">
                        <span className="text-sm text-muted mr-1 font-normal">{dashboard.account?.currency || 'ZAR'}</span>{dashboard.account?.balance?.toFixed(2) || '0.00'}
                     </p>
                  </div>`
);

appData = appData.replace(
  `                  <div>
                     <span className="text-xs uppercase tracking-wider font-medium text-muted mb-1 block">Income</span>
                     <p className="text-xl tabular-nums text-green-600 dark:text-green-500 font-semibold">
                        <span className="text-sm text-muted/70 mr-1 font-normal">{dashboard.account?.currency || "ZAR"}</span>{totalIncome.toFixed(2)}
                     </p>
                  </div>`,
  `                  <div className="bg-surface p-5 rounded-xl border border-border flex flex-col justify-center">
                     <span className="text-xs uppercase tracking-wider font-medium text-muted mb-1 block">Income</span>
                     <p className="text-2xl tabular-nums text-green-600 dark:text-green-500 font-semibold">
                        <span className="text-sm text-muted/70 mr-1 font-normal">{dashboard.account?.currency || "ZAR"}</span>{totalIncome.toFixed(2)}
                     </p>
                  </div>`
);


appData = appData.replace(
  `                  <div>
                     <span className="text-xs uppercase tracking-wider font-medium text-muted mb-1 block">Spent</span>
                     <p className="text-xl tabular-nums text-foreground font-semibold">
                        <span className="text-sm text-muted mr-1 font-normal">{dashboard.account?.currency || "ZAR"}</span>{totalSpent.toFixed(2)}
                     </p>
                  </div>
               </div>
            </div>`,
  `                  <div className="bg-surface p-5 rounded-xl border border-border flex flex-col justify-center">
                     <span className="text-xs uppercase tracking-wider font-medium text-muted mb-1 block">Spent</span>
                     <p className="text-2xl tabular-nums text-foreground font-semibold">
                        <span className="text-sm text-muted mr-1 font-normal">{dashboard.account?.currency || "ZAR"}</span>{totalSpent.toFixed(2)}
                     </p>
                  </div>
               </div>
            </div>`
);

// 4. Adjust the tab box that also pushes things down and overlaps
appData = appData.replace(
  `<div className="bg-surface/90 backdrop-blur-xl border-b border-border border-b border-border px-8 pl-20 py-5 flex items-center gap-6 shadow-sm sticky top-0 z-10">`,
  `<div className="bg-background/95 backdrop-blur-md border-b border-border px-6 pl-16 py-4 flex items-center gap-8 sticky top-0 z-10">`
);
appData = appData.replace(
  `text-xs font-bold uppercase tracking-widest pb-1 border-b-2`,
  `text-sm font-medium pb-1 border-b-2`
);
appData = appData.replace(
  `text-xs font-bold uppercase tracking-widest pb-1 border-b-2`,
  `text-sm font-medium pb-1 border-b-2`
);

// 5. Chat Input Area overlap fixes
appData = appData.replace(
  `bg-surface border border-border rounded-xl rounded-tl-sm`,
  `bg-surface border border-border rounded-xl rounded-tl-sm shadow-sm`
);

appData = appData.replace(
  `flex flex-col items-center justify-center gap-1.5 bg-surface border border-border py-3 rounded-xl text-xs font-semibold uppercase tracking-wider text-foreground`,
  `flex items-center justify-center gap-2 bg-surface border border-border py-2.5 rounded-lg text-sm font-medium text-foreground`
);

appData = appData.replace(
  `border-4 border-primary-foreground/20`,
  `border-2 border-primary-foreground/30`
);

// Change chat background a bit
appData = appData.replace(
  `className={cn("flex flex-col border-r border-border bg-surface shadow-md z-20 shrink-0 relative transition-all overflow-hidden", isResizingRef.current ? "duration-0" : "duration-300")}`,
  `className={cn("flex flex-col border-r border-border bg-background shadow-md z-20 shrink-0 relative transition-all overflow-hidden", isResizingRef.current ? "duration-0" : "duration-300")}`
);

fs.writeFileSync('src/App.tsx', appData);
console.log('patched banking look');
