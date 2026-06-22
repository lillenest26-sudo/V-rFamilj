import { useState, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Image, Folder, Upload, Trash2, X, ChevronLeft, FolderOpen } from "lucide-react";

export default function PhotosPage() {
  const { t, language } = useLanguage();
  const [selectedAlbum, setSelectedAlbum] = useState<number | null>(null);
  const [showAlbumDialog, setShowAlbumDialog] = useState(false);
  const [albumForm, setAlbumForm] = useState({ name: "", description: "", coverEmoji: "📸" });
  const [uploading, setUploading] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: albums = [], refetch: refetchAlbums } = trpc.photos.albums.useQuery();
  const { data: photos = [], refetch: refetchPhotos } = trpc.photos.photos.useQuery(
    { albumId: selectedAlbum! },
    { enabled: selectedAlbum !== null }
  );
  const createAlbum = trpc.photos.createAlbum.useMutation({ onSuccess: () => { refetchAlbums(); setShowAlbumDialog(false); toast.success(language === "sv" ? "Album skapat!" : "Albamka la abuuray!"); } });
  const deleteAlbum = trpc.photos.deleteAlbum.useMutation({ onSuccess: () => { refetchAlbums(); setSelectedAlbum(null); } });
  const uploadPhoto = trpc.photos.uploadPhoto.useMutation({ onSuccess: () => refetchPhotos() });
  const deletePhoto = trpc.photos.deletePhoto.useMutation({ onSuccess: () => refetchPhotos() });

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !selectedAlbum) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 10 * 1024 * 1024) { toast.error(language === "sv" ? "Filen är för stor (max 10MB)" : "Faylku waa weyn yahay (ugu badan 10MB)"); continue; }
      const reader = new FileReader();
      await new Promise<void>((resolve) => {
        reader.onload = async (e) => {
          const dataUrl = e.target?.result as string;
          // Strip data URL prefix to get base64
          const base64 = dataUrl.split(",")[1] ?? "";
          await uploadPhoto.mutateAsync({ albumId: selectedAlbum ?? undefined, fileName: file.name, fileData: base64, mimeType: file.type, caption: "" });
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }
    setUploading(false);
    toast.success(language === "sv" ? "Bilder uppladdade!" : "Sawirrada la soo geliyay!");
  };

  const currentAlbum = (albums as Array<{id: number; name?: string; title?: string; description?: string | null; coverEmoji?: string | null; createdAt: Date}>).find(a => a.id === selectedAlbum);
  const EMOJIS = ["📸","🌅","🎉","🏖","🏔","👨‍👩‍👧‍👦","🎂","🌸","🎄","⛄","🏡","✈️","🎓","💒","🎸"];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {selectedAlbum && (
            <button onClick={() => setSelectedAlbum(null)} className="p-2 rounded-xl hover:bg-muted transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="font-display text-2xl font-bold">
              {selectedAlbum ? currentAlbum?.name : t("nav.photos")}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {selectedAlbum
                ? `${photos.length} ${language === "sv" ? "bilder" : "sawir"}`
                : (language === "sv" ? "Familjens fotoalbum" : "Albamyada sawirada qoyska")}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {selectedAlbum ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="gap-1.5"
              >
                <Upload className="w-4 h-4" />
                {uploading ? (language === "sv" ? "Laddar upp..." : "Waxaa la soo geliyaa...") : (language === "sv" ? "Ladda upp" : "Soo geli")}
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFileUpload(e.target.files)} />
              <Button variant="outline" size="sm" onClick={() => { if (confirm(language === "sv" ? "Ta bort albumet?" : "Ma tirtirtaa albamka?")) deleteAlbum.mutate({ id: selectedAlbum }); }} className="text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button onClick={() => setShowAlbumDialog(true)} size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" /> {language === "sv" ? "Nytt album" : "Album cusub"}
            </Button>
          )}
        </div>
      </div>

      {/* Albums grid */}
      {!selectedAlbum && (
        <>
          {albums.length === 0 ? (
            <Card className="shadow-premium border-0">
              <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                <Image className="w-12 h-12 text-muted-foreground/40 mb-3" />
                <p className="font-medium text-muted-foreground">{language === "sv" ? "Inga album ännu" : "Wali album ma jirto"}</p>
                <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowAlbumDialog(true)}>
                  <Plus className="w-3 h-3 mr-1" /> {language === "sv" ? "Skapa album" : "Samee album"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {albums.map(album => (
                <Card
                  key={album.id}
                  onClick={() => setSelectedAlbum(album.id)}
                  className="shadow-sm border-0 cursor-pointer hover:shadow-md transition-all duration-200 group overflow-hidden"
                >
                  <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center text-5xl group-hover:scale-105 transition-transform duration-200">
                    {(album as any).coverEmoji ?? "📸"}
                  </div>
                  <CardContent className="p-3">
                    <p className="font-semibold text-sm truncate">{(album as any).title ?? (album as any).name}</p>
                    {album.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{album.description}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(album.createdAt).toLocaleDateString(language === "sv" ? "sv-SE" : "so-SO", { year: "numeric", month: "short" })}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Photos grid */}
      {selectedAlbum && (
        <>
          {/* Drop zone */}
          <div
            className="border-2 border-dashed border-border/60 rounded-2xl p-8 text-center hover:border-primary/40 hover:bg-primary/3 transition-all cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleFileUpload(e.dataTransfer.files); }}
          >
            <Upload className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{language === "sv" ? "Klicka eller dra och släpp bilder här" : "Guji ama jiid sawirrada halkan"}</p>
          </div>

          {photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FolderOpen className="w-10 h-10 text-muted-foreground/40 mb-2" />
              <p className="text-muted-foreground text-sm">{language === "sv" ? "Albumet är tomt" : "Albamku waa madhan yahay"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {photos.map(photo => (
                <div key={photo.id} className="group relative aspect-square rounded-xl overflow-hidden bg-muted cursor-pointer" onClick={() => setLightboxPhoto(photo.url)}>
                  <img src={photo.url} alt={photo.caption ?? ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-end p-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); deletePhoto.mutate({ id: photo.id }); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto p-1.5 bg-black/50 hover:bg-red-500 text-white rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <button className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-xl transition-colors">
            <X className="w-6 h-6" />
          </button>
          <img src={lightboxPhoto} alt="" className="max-w-full max-h-full object-contain rounded-xl" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* Album Dialog */}
      <Dialog open={showAlbumDialog} onOpenChange={setShowAlbumDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{language === "sv" ? "Nytt album" : "Album cusub"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>{language === "sv" ? "Emoji" : "Astaan"}</Label>
              <div className="flex gap-1.5 flex-wrap">
                {EMOJIS.map(e => (
                  <button key={e} onClick={() => setAlbumForm(f => ({ ...f, coverEmoji: e }))} className={cn("w-9 h-9 rounded-xl text-xl flex items-center justify-center transition-all hover:scale-110", albumForm.coverEmoji === e ? "bg-primary/20 ring-2 ring-primary scale-110" : "hover:bg-muted")}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{language === "sv" ? "Albumnamn" : "Magaca albamka"}</Label>
              <Input value={albumForm.name} onChange={e => setAlbumForm(f => ({ ...f, name: e.target.value }))} placeholder={language === "sv" ? "t.ex. Sommar 2025" : "tusaale: Xagaaga 2025"} />
            </div>
            <div className="space-y-1.5">
              <Label>{language === "sv" ? "Beskrivning (valfritt)" : "Sharaxaad (ikhtiyaari)"}</Label>
              <Input value={albumForm.description} onChange={e => setAlbumForm(f => ({ ...f, description: e.target.value }))} placeholder={language === "sv" ? "Kort beskrivning..." : "Sharaxaad gaaban..."} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAlbumDialog(false)}>{t("common.cancel")}</Button>
            <Button onClick={() => { if (!albumForm.name.trim()) return toast.error(language === "sv" ? "Ange ett namn" : "Geli magac"); createAlbum.mutate({ title: albumForm.name, description: albumForm.description || undefined }); }} disabled={createAlbum.isPending}>{t("common.create")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
