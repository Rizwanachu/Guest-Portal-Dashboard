import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, useLocation, Redirect } from 'wouter';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { setupCheck } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

import Dashboard from '@/pages/dashboard';
import BookingsList from '@/pages/bookings/list';
import NewBooking from '@/pages/bookings/new';
import BookingDetail from '@/pages/bookings/detail';
import CheckinForm from '@/pages/checkin';
import GuestSearch from '@/pages/guests/search';
import LoginPage from '@/pages/login';
import SetupPage from '@/pages/setup';
import HotelProfile from '@/pages/hotel/profile';
import RoomsPage from '@/pages/hotel/rooms';
import StaffPage from '@/pages/hotel/staff';
import ReportsPage from '@/pages/reports/index';
import ResetPasswordPage from '@/pages/reset-password';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

// ─── Auth Guard ───────────────────────────────────────────────────────────────

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [isAuthenticated, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, hsl(240,100%,97%) 0%, hsl(262,60%,95%) 100%)" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(145deg, hsl(245,80%,62%), hsl(262,83%,58%))", boxShadow: "0 8px 32px rgba(99,102,241,0.4)" }}>
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
          <p className="text-sm text-slate-500 font-medium">Loading CheckInn…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={LoginPage} />
      <Route path="/setup" component={SetupPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/checkin/:token" component={CheckinForm} />

      {/* Protected admin routes */}
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/bookings" component={() => <ProtectedRoute component={BookingsList} />} />
      <Route path="/bookings/new" component={() => <ProtectedRoute component={NewBooking} />} />
      <Route path="/bookings/:id" component={() => <ProtectedRoute component={BookingDetail} />} />
      <Route path="/guests/search" component={() => <ProtectedRoute component={GuestSearch} />} />
      <Route path="/hotel/profile" component={() => <ProtectedRoute component={HotelProfile} />} />
      <Route path="/hotel/rooms" component={() => <ProtectedRoute component={RoomsPage} />} />
      <Route path="/hotel/staff" component={() => <ProtectedRoute component={StaffPage} />} />
      <Route path="/reports" component={() => <ProtectedRoute component={ReportsPage} />} />

      <Route component={NotFound} />
    </Switch>
  );
}

function AppInner() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  // Redirect root to login if needed (handled by ProtectedRoute, but for fast redirect)
  useEffect(() => {
    if (!isLoading && !isAuthenticated && location === '/') {
      setLocation('/login');
    }
  }, [isLoading, isAuthenticated, location, setLocation]);

  return <Router />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <AuthProvider>
            <AppInner />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
