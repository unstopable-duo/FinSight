import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace Monthly Report Summary
const oldSummary = `<section className="bg-gradient-to-br from-[#1A1A1A] to-[#333333] p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                       <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold border-b border-white/20 pb-2 mb-8 text-white/90">Monthly Report Summary</h3>
                       <div className="grid grid-cols-2 gap-6 relative z-10">
                         <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 p-6 flex flex-col justify-center">
                           <span className="text-[10px] uppercase tracking-[0.2em] text-white/70 block mb-2">Main Expense</span>
                           <h4 className="text-xl font-serif italic text-white capitalize">{topExpense ? topExpense.name : 'N/A'}</h4>
                           <p className="text-sm font-light text-white/90 mt-1 tabular-nums">{topExpense ? \`ZAR \${topExpense.value.toFixed(2)}\` : '-'}</p>
                         </div>
                         <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 p-6 flex flex-col justify-center">
                           <span className="text-[10px] uppercase tracking-[0.2em] text-white/70 block mb-2">Top Income</span>
                           <h4 className="text-xl font-serif italic text-white capitalize">{topIncome ? topIncome.name : 'N/A'}</h4>
                           <p className="text-sm font-light text-white/90 mt-1 tabular-nums">{topIncome ? \`ZAR \${topIncome.value.toFixed(2)}\` : '-'}</p>
                         </div>
                       </div>
                    </section>`;

const newSummary = `<section className="bg-gradient-to-br from-[#1A1A1A] to-[#333333] p-8 rounded-3xl shadow-xl text-white relative flex flex-col gap-6 overflow-hidden">
                       <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                       <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold border-b border-white/20 pb-2 text-white/90">Financial Health</h3>
                       
                       <div className="flex items-center gap-6 relative z-10">
                         <div className="w-32 h-32 rounded-full border-8 border-white/20 flex flex-col items-center justify-center shrink-0">
                           <span className="text-4xl font-serif italic text-white">{dashboard?.healthScore?.score || 0}</span>
                           <span className="text-[10px] uppercase tracking-widest text-white/70 mt-1">/ 100</span>
                         </div>
                         <div>
                           <h4 className="text-2xl font-serif italic text-white mb-2">{dashboard?.healthScore?.label || 'Calculating...'}</h4>
                           <p className="text-xs text-white/70 leading-relaxed max-w-[200px]">Based on your savings rate, budget adherence, and spending consistency.</p>
                         </div>
                       </div>

                       <div className="grid grid-cols-2 gap-4 relative z-10 mt-2">
                         <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/10 p-4">
                           <span className="text-[9px] uppercase tracking-[0.2em] text-white/70 block mb-1">Main Expense</span>
                           <h4 className="text-lg font-serif italic text-white truncate">{topExpense ? topExpense.name : 'N/A'}</h4>
                         </div>
                         <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/10 p-4">
                           <span className="text-[9px] uppercase tracking-[0.2em] text-white/70 block mb-1">Savings Rate</span>
                           <h4 className="text-lg font-serif italic text-white truncate">{dashboard?.savingsRate || 0}%</h4>
                         </div>
                       </div>
                    </section>`;

content = content.replace(oldSummary, newSummary);

fs.writeFileSync('src/App.tsx', content, 'utf8');
