import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Star, Trophy, Gift, Crown, Trash2, Edit2, Sparkles } from "lucide-react";

const REWARD_EMOJIS = ["🎮","🍦","🎬","🎯","🎨","🎸","🏆","🎁","🌟","🦸","🎠","🎪","🎭","🏖","🎿","🎲","🎰","🎳","🎻","🎺"];

interface RewardForm {
  title: string;
  description: string;
  pointsCost: number;
  icon: string;
  category: string;
}

const defaultForm: RewardForm = {
  title: "", description: "", pointsCost: 10, icon: "🎁", category: "fun"
};

export default function RewardsPage() {
  const { t, language } = useLanguage();
  const [showRewardDialog, setShowRewardDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<RewardForm>(defaultForm);
  const [redeemingFor, setRedeemingFor] = useState<{ rewardId: number; rewardTitle: string } | null>(null);
  const [selectedMember, setSelectedMember] = useState<number | null>(null);

  const { data: rewards = [], refetch: refetchRewards } = trpc.rewards.list.useQuery();
  const { data: members = [] } = trpc.family.list.useQuery();
  const createReward = trpc.rewards.create.useMutation({ onSuccess: () => { refetchRewards(); setShowRewardDialog(false); toast.success(language === "sv" ? "Belöning skapad!" : "Abaalmarinta la abuuray!"); } });
  const deleteReward = trpc.rewards.delete.useMutation({ onSuccess: () => refetchRewards() });
  const unlockReward = trpc.rewards.unlock.useMutation({
    onSuccess: () => {
      refetchRewards();
      setRedeemingFor(null);
      setSelectedMember(null);
      toast.success(language === "sv" ? "Belöning inlöst! 🎉" : "Abaalmarinta la qaatay! 🎉");
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });
  const addPoints = trpc.rewards.addPoints.useMutation({ onSuccess: () => { toast.success(language === "sv" ? "Poäng tillagda!" : "Dhibcaha lagu daray!"); } });

  const children = members.filter(m => m.role === "child");

  const openCreate = () => { setForm(defaultForm); setEditingId(null); setShowRewardDialog(true); };

  const handleSubmit = () => {
    if (!form.title.trim()) return toast.error(language === "sv" ? "Ange ett namn" : "Geli magac");
    if (!selectedMember && children.length > 0) return toast.error(language === "sv" ? "Välj ett barn" : "Dooro ilmo");
    createReward.mutate({ ...form, memberId: selectedMember ?? (children[0]?.id ?? 0) });
  };

  const handleRedeem = () => {
    if (!redeemingFor || !selectedMember) return;
    unlockReward.mutate({ id: redeemingFor.rewardId, memberId: selectedMember });
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">{t("nav.rewards")}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{language === "sv" ? "Belöningar och poäng för barnen" : "Abaalmarinta iyo dhibcaha caruurta"}</p>
        </div>
        <Button onClick={openCreate} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" /> {language === "sv" ? "Ny belöning" : "Abaalmarinta cusub"}
        </Button>
      </div>

      {/* Children points leaderboard */}
      {children.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Crown className="w-4 h-4 text-amber-500" />
            {language === "sv" ? "Barnens poäng" : "Dhibcaha caruurta"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...children].sort((a, b) => (b.points ?? 0) - (a.points ?? 0)).map((child, idx) => (
              <Card key={child.id} className={cn("shadow-sm border-0 overflow-hidden", idx === 0 && "ring-2 ring-amber-400/50")}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl overflow-hidden"
                        style={{ backgroundColor: `${child.color ?? "#6366f1"}20` }}
                      >
                        {child.imageUrl ? (
                          <img src={child.imageUrl} alt={child.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{child.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      {idx === 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                          <Crown className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{child.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-lg font-bold font-display text-amber-600">{child.points ?? 0}</span>
                        <span className="text-xs text-muted-foreground">{language === "sv" ? "poäng" : "dhibco"}</span>
                      </div>
                    </div>
                    {idx < 3 && (
                      <div className="text-2xl">{["🥇","🥈","🥉"][idx]}</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Rewards catalog */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <Gift className="w-4 h-4 text-violet-500" />
          {language === "sv" ? "Belöningskatalog" : "Liiska abaalmarinta"}
        </h2>

        {rewards.length === 0 ? (
          <Card className="shadow-premium border-0">
            <CardContent className="p-12 flex flex-col items-center justify-center text-center">
              <Gift className="w-12 h-12 text-muted-foreground/40 mb-3" />
              <p className="font-medium text-muted-foreground">{language === "sv" ? "Inga belöningar ännu" : "Wali abaalmarinta ma jirto"}</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={openCreate}>
                <Plus className="w-3 h-3 mr-1" /> {language === "sv" ? "Skapa belöning" : "Samee abaalmarinta"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {rewards.map(reward => (
              <Card key={reward.id} className="shadow-sm border-0 group hover:shadow-md transition-all duration-200 overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-100 to-pink-100 dark:from-violet-900/30 dark:to-pink-900/30 flex items-center justify-center text-2xl">
                      {reward.icon ?? "🎁"}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => deleteReward.mutate({ id: reward.id })} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{reward.title}</h3>
                  {reward.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{reward.description}</p>}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-500" />
                      <span className="font-bold text-amber-600">{reward.pointsCost}</span>
                      <span className="text-xs text-muted-foreground">{language === "sv" ? "poäng" : "dhibco"}</span>
                    </div>
                    {children.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-700 dark:hover:text-violet-400 hover:border-violet-300"
                        onClick={() => setRedeemingFor({ rewardId: reward.id, rewardTitle: reward.title })}
                      >
                        <Sparkles className="w-3 h-3" />
                        {language === "sv" ? "Lös in" : "Qaado"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Redeem Dialog */}
      <Dialog open={redeemingFor !== null} onOpenChange={() => { setRedeemingFor(null); setSelectedMember(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">🎉</span>
              {language === "sv" ? "Lös in belöning" : "Qaado abaalmarinta"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-sm text-muted-foreground">
              {language === "sv" ? `Vem ska lösa in "${redeemingFor?.rewardTitle}"?` : `Cidda "${redeemingFor?.rewardTitle}" qaadanaysa?`}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {children.map(child => (
                <button
                  key={child.id}
                  onClick={() => setSelectedMember(child.id)}
                  className={cn("flex items-center gap-2 p-3 rounded-xl border-2 transition-all", selectedMember === child.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold overflow-hidden" style={{ backgroundColor: `${child.color ?? "#6366f1"}40` }}>
                    {child.imageUrl ? (
                      <img src={child.imageUrl} alt={child.name} className="w-full h-full object-cover" />
                    ) : (
                      child.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">{child.name}</p>
                    <p className="text-xs text-amber-600 flex items-center gap-0.5">
                      <Star className="w-3 h-3" /> {child.points ?? 0}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setRedeemingFor(null); setSelectedMember(null); }}>{t("common.cancel")}</Button>
            <Button onClick={handleRedeem} disabled={!selectedMember || unlockReward.isPending} className="gap-1.5">
              <Sparkles className="w-4 h-4" />
              {language === "sv" ? "Lös in!" : "Qaado!"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Reward Dialog */}
      <Dialog open={showRewardDialog} onOpenChange={setShowRewardDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{language === "sv" ? "Ny belöning" : "Abaalmarinta cusub"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>{language === "sv" ? "Ikon" : "Astaan"}</Label>
              <div className="flex gap-1.5 flex-wrap">
                {REWARD_EMOJIS.map(emoji => (
                  <button key={emoji} onClick={() => setForm(f => ({ ...f, icon: emoji }))} className={cn("w-9 h-9 rounded-xl text-xl flex items-center justify-center transition-all hover:scale-110", form.icon === emoji ? "bg-primary/20 ring-2 ring-primary scale-110" : "hover:bg-muted")}>
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{language === "sv" ? "Belöningens namn" : "Magaca abaalmarinta"}</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder={language === "sv" ? "t.ex. Extra skärmtid" : "tusaale: Wakhti dheeraad ah shaashadda"} />
            </div>
            <div className="space-y-1.5">
              <Label>{language === "sv" ? "Beskrivning" : "Sharaxaadda"}</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder={language === "sv" ? "Beskriv belöningen..." : "Sharax abaalmarinta..."} />
            </div>
            <div className="space-y-1.5">
              <Label>{language === "sv" ? `Poängkostnad: ${form.pointsCost} poäng` : `Qiimaha dhibcaha: ${form.pointsCost} dhibco`}</Label>
              <input type="range" min={1} max={100} value={form.pointsCost} onChange={e => setForm(f => ({ ...f, pointsCost: parseInt(e.target.value) }))} className="w-full accent-primary" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1</span><span>50</span><span>100</span>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowRewardDialog(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleSubmit} disabled={createReward.isPending || !form.title.trim()}>{t("common.create")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
