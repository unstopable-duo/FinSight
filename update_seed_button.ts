import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Add handleSeed function
const logoutLine = '  const handleLogout = async () => {';
const handleSeedContent = `
  const [isSeeding, setIsSeeding] = useState(false);
  const handleSeed = async () => {
    if (!user) return;
    setIsSeeding(true);
    try {
      const res = await fetch(\`/api/seed?user_id=\${user.uid}\`, { method: 'POST' });
      if (res.ok) {
        await fetchDashboard();
        alert('Demo data generated successfully! 90 days of synthetic history added.');
      } else {
        alert('Failed to seed demo data. Check console.');
      }
    } catch (err) {
      console.error(err);
      alert('Error seeding demo data.');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleLogout = async () => {`;
content = content.replace(logoutLine, handleSeedContent);

// Add button to header
const headerButtons = `          <button onClick={handleLogout} className="text-[#8C8980] hover:text-[#1A1A1A] transition-colors bg-white p-2 border border-[#E5E2D9] rounded-full">
            <LogOut className="w-4 h-4" />
          </button>`;
const newHeaderButtons = `          <div className="flex items-center gap-2">
            <button 
              onClick={handleSeed}
              disabled={isSeeding}
              className="text-[10px] font-bold uppercase tracking-widest text-[#8C8980] hover:text-[#1A1A1A] transition-colors bg-white px-3 py-2 border border-[#E5E2D9] rounded-full flex items-center justify-center disabled:opacity-50"
            >
              {isSeeding ? 'Seeding...' : 'Seed Data'}
            </button>
            <button title="Log Out" onClick={handleLogout} className="text-[#8C8980] hover:text-[#1A1A1A] transition-colors bg-white p-2 border border-[#E5E2D9] rounded-full">
              <LogOut className="w-4 h-4" />
            </button>
          </div>`;
content = content.replace(headerButtons, newHeaderButtons);

fs.writeFileSync('src/App.tsx', content, 'utf8');
