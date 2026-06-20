import { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, logout, getAccessToken, guestSignIn } from './lib/firebase';
import { Send, LogOut, Activity, Database, Trash2, FileSpreadsheet, Calendar, PanelLeftClose, PanelLeftOpen, Camera, Moon, Sun, Settings as SettingsIcon, X } from 'lucide-react';
import { cn } from './lib/utils';
import { format } from 'date-fns';
import { FloatingWidget } from './components/FloatingWidget';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts';

export default function App() {
  const [needsAuth, setNeedsAuth] = useState(true);
  const [, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [accountType, setAccountType] = useState('personal');
  const [activeSpaceId, setActiveSpaceId] = useState<string|null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'data'>('overview');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSpaceModalOpen, setIsSpaceModalOpen] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [newSpaceType, setNewSpaceType] = useState('Personal');
  const [currency, setCurrency] = useState('ZAR');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved as 'light' | 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Chat State
  const [messages, setMessages] = useState<{role: 'user'|'assistant'|'system', text: string, image?: string}[]>([{
    role: 'assistant', text: 'Hi! I am FinSight. Tell me what you spent today, or ask about your budgets and goals.'
  }]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const conversationIdRef = useRef(crypto.randomUUID());

  // Dashboard State
  const [dashboard, setDashboard] = useState<any>({ transactions: [], budgets: [], goals: [], currentMonth: '' });

  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const isResizingRef = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      let newWidth = e.clientX;
      if (newWidth < 300) newWidth = 300;
      if (newWidth > 800) newWidth = 800;
      setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
      }
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    initAuth(
      (u, t) => {
        setUser(u);
        setToken(t);
        setNeedsAuth(false);
      },
      () => setNeedsAuth(true)
    );
  }, []);

  const fetchDashboard = async () => {
    if (!user) return;
    try {
      const spaceQuery = activeSpaceId ? `&space_id=${activeSpaceId}` : '';
      const res = await fetch(`/api/dashboard?user_id=${user.uid}&currency=${currency}${spaceQuery}`);
      const data = await res.json();
      setDashboard(data);
      if (data.activeSpaceId && !activeSpaceId) {
        setActiveSpaceId(data.activeSpaceId);
      }
      if (data.account?.currency) {
        setCurrency(data.account.currency);
      }


    } catch(e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboard();
    }
  }, [user, activeSpaceId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

//... Rest of auth & login methods ...
  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setToken(result.accessToken);
        setUser(result.user);
        setNeedsAuth(false);
      }
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await guestSignIn();
      if (result) {
        // Automatically seed data for judges if they want demo view mapping to their account
        await fetch(`/api/seed?user_id=${result.user.uid}`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ persona: accountType, currency: currency }) });
        setToken(result.accessToken);
        setUser(result.user);
        setNeedsAuth(false);
      }
    } catch (err) {
      console.error('Guest login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };



  const handleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
    setNeedsAuth(true);
    setMessages([{ role: 'assistant', text: 'Hi! I am FinSight. Tell me what you spent today, or ask about your budgets and goals.' }]);
  };


  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newSpaceName) return;
    try {
      const res = await fetch(`/api/spaces?user_id=${user.uid}`, {
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

  const handleSaveSettings = async (updates: any) => {
    if (!user) return;
    
    // Optimistic
    if (updates.accountType) setAccountType(updates.accountType);
    if (updates.currency) setCurrency(updates.currency);
    
    // We get current state or overrides in updates
    const newAccountType = updates.accountType || accountType;
    const newCurrency = updates.currency || currency;

    try {
      const res = await fetch(`/api/settings?user_id=${user.uid}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ persona: newAccountType, currency: newCurrency })
      });
      if (res.ok) {
        await fetchDashboard();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [isClearing, setIsClearing] = useState(false);
  const handleClearData = async () => {
    if (!user || !confirm("Are you sure you want to clear all data? This cannot be undone.")) return;
    setIsClearing(true);
    try {
      const res = await fetch(`/api/clear?user_id=${user.uid}`, { method: 'POST' });
      if (res.ok) {
        await fetchDashboard();
        setIsSettingsOpen(false);
        setMessages([{ role: 'assistant', text: 'All data has been cleared.' }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsClearing(false);
    }
  };

  const deleteTransaction = async (id: string) => {
    // Optimistic cache update
    setDashboard((prev: any) => ({
      ...prev,
      transactions: prev.transactions.filter((t: any) => t._id !== id)
    }));
    await fetch(`/api/transactions/${id}?user_id=${user?.uid}`, { method: 'DELETE' });
    fetchDashboard();
  };

  const exportToSheets = async () => {
    try {
      const currentToken = await getAccessToken();
      if (!currentToken) {
        setMessages(prev => [...prev, { role: 'assistant', text: "Please sign in to enable Google Sheets integration." }]);
        return;
      }
      
      setMessages(prev => [...prev, { role: 'assistant', text: "Exporting your transactions to Google Sheets..." }]);
      
      // Create new sheet
      const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: { Authorization: `Bearer ${currentToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          properties: { title: `FinSight Export - ${format(new Date(), 'MMM yyyy')}` }
        })
      });
      const sheetData = await createRes.json();
      
      if (!sheetData.spreadsheetId) throw new Error('Failed to create spreadsheet');
      
      // Format data
      const header = ['Date', 'Merchant', 'Category', 'Type', 'Amount', 'Description'];
      const rows = (dashboard.transactions || []).map((t: any) => [
         format(new Date(t.date), 'yyyy-MM-dd'),
         t.merchant,
         t.category,
         t.type,
         t.amount,
         t.description || ''
      ]);
      
      const values = [header, ...rows];
      
      // Update sheet with data
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetData.spreadsheetId}/values/Sheet1!A1:F${values.length}?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${currentToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values })
      });
      
      setMessages(prev => [...prev, { role: 'assistant', text: `Export complete! You can view your sheet here: ${sheetData.spreadsheetUrl}` }]);
    } catch(err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', text: "There was an error exporting to Google Sheets. Did you grant permissions?" }]);
    }
  };

  const syncToCalendar = async () => {
    try {
      const currentToken = await getAccessToken();
      if (!currentToken) {
        setMessages(prev => [...prev, { role: 'assistant', text: "Please sign in to enable Google Calendar integration." }]);
        return;
      }

      setMessages(prev => [...prev, { role: 'assistant', text: "Creating a budget review reminder in your Google Calendar..." }]);

      // Get last day of current month
      const today = new Date();
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const event = {
        summary: 'FinSight Month-End Budget Review',
        description: `Review your budget and expenses for this month. Current balance: ${dashboard.account?.currency || "ZAR"} ${dashboard.account?.balance?.toFixed(2) || '0.00'}`,
        start: {
          date: format(lastDay, 'yyyy-MM-dd')
        },
        end: {
          date: format(lastDay, 'yyyy-MM-dd')
        }
      };

      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: { Authorization: `Bearer ${currentToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);

      setMessages(prev => [...prev, { role: 'assistant', text: `Reminder created! View it here: ${data.htmlLink}` }]);
    } catch(err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', text: "There was an error syncing to Google Calendar. Did you grant permissions?" }]);
    }
  };

  const sendMessageRaw = async (userText: string, imageString?: string) => {
    if ((!userText.trim() && !imageString) || isSending) return;

    const promptMessageId = crypto.randomUUID();
    if (typeof pendo !== 'undefined') {
      pendo.trackAgent("prompt", {
        agentId: "zlmyQHzz91V4hK0LVtSZzOKKajI",
        conversationId: conversationIdRef.current,
        messageId: promptMessageId,
        content: userText,
        fileUploaded: !!imageString,
      });
    }

    setMessages(prev => [...prev, { role: 'user', text: userText, image: imageString }]);
    setIsSending(true);

    try {
      const currentToken = await getAccessToken();
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.uid,
          message: userText,
          image: imageString,
          workspaceToken: currentToken,
          history: messages.filter(m => m.role !== 'system'),
          clientContext: {
             budgets: dashboard.budgets,
             goals: dashboard.goals,
             spaces: dashboard.spaces,
             activeSpaceId: activeSpaceId,
             account: dashboard.account
          }
        })
      });

      const data = await res.json();
      
      if (data.error) {
        if (data.error.includes('API key not valid') || data.error.includes('API_KEY_INVALID')) {
           setMessages(prev => [...prev, { role: 'assistant', text: "Error: Your Gemini API Key is missing or invalid. Please configure GEMINI_API_KEYZ in the Settings menu." }]);
        } else if (data.error.includes('exceeded your Gemini API quota') || data.error.includes('quota') || data.error.includes('RESOURCE_EXHAUSTED')) {
           setMessages(prev => [...prev, { role: 'assistant', text: "Error: You've exceeded your Gemini API quota on this key. Please use a key with sufficient quota or check your billing plan." }]);
        } else if (data.error.includes('experiencing high demand') || data.error.includes('UNAVAILABLE') || data.error.includes('503')) {
           setMessages(prev => [...prev, { role: 'assistant', text: "The AI model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later." }]);
        } else {
           setMessages(prev => [...prev, { role: 'assistant', text: `Sorry, there was an error processing your request: ${data.error}` }]);
        }
        return;
      }

      if (data.text) {
        setMessages(prev => [...prev, { role: 'assistant', text: data.text }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: "I processed that for you." }]);
      }

      if (typeof pendo !== 'undefined') {
        pendo.trackAgent("agent_response", {
          agentId: "zlmyQHzz91V4hK0LVtSZzOKKajI",
          conversationId: conversationIdRef.current,
          messageId: crypto.randomUUID(),
          content: data.text || "I processed that for you.",
          modelUsed: "gemini-2.5-flash",
          toolsUsed: data.actions?.map((a: any) => a.name) || [],
        });
      }

      if (data.actionResults && data.actionResults.length > 0) {
         fetchDashboard();
      }

    } catch(e) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, there was an error processing your request.' }]);
    } finally {
      setIsSending(false);
    }
  };


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;
     const reader = new FileReader();
     reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (fileInputRef.current) fileInputRef.current.value = '';
        sendMessageRaw("Please analyze this receipt and log the transaction.", base64);
     };
     reader.readAsDataURL(file);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input;
    setInput('');
    await sendMessageRaw(text);
  };

  if (needsAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-surface border border-border p-10 text-center space-y-8">
          <div>
            <h1 className="text-3xl font-sans  tracking-tight text-foreground mb-2">FinSight</h1>
            <p className="text-xs uppercase tracking-wider font-semibold text-muted">Personal Financial Intelligence</p>
          </div>
          
          <p className="text-foreground font-sans  text-sm border-t border-b border-border py-6">
            Sign in to track your budgets, analyze your spending, and achieve your financial goals.
          </p>


          <div className="mb-6">
             <label className="text-xs font-bold uppercase tracking-widest text-muted block mb-2">Account Type</label>
             <select value={accountType} onChange={e => setAccountType(e.target.value)} className="w-full border border-border p-3 text-sm  font-sans">
                <option value="personal">Personal User</option>
                <option value="professional">Professional User</option>
             </select>
          </div>

          <button 
            onClick={handleLogin} 
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-3 bg-primary text-primary-foreground hover:bg-[#333] px-4 py-4 font-bold text-[10px] uppercase tracking-widest transition-colors disabled:opacity-50"
          >
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 block bg-surface rounded-lg p-0.5">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              <path fill="none" d="M0 0h48v48H0z"></path>
            </svg>
            {isLoggingIn ? 'Authenticating...' : 'Sign in with Google'}
          </button>
          
          <div className="relative flex items-center justify-center border-t border-border pt-6">
            <span className="absolute bg-surface px-2 text-[10px] uppercase font-bold tracking-widest text-muted -top-2">OR</span>
          </div>

          <button 
            onClick={handleGuestLogin} 
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-3 bg-surface border border-primary text-foreground hover:bg-background px-4 py-4 font-bold text-[10px] uppercase tracking-widest transition-colors disabled:opacity-50"
          >
            {isLoggingIn ? 'Authenticating...' : 'Sign in as Guest / Judge'}
          </button>
        </div>
      </div>
    );
  }

  // Calculate totals
  const recentTransactions = dashboard.transactions || [];
  const totalSpent = recentTransactions.filter((t: any) => t.type === 'expense').reduce((acc: number, t: any) => acc + t.amount, 0) || 0;
  const totalIncome = recentTransactions.filter((t: any) => t.type === 'income').reduce((acc: number, t: any) => acc + t.amount, 0) || 0;
  
  const categoryTotals: any = {};
  recentTransactions.filter((t: any) => t.type === 'expense').forEach((t: any) => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  });
  
  const incomeCategoryTotals: any = {};
  recentTransactions.filter((t: any) => t.type === 'income').forEach((t: any) => {
    incomeCategoryTotals[t.category] = (incomeCategoryTotals[t.category] || 0) + t.amount;
  });

  const pieData = Object.keys(categoryTotals).map(k => ({ name: k, value: categoryTotals[k] })).sort((a,b) => b.value - a.value);
  
  
  const COLORS = theme === 'dark' 
    ? ['#e0e0e0', '#b0b0b0', '#808080', '#505050', '#333333', '#1e1e1e']
    : ['#1A1A1A', '#4A4A4A', '#7A7A7A', '#A9A9A9', '#D3D3D3', '#E5E2D9'];

  
  const getPrimaryMetricLabel = (p: string) => {
    if (p === 'Business') return 'Profit Margin';
    if (p === 'Project') return 'Budget Remaining';
    if (p === 'Investment') return 'ROI';
    return 'Savings Rate';
  };
  const getPrimaryMetricValue = (p: string) => {
    const cur = dashboard?.account?.currency || "ZAR";
    if (p === 'Business') return `${cur} ${(totalIncome - totalSpent).toFixed(0)}`;
    if (p === 'Project') {
       const budgetTotal = dashboard?.budgets?.reduce((a:any, b:any) => a + b.limit, 0) || 0;
       return `${cur} ${Math.max(0, budgetTotal - totalSpent).toFixed(0)}`;
    }
    return `${dashboard?.savingsRate || '0'}%`;
  };
  const getHealthCardTitle = (p: string) => {
    if (p === 'Business') return 'Business Health';
    if (p === 'Project') return 'Project Status';
    if (p === 'Investment') return 'Portfolio Health';
    return 'Financial Health';
  };

  return (
    <div className="flex h-screen w-full bg-background font-sans text-foreground overflow-hidden">
      <FloatingWidget onSendMessage={sendMessageRaw} />
      {/* Left Chat Pane */}
      <aside 
         style={{ width: isSidebarOpen ? `${sidebarWidth}px` : '0px', opacity: isSidebarOpen ? 1 : 0 }} 
         className={cn("flex flex-col border-r border-border bg-background shadow-md z-20 shrink-0 relative transition-all overflow-hidden", isResizingRef.current ? "duration-0" : "duration-300")}
       >
        <header className="p-5 border-b border-border flex flex-col gap-4 bg-background">
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
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}>
              {msg.role === 'user' ? (
                <div className="bg-primary text-primary-foreground p-4 mx-2 rounded-xl rounded-tr-sm max-w-[85%] text-sm leading-relaxed shadow-sm">
                   {msg.image && (
                     <img src={msg.image} alt="uploaded" className="mb-3 max-w-full rounded-md object-contain max-h-48" />
                   )}
                   {msg.text}
                </div>
              ) : (
                <div className="bg-surface p-4 mx-2 rounded-xl rounded-tl-sm max-w-[85%] text-sm leading-relaxed border border-border shadow-sm">
                   <p className="font-sans  text-xs mb-1.5 text-muted">FinSight Intelligence</p>
                   {msg.text}
                </div>
              )}
            </div>
          ))}
          {isSending && (
            <div className="flex w-full justify-start">
               <div className="bg-surface text-muted border border-border rounded-xl rounded-tl-sm px-5 py-3 mx-2 text-sm  shadow-sm flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-muted rounded-lg animate-pulse" />
                 <div className="w-1.5 h-1.5 bg-muted rounded-lg animate-pulse delay-75" />
                 <div className="w-1.5 h-1.5 bg-muted rounded-lg animate-pulse delay-150" />
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-6 border-t border-border bg-background space-y-4">
           <form onSubmit={sendMessage} className="relative flex items-center shadow-sm">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Talk to your money..."
                className="w-full bg-surface border border-border rounded-lg py-3 px-4 pr-16 text-sm focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted outline-none transition-all"
              />
              <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
              <div className="absolute right-2 flex items-center gap-1">
                <button 
                  title="Scan Receipt"
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 text-muted hover:text-foreground transition-colors flex items-center justify-center cursor-pointer"
                >
                  <Camera className="w-5 h-5" />
                </button>
                <button 
                  title="Send Message"
                  type="submit" 
                  disabled={!input.trim() || isSending}
                  className="p-3 bg-primary hover:bg-[#333] text-primary-foreground rounded-lg disabled:opacity-50 transition-colors flex items-center justify-center"
                >
                   <Send className="w-4 h-4" />
                </button>
              </div>
           </form>
           
           <div className="grid grid-cols-2 gap-2 mt-4">
             <button 
               onClick={exportToSheets}
               disabled={isSending}
               className="flex items-center justify-center gap-2 bg-surface border border-border py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-surface-hover transition-colors disabled:opacity-50 shadow-sm"
             >
               <FileSpreadsheet className="w-4 h-4 text-foreground" />
               <span>Export Sheets</span>
             </button>
             <button 
               onClick={syncToCalendar}
               disabled={isSending}
               className="flex flex-col items-center justify-center gap-1.5 bg-surface border border-border py-3 rounded-xl text-xs font-semibold uppercase tracking-wider text-foreground hover:bg-surface-hover transition-colors disabled:opacity-50 shadow-sm"
             >
               <Calendar className="w-4 h-4 text-foreground" />
               <span>Set Reminder</span>
             </button>
           </div>
        </div>

         <div 
           className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/10 active:bg-primary/20 transition-colors z-50"
           onMouseDown={(e) => {
             e.preventDefault();
             isResizingRef.current = true;
             document.body.style.cursor = 'col-resize';
             document.body.style.userSelect = 'none';
           }}
         />

      </aside>

      {/* Right Dashboard Pane */}
      <main className="flex-1 flex flex-col bg-background overflow-y-auto w-full relative">
         <div className="absolute top-6 left-4 z-20 flex items-center gap-2">
           <button 
             onClick={() => setIsSidebarOpen(!isSidebarOpen)}
             className="p-2 bg-surface border border-border rounded-xl shadow-sm text-muted hover:text-foreground transition-colors"
           >
             {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
           </button>
         </div>
         
         <div className="bg-background/95 backdrop-blur-md border-b border-border px-6 pl-16 py-4 flex items-center gap-8 sticky top-0 z-10">
            <button 
               onClick={() => setActiveTab('overview')}
               className={cn("text-sm font-medium pb-1 border-b-2 transition-colors", activeTab === 'overview' ? "border-primary text-foreground" : "border-transparent text-muted hover:text-foreground")}
            >
               <Activity className="w-4 h-4 inline-block mr-2" /> Overview
            </button>
            <button 
               onClick={() => setActiveTab('data')}
               className={cn("text-sm font-medium pb-1 border-b-2 transition-colors", activeTab === 'data' ? "border-primary text-foreground" : "border-transparent text-muted hover:text-foreground")}
            >
               <Database className="w-4 h-4 inline-block mr-2" /> Data & Charts
            </button>
         </div>

         <div className="p-6 lg:p-8 min-h-full max-w-6xl mx-auto w-full flex flex-col">
            
            {/* Page Header */}
            {dashboard.warning && (
               <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 text-red-800 px-5 py-4 rounded-xl mb-8 text-sm leading-relaxed max-w-2xl shadow-sm">
                  <strong>Database Warning:</strong>
                  <div className="mt-1">{dashboard.warning}</div>
                  {dashboard.warning.includes("bad auth") && (
                     <div className="mt-2 font-medium">
                        "bad auth" means your database username or password is incorrect. Check your MONGODB_URI in Settings and ensure you replaced &lt;password&gt; with your actual user password. (Note: if your password contains special characters like @, it must be URL-encoded).
                     </div>
                  )}
               </div>
            )}
            <div className="flex flex-col mb-10 gap-6">
               <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                     <span className="text-sm font-medium text-muted mb-1">Financial Overview</span>
                     <h2 className="text-2xl font-bold tracking-tight text-foreground">
                        {dashboard.currentMonth ? format(new Date(dashboard.currentMonth + '-01'), 'MMMM yyyy') : 'Loading...'}
                     </h2>
                  </div>

               </div>
               <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-surface p-5 rounded-xl border border-border mt-0 flex flex-col justify-center">
                     <span className="text-xs uppercase tracking-wider font-medium text-muted mb-1 block">
                        {getPrimaryMetricLabel(dashboard.account?.type)}
                     </span>
                     <p className="text-2xl tabular-nums text-foreground font-semibold">
                        {getPrimaryMetricValue(dashboard.account?.type)}
                     </p>
                  </div>
                  <div className="bg-surface p-5 rounded-xl border border-border flex flex-col justify-center">
                     <span className="text-xs uppercase tracking-wider font-medium text-muted mb-1 block">
                       Balance {dashboard.account?.payday && <span className="font-normal normal-case tracking-normal opacity-70 ml-1">({dashboard.account.payday}th)</span>}
                     </span>
                     <p className="text-2xl tabular-nums text-foreground font-semibold">
                        <span className="text-sm text-muted mr-1 font-normal">{dashboard.account?.currency || 'ZAR'}</span>{dashboard.account?.balance?.toFixed(2) || '0.00'}
                     </p>
                  </div>
                  <div className="bg-surface p-5 rounded-xl border border-border flex flex-col justify-center">
                     <span className="text-xs uppercase tracking-wider font-medium text-muted mb-1 block">Income</span>
                     <p className="text-2xl tabular-nums text-green-600 dark:text-green-500 font-semibold">
                        <span className="text-sm text-muted/70 mr-1 font-normal">{dashboard.account?.currency || "ZAR"}</span>{totalIncome.toFixed(2)}
                     </p>
                  </div>
                  <div className="bg-surface p-5 rounded-xl border border-border flex flex-col justify-center">
                     <span className="text-xs uppercase tracking-wider font-medium text-muted mb-1 block">Spent</span>
                     <p className="text-2xl tabular-nums text-foreground font-semibold">
                        <span className="text-sm text-muted mr-1 font-normal">{dashboard.account?.currency || "ZAR"}</span>{totalSpent.toFixed(2)}
                     </p>
                  </div>
               </div>
            </div>


            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 flex-1">
                 <div className="space-y-12 animate-in fade-in duration-500">
                   <section className="bg-gradient-to-br from-primary-gradient to-primary-gradient-end p-6 rounded-xl shadow-md text-primary-foreground relative flex flex-col gap-6 overflow-hidden">
                       <h3 className="text-xs uppercase tracking-wider font-semibold border-b border-primary-foreground/20 pb-2 text-primary-foreground/90">{getHealthCardTitle(dashboard.account?.type)}</h3>
                       <div className="flex items-center gap-6 relative z-10">
                         <div className="w-24 h-24 rounded-2xl border-2 border-primary-foreground/30 flex flex-col items-center justify-center shrink-0">
                           <span className="text-3xl font-bold tracking-tight text-primary-foreground">{dashboard?.healthScore?.score || 0}</span>
                         </div>
                         <div>
                           <h4 className="text-3xl font-bold tracking-tight text-primary-foreground mb-2">{dashboard?.healthScore?.label}</h4>
                           <p className="text-xs text-primary-foreground/70 leading-relaxed max-w-[200px]">Based on your savings rate, budget adherence, and spending consistency.</p>
                         </div>
                       </div>
                   </section>
                   <section>
                       <h3 className="text-xs uppercase tracking-wider font-semibold border-b border-border pb-2 mb-6 text-foreground">Budget Progress</h3>
                       {dashboard.budgets?.length === 0 ? <div className="text-sm text-muted  font-sans">No active budgets.</div> : (
                       <div className="space-y-6">
                         {dashboard.budgets?.map((b: any) => {
                            const spent = categoryTotals[b.category] || 0;
                            const pct = Math.min((spent / b.limit) * 100, 100);
                            const isOver = spent > b.limit;
                            return (
                              <div key={b._id} className="space-y-2">
                                 <div className="flex justify-between text-xs font-medium text-foreground">
                                   <span className="capitalize">{b.category}</span>
                                   <span>{dashboard.account?.currency || "ZAR"} {spent.toFixed(2)} / {b.limit}</span>
                                 </div>
                                 <div className="w-full h-2 bg-surface rounded-lg overflow-hidden border border-border">
                                    <div className={cn("h-full transition-all duration-500 rounded-lg", isOver ? "bg-red-50 dark:bg-red-900/300" : "bg-primary")} style={{ width: `${pct}%` }}/>
                                 </div>
                              </div>
                            )
                         })}
                       </div>
                       )}
                   </section>
                 </div>
                 <div className="space-y-12 animate-in fade-in duration-500 delay-100">
                    <section>
                       <h3 className="text-xs uppercase tracking-wider font-semibold border-b border-border pb-2 mb-6 text-foreground">Recent Activity</h3>
                       <div className="space-y-0 rounded-xl border border-border bg-surface text-foreground shadow-sm overflow-hidden">
                          {dashboard.transactions?.slice(0, 5).map((t: any, idx: number) => (
                            <div key={t._id} className={cn("p-5 flex items-center justify-between hover:bg-background transition-colors", idx !== 0 && "border-t border-border")}>
                               <div>
                                 <div className="font-medium text-sm text-foreground">{t.merchant}</div>
                                 <div className="text-[9px] uppercase tracking-[0.15em] text-muted mt-1.5">{t.category} • {format(new Date(t.date), 'MMM d, yyyy')}</div>
                               </div>
                               <div className={cn("font-sans text-sm", t.type === 'expense' ? 'text-foreground' : 'text-green-700')}>
                                 {t.type === 'expense' ? '-' : '+'} {dashboard.account?.currency || 'ZAR'} {t.amount.toFixed(2)}
                               </div>
                            </div>
                          ))}
                          {(!dashboard.transactions || dashboard.transactions.length === 0) && (
                              <div className="p-6 text-center text-muted text-sm font-sans ">
                                 No transactions recorded yet.
                              </div>
                          )}
                       </div>
                    </section>
                    <section>
                       <h3 className="text-xs uppercase tracking-wider font-semibold border-b border-border pb-2 mb-6 text-foreground">Savings Goals</h3>
                       {dashboard.goals?.length === 0 ? <div className="text-sm text-muted  font-sans">No active goals.</div> : (
                       <div className="space-y-6">
                         {dashboard.goals?.map((g: any) => {
                            const pct = Math.min((g.current_amount / g.target_amount) * 100, 100);
                            return (
                              <div key={g._id} className="bg-surface p-7 rounded-xl border border-border shadow-sm relative overflow-hidden">
                                 <div className="absolute top-0 right-0 p-5">
                                   <span className="text-[10px] text-muted font-sans ">Due {format(new Date(g.deadline || g.targetDate || g.created_at || Date.now()), 'MMM yyyy')}</span>
                                 </div>
                                 <h4 className="font-sans  text-2xl mb-4 text-foreground pr-16">{g.name}</h4>
                                 <div className="flex items-baseline space-x-2 mb-4">
                                    <span className="text-2xl tabular-nums text-foreground">{dashboard.account?.currency || "ZAR"} {g.current_amount}</span>
                                    <span className="text-sm text-muted uppercase tracking-wider">/ {g.target_amount}</span>
                                 </div>
                                 <div className="w-full h-3 bg-background rounded-lg overflow-hidden border border-border mb-4">
                                    <div className="h-full bg-primary flex items-center justify-end rounded-lg transition-all duration-500" style={{ width: `${pct}%` }}></div>
                                 </div>
                              </div>
                            )
                         })}
                       </div>
                       )}
                    </section>
                 </div>
              </div>
            )}
            {activeTab === 'data' && (
              <div className="space-y-12 animate-in fade-in duration-500">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                   <section className="bg-surface p-6 rounded-xl border border-border shadow-sm h-[420px] flex flex-col">
                      <h3 className="text-xs uppercase tracking-wider font-semibold border-b border-border pb-2 mb-6 text-foreground">Category Breakdown</h3>
                      {pieData.length > 0 ? (
                        <div className="flex-1 min-h-0 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="42%" outerRadius={80} innerRadius={50} stroke="var(--color-surface)" strokeWidth={3}>
                              {pieData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)', border: 'none', borderRadius: '12px' }} itemStyle={{ color: 'var(--color-primary-foreground)' }} />
                            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', paddingTop: '10px' }} />
                          </PieChart>
                        </ResponsiveContainer>
                        </div>
                      ) : <div className="flex h-full items-center justify-center text-sm  text-muted font-sans">No data to display.</div>}
                   </section>

                   <section className="bg-surface p-6 rounded-xl border border-border shadow-sm h-[420px]">
                      <h3 className="text-xs uppercase tracking-wider font-semibold border-b border-border pb-2 mb-6 text-foreground">Spending Over Time</h3>
                      {dashboard.transactions?.length > 0 ? (
                         <div className="flex-1 min-h-0 w-full">
                           <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dashboard.dailySpending || []}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                              <XAxis dataKey="_id" tickFormatter={d => format(new Date(d), 'MMM d')} tick={{ fontSize: 10, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} dy={10} />
                              <YAxis tick={{ fontSize: 10, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} dx={-10} />
                              <Tooltip cursor={{fill: 'var(--color-surface-hover)'}} contentStyle={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)', border: 'none', borderRadius: '12px' }} itemStyle={{ color: 'var(--color-primary-foreground)' }} />
                              <Bar dataKey="total" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                               {dashboard?.predictedEndSpend > 0 && <ReferenceLine y={dashboard.predictedEndSpend} stroke="#FF4D4D" strokeDasharray="3 3" label={{ position: 'top', value: "Predicted: " + dashboard.predictedEndSpend.toFixed(0), fill: '#FF4D4D', fontSize: 10 }} />}
                          </BarChart>
                         </ResponsiveContainer>
                        </div>
                      ) : <div className="flex h-full items-center justify-center text-sm  text-muted font-sans">No data to display.</div>}
                   </section>
                 </div>

                 <section>
                    <h3 className="text-xs uppercase tracking-wider font-semibold border-b border-border pb-2 mb-6 text-foreground">All Transactions</h3>
                    <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
                       <table className="w-full text-left text-sm">
                          <thead className="bg-background text-[9px] uppercase tracking-[0.15em] text-muted border-b border-border">
                             <tr>
                               <th className="px-6 py-4 font-bold">Date</th>
                               <th className="px-6 py-4 font-bold">Merchant</th>
                               <th className="px-6 py-4 font-bold">Reason/Description</th>
                               <th className="px-6 py-4 font-bold">Category</th>
                               <th className="px-6 py-4 font-bold text-right">Amount</th>
                               <th className="px-6 py-4 font-bold text-center">Action</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                             {dashboard.transactions?.map((t: any) => (
                               <tr key={t._id} className="hover:bg-background transition-colors">
                                 <td className="px-6 py-4 whitespace-nowrap text-muted">{format(new Date(t.date), 'MMM d, yyyy')}</td>
                                 <td className="px-6 py-4 font-medium whitespace-nowrap text-foreground">{t.merchant}</td>
                                 <td className="px-6 py-4 text-muted max-w-xs truncate" title={t.description}>{t.description || '-'}</td>
                                 <td className="px-6 py-4 capitalize whitespace-nowrap text-foreground">{t.category}</td>
                                 <td className="px-6 py-4 text-right tabular-nums font-sans">
                                    <span className="text-xs text-muted mr-1">{t.currency}</span>
                                    <span className={t.type === 'income' ? 'text-green-700' : 'text-foreground'}>{t.amount?.toFixed(2)}</span>
                                 </td>
                                 <td className="px-6 py-4 text-center">
                                    <button onClick={() => deleteTransaction(t._id)} title="Delete transaction" className="p-2 text-red-500 dark:text-red-400 hover:text-red-700 opacity-50 hover:bg-red-50 dark:bg-red-900/30 rounded hover:opacity-100 transition-all">
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                 </td>
                               </tr>
                             ))}
                             {(!dashboard.transactions || dashboard.transactions.length === 0) && (
                                <tr>
                                   <td colSpan={6} className="px-6 py-10 text-center text-sm  font-sans text-muted">
                                      No transactions found.
                                   </td>
                                </tr>
                             )}
                          </tbody>
                       </table>
                    </div>
                 </section>

              </div>
            )}
         </div>

         {/* Settings Modal */}
         {isSettingsOpen && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
               <div className="bg-surface border border-border rounded-xl p-6 max-w-md w-full shadow-lg relative animate-in zoom-in-95 duration-200">
                  <button onClick={() => setIsSettingsOpen(false)} className="absolute top-6 right-6 text-muted hover:text-foreground">
                     <X className="w-5 h-5" />
                  </button>
                     <h2 className="text-xl font-semibold tracking-tight mb-6 text-foreground">Settings</h2>

                  <div className="space-y-8">
                     <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-muted block mb-3">Currency</label>
                        <select 
                           value={currency} 
                           onChange={e => handleSaveSettings({ currency: e.target.value })} 
                           className="w-full border border-border p-3 rounded-xl bg-background text-foreground text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                        >
                           <option value="ZAR">ZAR (Rand)</option>
                           <option value="USD">USD ($)</option>
                           <option value="EUR">EUR (€)</option>
                           <option value="GBP">GBP (£)</option>
                           <option value="AUD">AUD (A$)</option>
                           <option value="CAD">CAD (C$)</option>
                        </select>
                     </div>

                     

                     <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-muted block mb-3">App Theme</label>
                        <div className="flex bg-background border border-border rounded-xl overflow-hidden p-1">
                           <button onClick={() => setTheme('light')} className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${theme === 'light' ? 'bg-surface shadow text-foreground' : 'text-muted hover:text-foreground'}`}>Light</button>
                           <button onClick={() => setTheme('dark')} className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${theme === 'dark' ? 'bg-surface shadow text-foreground' : 'text-muted hover:text-foreground'}`}>Dark</button>
                        </div>
                     </div>

                     <div className="pt-8 border-t border-border">
                        <label className="text-xs font-bold uppercase tracking-widest text-red-500 block mb-3">Danger Zone</label>
                        <button 
                           onClick={handleClearData} 
                           disabled={isClearing}
                           className="w-full py-3.5 px-4 border border-red-500/30 text-red-500 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                        >
                           <Trash2 className="w-4 h-4" />
                           {isClearing ? 'Clearing...' : 'Clear All Data'}
                        </button>
                        <p className="text-[11px] text-muted mt-3 leading-relaxed">Permanently deletes all transactions, budgets, goals, and account history.</p>
                     </div>
                  </div>
               </div>
            </div>
         )}
      
{isSpaceModalOpen && (
   <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface border border-border rounded-xl p-6 max-w-md w-full shadow-lg relative animate-in zoom-in-95 duration-200">
         <button onClick={() => setIsSpaceModalOpen(false)} className="absolute top-6 right-6 text-muted hover:text-foreground">
            <X className="w-5 h-5" />
         </button>
         <h2 className="text-xl font-semibold tracking-tight mb-6 text-foreground">Create Space</h2>
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

      </main>
    </div>
  );
}
