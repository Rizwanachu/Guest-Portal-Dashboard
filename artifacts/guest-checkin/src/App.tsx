import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';

import Dashboard from '@/pages/dashboard';
import BookingsList from '@/pages/bookings/list';
import NewBooking from '@/pages/bookings/new';
import BookingDetail from '@/pages/bookings/detail';
import CheckinForm from '@/pages/checkin';
import GuestSearch from '@/pages/guests/search';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/bookings" component={BookingsList} />
      <Route path="/bookings/new" component={NewBooking} />
      <Route path="/bookings/:id" component={BookingDetail} />
      <Route path="/checkin/:token" component={CheckinForm} />
      <Route path="/guests/search" component={GuestSearch} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
