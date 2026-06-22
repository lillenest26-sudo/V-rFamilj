import { useState, useRef } from "react";
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
import { FileText, Upload, Trash2, Download, Lock, Shield, Search, FolderOpen } from "lucide-react";

type DocCategory = "id" | "medical" | "school" | "insurance" | "financial" | "other";

const CATEGORY_CONFIG: Record<DocCategory, { icon: string; label: { sv: string; so: string }; color: string }> = {
  id: { icon: "🪪", label: { sv: "ID-dokument", so: "Aqoonsiga" }, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  medical: { icon: "🏥", label: { sv: "Medicinska", so: "Caafimaadka" }, color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  school: { icon: "🏫", label: { sv: "Skola", so: "Dugsiga" }, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  insurance: { icon: "🛡️", label: { sv: "Försäkring", so: "Caymiska" }, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  financial: { icon: "💰", label: { sv: "Ekonomi", so: "Maaliyadda" }, color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
  other: { icon: "📄", label: { sv: "Övrigt", so: "Kale" }, color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400" },
};

export default function DocumentsPage() {
  const { t, language } = useLanguage();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<DocCategory | "all">("all");
  const [uploading, setUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadForm, setUploadForm] = useState({ name: "", category: "other" as DocCategory, tags: "" });
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: documents = [], refetch } = trpc.documents.list.useQuery({});
  const uploadDoc = trpc.documents.upload.useMutation({ onSuccess: () => { refetch(); setShowUploadDialog(false); setPendingFile(null); toast.success(language === "sv" ? "Dokument uppladdat!" : "Dukumiintigii la soo geliyay!"); } });
  const deleteDoc = trpc.documents.delete.useMutation({ onSuccess: () => { refetch(); toast.success(language === "sv" ? "Borttaget" : "La tirtiraye"); } });
  
  // Map folder to category for display
  const folderToCategory = (folder: string | null): DocCategory => {
    const map: Record<string, DocCategory> = { id: "id", medical: "medical", school: "school", insurance: "insurance", financial: "financial" };
    return map[folder ?? ""] ?? "other";
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.size > 20 * 1024 * 1024) { toast.error(language === "sv" ? "Filen är för stor (max 20MB)" : "Faylku waa weyn yahay (ugu badan 20MB)"); return; }
    setPendingFile(file);
    setUploadForm(f => ({ ...f, name: file.name.replace(/\.[^/.]+$/, "") }));
    setShowUploadDialog(true);
  };

  const handleUpload = async () => {
    if (!pendingFile) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(",")[1] ?? "";
      await uploadDoc.mutateAsync({
        title: uploadForm.name || pendingFile.name,
        folder: uploadForm.category,
        description: uploadForm.tags || undefined,
        fileData: base64,
        fileName: pendingFile.name,
        mimeType: pendingFile.type,
        size: pendingFile.size,
      });
      setUploading(false);
    };
    reader.readAsDataURL(pendingFile);
  };

  const filtered = documents.filter(doc => {
    const matchesSearch = !search || doc.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || folderToCategory(doc.folder) === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getFileIcon = (mimeType: string | null) => {
    if (!mimeType) return "📄";
    if (mimeType.includes("pdf")) return "📕";
    if (mimeType.includes("image")) return "🖼️";
    if (mimeType.includes("word") || mimeType.includes("document")) return "📝";
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "📊";
    return "📄";
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold">{t("nav.documents")}</h1>
            <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
              <Shield className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">{language === "sv" ? "Säkert" : "Ammaan"}</span>
            </div>
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">{language === "sv" ? "Säker förvaring av viktiga dokument" : "Kaydinta ammaan ee dukumiintiyada muhiimka ah"}</p>
        </div>
        <Button onClick={() => fileInputRef.current?.click()} size="sm" className="gap-1.5">
          <Upload className="w-4 h-4" /> {language === "sv" ? "Ladda upp" : "Soo geli"}
        </Button>
        <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp" className="hidden" onChange={e => handleFileSelect(e.target.files)} />
      </div>

      {/* Security notice */}
      <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
        <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <p className="text-xs text-emerald-700 dark:text-emerald-400">
          {language === "sv"
            ? "Alla dokument är krypterade och säkert lagrade. Endast du och din familj har tillgång."
            : "Dhammaan dukumiintiyadu waa la xidid oo si ammaan ah ayaa loo kaydiyay. Adiga iyo qoyskaaga oo kaliya ayaa heli kara."}
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={language === "sv" ? "Sök dokument..." : "Raadi dukumiinti..."} className="pl-9" />
        </div>
        <Select value={categoryFilter} onValueChange={v => setCategoryFilter(v as DocCategory | "all")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === "sv" ? "Alla kategorier" : "Dhammaan qaybaha"}</SelectItem>
            {(Object.entries(CATEGORY_CONFIG) as [DocCategory, typeof CATEGORY_CONFIG[DocCategory]][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.icon} {v.label[language]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category stats */}
      <div className="flex gap-2 flex-wrap">
        {(Object.entries(CATEGORY_CONFIG) as [DocCategory, typeof CATEGORY_CONFIG[DocCategory]][]).map(([k, v]) => {
          const count = documents.filter(d => folderToCategory(d.folder) === k).length;
          if (count === 0) return null;
          return (
            <button key={k} onClick={() => setCategoryFilter(categoryFilter === k ? "all" : k)} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all", v.color, categoryFilter === k && "ring-2 ring-offset-1 ring-current")}>
              <span>{v.icon}</span>
              <span>{v.label[language]}</span>
              <span className="font-bold">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Documents list */}
      <Card className="shadow-premium border-0">
        <CardContent className="p-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderOpen className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">{documents.length === 0 ? (language === "sv" ? "Inga dokument ännu" : "Wali dukumiinti ma jirto") : (language === "sv" ? "Inga dokument matchar sökningen" : "Dukumiinti ku habboon raadinta kuma jirto")}</p>
              {documents.length === 0 && (
                <Button size="sm" variant="outline" className="mt-3" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-3 h-3 mr-1" /> {language === "sv" ? "Ladda upp dokument" : "Soo geli dukumiinti"}
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(doc => {
                const category = folderToCategory(doc.folder);
                const config = CATEGORY_CONFIG[category];
                return (
                  <div key={doc.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group">
                    <div className="text-2xl flex-shrink-0">{getFileIcon(doc.mimeType)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium truncate">{doc.title}</p>
                        <Badge className={cn("text-[10px] h-4 px-1.5 border-0", config.color)}>
                          {config.icon} {config.label[language]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                        <span>{new Date(doc.createdAt).toLocaleDateString(language === "sv" ? "sv-SE" : "so-SO", { year: "numeric", month: "short", day: "numeric" })}</span>
                        {doc.size && <span>{formatFileSize(doc.size)}</span>}
                        {doc.description && <span className="truncate max-w-[200px]">{doc.description}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      <button onClick={() => deleteDoc.mutate({ id: doc.id })} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
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

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{language === "sv" ? "Ladda upp dokument" : "Soo geli dukumiinti"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {pendingFile && (
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{pendingFile.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(pendingFile.size)}</p>
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>{language === "sv" ? "Dokumentnamn" : "Magaca dukumiintiga"}</Label>
              <Input value={uploadForm.name} onChange={e => setUploadForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>{language === "sv" ? "Kategori" : "Qaybta"}</Label>
              <Select value={uploadForm.category} onValueChange={v => setUploadForm(f => ({ ...f, category: v as DocCategory }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(CATEGORY_CONFIG) as [DocCategory, typeof CATEGORY_CONFIG[DocCategory]][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.icon} {v.label[language]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{language === "sv" ? "Taggar (kommaseparerade)" : "Calaamadaha (kala sooc farriimo)"}</Label>
              <Input value={uploadForm.tags} onChange={e => setUploadForm(f => ({ ...f, tags: e.target.value }))} placeholder={language === "sv" ? "t.ex. pass, 2025" : "tusaale: baasaboor, 2025"} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowUploadDialog(false); setPendingFile(null); }}>{t("common.cancel")}</Button>
            <Button onClick={handleUpload} disabled={uploading || uploadDoc.isPending}>
              {uploading ? (language === "sv" ? "Laddar upp..." : "Waxaa la soo geliyaa...") : (language === "sv" ? "Ladda upp" : "Soo geli")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
