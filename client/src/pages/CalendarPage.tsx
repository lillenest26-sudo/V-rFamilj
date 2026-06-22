import { useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { PullToRefresh } from "@/components/PullToRefresh";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  ChevronLeft, ChevronRight, Plus, Calendar, Clock, MapPin,
  Repeat, Trash2, Edit2, X
} from "lucide-react";
import { ImageUploadField } from "@/components/ImageUploadField";

const COLORS = ["#6366f1","#ec4899","#f59e0b","#10b981","#3b82f6","#8b5cf6","#ef4444","#06b6d4"];

const CATEGORY_ICONS: Record<string, string> = {
  general: "📅", birthday: "🎂", school: "🏫", work: "💼",
  health: "🏥", sport: "⚽", family: "👨‍👩‍👧‍👦", holiday: "🌴"
};

type RecurrenceType = "none" | "daily" | "weekly" | "monthly" | "yearly";

interface EventForm {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  color: string;
  location: string;
  category: string;
  recurrence: RecurrenceType;
  imageUrl?: string;
}

const defaultForm: EventForm = {
  title: "", description: "", startTime: "", endTime: "",
  allDay: false, color: "#6366f1", location: "", category: "general", recurrence: "none" as RecurrenceType,
  imageUrl: ""
};

export default function CalendarPage() {
  const { t, language } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week">("month");
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<EventForm>(defaultForm);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { data: events = [], refetch } = trpc.calendar.listAll.useQuery({});
  const createEvent = trpc.calendar.create.useMutation({ onSuccess: () => { refetch(); setShowDialog(false); toast.success(t("calendar.eventCreated")); } });
  const updateEvent = trpc.calendar.update.useMutation({ onSuccess: () => { refetch(); setShowDialog(false); toast.success(t("calendar.eventUpdated")); } });
  const deleteEvent = trpc.calendar.delete.useMutation({ onSuccess: () => { refetch(); toast.success(t("calendar.eventDeleted")); } });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const monthName = currentDate.toLocaleDateString(language === "sv" ? "sv-SE" : "so-SO", { month: "long", year: "numeric" });

  const eventsByDate = useMemo(() => {
    const map: Record<string, typeof events> = {};
    for (const event of events) {
      const d = new Date(event.startTime);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(event);
    }
    return map;
  }, [events]);

  const dayNames = language === "sv"
    ? ["Mån","Tis","Ons","Tor","Fre","Lör","Sön"]
    : ["Isn","Tal","Arb","Kha","Jim","Sab","Axd"];

  const openCreate = (date?: Date) => {
    const d = date ?? new Date();
    const dateStr = d.toISOString().slice(0, 16);
    setForm({ ...defaultForm, startTime: dateStr, endTime: dateStr });
    setEditingId(null);
    setShowDialog(true);
  };

  const openEdit = (event: typeof events[0]) => {
    setForm({
      title: event.title,
      description: event.description ?? "",
      startTime: new Date(event.startTime).toISOString().slice(0, 16),
      endTime: event.endTime ? new Date(event.endTime).toISOString().slice(0, 16) : "",
      allDay: event.allDay ?? false,
      color: event.color ?? "#6366f1",
      location: event.location ?? "",
      category: event.category ?? "general",
      recurrence: (event.recurrence ?? "none") as RecurrenceType,
    });
    setEditingId(event.id);
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (!form.title.trim()) return toast.error(t("calendar.titleRequired"));
    if (!form.startTime) return toast.error(t("calendar.startRequired"));
    if (editingId) {
      updateEvent.mutate({ id: editingId, ...form });
    } else {
      createEvent.mutate(form);
    }
  };

  const today = new Date();

  const handleRefresh = async () => {
    await refetch();
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="p-4 md:p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">{t("nav.calendar")}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{t("calendar.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-border overflow-hidden">
            <button
              onClick={() => setView("month")}
              className={cn("px-3 py-1.5 text-sm font-medium transition-colors", view === "month" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
            >
              {language === "sv" ? "Månad" : "Bil"}
            </button>
            <button
              onClick={() => setView("week")}
              className={cn("px-3 py-1.5 text-sm font-medium transition-colors", view === "week" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
            >
              {language === "sv" ? "Vecka" : "Toddobaad"}
            </button>
          </div>
          <Button onClick={() => openCreate()} size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" /> {t("calendar.addEvent")}
          </Button>
        </div>
      </div>

      <Card className="shadow-premium border-0">
        {/* Navigation */}
        <CardHeader className="pb-0 pt-4 px-5">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              className="p-2 rounded-xl hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="font-display text-lg font-semibold capitalize">{monthName}</h2>
            <button
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              className="p-2 rounded-xl hover:bg-muted transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {dayNames.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells */}
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[80px] rounded-xl" />
            ))}
            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
              const key = `${year}-${month}-${day}`;
              const dayEvents = eventsByDate[key] ?? [];
              const cellDate = new Date(year, month, day);

              return (
                <div
                  key={day}
                  onClick={() => openCreate(cellDate)}
                  className={cn(
                    "min-h-[80px] rounded-xl p-1.5 cursor-pointer transition-all duration-150 hover:bg-muted/60 group",
                    isToday && "ring-2 ring-primary ring-offset-1 ring-offset-card bg-primary/5"
                  )}
                >
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium mb-1 transition-colors",
                    isToday ? "bg-primary text-primary-foreground" : "group-hover:bg-muted text-foreground"
                  )}>
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map(event => (
                      <div
                        key={event.id}
                        onClick={(e) => { e.stopPropagation(); openEdit(event); }}
                        className="text-[10px] px-1.5 py-0.5 rounded-md truncate font-medium text-white cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: event.color ?? "#6366f1" }}
                      >
                        {CATEGORY_ICONS[event.category ?? "general"]} {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[10px] text-muted-foreground px-1">+{dayEvents.length - 3}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events List */}
      {events.length > 0 && (
        <Card className="shadow-premium border-0">
          <CardHeader className="pb-3 pt-4 px-5">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {language === "sv" ? "Kommande händelser" : "Dhacdooyinka soo socda"}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="space-y-2">
              {events.slice(0, 8).map(event => (
                <div key={event.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: event.color ?? "#6366f1" }} />
                  <div className="text-lg">{CATEGORY_ICONS[event.category ?? "general"]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{event.title}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(event.startTime).toLocaleDateString(language === "sv" ? "sv-SE" : "so-SO", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </span>
                      )}
                      {event.recurrence !== "none" && (
                        <span className="flex items-center gap-1">
                          <Repeat className="w-3 h-3" />
                          {event.recurrence}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(event)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteEvent.mutate({ id: event.id })} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Event Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? t("calendar.editEvent") : t("calendar.addEvent")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>{t("common.title")}</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder={t("calendar.eventTitle")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("calendar.startTime")}</Label>
                <Input type="datetime-local" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("calendar.endTime")}</Label>
                <Input type="datetime-local" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>{t("calendar.allDay")}</Label>
              <Switch checked={form.allDay} onCheckedChange={v => setForm(f => ({ ...f, allDay: v }))} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("calendar.location")}</Label>
              <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder={t("calendar.locationPlaceholder")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("calendar.category")}</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_ICONS).map(([k, icon]) => (
                      <SelectItem key={k} value={k}>{icon} {k}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("calendar.recurrence")}</Label>
                <Select value={form.recurrence} onValueChange={v => setForm(f => ({ ...f, recurrence: v as RecurrenceType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{language === "sv" ? "Ingen" : "Midna"}</SelectItem>
                    <SelectItem value="daily">{language === "sv" ? "Daglig" : "Maalinle"}</SelectItem>
                    <SelectItem value="weekly">{language === "sv" ? "Veckovis" : "Toddobaadlaha"}</SelectItem>
                    <SelectItem value="monthly">{language === "sv" ? "Månadsvis" : "Bilaha"}</SelectItem>
                    <SelectItem value="yearly">{language === "sv" ? "Årlig" : "Sannadlaha"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("calendar.color")}</Label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setForm(f => ({ ...f, color: c }))}
                    className={cn("w-7 h-7 rounded-full transition-transform hover:scale-110", form.color === c && "ring-2 ring-offset-2 ring-foreground scale-110")}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <ImageUploadField
              value={form.imageUrl || ""}
              onChange={(url: string) => setForm(f => ({ ...f, imageUrl: url }))}
              label={language === "sv" ? "Händelsebild (valfritt)" : "Sawirka dhacdooyinka (ikhtiyaari)"}
            />
          </div>
          <DialogFooter className="gap-2">
            {editingId && (
              <Button variant="destructive" size="sm" onClick={() => { deleteEvent.mutate({ id: editingId }); setShowDialog(false); }}>
                <Trash2 className="w-4 h-4 mr-1" /> {t("common.delete")}
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowDialog(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleSubmit} disabled={createEvent.isPending || updateEvent.isPending}>
              {editingId ? t("common.save") : t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </PullToRefresh>
  );
}
