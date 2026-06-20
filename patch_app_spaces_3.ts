import fs from 'fs';

let appData = fs.readFileSync('src/App.tsx', 'utf-8');

appData = appData.replace(
  `const [isSettingsOpen, setIsSettingsOpen] = useState(false);`,
  `const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSpaceModalOpen, setIsSpaceModalOpen] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [newSpaceType, setNewSpaceType] = useState('Personal');`
);

appData = appData.replace(
  `         <div className="flex items-center gap-2">
            <button 
              onClick={handleSeed}`,
  `         <div className="flex items-center gap-2">
            <button onClick={() => setIsSpaceModalOpen(true)} className="text-[10px] font-bold uppercase tracking-widest text-muted hover:text-foreground transition-colors bg-surface px-3 py-2 border border-border rounded-full flex items-center justify-center">
              + New Space
            </button>
            <button 
              onClick={handleSeed}`
);

const handleCreateSpace = `
  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newSpaceName) return;
    try {
      const res = await fetch(\`/api/spaces?user_id=\${user.uid}\`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ name: newSpaceName, type: newSpaceType, currency })
      });
      if (res.ok) {
        setIsSpaceModalOpen(false);
        setNewSpaceName('');
        await fetchDashboard();
      }
    } catch (err) {
      console.error(err);
    }
  };
`;

appData = appData.replace(
`  const handleSaveSettings = async (updates: any) => {`,
handleCreateSpace + `\n  const handleSaveSettings = async (updates: any) => {`
);

// We need to replace the persona dropdown in settings
appData = appData.replace(
`<div className="pt-8 border-t border-border">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted block mb-3">Account Persona</label>
                        <select 
                           value={persona} 
                           onChange={e => handleSaveSettings({ persona: e.target.value })} 
                           className="w-full border border-border p-3 rounded-xl bg-background text-foreground text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                        >
                           <option value="personal">Personal Finance</option>
                           <option value="founder">Founder (Runway, Burn, MRR)</option>
                           <option value="freelancer">Freelancer (Hourly Rate, Profits)</option>
                           <option value="side_project">Side Project (P&L, Break-even)</option>
                           <option value="student">Student (Tuition, Loans, Part-time)</option>
                           <option value="family">Family (Childcare, Groceries, Mortgage)</option>
                           <option value="digital_nomad">Digital Nomad (Travel, Accommodation, Co-working)</option>
                        </select>
                        <p className="text-[11px] text-muted mt-3 leading-relaxed">Changing persona adjusts the AI's area of focus and dashboard metrics. Doesn't delete your data.</p>
                     </div>`,
`` // delete the persona from settings, or we could change space settings. User wants to change space settings or add new space!
);

const spaceModal = `
{isSpaceModalOpen && (
   <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
         <button onClick={() => setIsSpaceModalOpen(false)} className="absolute top-6 right-6 text-muted hover:text-foreground">
            <X className="w-5 h-5" />
         </button>
         <h2 className="text-2xl font-serif italic mb-6 text-foreground">Create Space</h2>
         <form onSubmit={handleCreateSpace} className="space-y-6">
            <div>
               <label className="text-xs font-bold uppercase tracking-widest text-muted block mb-3">Space Name</label>
               <input type="text" value={newSpaceName} onChange={e => setNewSpaceName(e.target.value)} required placeholder="e.g. Vacation Fund" className="w-full border border-border p-3 rounded-xl bg-background text-foreground text-sm focus:ring-1 focus:ring-primary outline-none transition-all" />
            </div>
            <div>
               <label className="text-xs font-bold uppercase tracking-widest text-muted block mb-3">Space Template/Type</label>
               <select value={newSpaceType} onChange={e => setNewSpaceType(e.target.value)} className="w-full border border-border p-3 rounded-xl bg-background text-foreground text-sm focus:ring-1 focus:ring-primary outline-none transition-all">
                  <option value="Personal">Personal Space</option>
                  <option value="Business">Business Space</option>
                  <option value="Project">Project Space</option>
                  <option value="Event">Event Space</option>
                  <option value="Investment">Investment Space</option>
               </select>
            </div>
            <button type="submit" className="w-full bg-primary hover:bg-[#333] text-primary-foreground py-3.5 rounded-xl text-sm font-bold tracking-widest uppercase transition-colors">
               Create Space
            </button>
         </form>
      </div>
   </div>
)}
`;

appData = appData.replace(`</main>`, spaceModal + `\n      </main>`);

fs.writeFileSync('src/App.tsx', appData);
console.log('patched app modals!');
