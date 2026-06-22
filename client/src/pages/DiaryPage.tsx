import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, BookOpen, Trash2, Edit2, Lock, Heart } from "lucide-react";
import { ImageUploadField } from "@/components/ImageUploadField";

const MOODS = [
  { value: "happy", emoji: "😊", label: { sv: "Glad", so: "Faraxsan" } },
  { value: "excited", emoji: "🎉", label: { sv: "Upprymd", so: "Farxad leh" } },
  { value: "neutral", emoji: "😐", label: { sv: "Okej", so: "Caadi" } },
  { value: "sad", emoji: "😢", label: { sv: "Ledsen", so: "Murugo" } },
  { value: "tired", emoji: "😴", label: { sv: "Trött", so: "Daalan" } },
] as const;

type MoodValue = "happy" | "neutral" | "sad" | "excited" | "tired";
interface EntryForm {
  title: string;
  content: string;
  mood: MoodValue;
  entryDate: string;
  imageUrl?: string;
}

const defaultForm: EntryForm = {
  title: "", content: "", mood: "happy", entryDate: new Date().toISOString().slice(0, 10), imageUrl: ""
};

export default function DiaryPage() {
  const { t, language } = useLanguage();
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<EntryForm>(defaultForm);
  const [viewEntry, setViewEntry] = useState<number | null>(null);

  const { data: entries = [], refetch } = trpc.diary.list.useQuery();
  const createEntry = trpc.diary.create.useMutation({ onSuccess: () => { refetch(); setShowDialog(false); toast.success(language === "sv" ? "Dagboksinlägg sparat!" : "Qoraalka maalinlaha ah la keydsaday!"); } });
  const updateEntry = trpc.diary.update.useMutation({ onSuccess: () => { refetch(); setShowDialog(false); } });
  const deleteEntry = trpc.diary.delete.useMutation({ onSuccess: () => { refetch(); setViewEntry(null); } });

  const openCreate = () => { setForm(defaultForm); setEditingId(null); setShowDialog(true); };
  const openEdit = (e: typeof entries[0]) => {
    setForm({
      title: e.title ?? "",
      content: e.content,
      mood: (e.mood ?? "neutral") as MoodValue,
      entryDate: new Date(e.entryDate).toISOString().slice(0, 10),
      imageUrl: e.imageUrl ?? "",
    });
    setEditingId(e.id);
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (!form.content.trim()) return toast.error(language === "sv" ? "Skriv något" : "Wax qor");
    const data = { ...form, imageUrl: form.imageUrl || undefined };
    if (editingId) {
      updateEntry.mutate({ id: editingId, ...data });
    } else {
      createEntry.mutate(data);
    }
  };

  const getMoodConfig = (mood: string | null) => MOODS.find(m => m.value === mood) ?? MOODS[1];
  const viewingEntry = viewEntry !== null ? entries.find(e => e.id === viewEntry) : null;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">{t("nav.diary")}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{language === "sv" ? "Familjens dagbok och minnen" : "Maalinlaha qoyska iyo xusuusaha"}</p>
        </div>
        <Button onClick={openCreate} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" /> {language === "sv" ? "Nytt inlägg" : "Qoraal cusub"}
        </Button>
      </div>

      {/* Entries */}
      {entries.length === 0 ? (
        <Card className="shadow-premium border-0">
          <CardContent className="p-12 flex flex-col items-center justify-center text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-muted-foreground">{language === "sv" ? "Inga dagboksinlägg ännu" : "Wali qoraal maalinlah ma jirto"}</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={openCreate}>
              <Plus className="w-3 h-3 mr-1" /> {language === "sv" ? "Skriv ditt första inlägg" : "Qor qoraalkaaga koowaad"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {entries.map(entry => {
            const mood = getMoodConfig(entry.mood);
            return (
              <Card
                key={entry.id}
                onClick={() => setViewEntry(entry.id)}
                className="shadow-sm border-0 cursor-pointer hover:shadow-md transition-all duration-200 group overflow-hidden"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{mood.emoji}</span>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.entryDate).toLocaleDateString(language === "sv" ? "sv-SE" : "so-SO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                        </p>
                        {entry.title && <p className="font-semibold text-sm mt-0.5">{entry.title}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
  
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">{entry.content}</p>
                  <div className="flex items-center justify-between mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs text-muted-foreground">{mood.label[language]}</span>
                    <div className="flex gap-1">
                      <button onClick={(e) => { e.stopPropagation(); openEdit(entry); }} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); deleteEntry.mutate({ id: entry.id }); }} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* View Entry Dialog */}
      {viewingEntry && (
        <Dialog open={viewEntry !== null} onOpenChange={() => setViewEntry(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{getMoodConfig(viewingEntry.mood).emoji}</span>
                <div>
                  <DialogTitle>{viewingEntry.title || (language === "sv" ? "Dagboksinlägg" : "Qoraalka maalinlaha")}</DialogTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {new Date(viewingEntry.entryDate).toLocaleDateString(language === "sv" ? "sv-SE" : "so-SO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </div>
              </div>
            </DialogHeader>
            <div className="py-2">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{viewingEntry.content}</p>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={() => { setViewEntry(null); openEdit(viewingEntry); }}>
                <Edit2 className="w-3.5 h-3.5 mr-1" /> {t("common.edit")}
              </Button>
              <Button variant="destructive" size="sm" onClick={() => deleteEntry.mutate({ id: viewingEntry.id })}>
                <Trash2 className="w-3.5 h-3.5 mr-1" /> {t("common.delete")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? (language === "sv" ? "Redigera inlägg" : "Wax ka beddel qoraalka") : (language === "sv" ? "Nytt dagboksinlägg" : "Qoraal maalinlah cusub")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>{language === "sv" ? "Hur mår du idag?" : "Sidee tahay maanta?"}</Label>
              <div className="flex gap-2 flex-wrap">
                {MOODS.map(m => (
                  <button
                    key={m.value}
                    onClick={() => setForm(f => ({ ...f, mood: m.value }))}
                    className={cn("flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all hover:scale-110", form.mood === m.value ? "bg-primary/15 ring-2 ring-primary scale-110" : "hover:bg-muted")}
                  >
                    <span className="text-xl">{m.emoji}</span>
                    <span className="text-[9px] text-muted-foreground">{m.label[language]}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{language === "sv" ? "Titel (valfritt)" : "Cinwaanka (ikhtiyaari)"}</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder={language === "sv" ? "Rubrik..." : "Cinwaan..."} />
              </div>
              <div className="space-y-1.5">
                <Label>{language === "sv" ? "Datum" : "Taariikhda"}</Label>
                <Input type="date" value={form.entryDate} onChange={e => setForm(f => ({ ...f, entryDate: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{language === "sv" ? "Skriv dina tankar..." : "Qor fikiraahaaga..."}</Label>
              <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={6} placeholder={language === "sv" ? "Vad hände idag? Hur kände du dig?" : "Maxaa maanta dhacay? Sidee dareemaysay?"} />
            </div>
            <ImageUploadField
              value={form.imageUrl || ""}
              onChange={(url: string) => setForm(f => ({ ...f, imageUrl: url }))}
              label={language === "sv" ? "Bild (valfritt)" : "Sawir (opsiyonal)"}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleSubmit} disabled={createEntry.isPending || updateEntry.isPending}>
              {editingId ? t("common.save") : t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
