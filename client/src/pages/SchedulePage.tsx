import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 06:00 - 23:00

const CATEGORY_ICONS: Record<string, string> = {
  general: "📅", birthday: "🎂", school: "🏫", work: "💼",
  health: "🏥", sport: "⚽", family: "👨‍👩‍👧‍👦", holiday: "🌴"
};

function getWeekDates(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return Array.from({ length: 7 }, (_, i) => {
    const nd = new Date(d);
    nd.setDate(d.getDate() + i);
    return nd;
  });
}

export default function SchedulePage() {
  const { t, language } = useLanguage();
  const [weekDate, setWeekDate] = useState(new Date());
  const weekDates = getWeekDates(weekDate);

  const { data: events = [] } = trpc.calendar.listAll.useQuery({});

  const dayNames = language === "sv"
    ? ["Mån","Tis","Ons","Tor","Fre","Lör","Sön"]
    : ["Isn","Tal","Arb","Kha","Jim","Sab","Axd"];

  const today = new Date();

  const getEventsForDayHour = (date: Date, hour: number) => {
    return events.filter(event => {
      const d = new Date(event.startTime);
      return d.getFullYear() === date.getFullYear() &&
        d.getMonth() === date.getMonth() &&
        d.getDate() === date.getDate() &&
        d.getHours() === hour;
    });
  };

  const weekLabel = `${weekDates[0].toLocaleDateString(language === "sv" ? "sv-SE" : "so-SO", { month: "short", day: "numeric" })} – ${weekDates[6].toLocaleDateString(language === "sv" ? "sv-SE" : "so-SO", { month: "short", day: "numeric", year: "numeric" })}`;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">{t("nav.schedule")}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{language === "sv" ? "Veckans schema" : "Jadwalka toddobaadka"}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { const d = new Date(weekDate); d.setDate(d.getDate() - 7); setWeekDate(d); }} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium min-w-[200px] text-center">{weekLabel}</span>
          <button onClick={() => { const d = new Date(weekDate); d.setDate(d.getDate() + 7); setWeekDate(d); }} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
          <Button size="sm" variant="outline" onClick={() => setWeekDate(new Date())}>
            {language === "sv" ? "Idag" : "Maanta"}
          </Button>
        </div>
      </div>

      <Card className="shadow-premium border-0 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Day headers */}
            <div className="grid grid-cols-8 border-b border-border">
              <div className="p-3 text-xs text-muted-foreground font-medium flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              {weekDates.map((date, i) => {
                const isToday = date.toDateString() === today.toDateString();
                return (
                  <div key={i} className={cn(
                    "p-3 text-center border-l border-border",
                    isToday && "bg-primary/5"
                  )}>
                    <div className="text-xs font-semibold text-muted-foreground">{dayNames[i]}</div>
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center mx-auto mt-1 text-sm font-bold",
                      isToday ? "bg-primary text-primary-foreground" : "text-foreground"
                    )}>
                      {date.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Time slots */}
            <div className="max-h-[600px] overflow-y-auto">
              {HOURS.map(hour => (
                <div key={hour} className="grid grid-cols-8 border-b border-border/50 min-h-[60px]">
                  <div className="p-2 text-xs text-muted-foreground font-medium text-right pr-3 pt-2 flex-shrink-0">
                    {String(hour).padStart(2, "0")}:00
                  </div>
                  {weekDates.map((date, di) => {
                    const isToday = date.toDateString() === today.toDateString();
                    const hourEvents = getEventsForDayHour(date, hour);
                    return (
                      <div key={di} className={cn(
                        "border-l border-border/50 p-1 min-h-[60px]",
                        isToday && "bg-primary/3"
                      )}>
                        {hourEvents.map(event => (
                          <div
                            key={event.id}
                            className="text-[10px] px-1.5 py-1 rounded-md text-white font-medium mb-0.5 truncate"
                            style={{ backgroundColor: event.color ?? "#6366f1" }}
                          >
                            {CATEGORY_ICONS[event.category ?? "general"]} {event.title}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
