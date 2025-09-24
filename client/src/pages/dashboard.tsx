import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!user) return;

    // Redirect to role-specific dashboard
    switch (user.role) {
      case "super_admin":
        setLocation("/super-admin");
        break;
      case "hospital_admin":
        setLocation("/hospital-admin");
        break;
      case "doctor":
        setLocation("/doctor");
        break;
      case "patient":
        setLocation("/patient");
        break;
      default:
        break;
    }
  }, [user, setLocation]);

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-muted-foreground">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
