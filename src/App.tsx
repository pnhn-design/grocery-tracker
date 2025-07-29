import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { ItemsPage } from "./components/ItemsPage";
import { CategoriesPage } from "./components/CategoriesPage";
import { MarketsPage } from "./components/MarketsPage";
import { PurchasesPage } from "./components/PurchasesPage";
import { AdminPanel } from "./components/AdminPanel";
import { AuthPage } from "./pages/AuthPage";
import { AuthProvider } from "./hooks/useAuth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="items" element={<ItemsPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="markets" element={<MarketsPage />} />
              <Route path="purchases" element={<PurchasesPage />} />
              <Route path="admin" element={<AdminPanel />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
