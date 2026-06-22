import { useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, ShoppingCart, Check, Trash2, Sparkles, RefreshCw, ArrowRight } from "lucide-react";
import { ImageUploadField } from "@/components/ImageUploadField";

const CATEGORIES = {
  sv: ["Frukt & Grönt", "Kött & Fisk", "Mejeri", "Bröd & Spannmål", "Konserver", "Fryst", "Drycker", "Övrigt"],
  so: ["Khudaar & Miraha", "Hilib & Kalluun", "Caanaha", "Rooti & Xabooble", "Qasacadaysan", "Barafaysan", "Cabitaan", "Kale"],
};

interface ItemForm {
  name: string;
  quantity: string;
  unit: string;
  category: string;
  notes: string;
  price?: string;
  imageUrl?: string;
}

const defaultForm: ItemForm = { name: "", quantity: "1", unit: "", category: "", notes: "", price: "", imageUrl: "" };

export default function ShoppingPage() {
  const { t, language } = useLanguage();
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState<ItemForm>(defaultForm);
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);

  // Get current week start (Monday)
  const weekStart = useMemo(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  }, []);

  const { data: items = [], refetch } = trpc.shopping.list.useQuery();
  const addItem = trpc.shopping.create.useMutation({ 
    onSuccess: () => { 
      refetch(); 
      setShowDialog(false); 
      setForm(defaultForm);
      toast.success(language === "sv" ? "Vara tillagd!" : "Shayga lagu daray!"); 
    } 
  });
  const toggleItem = trpc.shopping.toggle.useMutation({ onSuccess: () => refetch() });
  const deleteItem = trpc.shopping.delete.useMutation({ onSuccess: () => refetch() });
  const generateFromMealPlan = trpc.mealPlan.generateShoppingList.useMutation({
    onSuccess: (result: { count: number }) => {
      refetch();
      setShowGenerateConfirm(false);
      toast.success(language === "sv" ? `${result.count} varor genererade från matplanen!` : `${result.count} shay ayaa laga sameeyay qorshaha cuntada!`);
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });

  const CATEGORY_MAP: Record<string, "fruit"|"vegetable"|"meat"|"dairy"|"bread"|"drink"|"other"> = {
    "Frukt & Grönt": "fruit", "Khudaar & Miraha": "fruit",
    "Kött & Fisk": "meat", "Hilib & Kalluun": "meat",
    "Mejeri": "dairy", "Caanaha": "dairy",
    "Bröd & Spannmål": "bread", "Rooti & Xabooble": "bread",
    "Konserver": "other", "Qasacadaysan": "other",
    "Fryst": "other", "Barafaysan": "other",
    "Drycker": "drink", "Cabitaan": "drink",
    "Övrigt": "other", "Kale": "other",
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return toast.error(language === "sv" ? "Ange ett namn" : "Geli magac");
    addItem.mutate({ 
      name: form.name, 
      quantity: form.quantity || undefined, 
      category: CATEGORY_MAP[form.category] ?? "other",
      imageUrl: form.imageUrl
    });
  };

  // Split items into two sections
  const needToBuy = items.filter(i => !i.bought);
  const atHome = items.filter(i => i.bought);

  const categories = CATEGORIES[language as keyof typeof CATEGORIES] ?? CATEGORIES.sv;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">{t("nav.shopping")}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {language === "sv" ? `${needToBuy.length} varor kvar att handla, ${atHome.length} finns hemma` : `${needToBuy.length} shay oo hadhay in la gato, ${atHome.length} ayaa guriga jira`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowGenerateConfirm(true)} className="gap-1.5">
            <Sparkles className="w-4 h-4" />
            {language === "sv" ? "Från matplan" : "Qorshaha cuntada"}
          </Button>
          <Button size="sm" onClick={() => setShowDialog(true)} className="gap-1.5">
            <Plus className="w-4 h-4" />
            {language === "sv" ? "Lägg till vara" : "Ku dar shay"}
          </Button>
        </div>
      </div>

      {/* Two-Section Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 1: BEHÖVER KÖPAS (Need to Buy) */}
        <Card className="border-2 border-amber-200 dark:border-amber-900/30">
          <CardHeader className="bg-amber-50 dark:bg-amber-900/10">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingCart className="w-5 h-5 text-amber-600" />
              {language === "sv" ? "Behöver köpas" : "Waa inoo baahan"}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {language === "sv" ? `${needToBuy.length} varor` : `${needToBuy.length} shay`}
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            {needToBuy.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="w-12 h-12 mx-auto opacity-20 mb-2" />
                <p className="text-sm">{language === "sv" ? "Ingen vara att handla" : "Waxba oo gatin la'aan"}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {needToBuy.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                  >
                    <button
                      onClick={() => toggleItem.mutate({ id: item.id, bought: true })}
                      className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors flex items-center justify-center"
                    >
                      {/* Unchecked circle */}
                    </button>
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      {item.quantity && (
                        <p className="text-xs text-muted-foreground">{item.quantity}</p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteItem.mutate({ id: item.id })}
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* SECTION 2: FINNS HEMMA (At Home) */}
        <Card className="border-2 border-green-200 dark:border-green-900/30">
          <CardHeader className="bg-green-50 dark:bg-green-900/10">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Check className="w-5 h-5 text-green-600" />
              {language === "sv" ? "Finns hemma" : "Guriga jira"}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {language === "sv" ? `${atHome.length} varor` : `${atHome.length} shay`}
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            {atHome.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Check className="w-12 h-12 mx-auto opacity-20 mb-2" />
                <p className="text-sm">{language === "sv" ? "Inga varor hemma" : "Waxba oo guriga jira'aan"}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {atHome.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/10 hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors group"
                  >
                    <button
                      onClick={() => toggleItem.mutate({ id: item.id, bought: false })}
                      className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center"
                    >
                      <Check className="w-4 h-4 text-white" />
                    </button>
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded object-cover flex-shrink-0 opacity-50" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate line-through text-muted-foreground">{item.name}</p>
                      {item.quantity && (
                        <p className="text-xs text-muted-foreground">{item.quantity}</p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteItem.mutate({ id: item.id })}
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Item Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === "sv" ? "Lägg till vara" : "Ku dar shay"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">{language === "sv" ? "Namn" : "Magac"}</Label>
              <Input
                id="name"
                placeholder={language === "sv" ? "T.ex. Mjölk" : "T.ex. Caano"}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="quantity">{language === "sv" ? "Antal" : "Tirada"}</Label>
                <Input
                  id="quantity"
                  placeholder="1"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="category">{language === "sv" ? "Kategori" : "Qaybka"}</Label>
                <Select value={form.category} onValueChange={(val) => setForm({ ...form, category: val })}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder={language === "sv" ? "Välj" : "Dooro"} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="notes">{language === "sv" ? "Anteckning (valfritt)" : "Xusuusta (ikhtiyaari)"}</Label>
              <Input
                id="notes"
                placeholder={language === "sv" ? "T.ex. ekologisk" : "T.ex. asli"}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <ImageUploadField
              value={form.imageUrl || ""}
              onChange={(url: string) => setForm({ ...form, imageUrl: url })}
              label={language === "sv" ? "Produktbild (valfritt)" : "Sawirka alaabta (ikhtiyaari)"}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              {language === "sv" ? "Avbryt" : "Jooji"}
            </Button>
            <Button onClick={handleSubmit} disabled={addItem.isPending}>
              {addItem.isPending ? "..." : (language === "sv" ? "Lägg till" : "Ku dar")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate from Meal Plan Confirmation */}
      <Dialog open={showGenerateConfirm} onOpenChange={setShowGenerateConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === "sv" ? "Generera från matplan?" : "Samee laga qorshaha cuntada?"}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {language === "sv" ? "Detta kommer att lägga till alla ingredienser från denna veckas matplan till inköpslistan." : "Tani waxay ku darti doontaa dhammaan waxyaabaha laga sameeya qorshaha cuntada ee toddobaadkan."}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateConfirm(false)}>
              {language === "sv" ? "Avbryt" : "Jooji"}
            </Button>
            <Button onClick={() => generateFromMealPlan.mutate({ weekStart })} disabled={generateFromMealPlan.isPending}>
              {generateFromMealPlan.isPending ? "..." : (language === "sv" ? "Generera" : "Samee")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
