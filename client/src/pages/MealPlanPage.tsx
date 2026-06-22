import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, ShoppingCart, ChevronLeft, ChevronRight, Trash2, UtensilsCrossed, Edit2 } from "lucide-react";
import { ImageUploadField } from "@/components/ImageUploadField";

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

const MEAL_CONFIG: Record<MealType, { icon: string; label: { sv: string; so: string }; color: string }> = {
  breakfast: { icon: "🌅", label: { sv: "Frukost", so: "Quraac" }, color: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" },
  lunch: { icon: "☀️", label: { sv: "Lunch", so: "Qado" }, color: "bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800" },
  dinner: { icon: "🌙", label: { sv: "Middag", so: "Casho" }, color: "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800" },
  snack: { icon: "🍎", label: { sv: "Mellanmål", so: "Cunno yar" }, color: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800" },
};

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDates(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
}

export default function MealPlanPage() {
  const { t, language } = useLanguage();
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [form, setForm] = useState({
    mealType: "dinner" as MealType,
    title: "",
    description: "",
    recipe: "",
    ingredients: "",
    imageUrl: "",
  });

  const weekStartStr = weekStart.toISOString().slice(0, 10);
  const weekDates = getWeekDates(weekStart);

  const { data: meals = [], refetch } = trpc.mealPlan.list.useQuery({ weekStart: weekStartStr });
  const createMeal = trpc.mealPlan.create.useMutation({ onSuccess: () => { refetch(); setShowDialog(false); toast.success(language === "sv" ? "Måltid tillagd!" : "Cunno lagu daray!"); } });
  const updateMeal = trpc.mealPlan.update.useMutation({ onSuccess: () => { refetch(); setShowDialog(false); } });
  const deleteMeal = trpc.mealPlan.delete.useMutation({ onSuccess: () => refetch() });
  const generateShopping = trpc.mealPlan.generateShoppingList.useMutation({
    onSuccess: (data) => toast.success(language === "sv" ? `Inköpslista skapad med ${data.count} varor!` : `Liiska xididdada waxaa lagu sameeyay ${data.count} shay!`)
  });

  const dayNames = language === "sv"
    ? ["Måndag","Tisdag","Onsdag","Torsdag","Fredag","Lördag","Söndag"]
    : ["Isniin","Talaado","Arbaco","Khamiis","Jimco","Sabti","Axad"];

  const shortDayNames = language === "sv"
    ? ["Mån","Tis","Ons","Tor","Fre","Lör","Sön"]
    : ["Isn","Tal","Arb","Kha","Jim","Sab","Axd"];

  const weekLabel = `${weekDates[0].toLocaleDateString(language === "sv" ? "sv-SE" : "so-SO", { month: "short", day: "numeric" })} – ${weekDates[6].toLocaleDateString(language === "sv" ? "sv-SE" : "so-SO", { month: "short", day: "numeric", year: "numeric" })}`;

  const getMealsForDay = (dayOfWeek: number) => meals.filter(m => m.dayOfWeek === dayOfWeek);

  const openCreate = (dayOfWeek: number) => {
    setSelectedDay(dayOfWeek);
    setForm({ mealType: "dinner", title: "", description: "", recipe: "", ingredients: "", imageUrl: "" });
    setEditingId(null);
    setShowDialog(true);
  };

  const openEdit = (meal: typeof meals[0]) => {
    setSelectedDay(meal.dayOfWeek);
    setForm({
      mealType: (meal.mealType ?? "dinner") as MealType,
      title: meal.title,
      description: meal.description ?? "",
      recipe: meal.recipe ?? "",
      ingredients: Array.isArray(meal.ingredients) ? (meal.ingredients as string[]).join(", ") : "",
      imageUrl: meal.imageUrl ?? "",
    });
    setEditingId(meal.id);
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (!form.title.trim()) return toast.error(language === "sv" ? "Ange en titel" : "Geli cinwaan");
    const ingredients = form.ingredients.split(",").map(s => s.trim()).filter(Boolean);
    if (editingId) {
      updateMeal.mutate({ id: editingId, title: form.title, description: form.description, recipe: form.recipe, ingredients, imageUrl: form.imageUrl });
    } else {
      createMeal.mutate({ weekStart: weekStartStr, dayOfWeek: selectedDay, mealType: form.mealType, title: form.title, description: form.description, recipe: form.recipe, ingredients, imageUrl: form.imageUrl });
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">{t("nav.mealPlan")}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{language === "sv" ? "Planera veckans måltider" : "Qorshee cunnooyinka toddobaadka"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateShopping.mutate({ weekStart: weekStartStr })}
            disabled={generateShopping.isPending}
            className="gap-1.5"
          >
            <ShoppingCart className="w-4 h-4" />
            {language === "sv" ? "Skapa inköpslista" : "Samee liiska xididdada"}
          </Button>
        </div>
      </div>

      {/* Week navigation */}
      <div className="flex items-center gap-3">
        <button onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); }} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-medium">{weekLabel}</span>
        <button onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); }} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
        <Button size="sm" variant="ghost" onClick={() => setWeekStart(getWeekStart(new Date()))}>
          {language === "sv" ? "Denna vecka" : "Toddobaadkan"}
        </Button>
      </div>

      {/* Meal type legend */}
      <div className="flex gap-2 flex-wrap">
        {(Object.entries(MEAL_CONFIG) as [MealType, typeof MEAL_CONFIG[MealType]][]).map(([k, v]) => (
          <div key={k} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border", v.color)}>
            <span>{v.icon}</span>
            <span>{v.label[language]}</span>
          </div>
        ))}
      </div>

      {/* Weekly grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {weekDates.map((date, dayIndex) => {
          const dayMeals = getMealsForDay(dayIndex);
          const isToday = date.toDateString() === new Date().toDateString();
          return (
            <Card key={dayIndex} className={cn(
              "shadow-sm border-0 transition-all",
              isToday && "ring-2 ring-primary/30"
            )}>
              <CardHeader className="pb-2 pt-3 px-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">{shortDayNames[dayIndex]}</p>
                    <p className={cn("text-lg font-bold font-display", isToday && "text-primary")}>{date.getDate()}</p>
                  </div>
                  <button
                    onClick={() => openCreate(dayIndex)}
                    className="w-6 h-6 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-primary" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-3 space-y-1.5">
                {dayMeals.length === 0 ? (
                  <button
                    onClick={() => openCreate(dayIndex)}
                    className="w-full py-4 border-2 border-dashed border-border/50 rounded-xl text-xs text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors"
                  >
                    {language === "sv" ? "+ Lägg till" : "+ Ku dar"}
                  </button>
                ) : (
                  dayMeals.map(meal => {
                    const mtype = (meal.mealType ?? "dinner") as MealType;
                    const config = MEAL_CONFIG[mtype];
                    return (
                      <div
                        key={meal.id}
                        onClick={() => openEdit(meal)}
                        className={cn("rounded-lg border cursor-pointer hover:shadow-sm transition-all group overflow-hidden", config.color)}
                      >
                        {meal.imageUrl && (
                          <img src={meal.imageUrl} alt={meal.title} className="w-full h-12 object-cover" />
                        )}
                        <div className="p-2">
                          <div className="flex items-start justify-between gap-1">
                            <div className="min-w-0">
                              <div className="text-[10px] font-semibold text-muted-foreground">{config.icon} {config.label[language]}</div>
                              <div className="text-xs font-medium truncate mt-0.5">{meal.title}</div>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteMeal.mutate({ id: meal.id }); }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId
                ? (language === "sv" ? "Redigera måltid" : "Wax ka beddel cunada")
                : (language === "sv" ? "Lägg till måltid" : "Ku dar cunno")}
              {" — "}{dayNames[selectedDay]}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto">
            <div className="space-y-1.5">
              <Label>{language === "sv" ? "Måltidstyp" : "Nooca cuntada"}</Label>
              <Select value={form.mealType} onValueChange={v => setForm(f => ({ ...f, mealType: v as MealType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(MEAL_CONFIG) as [MealType, typeof MEAL_CONFIG[MealType]][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.icon} {v.label[language]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("common.title")}</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder={language === "sv" ? "t.ex. Pasta bolognese" : "tusaale: Baasto"} />
            </div>
            <div className="space-y-1.5">
              <Label>{language === "sv" ? "Ingredienser (kommaseparerade)" : "Sheyga (kala sooc farriimo)"}</Label>
              <Input value={form.ingredients} onChange={e => setForm(f => ({ ...f, ingredients: e.target.value }))} placeholder={language === "sv" ? "pasta, köttfärs, tomat..." : "baasto, hilib, tamaato..."} />
            </div>
            <div className="space-y-1.5">
              <Label>{language === "sv" ? "Recept (valfritt)" : "Sida lagu karsado (ikhtiyaari)"}</Label>
              <Textarea value={form.recipe} onChange={e => setForm(f => ({ ...f, recipe: e.target.value }))} rows={3} placeholder={language === "sv" ? "Skriv receptet här..." : "Halkan ku qor sida lagu karsado..."} />
            </div>
            <div className="space-y-1.5">
              <ImageUploadField
                value={form.imageUrl}
                onChange={(url) => setForm(f => ({ ...f, imageUrl: url }))}
                label={language === "sv" ? "Måltidsbild (valfritt)" : "Sawirka cunada (ikhtiyaari)"}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            {editingId && (
              <Button variant="destructive" size="sm" onClick={() => { deleteMeal.mutate({ id: editingId }); setShowDialog(false); }}>
                <Trash2 className="w-4 h-4 mr-1" /> {t("common.delete")}
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowDialog(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleSubmit} disabled={createMeal.isPending || updateMeal.isPending}>
              {editingId ? t("common.save") : t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
