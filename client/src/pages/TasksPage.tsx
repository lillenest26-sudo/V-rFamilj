import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Filter, CheckSquare, Clock, Star, AlertTriangle } from "lucide-react";
import { ImageUploadField } from "@/components/ImageUploadField";

type Priority = "low" | "medium" | "high" | "urgent";
type Status = "pending" | "in_progress" | "done";

const PRIORITY_CONFIG: Record<Priority, { color: string; label: { sv: string; so: string }; icon: React.ComponentType<{ className?: string }> }> = {
  low: { color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", label: { sv: "Låg", so: "Hoose" }, icon: CheckSquare },
  medium: { color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", label: { sv: "Medel", so: "Dhexe" }, icon: Star },
  high: { color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", label: { sv: "Hög", so: "Sare" }, icon: AlertTriangle },
  urgent: { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", label: { sv: "Brådskande", so: "Deg deg" }, icon: AlertTriangle },
};

interface TaskForm {
  title: string;
  description: string;
  priority: Priority;
  dueDate: string;
  assignedTo: string;
  category: string;
  points: string;
  imageUrl: string;
}

const defaultForm: TaskForm = {
  title: "", description: "", priority: "medium", dueDate: "", assignedTo: "", category: "", points: "0", imageUrl: ""
};

export default function TasksPage() {
  const { t, language } = useLanguage();
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<TaskForm>(defaultForm);
  const [filter, setFilter] = useState<"all" | Status>("all");

  const { data: tasks = [], refetch } = trpc.tasks.list.useQuery({});
  const { data: members = [] } = trpc.family.list.useQuery();
  const createTask = trpc.tasks.create.useMutation({ onSuccess: () => { refetch(); setShowDialog(false); toast.success(t("tasks.taskCreated")); } });
  const updateTask = trpc.tasks.update.useMutation({ onSuccess: () => { refetch(); } });
  const deleteTask = trpc.tasks.delete.useMutation({ onSuccess: () => { refetch(); toast.success(t("tasks.taskDeleted")); } });

  const filteredTasks = filter === "all" ? tasks : tasks.filter(t => t.status === filter);

  const stats = {
    total: tasks.length,
    done: tasks.filter(t => t.status === "done").length,
    pending: tasks.filter(t => t.status === "pending").length,
    inProgress: tasks.filter(t => t.status === "in_progress").length,
  };

  const openCreate = () => { setForm(defaultForm); setEditingId(null); setShowDialog(true); };
  const openEdit = (task: typeof tasks[0]) => {
    setForm({
      title: task.title,
      description: task.description ?? "",
      priority: (task.priority ?? "medium") as Priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "",
      assignedTo: task.assignedTo?.toString() ?? "",
      category: task.category ?? "",
      points: task.points?.toString() ?? "0",
      imageUrl: task.imageUrl ?? "",
    });
    setEditingId(task.id);
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (!form.title.trim()) return toast.error(t("tasks.titleRequired"));
    const data = {
      title: form.title,
      description: form.description || undefined,
      priority: form.priority,
      dueDate: form.dueDate || undefined,
      assignedTo: form.assignedTo ? parseInt(form.assignedTo) : undefined,
      category: form.category || undefined,
      points: parseInt(form.points) || 0,
      imageUrl: form.imageUrl || undefined,
    };
    if (editingId) {
      updateTask.mutate({ id: editingId, ...data });
      setShowDialog(false);
    } else {
      createTask.mutate(data);
    }
  };

  const toggleStatus = (task: typeof tasks[0]) => {
    const nextStatus: Status = task.status === "done" ? "pending" : task.status === "pending" ? "in_progress" : "done";
    updateTask.mutate({ id: task.id, status: nextStatus });
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">{t("nav.tasks")}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{t("tasks.subtitle")}</p>
        </div>
        <Button onClick={openCreate} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" /> {t("tasks.addTask")}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: language === "sv" ? "Totalt" : "Wadarta", value: stats.total, color: "text-foreground" },
          { label: language === "sv" ? "Klara" : "Dhammaatay", value: stats.done, color: "text-emerald-600" },
          { label: language === "sv" ? "Pågår" : "Socda", value: stats.inProgress, color: "text-amber-600" },
          { label: language === "sv" ? "Väntande" : "Sugaya", value: stats.pending, color: "text-muted-foreground" },
        ].map(({ label, value, color }) => (
          <Card key={label} className="shadow-sm border-0 bg-muted/30">
            <CardContent className="p-4 text-center">
              <div className={cn("text-2xl font-bold font-display", color)}>{value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-xl w-fit">
        {(["all", "pending", "in_progress", "done"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150",
              filter === f ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f === "all" ? (language === "sv" ? "Alla" : "Dhammaan") :
             f === "pending" ? (language === "sv" ? "Väntande" : "Sugaya") :
             f === "in_progress" ? (language === "sv" ? "Pågår" : "Socda") :
             (language === "sv" ? "Klara" : "Dhammaatay")}
          </button>
        ))}
      </div>

      {/* Tasks list */}
      <Card className="shadow-premium border-0">
        <CardContent className="p-4">
          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckSquare className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">{t("tasks.noTasks")}</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={openCreate}>
                <Plus className="w-3 h-3 mr-1" /> {t("tasks.addTask")}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map(task => {
                const priority = (task.priority ?? "medium") as Priority;
                const pConfig = PRIORITY_CONFIG[priority];
                const assignedMember = members.find(m => m.id === task.assignedTo);
                return (
                  <div
                    key={task.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-all duration-150 hover:shadow-sm group",
                      task.status === "done" ? "opacity-60 bg-muted/30 border-border/50" : "bg-card border-border/50 hover:border-border"
                    )}
                  >
                    {/* Status toggle */}
                    <button
                      onClick={() => toggleStatus(task)}
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                        task.status === "done" ? "bg-emerald-500 border-emerald-500" :
                        task.status === "in_progress" ? "border-amber-500 bg-amber-100 dark:bg-amber-900/30" :
                        "border-muted-foreground/40 hover:border-primary"
                      )}
                    >
                      {task.status === "done" && <CheckSquare className="w-3 h-3 text-white" />}
                      {task.status === "in_progress" && <div className="w-2 h-2 rounded-full bg-amber-500" />}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn("text-sm font-medium", task.status === "done" && "line-through text-muted-foreground")}>
                          {task.title}
                        </span>
                        <Badge className={cn("text-[10px] h-4 px-1.5 border-0", pConfig.color)}>
                          {pConfig.label[language]}
                        </Badge>
                        {task.points && task.points > 0 && (
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-primary border-primary/30">
                            ⭐ {task.points}p
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {task.dueDate && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(task.dueDate).toLocaleDateString(language === "sv" ? "sv-SE" : "so-SO", { month: "short", day: "numeric" })}
                          </span>
                        )}
                        {assignedMember && (
                          <span className="text-xs text-muted-foreground">
                            👤 {assignedMember.name}
                          </span>
                        )}
                        {task.category && (
                          <span className="text-xs text-muted-foreground">#{task.category}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(task)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteTask.mutate({ id: task.id })} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? t("tasks.editTask") : t("tasks.addTask")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>{t("common.title")}</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder={t("tasks.taskTitle")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("tasks.priority")}</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v as Priority }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(PRIORITY_CONFIG) as [Priority, typeof PRIORITY_CONFIG[Priority]][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label[language]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("tasks.dueDate")}</Label>
                <Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("tasks.assignTo")}</Label>
                <Select value={form.assignedTo} onValueChange={v => setForm(f => ({ ...f, assignedTo: v }))}>
                  <SelectTrigger><SelectValue placeholder={language === "sv" ? "Välj person" : "Dooro qof"} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">{language === "sv" ? "Ingen" : "Midna"}</SelectItem>
                    {members.map(m => <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{language === "sv" ? "Poäng (barn)" : "Dhibcaha (caruurta)"}</Label>
                <Input type="number" min="0" max="100" value={form.points} onChange={e => setForm(f => ({ ...f, points: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("tasks.category")}</Label>
              <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder={language === "sv" ? "t.ex. skola, hushåll" : "tusaale: dugsiga, guriga"} />
            </div>
            <div className="space-y-1.5">
              <ImageUploadField
                value={form.imageUrl}
                onChange={url => setForm(f => ({ ...f, imageUrl: url }))}
                label={language === "sv" ? "Bild (valfritt)" : "Sawir (opsiyonal)"}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            {editingId && (
              <Button variant="destructive" size="sm" onClick={() => { deleteTask.mutate({ id: editingId }); setShowDialog(false); }}>
                <Trash2 className="w-4 h-4 mr-1" /> {t("common.delete")}
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowDialog(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleSubmit} disabled={createTask.isPending || updateTask.isPending}>
              {editingId ? t("common.save") : t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
