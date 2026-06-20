import fs from 'fs';

let appData = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Remove auto-seeding
appData = appData.replace(
`      if (data.isNewAccount) {
         await fetch(\`/api/seed?user_id=\${user.uid}\`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ persona: accountType, currency: data.account?.currency || currency }) });
         const res2 = await fetch(\`/api/dashboard?user_id=\${user.uid}&currency=\${currency}\${spaceQuery}\`);
         const data2 = await res2.json();
         setDashboard(data2);
      }`,
``
);

// 2. Remove HandleSeed logic references from buttons
// In the Header:
appData = appData.replace(
`                  <button onClick={handleSeed} disabled={isSeeding} className="text-sm font-medium text-muted hover:text-foreground transition-colors bg-surface px-4 py-2 border border-border rounded-lg flex items-center shadow-sm disabled:opacity-50">
                    {isSeeding ? 'Seeding...' : 'Seed Data'}
                  </button>`,
``
);

// 3. Rename "Continue as Guest" and call handleSeed IF it's guest sign-in
appData = appData.replace(
`         <button onClick={handleGuestLogin} disabled={isLoggingIn} className="w-full bg-surface text-foreground border border-border py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-muted/10 transition-colors focus:ring-2 focus:ring-primary focus:outline-none font-medium text-sm">
            Continue as Guest
         </button>`,
`         <button onClick={handleGuestLogin} disabled={isLoggingIn} className="w-full bg-surface text-foreground border border-border py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-primary/5 hover:border-primary transition-colors focus:ring-2 focus:ring-primary focus:outline-none font-medium text-sm">
            Sign in as Guest / Judge
         </button>`
);

// Inside handleGuestLogin, we add the seed logic immediately!
appData = appData.replace(
`  const handleGuestLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await guestSignIn();
      if (result) {
        setToken(result.accessToken);
        setUser(result.user);
        setNeedsAuth(false);
      }
    } catch (err) {
      console.error('Guest login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };`,
`  const handleGuestLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await guestSignIn();
      if (result) {
        // Automatically seed data for judges if they want demo view mapping to their account
        await fetch(\`/api/seed?user_id=\${result.user.uid}\`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ persona: accountType, currency: currency }) });
        setToken(result.accessToken);
        setUser(result.user);
        setNeedsAuth(false);
      }
    } catch (err) {
      console.error('Guest login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };`
);

fs.writeFileSync('src/App.tsx', appData);
console.log('patched App.tsx');
