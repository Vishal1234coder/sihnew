import { useQuery } from "@tanstack/react-query";
import { useAuthHeaders } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Users, CheckCircle, Pill, AlertTriangle, TrendingUp, Clock } from "lucide-react";
import type { DashboardStats } from "@/lib/types";

export default function StatsOverview() {
  const authHeaders = useAuthHeaders();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/stats", {
        headers: authHeaders,
      });
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: stats?.totalPatients ? "Total Patients" : "Active Prescriptions",
      value: stats?.totalPatients || stats?.activePrescriptions || 0,
      icon: stats?.totalPatients ? Users : Pill,
      color: "bg-primary/10 text-primary",
      trend: "+12% from last month",
      trendColor: "text-emerald-600",
    },
    {
      title: "Compliance Rate",
      value: `${stats?.complianceRate || 0}%`,
      icon: CheckCircle,
      color: "bg-emerald-100 text-emerald-600",
      trend: "+2.3% improvement",
      trendColor: "text-emerald-600",
    },
    {
      title: stats?.todaysDoses ? "Today's Doses" : "Active Prescriptions",
      value: stats?.todaysDoses || stats?.activePrescriptions || 0,
      icon: stats?.todaysDoses ? Clock : Pill,
      color: "bg-amber-100 text-amber-600",
      trend: stats?.nextMedicine || "23 due today",
      trendColor: "text-amber-600",
    },
    {
      title: "Alerts",
      value: stats?.alerts || 0,
      icon: AlertTriangle,
      color: "bg-red-100 text-red-600",
      trend: "5 critical cases",
      trendColor: "text-red-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} data-testid={`stat-card-${index}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className={`text-sm mt-2 ${stat.trendColor}`}>
                <TrendingUp className="w-3 h-3 inline mr-1" />
                {stat.trend}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
