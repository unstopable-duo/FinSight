import fs from 'fs';

let widgetData = fs.readFileSync('src/components/FloatingWidget.tsx', 'utf-8');

widgetData = widgetData.replace(
  `className="mb-4 bg-white border border-[#E5E2D9] shadow-xl p-4 w-72 flex flex-col gap-4 font-sans text-[#1A1A1A]"`,
  `className="mb-4 bg-surface border border-border shadow-xl rounded-xl p-4 w-72 flex flex-col gap-4 font-sans text-foreground"`
);

widgetData = widgetData.replace(
  `border-b border-[#E5E2D9] pb-2`,
  `border-b border-border pb-2`
);

widgetData = widgetData.replace(
  `<span className="font-serif italic font-bold">FinSight Mini</span>`,
  `<span className="font-bold tracking-tight">FinSight Mini</span>`
);

widgetData = widgetData.replace(
  `className="text-[#8C8980] hover:text-[#1A1A1A]"`,
  `className="text-muted hover:text-foreground"`
);

widgetData = widgetData.replace(
  `className="w-full bg-[#FAFAFA] border border-[#E5E2D9] p-3 text-sm focus:outline-none focus:border-[#1A1A1A]"`,
  `className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:outline-none focus:border-primary"`
);

widgetData = widgetData.replace(
  `className={cn("p-2 rounded-full border border-[#E5E2D9] text-[#8C8980] hover:bg-[#1A1A1A] hover:text-white transition-colors", isListening && "text-red-500 border-red-500 animate-pulse")}`,
  `className={cn("p-2 rounded-lg border border-border text-muted hover:bg-primary hover:text-primary-foreground transition-colors", isListening && "text-red-500 border-red-500 animate-pulse")}`
);

widgetData = widgetData.replace(
  `className="p-2 rounded-full border border-[#E5E2D9] text-[#8C8980] hover:bg-[#1A1A1A] hover:text-white transition-colors"`,
  `className="p-2 rounded-lg border border-border text-muted hover:bg-primary hover:text-primary-foreground transition-colors"`
);

widgetData = widgetData.replace(
  `className="w-12 h-12 bg-[#1A1A1A] rounded-full text-white flex items-center justify-center shadow-lg hover:bg-black transition-colors"`,
  `className="w-12 h-12 bg-primary rounded-full text-primary-foreground flex items-center justify-center shadow-lg hover:bg-[#333] transition-colors"`
);

fs.writeFileSync('src/components/FloatingWidget.tsx', widgetData);
console.log('patched floating widget');
