import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Home, Calendar, Clock, CheckSquare, Bell, UtensilsCrossed,
  ShoppingCart, PiggyBank, Users, Image, FileText, BookOpen,
  Target, Trophy, Bot, Settings, Moon, Sun, Globe, Menu, X,
  LogOut, LogIn, ChevronRight, Heart
} from "lucide-react";

interface NavItem {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
  section?: string;
}

const navItems: NavItem[] = [
  { path: "/", icon: Home, labelKey: "nav.home", section: "main" },
  { path: "/calendar", icon: Calendar, labelKey: "nav.calendar", section: "plan" },
  { path: "/schedule", icon: Clock, labelKey: "nav.schedule", section: "plan" },
  { path: "/tasks", icon: CheckSquare, labelKey: "nav.tasks", section: "plan" },
  { path: "/reminders", icon: Bell, labelKey: "nav.reminders", section: "plan" },
  { path: "/meal-plan", icon: UtensilsCrossed, labelKey: "nav.mealPlan", section: "home" },
  { path: "/shopping", icon: ShoppingCart, labelKey: "nav.shopping", section: "home" },
  { path: "/budget", icon: PiggyBank, labelKey: "nav.budget", section: "home" },
  { path: "/family", icon: Users, labelKey: "nav.family", section: "family" },
  { path: "/photos", icon: Image, labelKey: "nav.photos", section: "family" },
  { path: "/documents", icon: FileText, labelKey: "nav.documents", section: "family" },
  { path: "/diary", icon: BookOpen, labelKey: "nav.diary", section: "grow" },
  { path: "/goals", icon: Target, labelKey: "nav.goals", section: "grow" },
  { path: "/rewards", icon: Trophy, labelKey: "nav.rewards", section: "grow" },
  { path: "/ai-assistant", icon: Bot, labelKey: "nav.aiAssistant", section: "tools" },
];

const sectionLabels: Record<string, { sv: string; so: string }> = {
  main: { sv: "Översikt", so: "Guud ahaan" },
  plan: { sv: "Planering", so: "Qorshaha" },
  home: { sv: "Hushåll", so: "Guriga" },
  family: { sv: "Familj", so: "Qoyska" },
  grow: { sv: "Växa", so: "Kobca" },
  tools: { sv: "Verktyg", so: "Qaladaadka" },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const sections = ["main", "plan", "home", "family", "grow", "tools"];

  const SidebarContent = ({ collapsed = false }: { collapsed?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 px-4 py-5 border-b border-sidebar-border",
        collapsed && "justify-center px-2"
      )}>
        <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0 shadow-lg">
          <Heart className="w-5 h-5 text-white" fill="white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="text-sidebar-foreground font-display font-bold text-base leading-tight">
              {language === "sv" ? "Vår Familj" : "Qoyskeena"}
            </h1>
            <p className="text-sidebar-foreground/50 text-xs truncate">
              {language === "sv" ? "Tillsammans varje dag" : "Wada maalin kasta"}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 scrollbar-hide">
        {sections.map((section) => {
          const items = navItems.filter(i => i.section === section);
          if (!items.length) return null;
          return (
            <div key={section} className="mb-1">
              {!collapsed && (
                <div className="px-4 py-1.5">
                  <span className="text-sidebar-foreground/35 text-[10px] font-semibold uppercase tracking-widest">
                    {sectionLabels[section]?.[language] ?? section}
                  </span>
                </div>
              )}
              {items.map((item) => {
                const isActive = location === item.path;
                const Icon = item.icon;
                const label = t(item.labelKey);

                const itemEl = (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                      "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60",
                      isActive && "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm",
                      collapsed && "justify-center px-2.5"
                    )}
                  >
                    <Icon className={cn("w-4.5 h-4.5 flex-shrink-0", isActive && "text-primary")} />
                    {!collapsed && <span className="truncate">{label}</span>}
                    {!collapsed && isActive && (
                      <ChevronRight className="w-3.5 h-3.5 ml-auto text-primary/60" />
                    )}
                  </Link>
                );

                if (collapsed) {
                  return (
                    <Tooltip key={item.path} delayDuration={0}>
                      <TooltipTrigger asChild>{itemEl}</TooltipTrigger>
                      <TooltipContent side="right" className="text-xs">{label}</TooltipContent>
                    </Tooltip>
                  );
                }
                return itemEl;
              })}
            </div>
          );
        })}
      </nav>

      {/* Bottom Controls */}
      <div className={cn(
        "border-t border-sidebar-border p-3 space-y-1",
        collapsed && "flex flex-col items-center"
      )}>
        {/* Theme Toggle */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={toggleTheme}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium",
                "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-all duration-150",
                collapsed && "justify-center w-10 px-2.5"
              )}
            >
              {theme === "dark" ? <Sun className="w-4.5 h-4.5 flex-shrink-0" /> : <Moon className="w-4.5 h-4.5 flex-shrink-0" />}
              {!collapsed && <span>{theme === "dark" ? t("settings.lightMode") : t("settings.darkMode")}</span>}
            </button>
          </TooltipTrigger>
          {collapsed && <TooltipContent side="right" className="text-xs">{theme === "dark" ? t("settings.lightMode") : t("settings.darkMode")}</TooltipContent>}
        </Tooltip>

        {/* Language Toggle */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={() => setLanguage(language === "sv" ? "so" : "sv")}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium",
                "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-all duration-150",
                collapsed && "justify-center w-10 px-2.5"
              )}
            >
              <Globe className="w-4.5 h-4.5 flex-shrink-0" />
              {!collapsed && (
                <span>{language === "sv" ? "Soomaali" : "Svenska"}</span>
              )}
            </button>
          </TooltipTrigger>
          {collapsed && <TooltipContent side="right" className="text-xs">{language === "sv" ? "Soomaali" : "Svenska"}</TooltipContent>}
        </Tooltip>

        {/* User */}
        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium",
                "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-all duration-150",
                collapsed && "justify-center w-10 px-2.5"
              )}>
                <Avatar className="w-5 h-5 flex-shrink-0">
                  <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                    {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && <span className="truncate">{user?.name ?? "User"}</span>}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                {t("settings.logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <a
            href={getLoginUrl()}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium",
              "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-all duration-150",
              collapsed && "justify-center w-10 px-2.5"
            )}
          >
            <LogIn className="w-4.5 h-4.5 flex-shrink-0" />
            {!collapsed && <span>{t("settings.login")}</span>}
          </a>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col bg-sidebar transition-all duration-300 ease-out flex-shrink-0",
        sidebarCollapsed ? "w-[60px]" : "w-[240px]"
      )}>
        <SidebarContent collapsed={sidebarCollapsed} />
        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute left-0 top-1/2 -translate-y-1/2 translate-x-[calc(100%-1px)] z-10 hidden lg:flex w-5 h-10 items-center justify-center bg-sidebar border border-sidebar-border rounded-r-lg text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors"
          style={{ left: sidebarCollapsed ? "60px" : "240px" }}
        >
          <ChevronRight className={cn("w-3 h-3 transition-transform", sidebarCollapsed ? "" : "rotate-180")} />
        </button>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-[260px] bg-sidebar flex flex-col animate-slide-in-left">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 text-sidebar-foreground/60 hover:text-sidebar-foreground"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-card border-b border-border shadow-sm flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" fill="white" />
            </div>
            <span className="font-display font-bold text-sm">
              {language === "sv" ? "Vår Familj" : "Qoyskeena"}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setLanguage(language === "sv" ? "so" : "sv")}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 text-xs font-bold"
            >
              {language === "sv" ? "SO" : "SV"}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
