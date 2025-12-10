
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { AuthProvider } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { NativePiPScores } from "@/components/NativePiPScores";
import Index from "./pages/Index";
import Teams from "./pages/Teams";
import Players from "./pages/Players";
import LiveScores from "./pages/LiveScores";
import Fixtures from "./pages/Fixtures";
import Statistics from "./pages/Statistics";
import PointsTable from "./pages/PointsTable";
import News from "./pages/News";
import Gallery from "./pages/Gallery";
import Admin from "./pages/Admin";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import TestAPI from "./pages/TestAPI";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {/* Native Picture-in-Picture Live Scores - Floats on all apps */}
          <NativePiPScores />
          <Layout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/teams" element={<Teams />} />
              <Route path="/players" element={<Players />} />
              <Route path="/live-scores" element={<LiveScores />} />
              <Route path="/fixtures" element={<Fixtures />} />
              <Route path="/stats" element={<Statistics />} />
              <Route path="/points-table" element={<PointsTable />} />
              <Route path="/news" element={<News />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/test-api" element={<TestAPI />} />
              <Route path="/admindashboard" element={<Admin />} />

              <Route path="/admin" element={
                <ProtectedRoute adminOnly redirectTo="/auth">
                  <Admin />
                </ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute redirectTo="/login">
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
