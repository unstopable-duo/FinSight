import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  'import { Send, LogOut, Target, Activity, Database, Trash2, FileSpreadsheet, Calendar } from \'lucide-react\';',
  'import { Send, LogOut, Target, Activity, Database, Trash2, FileSpreadsheet, Calendar, PanelLeftClose, PanelLeftOpen } from \'lucide-react\';'
);

const stateInsertion = `
  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(450);
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
  }, []);`;

content = content.replace(
  '  const [dashboard, setDashboard] = useState<any>({ transactions: [], budgets: [], goals: [], currentMonth: \'\' });',
  '  const [dashboard, setDashboard] = useState<any>({ transactions: [], budgets: [], goals: [], currentMonth: \'\' });\n' + stateInsertion
);

const asideStart = '<aside className=\"w-full md:w-[450px] flex flex-col border-r border-[#E5E2D9] bg-white shadow-xl z-20\">';
const newAsideStart = `<aside 
         style={{ width: isSidebarOpen ? \`\${sidebarWidth}px\` : '0px', display: isSidebarOpen ? 'flex' : 'none' }} 
         className={cn("flex flex-col border-r border-[#E5E2D9] bg-white shadow-xl z-20 shrink-0 relative transition-all", isResizingRef.current ? "duration-0" : "duration-300")}
       >`;
content = content.replace(asideStart, newAsideStart);

const dragHandle = `
         <div 
           className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-[#1A1A1A]/10 active:bg-[#1A1A1A]/20 transition-colors z-50"
           onMouseDown={(e) => {
             e.preventDefault();
             isResizingRef.current = true;
             document.body.style.cursor = 'col-resize';
             document.body.style.userSelect = 'none';
           }}
         />
`;
content = content.replace('      </aside>', dragHandle + '\n      </aside>');

const mainHeader = '<main className=\"flex-1 flex flex-col bg-[#F9F7F2] overflow-y-auto w-full relative\">';
const newMainHeader = mainHeader + `
         <div className="absolute top-6 left-4 z-20 flex items-center gap-2">
           <button 
             onClick={() => setIsSidebarOpen(!isSidebarOpen)}
             className="p-2 bg-white border border-[#E5E2D9] rounded-xl shadow-sm text-[#8C8980] hover:text-[#1A1A1A] transition-colors"
           >
             {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
           </button>
         </div>`;
content = content.replace(mainHeader, newMainHeader);

fs.writeFileSync('src/App.tsx', content, 'utf8');
