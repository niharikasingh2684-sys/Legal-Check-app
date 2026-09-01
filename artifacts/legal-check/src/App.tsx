import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

import { StoreProvider } from '@/lib/store';
import { AppLayout } from '@/components/layout/app-layout';

import Welcome from '@/pages/welcome';
import Dashboard from '@/pages/dashboard';
import ScanPage from '@/pages/scan';
import ExtractionPage from '@/pages/extraction';
import ResultsPage from '@/pages/results';
import ViolationsPage from '@/pages/violations';
import ReportPage from '@/pages/report';
import HistoryPage from '@/pages/history';

const queryClient = new QueryClient();

function Router() {
  return (
    <AppLayout>
      <RoutedErrorBoundary>
        <Switch>
          <Route path="/" component={Welcome} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/scan" component={ScanPage} />
          <Route path="/extraction" component={ExtractionPage} />
          <Route path="/results" component={ResultsPage} />
          <Route path="/violations" component={ViolationsPage} />
          <Route path="/report" component={ReportPage} />
          <Route path="/history" component={HistoryPage} />
          <Route component={NotFound} />
        </Switch>
      </RoutedErrorBoundary>
    </AppLayout>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <StoreProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
        </StoreProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
