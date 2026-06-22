import { useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Plus, TrendingUp, TrendingDown, Wallet, Target, Trash2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { ImageUploadField } from "@/components/ImageUploadField";

type TxType = "income" | "expense";

const EXPENSE_CATEGORIES = ["mat", "transport", "nöje", "hälsa", "utbildning", "kläder", "hem", "övrigt"];
const INCOME_CATEGORIES = ["lön", "bidrag", "gåva", "övrigt"];

const COLORS = ["#6366f1","#ec4899","#f59e0b","#10b981","#3b82f6","#8b5cf6","#ef4444","#06b6d4","#84cc16","#f97316"];

export default function BudgetPage() {
  const { t, language } = useLanguage();
  const [showTxDialog, setShowTxDialog] = useState(false);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [txForm, setTxForm] = useState({ type: "expense" as TxType, amount: "", category: "mat", description: "", date: new Date().toISOString().slice(0, 10), imageUrl: "" });
  const [goalForm, setGoalForm] = useState({ title: "", targetAmount: "", currentAmount: "0", icon: "🎯", color: "#6366f1", deadline: "" });
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "goals">("overview");

  const { data: transactions = [], refetch: refetchTx } = trpc.budget.transactions.useQuery({});
  const { data: goals = [], refetch: refetchGoals } = trpc.budget.savingsGoals.useQuery();
  const createTx = trpc.budget.addTransaction.useMutation({ onSuccess: () => { refetchTx(); setShowTxDialog(false); toast.success(language === "sv" ? "Transaktion tillagd!" : "Macaamilad lagu daray!"); } });
  const deleteTx = trpc.budget.deleteTransaction.useMutation({ onSuccess: () => refetchTx() });
  const createGoal = trpc.budget.createSavingsGoal.useMutation({ onSuccess: () => { refetchGoals(); setShowGoalDialog(false); toast.success(language === "sv" ? "Sparmål skapat!" : "Hadafka kaydinta la abuuray!"); } });
  const updateGoal = trpc.budget.updateSavingsGoal.useMutation({ onSuccess: () => refetchGoals() });
  const deleteGoal = trpc.budget.deleteSavingsGoal.useMutation({ onSuccess: () => refetchGoals() });

  const stats = useMemo(() => {
    const income = transactions.filter(t => t.type === "income").reduce((s, t) => s + parseFloat(t.amount), 0);
    const expense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + parseFloat(t.amount), 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.filter(t => t.type === "expense").forEach(t => {
      map[t.category] = (map[t.category] ?? 0) + parseFloat(t.amount);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const monthlyData = useMemo(() => {
    const map: Record<string, { income: number; expense: number }> = {};
    transactions.forEach(t => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!map[key]) map[key] = { income: 0, expense: 0 };
      if (t.type === "income") map[key].income += parseFloat(t.amount);
      else map[key].expense += parseFloat(t.amount);
    });
    return Object.entries(map).sort().slice(-6).map(([month, data]) => ({ month, ...data }));
  }, [transactions]);

  const formatCurrency = (n: number) => `${n.toLocaleString(language === "sv" ? "sv-SE" : "so-SO")} kr`;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">{t("nav.budget")}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{language === "sv" ? "Håll koll på familjens ekonomi" : "La sooc dhaqaalaha qoyska"}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowGoalDialog(true)} className="gap-1.5">
            <Target className="w-4 h-4" /> {language === "sv" ? "Nytt mål" : "Hadaf cusub"}
          </Button>
          <Button size="sm" onClick={() => setShowTxDialog(true)} className="gap-1.5">
            <Plus className="w-4 h-4" /> {language === "sv" ? "Ny transaktion" : "Macaamilad cusub"}
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-premium border-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{language === "sv" ? "Inkomster" : "Dakhliga"}</span>
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <p className="text-2xl font-bold font-display text-emerald-700 dark:text-emerald-300">{formatCurrency(stats.income)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-premium border-0 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-red-700 dark:text-red-400">{language === "sv" ? "Utgifter" : "Kharashka"}</span>
              <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <p className="text-2xl font-bold font-display text-red-700 dark:text-red-300">{formatCurrency(stats.expense)}</p>
          </CardContent>
        </Card>
        <Card className={cn("shadow-premium border-0 bg-gradient-to-br", stats.balance >= 0 ? "from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20" : "from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20")}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className={cn("text-sm font-medium", stats.balance >= 0 ? "text-indigo-700 dark:text-indigo-400" : "text-orange-700 dark:text-orange-400")}>{language === "sv" ? "Saldo" : "Haraaga"}</span>
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", stats.balance >= 0 ? "bg-indigo-100 dark:bg-indigo-900/40" : "bg-orange-100 dark:bg-orange-900/40")}>
                <Wallet className={cn("w-4 h-4", stats.balance >= 0 ? "text-indigo-600 dark:text-indigo-400" : "text-orange-600 dark:text-orange-400")} />
              </div>
            </div>
            <p className={cn("text-2xl font-bold font-display", stats.balance >= 0 ? "text-indigo-700 dark:text-indigo-300" : "text-orange-700 dark:text-orange-300")}>{formatCurrency(stats.balance)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-xl w-fit">
        {(["overview", "transactions", "goals"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={cn("px-3 py-1.5 rounded-lg text-sm font-medium transition-all", activeTab === tab ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
            {tab === "overview" ? (language === "sv" ? "Översikt" : "Guud ahaan") : tab === "transactions" ? (language === "sv" ? "Transaktioner" : "Macaamilado") : (language === "sv" ? "Sparmål" : "Hadafyada")}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Category breakdown */}
          <Card className="shadow-premium border-0">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{language === "sv" ? "Utgifter per kategori" : "Kharashka qaybta"}</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {categoryData.length > 0 ? (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width={140} height={140}>
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                        {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number | string) => formatCurrency(Number(v))} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-1.5">
                    {categoryData.slice(0, 6).map((item, i) => (
                      <div key={item.name} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-xs text-muted-foreground capitalize">{item.name}</span>
                        </div>
                        <span className="text-xs font-medium">{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Wallet className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-sm">{language === "sv" ? "Inga transaktioner ännu" : "Wali macaamilad ma jirto"}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly chart */}
          <Card className="shadow-premium border-0">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{language === "sv" ? "Månadsöversikt" : "Guudmarka bilaha"}</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={monthlyData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: number | string) => formatCurrency(Number(v))} />
                    <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <TrendingUp className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-sm">{language === "sv" ? "Lägg till transaktioner för att se grafen" : "Ku dar macaamilado si aad u aragto garaafka"}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "transactions" && (
        <Card className="shadow-premium border-0">
          <CardContent className="p-4">
            {transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Wallet className="w-10 h-10 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">{language === "sv" ? "Inga transaktioner ännu" : "Wali macaamilad ma jirto"}</p>
                <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowTxDialog(true)}>
                  <Plus className="w-3 h-3 mr-1" /> {language === "sv" ? "Lägg till" : "Ku dar"}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map(tx => (
                  <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group">
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0", tx.type === "income" ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30")}>
                      {tx.type === "income" ? <ArrowUpRight className="w-4 h-4 text-emerald-600" /> : <ArrowDownRight className="w-4 h-4 text-red-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{tx.description || tx.category}</p>
                      <p className="text-xs text-muted-foreground">
                        {tx.category} · {new Date(tx.date).toLocaleDateString(language === "sv" ? "sv-SE" : "so-SO", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                    <span className={cn("text-sm font-semibold", tx.type === "income" ? "text-emerald-600" : "text-red-600")}>
                      {tx.type === "income" ? "+" : "-"}{formatCurrency(parseFloat(tx.amount))}
                    </span>
                    <button onClick={() => deleteTx.mutate({ id: tx.id })} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "goals" && (
        <div className="space-y-3">
          {goals.length === 0 ? (
            <Card className="shadow-premium border-0">
              <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                <Target className="w-10 h-10 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">{language === "sv" ? "Inga sparmål ännu" : "Wali hadaf kaydinta ma jirto"}</p>
                <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowGoalDialog(true)}>
                  <Plus className="w-3 h-3 mr-1" /> {language === "sv" ? "Skapa mål" : "Samee hadaf"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            goals.map(goal => {
              const current = parseFloat(goal.currentAmount ?? "0");
              const target = parseFloat(goal.targetAmount);
              const pct = Math.min(100, Math.round((current / target) * 100));
              return (
                <Card key={goal.id} className="shadow-premium border-0">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: `${goal.color}20` }}>
                          {goal.icon ?? "🎯"}
                        </div>
                        <div>
                          <p className="font-semibold">{goal.title}</p>
                          <p className="text-xs text-muted-foreground">{formatCurrency(current)} / {formatCurrency(target)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{pct}%</Badge>
                        <button onClick={() => deleteGoal.mutate({ id: goal.id })} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <Progress value={pct} className="h-2" />
                    {goal.deadline && (
                      <p className="text-xs text-muted-foreground mt-2">
                        🗓 {new Date(goal.deadline).toLocaleDateString(language === "sv" ? "sv-SE" : "so-SO", { year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    )}
                    <div className="flex gap-2 mt-3">
                      <Input
                        type="number"
                        placeholder={language === "sv" ? "Lägg till belopp" : "Ku dar lacag"}
                        className="h-8 text-sm"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const val = parseFloat((e.target as HTMLInputElement).value);
                            if (!isNaN(val)) {
                              updateGoal.mutate({ id: goal.id, currentAmount: (current + val).toFixed(2) });
                              (e.target as HTMLInputElement).value = "";
                            }
                          }
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Transaction Dialog */}
      <Dialog open={showTxDialog} onOpenChange={setShowTxDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{language === "sv" ? "Ny transaktion" : "Macaamilad cusub"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              {(["expense", "income"] as TxType[]).map(type => (
                <button key={type} onClick={() => setTxForm(f => ({ ...f, type }))} className={cn("flex-1 py-2 rounded-xl text-sm font-medium border transition-all", txForm.type === type ? (type === "income" ? "bg-emerald-500 text-white border-emerald-500" : "bg-red-500 text-white border-red-500") : "border-border hover:bg-muted")}>
                  {type === "income" ? (language === "sv" ? "Inkomst" : "Dakhli") : (language === "sv" ? "Utgift" : "Kharash")}
                </button>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label>{language === "sv" ? "Belopp (kr)" : "Lacagta (kr)"}</Label>
              <Input type="number" value={txForm.amount} onChange={e => setTxForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{language === "sv" ? "Kategori" : "Qaybta"}</Label>
                <Select value={txForm.category} onValueChange={v => setTxForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(txForm.type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{language === "sv" ? "Datum" : "Taariikhda"}</Label>
                <Input type="date" value={txForm.date} onChange={e => setTxForm(f => ({ ...f, date: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{language === "sv" ? "Beskrivning" : "Sharaxaad"}</Label>
              <Input value={txForm.description} onChange={e => setTxForm(f => ({ ...f, description: e.target.value }))} placeholder={language === "sv" ? "Valfri beskrivning" : "Sharaxaad ikhtiyaari ah"} />
            </div>
            <ImageUploadField
              value={txForm.imageUrl || ""}
              onChange={(url: string) => setTxForm(f => ({ ...f, imageUrl: url }))}
              label={language === "sv" ? "Kvitto/Bild (valfritt)" : "Resit/Sawir (opsiyonal)"}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowTxDialog(false)}>{t("common.cancel")}</Button>
            <Button onClick={() => { if (!txForm.amount) return toast.error(language === "sv" ? "Ange ett belopp" : "Geli lacag"); createTx.mutate(txForm); }} disabled={createTx.isPending}>{t("common.create")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Goal Dialog */}
      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{language === "sv" ? "Nytt sparmål" : "Hadaf kaydinta cusub"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>{t("common.title")}</Label>
              <Input value={goalForm.title} onChange={e => setGoalForm(f => ({ ...f, title: e.target.value }))} placeholder={language === "sv" ? "t.ex. Semesterresa" : "tusaale: Fasax"} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{language === "sv" ? "Målbelopp (kr)" : "Hadafka lacagta (kr)"}</Label>
                <Input type="number" value={goalForm.targetAmount} onChange={e => setGoalForm(f => ({ ...f, targetAmount: e.target.value }))} placeholder="10000" />
              </div>
              <div className="space-y-1.5">
                <Label>{language === "sv" ? "Startbelopp (kr)" : "Lacagta bilowga (kr)"}</Label>
                <Input type="number" value={goalForm.currentAmount} onChange={e => setGoalForm(f => ({ ...f, currentAmount: e.target.value }))} placeholder="0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{language === "sv" ? "Ikon" : "Astaan"}</Label>
                <Input value={goalForm.icon} onChange={e => setGoalForm(f => ({ ...f, icon: e.target.value }))} placeholder="🎯" />
              </div>
              <div className="space-y-1.5">
                <Label>{language === "sv" ? "Deadline" : "Xadka waqtiga"}</Label>
                <Input type="date" value={goalForm.deadline} onChange={e => setGoalForm(f => ({ ...f, deadline: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowGoalDialog(false)}>{t("common.cancel")}</Button>
            <Button onClick={() => { if (!goalForm.title || !goalForm.targetAmount) return toast.error(language === "sv" ? "Fyll i alla fält" : "Buuxi dhammaan goobaha"); createGoal.mutate({ ...goalForm, currentAmount: goalForm.currentAmount || "0" }); }} disabled={createGoal.isPending}>{t("common.create")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
