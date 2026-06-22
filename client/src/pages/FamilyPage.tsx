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
import { Plus, Trash2, Edit2, Users, Star, Crown, Baby } from "lucide-react";
import { ImageUploadField } from "@/components/ImageUploadField";

type MemberRole = "parent" | "child";

const COLORS = ["#6366f1","#ec4899","#f59e0b","#10b981","#3b82f6","#8b5cf6","#ef4444","#06b6d4","#84cc16","#f97316"];

interface MemberForm {
  name: string;
  role: MemberRole;
  birthday: string;
  notes: string;
  color: string;
  imageUrl?: string;
}

const defaultForm: MemberForm = {
  name: "", role: "child", birthday: "", notes: "", color: "#6366f1", imageUrl: ""
};

export default function FamilyPage() {
  const { t, language } = useLanguage();
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<MemberForm>(defaultForm);

  const { data: members = [], refetch } = trpc.family.list.useQuery();
  const createMember = trpc.family.create.useMutation({ onSuccess: () => { refetch(); setShowDialog(false); toast.success(language === "sv" ? "Familjemedlem tillagd!" : "Xubin qoys ah lagu daray!"); } });
  const updateMember = trpc.family.update.useMutation({ onSuccess: () => { refetch(); setShowDialog(false); } });
  const deleteMember = trpc.family.delete.useMutation({ onSuccess: () => { refetch(); toast.success(language === "sv" ? "Borttagen" : "La tirtiraye"); } });

  const parents = members.filter(m => m.role === "parent");
  const children = members.filter(m => m.role === "child");

  const openCreate = () => { setForm(defaultForm); setEditingId(null); setShowDialog(true); };
  const openEdit = (m: typeof members[0]) => {
    setForm({
      name: m.name,
      role: (m.role ?? "child") as MemberRole,
      birthday: m.birthday ? new Date(m.birthday).toISOString().slice(0, 10) : "",
      notes: m.notes ?? "",
      color: m.color ?? "#6366f1",
      imageUrl: m.imageUrl ?? "",
    });
    setEditingId(m.id);
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return toast.error(language === "sv" ? "Ange ett namn" : "Geli magac");
    if (editingId) {
      updateMember.mutate({ id: editingId, ...form });
    } else {
      createMember.mutate(form);
    }
  };

  const getAge = (birthday: Date | string | null) => {
    if (!birthday) return null;
    const d = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
    return age;
  };

  const isBirthdaySoon = (birthday: Date | string | null) => {
    if (!birthday) return false;
    const d = new Date(birthday);
    const today = new Date();
    const next = new Date(today.getFullYear(), d.getMonth(), d.getDate());
    if (next < today) next.setFullYear(today.getFullYear() + 1);
    const diff = (next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 14;
  };

  const MemberCard = ({ member }: { member: typeof members[0] }) => {
    const age = getAge(member.birthday);
    const birthdaySoon = isBirthdaySoon(member.birthday);
    const isParent = member.role === "parent";
    return (
      <Card className="shadow-premium border-0 overflow-hidden group hover:shadow-lg transition-all duration-200">
        <div className="h-2" style={{ backgroundColor: member.color ?? "#6366f1" }} />
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {member.imageUrl ? (
              <img
                src={member.imageUrl}
                alt={member.name}
                className="w-14 h-14 rounded-2xl object-cover shadow-sm"
              />
            ) : (
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-sm text-white"
                style={{ backgroundColor: member.color ?? "#6366f1" }}
              >
                {member.name.charAt(0).toUpperCase()}
              </div>
            )}
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-lg font-display">{member.name}</h3>
                  {isParent && <Crown className="w-4 h-4 text-amber-500" />}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge
                    className={cn("text-[10px] h-4 px-1.5 border-0", isParent ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400")}
                  >
                    {isParent ? (language === "sv" ? "Förälder" : "Waalidka") : (language === "sv" ? "Barn" : "Ilmaha")}
                  </Badge>
                  {age !== null && <span className="text-xs text-muted-foreground">{age} {language === "sv" ? "år" : "jir"}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => openEdit(member)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => deleteMember.mutate({ id: member.id })} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {member.notes && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{member.notes}</p>
          )}

          {member.birthday && (
            <div className={cn("flex items-center gap-1.5 text-xs rounded-lg px-2 py-1.5", birthdaySoon ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400" : "text-muted-foreground")}>
              <span>🎂</span>
              <span>
                {new Date(member.birthday).toLocaleDateString(language === "sv" ? "sv-SE" : "so-SO", { month: "long", day: "numeric" })}
                {birthdaySoon && ` — ${language === "sv" ? "Snart!" : "Dhow!"}  🎉`}
              </span>
            </div>
          )}

          {!isParent && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Star className="w-3.5 h-3.5 text-amber-500" />
              <span>{language === "sv" ? "Poäng: " : "Dhibcaha: "}<strong className="text-foreground">{member.points ?? 0}</strong></span>
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
          <h1 className="font-display text-2xl font-bold">{t("nav.family")}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{language === "sv" ? "Familjemedlemmar och profiler" : "Xubnaha qoyska iyo xogtooda"}</p>
        </div>
        <Button onClick={openCreate} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" /> {language === "sv" ? "Lägg till" : "Ku dar"}
        </Button>
      </div>

      {/* Parents */}
      {parents.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Crown className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{language === "sv" ? "Föräldrar" : "Waalidyasha"}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {parents.map(m => <MemberCard key={m.id} member={m} />)}
          </div>
        </div>
      )}

      {/* Children */}
      {children.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Baby className="w-4 h-4 text-violet-500" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{language === "sv" ? "Barn" : "Caruurta"}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {children.map(m => <MemberCard key={m.id} member={m} />)}
          </div>
        </div>
      )}

      {members.length === 0 && (
        <Card className="shadow-premium border-0">
          <CardContent className="p-12 flex flex-col items-center justify-center text-center">
            <Users className="w-12 h-12 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-muted-foreground">{language === "sv" ? "Inga familjemedlemmar ännu" : "Wali xubin qoys ah ma jirto"}</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={openCreate}>
              <Plus className="w-3 h-3 mr-1" /> {language === "sv" ? "Lägg till familjemedlem" : "Ku dar xubin qoys ah"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? (language === "sv" ? "Redigera profil" : "Wax ka beddel xogta") : (language === "sv" ? "Ny familjemedlem" : "Xubin qoys cusub")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>{language === "sv" ? "Namn" : "Magaca"}</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={language === "sv" ? "Fullständigt namn" : "Magaca oo buuxa"} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{language === "sv" ? "Roll" : "Doorka"}</Label>
                <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v as MemberRole }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parent">{language === "sv" ? "Förälder" : "Waalidka"}</SelectItem>
                    <SelectItem value="child">{language === "sv" ? "Barn" : "Ilmaha"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{language === "sv" ? "Födelsedag" : "Maalinta dhalashada"}</Label>
                <Input type="date" value={form.birthday} onChange={e => setForm(f => ({ ...f, birthday: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{language === "sv" ? "Färg" : "Midabka"}</Label>
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
            <div className="space-y-1.5">
              <Label>{language === "sv" ? "Bio / Anteckning" : "Xog / Xusuusin"}</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder={language === "sv" ? "Kort beskrivning..." : "Sharaxaad gaaban..."} />
            </div>
            <ImageUploadField
              value={form.imageUrl || ""}
              onChange={(url: string) => setForm(f => ({ ...f, imageUrl: url }))}
              label={language === "sv" ? "Profilbild" : "Sawirka koofiyada"}
            />
          </div>
          <DialogFooter className="gap-2">
            {editingId && (
              <Button variant="destructive" size="sm" onClick={() => { deleteMember.mutate({ id: editingId }); setShowDialog(false); }}>
                <Trash2 className="w-4 h-4 mr-1" /> {t("common.delete")}
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowDialog(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleSubmit} disabled={createMember.isPending || updateMember.isPending}>
              {editingId ? t("common.save") : t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
