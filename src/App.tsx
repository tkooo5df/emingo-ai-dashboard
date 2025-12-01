import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import BottomNav from "./components/BottomNav";
import Dashboard from "./pages/Dashboard";
import Income from "./pages/Income";
import Expenses from "./pages/Expenses";
import Budget from "./pages/Budget";
import Projects from "./pages/Projects";
import Goals from "./pages/Goals";
import AIAssistant from "./pages/AIAssistant";
import Account from "./pages/Account";
import Debts from "./pages/Debts";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AuthCallback from "./pages/AuthCallback";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import { useEffect, useState } from "react";
import "./lib/i18n";
import { useTranslation } from "react-i18next";

const queryClient = new QueryClient();

const AppContent = () => {
  const [isMobile, setIsMobile] = useState(false);
  const { i18n } = useTranslation();
  const [, forceUpdate] = useState(0);

  // Listen to language changes and force re-render
  useEffect(() => {
    console.log('🌐 [App] Setting up language change listener...');
    
    const handleLanguageChange = (lng: string) => {
      console.log('🌐 [App] Language change detected in App component:', {
        newLanguage: lng,
        timestamp: new Date().toISOString()
      });
      forceUpdate(prev => prev + 1);
      console.log('🌐 [App] Force update triggered for re-render');
    };
    
    i18n.on('languageChanged', handleLanguageChange);
    console.log('🌐 [App] Language change listener registered');
    
    return () => {
      console.log('🌐 [App] Cleaning up language change listener');
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      
      {/* Protected routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <div className="flex min-h-screen bg-background">
              <Sidebar />
              <main className={`
                flex-1 min-h-screen
                ${isMobile 
                  ? 'pt-14 pb-20 px-4' 
                  : 'ml-64 p-8'
                }
              `}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/account" element={<Account />} />
                  <Route path="/income" element={<Income />} />
                  <Route path="/expenses" element={<Expenses />} />
                  <Route path="/debts" element={<Debts />} />
                  <Route path="/budget" element={<Budget />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/goals" element={<Goals />} />
                  <Route path="/ai-assistant" element={<AIAssistant />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route 
                    path="/admin" 
                    element={
                      <AdminRoute>
                        <AdminDashboard />
                      </AdminRoute>
                    } 
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <BottomNav />
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

const App = () => {

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
