import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Users,
  Hospital,
  UserCheck,
  Pill,
  Clock,
  BarChart3,
  Brain,
  Home,
  Activity,
  MessageSquareMore,
} from "lucide-react";

interface SidebarItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const sidebarItems: SidebarItem[] = [
  { href: "/", label: "Dashboard", icon: Home, roles: ["super_admin", "hospital_admin", "doctor", "patient"] },
  { href: "/hospitals", label: "Manage Hospitals", icon: Hospital, roles: ["super_admin"] },
  { href: "/doctors", label: "Manage Doctors", icon: UserCheck, roles: ["super_admin", "hospital_admin"] },
  { href: "/patients", label: "Patients", icon: Users, roles: ["doctor", "hospital_admin"] },
  { href: "/prescriptions", label: "Prescriptions", icon: Pill, roles: ["doctor"] },
  { href: "/medicines", label: "My Medicines", icon: Pill, roles: ["patient"] },
  { href: "/reminders", label: "Reminders", icon: Clock, roles: ["doctor", "patient"] },
  { href: "/compliance", label: "Compliance Reports", icon: BarChart3, roles: ["doctor", "hospital_admin"] },
  { href: "/activity", label: "My Activity", icon: Activity, roles: ["patient"] },
  { href: "/ai-assistant", label: "AI Assistant", icon: MessageSquareMore, roles: ["patient"] },
  { href: "/insights", label: "AI Insights", icon: Brain, roles: ["doctor", "hospital_admin"] },
];

export default function Sidebar() {
  const { user } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  const filteredItems = sidebarItems.filter(item => 
    item.roles.includes(user.role)
  );

  const groupedItems = {
    main: filteredItems.filter(item => 
      ["Dashboard", "Patients", "My Medicines", "My Activity"].includes(item.label)
    ),
    management: filteredItems.filter(item => 
      ["Manage Hospitals", "Manage Doctors", "Prescriptions"].includes(item.label)
    ),
    analytics: filteredItems.filter(item => 
      ["Compliance Reports", "AI Insights"].includes(item.label)
    ),
    tools: filteredItems.filter(item => 
      ["Reminders", "AI Assistant"].includes(item.label)
    ),
  };

  const renderNavSection = (title: string, items: SidebarItem[]) => {
    if (items.length === 0) return null;

    return (
      <div key={title}>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {title}
        </h3>
        <nav className="space-y-2">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
                data-testid={`nav-${item.label.toLowerCase().replace(/ /g, "-")}`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    );
  };

  return (
    <aside className="w-64 bg-card border-r border-border p-6 hidden lg:block">
      <div className="space-y-6">
        {renderNavSection("Main Menu", groupedItems.main)}
        {renderNavSection("Management", groupedItems.management)}
        {renderNavSection("Analytics", groupedItems.analytics)}
        {renderNavSection("Tools", groupedItems.tools)}
      </div>
    </aside>
  );
}
