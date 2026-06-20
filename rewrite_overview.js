import fs from 'fs';

const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');
const startIdx = lines.findIndex(l => l.includes("{activeTab === 'overview' ? ("));
const endIdx = lines.findIndex((l, i) => i > startIdx && l.includes(") : ("));

if (startIdx !== -1 && endIdx !== -1) {
const newString = `
            {activeTab === 'overview' && dashboard.account?.persona === 'founder' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 flex-1">
                 <div className="space-y-12">
                   <section className="bg-gradient-to-br from-primary-gradient to-primary-gradient-end p-6 rounded-2xl shadow-md text-primary-foreground relative flex flex-col gap-6 overflow-hidden">
                       <div className="absolute top-0 right-0 w-64 h-64 bg-surface/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                       <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold border-b border-primary-foreground/20 pb-2 text-primary-foreground/90">Startup Financial Health</h3>
                       <div className="flex items-center gap-6 relative z-10">
                         <div className="w-32 h-32 rounded-full border-8 border-primary-foreground/20 flex flex-col items-center justify-center shrink-0">
                           <span className="text-4xl font-serif italic text-primary-foreground">{dashboard?.healthScore?.score || 0}</span>
                         </div>
                         <div>
                           <h4 className="text-2xl font-serif italic text-primary-foreground mb-2">{dashboard?.healthScore?.label}</h4>
                           <p className="text-xs text-primary-foreground/70 leading-relaxed max-w-[200px]">Runway calculated based on current balance and net cash burn over this month.</p>
                         </div>
                       </div>
                       <div className="grid grid-cols-2 gap-4 relative z-10 mt-2">
                         <div className="bg-surface/10 backdrop-blur-md rounded-xl border border-primary-foreground/10 p-4">
                           <span className="text-[9px] uppercase tracking-[0.2em] text-primary-foreground/70 block mb-1">Top Spend</span>
                           <h4 className="text-lg font-serif italic text-primary-foreground truncate">{topExpense ? topExpense.name : 'N/A'}</h4>
                         </div>
                         <div className="bg-surface/10 backdrop-blur-md rounded-xl border border-primary-foreground/10 p-4">
                           <span className="text-[9px] uppercase tracking-[0.2em] text-primary-foreground/70 block mb-1">Savings Rate</span>
                           <h4 className="text-lg font-serif italic text-primary-foreground truncate">{dashboard?.savingsRate || 0}%</h4>
                         </div>
                       </div>
                   </section>
                   <section>
                       <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold border-b border-border pb-2 mb-6 text-foreground">Burn Rate Progress</h3>
                       <div className="space-y-6">
                         {dashboard.budgets?.map((b: any) => {
                            const spent = categoryTotals[b.category] || 0;
                            const pct = Math.min((spent / b.limit) * 100, 100);
                            const isOver = spent > b.limit;
                            return (
                              <div key={b._id} className="space-y-2">
                                 <div className="flex justify-between text-xs font-serif italic text-foreground">
                                   <span className="capitalize">{b.category}</span>
                                   <span>{dashboard.account?.currency || "ZAR"} {spent.toFixed(2)} / {b.limit}</span>
                                 </div>
                                 <div className="w-full h-2 bg-surface rounded-full overflow-hidden border border-border">
                                    <div className={cn("h-full transition-all duration-500 rounded-full", isOver ? "bg-red-500 dark:bg-red-900/30" : "bg-primary")} style={{ width: \`\${pct}%\` }}/>
                                 </div>
                              </div>
                            )
                         })}
                       </div>
                   </section>
                 </div>
                 <div className="space-y-12">
                   <section>
                       <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold border-b border-border pb-2 mb-6 text-foreground">Recent SaaS & Operations Spend</h3>
                       <div className="space-y-0 rounded-2xl border border-border bg-surface text-foreground shadow-sm overflow-hidden">
                          {dashboard.transactions?.slice(0, 8).map((t: any, idx: number) => (
                            <div key={t._id} className={cn("p-5 flex items-center justify-between hover:bg-background transition-colors", idx !== 0 && "border-t border-border")}>
                               <div>
                                 <div className="font-medium text-sm text-foreground">{t.merchant}</div>
                                 <div className="text-[9px] uppercase tracking-[0.15em] text-muted mt-1.5">{t.category} • {format(new Date(t.date), 'MMM d, yyyy')}</div>
                               </div>
                               <div className={cn("font-serif text-sm", t.type === 'expense' ? 'text-foreground' : 'text-green-700')}>
                                 {t.type === 'expense' ? '-' : '+'} {dashboard.account?.currency || 'ZAR'} {t.amount.toFixed(2)}
                               </div>
                            </div>
                          ))}
                       </div>
                   </section>
                 </div>
              </div>
            )}
            {activeTab === 'overview' && dashboard.account?.persona === 'freelancer' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 flex-1">
                 <div className="space-y-12">
                   <section className="bg-surface p-6 rounded-2xl shadow-md border border-border relative flex flex-col gap-6 overflow-hidden">
                       <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold border-b border-border pb-2 text-foreground">Freelancer Health</h3>
                       <div className="flex items-center gap-6">
                         <div className="w-32 h-32 rounded-full border-8 border-primary/20 flex flex-col items-center justify-center shrink-0">
                           <span className="text-4xl font-serif italic text-foreground">{dashboard?.healthScore?.score || 0}</span>
                         </div>
                         <div>
                           <h4 className="text-xl font-serif italic text-muted mb-2">{dashboard?.healthScore?.label}</h4>
                           <p className="text-xs text-muted leading-relaxed max-w-[200px]">Calculated from revenue and an exact 160h work month equivalent.</p>
                         </div>
                       </div>
                   </section>
                   <section>
                       <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold border-b border-border pb-2 mb-6 text-foreground">Pending Invoices (Owed to you)</h3>
                       {dashboard.debts?.length === 0 ? <div className="text-sm text-muted italic font-serif">No pending invoices.</div> : (
                         <div className="space-y-3">
                            {dashboard.debts?.map((d: any) => (
                               <div key={d._id} className="bg-surface p-5 rounded-2xl border border-border shadow-sm flex items-center justify-between">
                                  <div>
                                     <div className="font-medium text-sm text-foreground capitalize">{d.friend_name}</div>
                                     <div className="text-[9px] uppercase tracking-widest text-muted mt-1.5">{format(new Date(d.date), 'MMM d, yyyy')}</div>
                                  </div>
                                  <div className="font-serif italic text-foreground text-yellow-600">
                                     Unpaid: {dashboard.account?.currency || "ZAR"} {d.amount.toFixed(2)}
                                  </div>
                               </div>
                            ))}
                         </div>
                       )}
                   </section>
                 </div>
                 <div className="space-y-12">
                   <section>
                       <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold border-b border-border pb-2 mb-6 text-foreground">Highest Paying Clients & Income</h3>
                       <div className="space-y-0 rounded-2xl border border-border bg-surface text-foreground shadow-sm overflow-hidden">
                          {dashboard.transactions?.filter((t:any) => t.type === 'income').slice(0, 5).map((t: any, idx: number) => (
                            <div key={t._id} className={cn("p-5 flex items-center justify-between hover:bg-background transition-colors", idx !== 0 && "border-t border-border")}>
                               <div>
                                 <div className="font-medium text-sm text-foreground">{t.merchant}</div>
                                 <div className="text-[9px] uppercase tracking-[0.15em] text-muted mt-1.5">{t.category} • {format(new Date(t.date), 'MMM d, yyyy')}</div>
                               </div>
                               <div className="font-serif text-sm text-green-600 font-bold">
                                 + {dashboard.account?.currency || 'ZAR'} {t.amount.toFixed(2)}
                               </div>
                            </div>
                          ))}
                          {(!dashboard.transactions || dashboard.transactions.filter((t:any) => t.type === 'income').length === 0) && (
                              <div className="p-6 text-center text-muted text-sm font-serif italic">
                                 No income recorded yet.
                              </div>
                          )}
                       </div>
                   </section>
                   <section>
                       <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold border-b border-border pb-2 mb-6 text-foreground">Business Expenses</h3>
                       <div className="space-y-0 rounded-2xl border border-border bg-surface text-foreground shadow-sm overflow-hidden">
                          {dashboard.transactions?.filter((t:any) => t.type === 'expense').slice(0, 5).map((t: any, idx: number) => (
                            <div key={t._id} className={cn("p-5 flex items-center justify-between hover:bg-background transition-colors", idx !== 0 && "border-t border-border")}>
                               <div>
                                 <div className="font-medium text-sm text-foreground">{t.merchant}</div>
                                 <div className="text-[9px] uppercase tracking-[0.15em] text-muted mt-1.5">{t.category} • {format(new Date(t.date), 'MMM d, yyyy')}</div>
                               </div>
                               <div className="font-serif text-sm text-foreground">
                                 - {dashboard.account?.currency || 'ZAR'} {t.amount.toFixed(2)}
                               </div>
                            </div>
                          ))}
                          {(!dashboard.transactions || dashboard.transactions.filter((t:any) => t.type === 'expense').length === 0) && (
                              <div className="p-6 text-center text-muted text-sm font-serif italic">
                                 No expenses recorded yet.
                              </div>
                          )}
                       </div>
                   </section>
                 </div>
              </div>
            )}
            {activeTab === 'overview' && dashboard.account?.persona === 'side_project' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 flex-1">
                 <div className="space-y-12">
                   <section className="bg-gradient-to-br from-primary-gradient to-primary-gradient-end p-6 rounded-2xl shadow-md text-primary-foreground relative flex flex-col gap-6 overflow-hidden">
                       <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold border-b border-primary-foreground/20 pb-2 text-primary-foreground/90">Project P&L Status</h3>
                       <div className="flex items-center gap-6 relative z-10">
                         <div className="w-32 h-32 rounded-full border-8 border-primary-foreground/20 flex flex-col items-center justify-center shrink-0">
                           <span className="text-3xl font-serif italic text-primary-foreground">{dashboard?.healthScore?.score || 0}</span>
                         </div>
                         <div>
                           <h4 className="text-2xl font-serif italic text-primary-foreground mb-2">{dashboard?.healthScore?.label}</h4>
                           <p className="text-xs text-primary-foreground/70 leading-relaxed max-w-[200px]">Monthly profit or loss from this side project.</p>
                         </div>
                       </div>
                   </section>
                   <section>
                       <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold border-b border-border pb-2 mb-6 text-foreground">Top Infrastructure Costs</h3>
                       <div className="space-y-0 rounded-2xl border border-border bg-surface text-foreground shadow-sm overflow-hidden">
                          {dashboard.transactions?.filter((t:any) => t.type === 'expense').slice(0, 5).map((t: any, idx: number) => (
                            <div key={t._id} className={cn("p-5 flex items-center justify-between hover:bg-background transition-colors", idx !== 0 && "border-t border-border")}>
                               <div>
                                 <div className="font-medium text-sm text-foreground">{t.merchant}</div>
                                 <div className="text-[9px] uppercase tracking-[0.15em] text-muted mt-1.5">{t.category} • {format(new Date(t.date), 'MMM d, yyyy')}</div>
                               </div>
                               <div className="font-serif text-sm text-foreground">
                                 - {dashboard.account?.currency || 'ZAR'} {t.amount.toFixed(2)}
                               </div>
                            </div>
                          ))}
                       </div>
                   </section>
                 </div>
                 <div className="space-y-12">
                   <section>
                       <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold border-b border-border pb-2 mb-6 text-foreground">Recent Subscriptions or Revenue</h3>
                       <div className="space-y-0 rounded-2xl border border-border bg-surface text-foreground shadow-sm overflow-hidden">
                          {dashboard.transactions?.filter((t:any) => t.type === 'income').slice(0, 5).map((t: any, idx: number) => (
                            <div key={t._id} className={cn("p-5 flex items-center justify-between hover:bg-background transition-colors", idx !== 0 && "border-t border-border")}>
                               <div>
                                 <div className="font-medium text-sm text-foreground">{t.merchant}</div>
                                 <div className="text-[9px] uppercase tracking-[0.15em] text-muted mt-1.5">{t.category} • {format(new Date(t.date), 'MMM d, yyyy')}</div>
                               </div>
                               <div className="font-serif text-sm text-green-600 font-bold">
                                 + {dashboard.account?.currency || 'ZAR'} {t.amount.toFixed(2)}
                               </div>
                            </div>
                          ))}
                          {(!dashboard.transactions || dashboard.transactions.filter((t:any) => t.type === 'income').length === 0) && (
                              <div className="p-6 text-center text-muted text-sm font-serif italic">
                                 No income recorded yet.
                              </div>
                          )}
                       </div>
                   </section>
                 </div>
              </div>
            )}
            {activeTab === 'overview' && !['founder', 'freelancer', 'side_project'].includes(dashboard.account?.persona) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 flex-1">
                 <div className="space-y-12">
                   <section className="bg-gradient-to-br from-primary-gradient to-primary-gradient-end p-6 rounded-2xl shadow-md text-primary-foreground relative flex flex-col gap-6 overflow-hidden">
                       <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold border-b border-primary-foreground/20 pb-2 text-primary-foreground/90">{getHealthCardTitle(dashboard.account?.persona)}</h3>
                       <div className="flex items-center gap-6 relative z-10">
                         <div className="w-32 h-32 rounded-full border-8 border-primary-foreground/20 flex flex-col items-center justify-center shrink-0">
                           <span className="text-4xl font-serif italic text-primary-foreground">{dashboard?.healthScore?.score || 0}</span>
                         </div>
                         <div>
                           <h4 className="text-2xl font-serif italic text-primary-foreground mb-2">{dashboard?.healthScore?.label}</h4>
                           <p className="text-xs text-primary-foreground/70 leading-relaxed max-w-[200px]">Based on your savings rate, budget adherence, and spending consistency.</p>
                         </div>
                       </div>
                   </section>
                   <section>
                       <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold border-b border-border pb-2 mb-6 text-foreground">Budget Progress</h3>
                       {dashboard.budgets?.length === 0 ? <div className="text-sm text-muted italic font-serif">No active budgets.</div> : (
                       <div className="space-y-6">
                         {dashboard.budgets?.map((b: any) => {
                            const spent = categoryTotals[b.category] || 0;
                            const pct = Math.min((spent / b.limit) * 100, 100);
                            const isOver = spent > b.limit;
                            return (
                              <div key={b._id} className="space-y-2">
                                 <div className="flex justify-between text-xs font-serif italic text-foreground">
                                   <span className="capitalize">{b.category}</span>
                                   <span>{dashboard.account?.currency || "ZAR"} {spent.toFixed(2)} / {b.limit}</span>
                                 </div>
                                 <div className="w-full h-2 bg-surface rounded-full overflow-hidden border border-border">
                                    <div className={cn("h-full transition-all duration-500 rounded-full", isOver ? "bg-red-50 dark:bg-red-900/300" : "bg-primary")} style={{ width: \`\${pct}%\` }}/>
                                 </div>
                              </div>
                            )
                         })}
                       </div>
                       )}
                   </section>
                 </div>
                 <div className="space-y-12">
                    <section>
                       <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold border-b border-border pb-2 mb-6 text-foreground">Recent Activity</h3>
                       <div className="space-y-0 rounded-2xl border border-border bg-surface text-foreground shadow-sm overflow-hidden">
                          {dashboard.transactions?.slice(0, 5).map((t: any, idx: number) => (
                            <div key={t._id} className={cn("p-5 flex items-center justify-between hover:bg-background transition-colors", idx !== 0 && "border-t border-border")}>
                               <div>
                                 <div className="font-medium text-sm text-foreground">{t.merchant}</div>
                                 <div className="text-[9px] uppercase tracking-[0.15em] text-muted mt-1.5">{t.category} • {format(new Date(t.date), 'MMM d, yyyy')}</div>
                               </div>
                               <div className={cn("font-serif text-sm", t.type === 'expense' ? 'text-foreground' : 'text-green-700')}>
                                 {t.type === 'expense' ? '-' : '+'} {dashboard.account?.currency || 'ZAR'} {t.amount.toFixed(2)}
                               </div>
                            </div>
                          ))}
                          {(!dashboard.transactions || dashboard.transactions.length === 0) && (
                              <div className="p-6 text-center text-muted text-sm font-serif italic">
                                 No transactions recorded yet.
                              </div>
                          )}
                       </div>
                    </section>
                    <section>
                       <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold border-b border-border pb-2 mb-6 text-foreground">Savings Goals</h3>
                       {dashboard.goals?.length === 0 ? <div className="text-sm text-muted italic font-serif">No active goals.</div> : (
                       <div className="space-y-6">
                         {dashboard.goals?.map((g: any) => {
                            const pct = Math.min((g.current_amount / g.target_amount) * 100, 100);
                            return (
                              <div key={g._id} className="bg-surface p-7 rounded-2xl border border-border shadow-sm relative overflow-hidden">
                                 <div className="absolute top-0 right-0 p-5">
                                   <span className="text-[10px] text-muted font-serif italic">Due {format(new Date(g.deadline || g.targetDate || g.created_at || Date.now()), 'MMM yyyy')}</span>
                                 </div>
                                 <h4 className="font-serif italic text-2xl mb-4 text-foreground pr-16">{g.name}</h4>
                                 <div className="flex items-baseline space-x-2 mb-4">
                                    <span className="text-4xl tabular-nums text-foreground">{dashboard.account?.currency || "ZAR"} {g.current_amount}</span>
                                    <span className="text-sm text-muted uppercase tracking-wider">/ {g.target_amount}</span>
                                 </div>
                                 <div className="w-full h-3 bg-background rounded-full overflow-hidden border border-border mb-4">
                                    <div className="h-full bg-primary flex items-center justify-end rounded-full transition-all duration-500" style={{ width: \`\${pct}%\` }}></div>
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
`;

lines.splice(startIdx, endIdx - startIdx + 1, ...newString.split('\n'));
fs.writeFileSync('src/App.tsx', lines.join('\n'));
} else {
  console.log("NOT FOUND");
}
