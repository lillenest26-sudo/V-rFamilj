import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Send, Bot, User, Sparkles, Trash2, RotateCcw } from "lucide-react";
import { Streamdown } from "streamdown";

const QUICK_PROMPTS = {
  sv: [
    "Ge mig idéer för veckans middag",
    "Hur kan vi spara mer pengar?",
    "Aktiviteter för hela familjen",
    "Tips för barnens läxor",
    "Planera en familjehelg",
  ],
  so: [
    "Ii sii fikrado casho toddobaadlaha",
    "Sideen u kaydin karaa lacag badan?",
    "Hawlaha qoyska oo dhan",
    "Talooyinka waxbarashada caruurta",
    "Qorsheynta fasaxa qoyska",
  ],
};

export default function AIAssistantPage() {
  const { t, language } = useLanguage();
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: history = [], refetch } = trpc.ai.history.useQuery();
  const sendMessage = trpc.ai.chat.useMutation({
    onSuccess: () => { refetch(); setIsStreaming(false); },
    onError: (err: { message: string }) => { toast.error(err.message); setIsStreaming(false); },
  });
  const clearHistory = trpc.ai.clearHistory.useMutation({ onSuccess: () => refetch() });

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [history]);

  const handleSend = (msg?: string) => {
    const text = (msg ?? input).trim();
    if (!text || isStreaming) return;
    setInput("");
    setIsStreaming(true);
    sendMessage.mutate({ message: text, language });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const quickPrompts = QUICK_PROMPTS[language as keyof typeof QUICK_PROMPTS] ?? QUICK_PROMPTS.sv;

  return (
    <div className="p-4 md:p-6 lg:p-8 h-full flex flex-col gap-4 animate-fade-in" style={{ height: "calc(100vh - 4rem)" }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold">{t("nav.assistant")}</h1>
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">{language === "sv" ? "Din personliga familjeassistent" : "Kaaliyahaaga qoyska ee shakhsiga ah"}</p>
        </div>
        {history.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => clearHistory.mutate()} className="gap-1.5 text-muted-foreground">
            <Trash2 className="w-3.5 h-3.5" />
            {language === "sv" ? "Rensa" : "Nadiifi"}
          </Button>
        )}
      </div>

      {/* Messages */}
      <Card className="shadow-premium border-0 flex-1 overflow-hidden flex flex-col min-h-0">
        <CardContent className="p-0 flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {history.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-pink-100 dark:from-violet-900/30 dark:to-pink-900/30 flex items-center justify-center text-3xl mb-4">
                  🤖
                </div>
                <h3 className="font-semibold text-lg font-display mb-1">{language === "sv" ? "Hej! Jag är din familjeassistent" : "Salaan! Waxaan ahay kaaliyahaaga qoyska"}</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {language === "sv"
                    ? "Jag kan hjälpa dig med matplanering, budgetering, aktiviteter och mycket mer."
                    : "Waxaan kaa caawin karaa qorshaha cuntada, miisaaniyada, hawlaha iyo wax badan oo kale."}
                </p>

                {/* Quick prompts */}
                <div className="mt-6 flex flex-col gap-2 w-full max-w-sm">
                  {quickPrompts.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(prompt)}
                      className="text-left px-4 py-2.5 rounded-xl bg-muted/60 hover:bg-muted text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(history as Array<{id: number; role: string; content: string; createdAt: Date}>).map((msg, i) => (
              <div key={msg.id ?? i} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={cn("max-w-[80%] rounded-2xl px-4 py-3 text-sm", msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted rounded-tl-sm")}>
                  {msg.role === "assistant" ? (
                    <Streamdown>{msg.content}</Streamdown>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                  <p className={cn("text-[10px] mt-1", msg.role === "user" ? "text-primary-foreground/60 text-right" : "text-muted-foreground")}>
                    {new Date(msg.createdAt).toLocaleTimeString(language === "sv" ? "sv-SE" : "so-SO", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}

            {isStreaming && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1 items-center h-5">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border/50 p-4">
            {history.length > 0 && (
              <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                {quickPrompts.slice(0, 3).map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(prompt)}
                    className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={language === "sv" ? "Skriv ett meddelande..." : "Qor fariin..."}
                disabled={isStreaming}
                className="flex-1"
              />
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || isStreaming}
                size="icon"
                className="bg-gradient-to-br from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 border-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
