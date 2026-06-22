import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { useGeoLocation } from "@/hooks/useGeoLocation";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { PullToRefresh } from "@/components/PullToRefresh";
import {
  Calendar, CheckSquare, Bell, UtensilsCrossed, PiggyBank,
  Users, Target, Trophy, Bot, Plus, ArrowRight, Cloud,
  Sun, CloudRain, Wind, Droplets, Heart, Star, Zap,
  Clock, TrendingUp, ShoppingCart, Dumbbell
} from "lucide-react";

function ClockWidget() {
  const [time, setTime] = useState(new Date());
  const { language } = useLanguage();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = time.toLocaleTimeString(language === "sv" ? "sv-SE" : "so-SO", {
    hour: "2-digit", minute: "2-digit"
  });
  const dateStr = time.toLocaleDateString(language === "sv" ? "sv-SE" : "so-SO", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  return (
    <div className="text-center">
      <div className="font-display text-5xl font-bold text-foreground tracking-tight tabular-nums">
        {timeStr}
      </div>
      <p className="text-muted-foreground text-sm mt-1 capitalize">{dateStr}</p>
    </div>
  );
}

function WeatherWidget() {
  const { t } = useLanguage();
  const { location } = useGeoLocation();
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!location) return;

    const fetchWeather = async () => {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,weather_code&timezone=auto&forecast_days=4`
        );
        const data = await response.json();
        const current = data.current;
        const daily = data.daily;

        const getWeatherIcon = (code: number) => {
          if (code === 0 || code === 1) return Sun;
          if (code === 2 || code === 3) return Cloud;
          if (code >= 45 && code <= 82) return CloudRain;
          return Cloud;
        };

        const forecast = daily.time.slice(1, 5).map((date: string, idx: number) => ({
          day: new Date(date).toLocaleDateString('sv-SE', { weekday: 'short' }).substring(0, 3),
          icon: getWeatherIcon(daily.weather_code[idx + 1]),
          temp: Math.round(daily.temperature_2m_max[idx + 1]),
        }));

        setWeather({
          temp: Math.round(current.temperature_2m),
          feelsLike: Math.round(current.temperature_2m - 2),
          humidity: current.relative_humidity_2m,
          wind: Math.round(current.wind_speed_10m),
          forecast,
        });
      } catch (err) {
        console.log('Weather fetch error:', err);
        setWeather({
          temp: 18,
          feelsLike: 16,
          humidity: 62,
          wind: 12,
          forecast: [
            { day: "Lör", icon: Sun, temp: 20 },
            { day: "Sön", icon: Cloud, temp: 17 },
            { day: "Mån", icon: CloudRain, temp: 14 },
            { day: "Tis", icon: Cloud, temp: 16 },
          ],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [location]);

  if (loading || !weather) return <div className="h-32 bg-muted/30 rounded-lg animate-pulse" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-3xl font-bold text-foreground">{weather.temp}°C</p>
          <p className="text-xs text-muted-foreground mt-0.5">Stockholm</p>
        </div>
        <Sun className="w-12 h-12 text-amber-400" />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {weather.forecast.map((f: any, i: number) => (
          <div key={i} className="text-center">
            <p className="text-xs font-medium text-muted-foreground">{f.day}</p>
            <f.icon className="w-4 h-4 mx-auto my-1 text-muted-foreground" />
            <p className="text-xs font-semibold">{f.temp}°</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const familyRules = [
  { sv: "Vi respekterar varandra", so: "Waan is isku jeclaynaa" },
  { sv: "Vi pratar med varandra", so: "Waan wada hadlayaa" },
  { sv: "Vi hjälper till hemma", so: "Waan wada gacan isugu taagnaa" },
  { sv: "Vi gör vårt bästa", so: "Waan wada iska doonayaa inaan iska dhex qabnaa" },
  { sv: "Vi har roligt tillsammans", so: "Waan wada madadaalaynaa" },
];

export default function Dashboard() {
  const { t, language } = useLanguage();
  const utils = trpc.useUtils();
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const mealQuery = trpc.mealPlan.list.useQuery({ weekStart: weekStart.toISOString().split('T')[0] });
  const remindersQuery = trpc.reminders.today.useQuery();
  const membersQuery = trpc.family.list.useQuery();
  const goalsQuery = trpc.goals.list.useQuery({ limit: 3 });
  
  const { data: mealPlans = [] } = mealQuery;
  const { data: reminders = [] } = remindersQuery;
  const { data: members = [] } = membersQuery;
  const { data: goals = [] } = goalsQuery;

  const handleRefresh = async () => {
    await Promise.all([
      utils.mealPlan.list.invalidate(),
      utils.reminders.today.invalidate(),
      utils.family.list.invalidate(),
      utils.goals.list.invalidate(),
    ]);
  };

  const today = new Date();
  const greeting = (() => {
    const h = today.getHours();
    if (h < 12) return language === "sv" ? "God morgon" : "Subax wanaagsan";
    if (h < 17) return language === "sv" ? "God dag" : "Galab wanaagsan";
    return language === "sv" ? "God kväll" : "Habeenimo wanaagsan";
  })();

  // Weekly schedule (placeholder for future schedule module)
  const scheduleByTime: Record<string, any[]> = {};
  const sortedTimes: string[] = [];
  const schedule: any[] = [];

  // Get meals for the week
  const mealsByDay = (mealPlans || []).reduce((acc: any, meal: any) => {
    const day = new Date(meal.weekStart).toLocaleDateString('sv-SE', { weekday: 'short' }).substring(0, 3).toUpperCase();
    if (!acc[day]) acc[day] = { breakfast: null, lunch: null, dinner: null };
    if (meal.mealType === "breakfast") acc[day].breakfast = meal;
    if (meal.mealType === "lunch") acc[day].lunch = meal;
    if (meal.mealType === "dinner") acc[day].dinner = meal;
    return acc;
  }, {});

  const daysOfWeek = ["MÅN", "TIS", "ONS", "TORS", "FRE", "LÖR", "SÖN"];

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="p-4 md:p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            {language === "sv" ? "FAMILJE DASHBOARD" : "DASHBOARD QOYSKA"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("dashboard.subtitle")}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <Heart className="w-4 h-4" fill="currentColor" />
          <span>{language === "sv" ? "Planera idag, skapar en bättre morgondag" : "Qorshee maanta, samee berri wanaagsan"}</span>
        </div>
      </div>

      {/* Main Layout: Left (Schedule + Meals) + Right (Reminders, Rules, Weather) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* LEFT SIDE - 70% */}
        <div className="lg:col-span-3 space-y-6">
          {/* Weekly Schedule */}
          <Card className="shadow-premium border-0">
            <CardHeader className="pb-3 pt-4 px-5">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {language === "sv" ? "Veckoscema" : "Jadwalka Usbuuca"}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 overflow-x-auto">
              <div className="min-w-max">
                <div className="grid gap-4" style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}>
                  {/* Header with days */}
                  <div className="text-xs font-bold text-muted-foreground"></div>
                  {daysOfWeek.map((day, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - date.getDay() + i + 1);
                    const dayNum = date.getDate();
                    const isToday = date.toDateString() === new Date().toDateString();
                    return (
                      <div key={day} className={cn("text-center pb-2 border-b", isToday && "bg-emerald-50 dark:bg-emerald-900/20")}>
                        <p className="text-xs font-bold">{day}</p>
                        <p className="text-xs text-muted-foreground">{dayNum} Maj</p>
                      </div>
                    );
                  })}

                  {/* Time slots */}
                  {sortedTimes.slice(0, 15).map((time) => (
                    <div key={time} className="contents">
                      <div className="text-xs font-semibold text-muted-foreground pt-2">{time}</div>
                      {daysOfWeek.map((day) => (
                        <div key={`${day}-${time}`} className="text-center text-xs space-y-1 pt-2">
                          {scheduleByTime[time]?.map((item: any, idx: number) => (
                            <div key={idx} className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded px-2 py-1 text-[10px] font-medium truncate">
                              {item.title}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meal Plan */}
          <Card className="shadow-premium border-0">
            <CardHeader className="pb-3 pt-4 px-5">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4" />
                {language === "sv" ? "Veckan's Matplan" : "Cununta Usbuuca"}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="grid grid-cols-7 gap-3">
                {daysOfWeek.map((day, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() - date.getDay() + i + 1);
                  const dayMeals = mealsByDay[day];
                  const mealType = dayMeals?.breakfast || dayMeals?.lunch || dayMeals?.dinner;

                  return (
                    <div key={day} className="text-center">
                      <p className="text-xs font-bold text-muted-foreground mb-2">{day}</p>
                      {mealType?.imageUrl ? (
                        <img src={mealType.imageUrl} alt={mealType.title} className="w-full h-20 object-cover rounded-lg" />
                      ) : (
                        <div className="w-full h-20 bg-muted/30 rounded-lg flex items-center justify-center text-2xl">
                          {mealType?.mealType === "breakfast" ? "🍳" : mealType?.mealType === "lunch" ? "🥗" : "🍽"}
                        </div>
                      )}
                      <p className="text-[10px] font-semibold mt-2 truncate">{mealType?.title || "-"}</p>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground text-center mt-4">
                {language === "sv" ? "Varierad mat • Mycket kärlekfullt • Tillsammans" : "Cuntada kala duwan • Jaceyl badan • Wada jira"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT SIDE - 30% */}
        <div className="lg:col-span-1 space-y-4">
          {/* Today's Reminders */}
          <Card className="shadow-premium border-0">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Bell className="w-3 h-3" />
                {language === "sv" ? "Dagens Påminnelser" : "Xusuusin Maanta"}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {reminders && reminders.length > 0 ? (
                reminders.slice(0, 4).map((reminder) => (
                  <div key={reminder.id} className={cn(
                    "text-xs p-2 rounded-lg",
                    reminder.type === "urgent" ? "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300" :
                    reminder.type === "important" ? "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300" :
                    "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                  )}>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{reminder.title}</p>
                        <p className="text-[10px] opacity-75">
                          {new Date(reminder.remindAt).toLocaleTimeString(language === "sv" ? "sv-SE" : "so-SO", {
                            hour: "2-digit", minute: "2-digit"
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center py-3">{language === "sv" ? "Inga påminnelser" : "Walaa xusuusin"}</p>
              )}
            </CardContent>
          </Card>

          {/* Family Workout */}
          <Card className="shadow-premium border-0">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Dumbbell className="w-3 h-3" />
                {language === "sv" ? "Denna Vecka" : "Maanta"}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {members && members.length > 0 ? (
                members.slice(0, 4).map((member) => (
                  <div key={member.id} className="flex items-center gap-2 text-xs">
                    <span className="text-lg">{member.role === "parent" ? "👨‍🦱" : "👧"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{member.name}</p>
                      <p className="text-muted-foreground text-[10px]">Gym (Papa)</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center py-3">{language === "sv" ? "Inga medlemmar" : "Walaa xubnaha"}</p>
              )}
            </CardContent>
          </Card>

          {/* Family Rules */}
          <Card className="shadow-premium border-0 bg-gradient-to-br from-emerald-50 dark:from-emerald-900/20 to-card">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Heart className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                {language === "sv" ? "Regler i vårt hem" : "Xeerarka gurigayaga"}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-1.5">
              {familyRules.map((rule, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <CheckSquare className="w-3 h-3 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">{language === "sv" ? rule.sv : rule.so}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Weather */}
          <Card className="shadow-premium border-0">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Cloud className="w-3 h-3" />
                {language === "sv" ? "Väder" : "Haweenka"}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <WeatherWidget />
            </CardContent>
          </Card>

          {/* Motivation */}
          <Card className="shadow-premium border-0 bg-gradient-to-br from-primary/5 to-card">
            <CardContent className="p-4">
              <p className="text-xs text-center text-foreground font-semibold leading-relaxed">
                {language === "sv"
                  ? '"Små vanor varje dag skapar ett stort och lyckligt familjeliv."'
                  : '"Alaabaab yar maalinta oo kale waxay abuuri karaan qoyska faraxsan."'}
              </p>
              <div className="flex justify-center mt-3">
                <Heart className="w-4 h-4 text-rose-500" fill="currentColor" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </PullToRefresh>
  );
}
