import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const iconsReplace = "import { Send, LogOut, Target, Activity, Database, Trash2, FileSpreadsheet, Calendar, PanelLeftClose, PanelLeftOpen } from 'lucide-react';";
const newIcons = "import { Send, LogOut, Target, Activity, Database, Trash2, FileSpreadsheet, Calendar, PanelLeftClose, PanelLeftOpen, Camera } from 'lucide-react';";
content = content.replace(iconsReplace, newIcons);

const fileRef = "  const messagesEndRef = useRef<HTMLDivElement>(null);";
const newFileRef = "  const messagesEndRef = useRef<HTMLDivElement>(null);\n  const fileInputRef = useRef<HTMLInputElement>(null);";
content = content.replace(fileRef, newFileRef);

const handleFileUpload = `
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
`;
content = content.replace('  const sendMessage = async (e: React.FormEvent) => {', handleFileUpload + '\n  const sendMessage = async (e: React.FormEvent) => {');

const chatInput = `
             <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Talk to your money..."
                className="w-full bg-white border border-[#E5E2D9] rounded-full py-4 px-6 pr-24 text-sm italic focus:ring-1 focus:ring-[#1A1A1A] text-[#1A1A1A] placeholder:text-[#8C8980] outline-none transition-all"
              />
              <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
              <div className="absolute right-2 flex items-center gap-1">
                <button 
                  title="Scan Receipt"
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 text-[#8C8980] hover:text-[#1A1A1A] transition-colors flex items-center justify-center cursor-pointer"
                >
                  <Camera className="w-5 h-5" />
                </button>
                <button 
                  title="Send Message"
                  type="submit" 
                  disabled={!input.trim() || isSending}
                  className="p-3 bg-[#1A1A1A] hover:bg-[#333] text-white rounded-full disabled:opacity-50 transition-colors flex items-center justify-center"
                >
                   <Send className="w-4 h-4" />
                </button>
              </div>
`;

content = content.replace(/<input\s+type="text"\s+value=\{input\}[\s\S]*?<\/button>/, chatInput.trim());
fs.writeFileSync('src/App.tsx', content, 'utf8');
