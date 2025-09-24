import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "./lib/auth";

import Dashboard from "@/pages/dashboard";
import SuperAdmin from "@/pages/super-admin";
import HospitalAdmin from "@/pages/hospital-admin";
import Doctor from "@/pages/doctor";
import Patient from "@/pages/patient";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component, allowedRoles }: { 
  component: React.ComponentType; 
  allowedRoles?: string[] 
}) {
  const { user } = useAuth();
  
  if (!user) {
    return <Login />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <NotFound />;
  }
  
  return <Component />;
}

function Router() {
  const { user } = useAuth();

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        {user ? <Dashboard /> : <Login />}
      </Route>
      <Route path="/super-admin">
        <ProtectedRoute component={SuperAdmin} allowedRoles={["super_admin"]} />
      </Route>
      <Route path="/hospital-admin">
        <ProtectedRoute component={HospitalAdmin} allowedRoles={["hospital_admin"]} />
      </Route>
      <Route path="/doctor">
        <ProtectedRoute component={Doctor} allowedRoles={["doctor"]} />
      </Route>
      <Route path="/patient">
        <ProtectedRoute component={Patient} allowedRoles={["patient"]} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
