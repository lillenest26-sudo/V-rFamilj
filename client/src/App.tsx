import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import AppLayout from "./components/AppLayout";

// Pages
import Dashboard from "./pages/Dashboard";
import CalendarPage from "./pages/CalendarPage";
import SchedulePage from "./pages/SchedulePage";
import TasksPage from "./pages/TasksPage";
import RemindersPage from "./pages/RemindersPage";
import MealPlanPage from "./pages/MealPlanPage";
import ShoppingPage from "./pages/ShoppingPage";
import BudgetPage from "./pages/BudgetPage";
import FamilyPage from "./pages/FamilyPage";
import PhotosPage from "./pages/PhotosPage";
import DocumentsPage from "./pages/DocumentsPage";
import DiaryPage from "./pages/DiaryPage";
import GoalsPage from "./pages/GoalsPage";
import RewardsPage from "./pages/RewardsPage";
import AIAssistantPage from "./pages/AIAssistantPage";
import NotFound from "./pages/NotFound";
import { InstallButton } from "./components/InstallButton";

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/calendar" component={CalendarPage} />
        <Route path="/schedule" component={SchedulePage} />
        <Route path="/tasks" component={TasksPage} />
        <Route path="/reminders" component={RemindersPage} />
        <Route path="/meal-plan" component={MealPlanPage} />
        <Route path="/shopping" component={ShoppingPage} />
        <Route path="/budget" component={BudgetPage} />
        <Route path="/family" component={FamilyPage} />
        <Route path="/photos" component={PhotosPage} />
        <Route path="/documents" component={DocumentsPage} />
        <Route path="/diary" component={DiaryPage} />
        <Route path="/goals" component={GoalsPage} />
        <Route path="/rewards" component={RewardsPage} />
        <Route path="/ai-assistant" component={AIAssistantPage} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster richColors position="top-right" />
            <Router />
            <InstallButton />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
