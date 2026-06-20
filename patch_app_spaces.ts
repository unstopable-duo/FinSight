import fs from 'fs';

let appData = fs.readFileSync('src/App.tsx', 'utf-8');

appData = appData.replace(
  `const [persona, setPersona] = useState('personal');`,
  `const [accountType, setAccountType] = useState('personal');
  const [activeSpaceId, setActiveSpaceId] = useState<string|null>(null);`
);

appData = appData.replace(
  `const fetchDashboard = async () => {
    if (!user) return;
    try {
      const res = await fetch(\`/api/dashboard?user_id=\${user.uid}&persona=\${persona}&currency=\${currency}\`);`,
  `const fetchDashboard = async () => {
    if (!user) return;
    try {
      const spaceQuery = activeSpaceId ? \`&space_id=\${activeSpaceId}\` : '';
      const res = await fetch(\`/api/dashboard?user_id=\${user.uid}&currency=\${currency}\${spaceQuery}\`);`
);

appData = appData.replace(
`      if (data.account?.persona) {
        setPersona(data.account.persona);
      }`,
`      if (data.activeSpaceId && !activeSpaceId) {
        setActiveSpaceId(data.activeSpaceId);
      }`
);

appData = appData.replace(
`await fetch(\`/api/seed?user_id=\${user.uid}\`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ persona: data.account?.persona || persona, currency: data.account?.currency || currency }) });
         const res2 = await fetch(\`/api/dashboard?user_id=\${user.uid}&persona=\${persona}&currency=\${currency}\`);`,
`await fetch(\`/api/seed?user_id=\${user.uid}\`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ persona: accountType, currency: data.account?.currency || currency }) });
         const res2 = await fetch(\`/api/dashboard?user_id=\${user.uid}&currency=\${currency}\${spaceQuery}\`);`
);

appData = appData.replace(
`useEffect(() => {
    if (user) {
      fetchDashboard();
    }
  }, [user]);`,
`useEffect(() => {
    if (user) {
      fetchDashboard();
    }
  }, [user, activeSpaceId]);`
);


appData = appData.replace(
`const res = await fetch(\`/api/seed?user_id=\${user.uid}\`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ persona, currency }) });`,
`const res = await fetch(\`/api/seed?user_id=\${user.uid}\`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ persona: accountType, currency }) });`
);

appData = appData.replace(
`clientContext: {
             budgets: dashboard.budgets,
             spending: dashboard.transactions.map((t:any) => ({category: t.category, amount: t.amount})),
             goals: dashboard.goals,
             persona: dashboard.account?.persona
          }`,
`clientContext: {
             budgets: dashboard.budgets,
             goals: dashboard.goals,
             spaces: dashboard.spaces,
             activeSpaceId: activeSpaceId,
             account: dashboard.account
          }`
);

// Login screen persona select
appData = appData.replace(
`<label className="text-xs font-bold uppercase tracking-widest text-muted block mb-2">Choose Persona</label>
             <select value={persona} onChange={e => setPersona(e.target.value as any)} className="w-full border border-border p-3 text-sm italic font-serif">
                <option value="personal">Personal Finance</option>
                <option value="founder">Founder (Runway, Burn, MRR)</option>
                <option value="freelancer">Freelancer (Hourly Rate, Profits)</option>
                <option value="side_project">Side Project (P&L, Break-even)</option>
             </select>`,
`<label className="text-xs font-bold uppercase tracking-widest text-muted block mb-2">Account Type</label>
             <select value={accountType} onChange={e => setAccountType(e.target.value)} className="w-full border border-border p-3 text-sm italic font-serif">
                <option value="personal">Personal User</option>
                <option value="professional">Professional User</option>
             </select>`
);

// Header Spaces dropdown
appData = appData.replace(
`<div>
            <h1 className="text-4xl font-serif italic tracking-tight mb-1 text-foreground">FinSight</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted">Personal Finance AI</p>
          </div>
          <div className="flex items-center gap-2">`,
`<div>
            <h1 className="text-4xl font-serif italic tracking-tight mb-1 text-foreground">FinSight</h1>
            <div className="mt-2">
              <select value={activeSpaceId || ''} onChange={e => setActiveSpaceId(e.target.value)} className="bg-surface border border-border rounded text-[10px] uppercase tracking-[0.1em] font-bold text-muted p-1 outline-none">
                {dashboard.spaces?.map((s:any) => (
                   <option key={s._id} value={s._id}>{s.name} ({s.type})</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">`
);

fs.writeFileSync('src/App.tsx', appData);
console.log('patched app!');
