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
import { toast } from "sonner";
import { Plus, Bell, Trash2, Check, AlertCircle, Info } from "lucide-react";
import { ImageUploadField } from "@/components/ImageUploadField";

type ReminderType = "normal" | "important" | "urgent";

const TYPE_CONFIG: Record<ReminderType, { color: string; bg: string; icon: React.ComponentType<{ className?: string }>; label: { sv: string; so: string } }> = {
  normal: { color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800", icon: Info, label: { sv: "Normal", so: "Caadi" } },
  important: { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800", icon: AlertCircle, label: { sv: "Viktig", so: "Muhiim" } },
  urgent: { color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800", icon: Bell, label: { sv: "Brådskande", so: "Deg deg" } },
};

export default function RemindersPage() {
  const { t, language } = useLanguage();
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", remindAt: "", type: "normal" as ReminderType, imageUrl: "" });

  const { data: reminders = [], refetch } = trpc.reminders.list.useQuery();
  const createReminder = trpc.reminders.create.useMutation({ onSuccess: () => { refetch(); setShowDialog(false); toast.success(t("reminders.created")); } });
  const updateReminder = trpc.reminders.update.useMutation({ onSuccess: () => refetch() });
  const deleteReminder = trpc.reminders.delete.useMutation({ onSuccess: () => { refetch(); toast.success(t("reminders.deleted")); } });

  const now = new Date();
  const today = reminders.filter(r => {
    const d = new Date(r.remindAt);
    return d.toDateString() === now.toDateString();
  });
  const upcoming = reminders.filter(r => {
    const d = new Date(r.remindAt);
    return d > now && d.toDateString() !== now.toDateString();
  });
  const past = reminders.filter(r => new Date(r.remindAt) < now && r.remindAt.toString() !== now.toDateString());

  const handleSubmit = () => {
    if (!form.title.trim()) return toast.error(t("reminders.titleRequired"));
    if (!form.remindAt) return toast.error(t("reminders.timeRequired"));
    const data = { ...form, imageUrl: form.imageUrl || undefined };
    createReminder.mutate(data);
  };

  const ReminderItem = ({ reminder }: { reminder: typeof reminders[0] }) => {
    const type = (reminder.type ?? "normal") as ReminderType;
    const config = TYPE_CONFIG[type];
    const Icon = config.icon;
    return (
      <div className={cn("flex items-center gap-3 p-3 rounded-xl border transition-all group", config.bg, reminder.done && "opacity-50")}>
        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0", `bg-${type === "normal" ? "blue" : type === "important" ? "amber" : "red"}-100 dark:bg-${type === "normal" ? "blue" : type === "important" ? "amber" : "red"}-900/30`)}>
          <Icon className={cn("w-4 h-4", config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-medium", reminder.done && "line-through")}>{reminder.title}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(reminder.remindAt).toLocaleDateString(language === "sv" ? "sv-SE" : "so-SO", {
              weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
            })}
          </p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!reminder.done && (
            <button onClick={() => updateReminder.mutate({ id: reminder.id, done: true })} className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-muted-foreground hover:text-emerald-600 transition-colors">
              <Check className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={() => deleteReminder.mutate({ id: reminder.id })} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">{t("nav.reminders")}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{language === "sv" ? "Håll koll på viktiga saker" : "La sooc waxyaabaha muhiimka ah"}</p>
        </div>
        <Button onClick={() => setShowDialog(true)} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" /> {t("reminders.addReminder")}
        </Button>
      </div>

      {/* Today */}
      {today.length > 0 && (
        <Card className="shadow-premium border-0">
          <CardHeader className="pb-3 pt-4 px-5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              {language === "sv" ? "Idag" : "Maanta"} ({today.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-2">
            {today.map(r => <ReminderItem key={r.id} reminder={r} />)}
          </CardContent>
        </Card>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <Card className="shadow-premium border-0">
          <CardHeader className="pb-3 pt-4 px-5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              {language === "sv" ? "Kommande" : "Soo socda"} ({upcoming.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-2">
            {upcoming.map(r => <ReminderItem key={r.id} reminder={r} />)}
          </CardContent>
        </Card>
      )}

      {reminders.length === 0 && (
        <Card className="shadow-premium border-0">
          <CardContent className="p-12 flex flex-col items-center justify-center text-center">
            <Bell className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">{t("reminders.noReminders")}</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowDialog(true)}>
              <Plus className="w-3 h-3 mr-1" /> {t("reminders.addReminder")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("reminders.addReminder")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>{t("common.title")}</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder={language === "sv" ? "Påminnelsens titel" : "Cinwaanka xusuuska"} />
            </div>
            <div className="space-y-1.5">
              <Label>{language === "sv" ? "Tid" : "Waqtiga"}</Label>
              <Input type="datetime-local" value={form.remindAt} onChange={e => setForm(f => ({ ...f, remindAt: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>{language === "sv" ? "Typ" : "Nooca"}</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as ReminderType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(TYPE_CONFIG) as [ReminderType, typeof TYPE_CONFIG[ReminderType]][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label[language]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ImageUploadField
              value={form.imageUrl || ""}
              onChange={(url: string) => setForm(f => ({ ...f, imageUrl: url }))}
              label={language === "sv" ? "Bild (valfritt)" : "Sawir (opsiyonal)"}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleSubmit} disabled={createReminder.isPending}>{t("common.create")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
