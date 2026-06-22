import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Target, Trash2, Edit2, CheckCircle2, Trophy } from "lucide-react";

type GoalCategory = "health" | "education" | "finance" | "family" | "fun" | "other";

const CATEGORY_CONFIG: Record<GoalCategory, { emoji: string; label: { sv: string; so: string }; color: string }> = {
  health: { emoji: "💪", label: { sv: "Hälsa", so: "Caafimaadka" }, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" },
  education: { emoji: "📚", label: { sv: "Utbildning", so: "Waxbarashada" }, color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20" },
  finance: { emoji: "💰", label: { sv: "Ekonomi", so: "Maaliyadda" }, color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20" },
  family: { emoji: "👨‍👩‍👧‍👦", label: { sv: "Familj", so: "Qoyska" }, color: "text-pink-600 bg-pink-50 dark:bg-pink-900/20" },
  fun: { emoji: "🎉", label: { sv: "Nöje", so: "Madadaalada" }, color: "text-violet-600 bg-violet-50 dark:bg-violet-900/20" },
  other: { emoji: "🎯", label: { sv: "Övrigt", so: "Kale" }, color: "text-gray-600 bg-gray-50 dark:bg-gray-900/20" },
};

interface GoalForm {
  title: string;
  description: string;
  category: GoalCategory;
  targetDate: string;
  progress: number;
  completed: boolean;
}

const defaultForm: GoalForm = {
  title: "", description: "", category: "family", targetDate: "", progress: 0, completed: false
};

export default function GoalsPage() {
  const { t, language } = useLanguage();
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<GoalForm>(defaultForm);

  const { data: goals = [], refetch } = trpc.goals.list.useQuery();
  const createGoal = trpc.goals.create.useMutation({ onSuccess: () => { refetch(); setShowDialog(false); toast.success(language === "sv" ? "Mål skapat!" : "Hadafka la abuuray!"); } });
  const updateGoal = trpc.goals.update.useMutation({ onSuccess: () => { refetch(); setShowDialog(false); } });
  const deleteGoal = trpc.goals.delete.useMutation({ onSuccess: () => refetch() });

  const openCreate = () => { setForm(defaultForm); setEditingId(null); setShowDialog(true); };
  const openEdit = (g: typeof goals[0]) => {
    setForm({
      title: g.title,
      description: g.description ?? "",
      category: (g.category ?? "other") as GoalCategory,
      targetDate: g.targetDate ? new Date(g.targetDate).toISOString().slice(0, 10) : "",
      progress: g.progress ?? 0,
      completed: g.completed ?? false,
    });
    setEditingId(g.id);
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (!form.title.trim()) return toast.error(language === "sv" ? "Ange ett mål" : "Geli hadaf");
    if (editingId) {
      updateGoal.mutate({ id: editingId, ...form });
    } else {
      createGoal.mutate(form);
    }
  };

  const activeGoals = goals.filter(g => !g.completed);
  const completedGoals = goals.filter(g => g.completed);

  const GoalCard = ({ goal }: { goal: typeof goals[0] }) => {
    const category = (goal.category ?? "other") as GoalCategory;
    const config = CATEGORY_CONFIG[category];
    const isCompleted = goal.completed ?? false;
    return (
      <Card className={cn("shadow-sm border-0 overflow-hidden group hover:shadow-md transition-all duration-200", isCompleted && "opacity-70")}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-xl", config.color)}>
                {config.emoji}
              </div>
              <div>
                <Badge className={cn("text-[10px] h-4 px-1.5 border-0 mb-1", config.color)}>
                  {config.label[language]}
                </Badge>
                <h3 className={cn("font-semibold text-sm", isCompleted && "line-through text-muted-foreground")}>{goal.title}</h3>
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!isCompleted && (
                <button onClick={() => updateGoal.mutate({ id: goal.id, completed: true, progress: 100 })} className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-muted-foreground hover:text-emerald-600 transition-colors" title={language === "sv" ? "Markera som klar" : "Calaamadee sidii dhammaystiran"}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button onClick={() => openEdit(goal)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => deleteGoal.mutate({ id: goal.id })} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {goal.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{goal.description}</p>}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{language === "sv" ? "Framsteg" : "Horumarinta"}</span>
              <span className="font-semibold">{goal.progress ?? 0}%</span>
            </div>
            <Progress value={goal.progress ?? 0} className="h-1.5" />
          </div>

          {goal.targetDate && (
            <p className="text-xs text-muted-foreground mt-2">
              🎯 {new Date(goal.targetDate).toLocaleDateString(language === "sv" ? "sv-SE" : "so-SO", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          )}

          {isCompleted && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600 dark:text-emerald-400">
              <Trophy className="w-3.5 h-3.5" />
              <span>{language === "sv" ? "Uppnått!" : "La gaadhay!"}</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">{t("nav.goals")}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{language === "sv" ? "Familjens mål och drömmar" : "Hadafyada iyo riyooyinka qoyska"}</p>
        </div>
        <Button onClick={openCreate} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" /> {language === "sv" ? "Nytt mål" : "Hadaf cusub"}
        </Button>
      </div>

      {/* Stats */}
      {goals.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="shadow-sm border-0">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold font-display">{activeGoals.length}</p>
              <p className="text-xs text-muted-foreground">{language === "sv" ? "Aktiva mål" : "Hadafyada firfircoon"}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-0">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold font-display text-emerald-600">{completedGoals.length}</p>
              <p className="text-xs text-muted-foreground">{language === "sv" ? "Uppnådda" : "La gaadhay"}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-0">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold font-display text-amber-600">
                {activeGoals.length > 0 ? Math.round(activeGoals.reduce((s, g) => s + (g.progress ?? 0), 0) / activeGoals.length) : 0}%
              </p>
              <p className="text-xs text-muted-foreground">{language === "sv" ? "Genomsnitt" : "Celceliska"}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">{language === "sv" ? "Aktiva mål" : "Hadafyada firfircoon"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeGoals.map(g => <GoalCard key={g.id} goal={g} />)}
          </div>
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-500" />
            {language === "sv" ? "Uppnådda mål" : "Hadafyada la gaadhay"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedGoals.map(g => <GoalCard key={g.id} goal={g} />)}
          </div>
        </div>
      )}

      {goals.length === 0 && (
        <Card className="shadow-premium border-0">
          <CardContent className="p-12 flex flex-col items-center justify-center text-center">
            <Target className="w-12 h-12 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-muted-foreground">{language === "sv" ? "Inga mål ännu" : "Wali hadaf ma jirto"}</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={openCreate}>
              <Plus className="w-3 h-3 mr-1" /> {language === "sv" ? "Sätt ett mål" : "Dhig hadaf"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? (language === "sv" ? "Redigera mål" : "Wax ka beddel hadafka") : (language === "sv" ? "Nytt mål" : "Hadaf cusub")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>{language === "sv" ? "Mål" : "Hadafka"}</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder={language === "sv" ? "Vad vill ni uppnå?" : "Maxaad doonaysaan in la gaadho?"} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{language === "sv" ? "Kategori" : "Qaybta"}</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v as GoalCategory }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(CATEGORY_CONFIG) as [GoalCategory, typeof CATEGORY_CONFIG[GoalCategory]][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.emoji} {v.label[language]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{language === "sv" ? "Måldatum" : "Taariikhda hadafka"}</Label>
                <Input type="date" value={form.targetDate} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{language === "sv" ? "Beskrivning" : "Sharaxaadda"}</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder={language === "sv" ? "Beskriv målet..." : "Sharax hadafka..."} />
            </div>
            <div className="space-y-1.5">
              <Label>{language === "sv" ? `Framsteg: ${form.progress}%` : `Horumarinta: ${form.progress}%`}</Label>
              <input type="range" min={0} max={100} value={form.progress} onChange={e => setForm(f => ({ ...f, progress: parseInt(e.target.value) }))} className="w-full accent-primary" />
            </div>
            {editingId && (
              <div className="flex items-center gap-2">
                <button onClick={() => setForm(f => ({ ...f, completed: !f.completed }))} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors", form.completed ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground hover:bg-muted/80")}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {language === "sv" ? "Uppnådd" : "La gaadhay"}
                </button>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleSubmit} disabled={createGoal.isPending || updateGoal.isPending}>
              {editingId ? t("common.save") : t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
