import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthHeaders } from "@/lib/auth";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import StatsOverview from "@/components/dashboard/stats-overview";
import HospitalManagement from "@/components/admin/hospital-management";
import UserManagement from "@/components/admin/user-management";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Hospital, Users, Plus, BarChart3 } from "lucide-react";

export default function SuperAdmin() {
  const [activeTab, setActiveTab] = useState("overview");
  const authHeaders = useAuthHeaders();

  const { data: hospitals = [], isLoading: hospitalsLoading } = useQuery({
    queryKey: ["/api/hospitals"],
    queryFn: async () => {
      const response = await fetch("/api/hospitals", { headers: authHeaders });
      if (!response.ok) throw new Error("Failed to fetch hospitals");
      return response.json();
    },
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users", { headers: authHeaders });
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 bg-muted/30">
          {/* Dashboard Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Super Admin Dashboard</h1>
                <p className="text-muted-foreground mt-1">Manage hospitals and oversee the entire platform</p>
              </div>
              <div className="mt-4 sm:mt-0 flex space-x-3">
                <Button data-testid="button-add-hospital">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Hospital
                </Button>
                <Button variant="outline" data-testid="button-system-reports">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  System Reports
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <StatsOverview />

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
              <TabsTrigger value="hospitals" data-testid="tab-hospitals">Hospitals</TabsTrigger>
              <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
              <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Recent Hospitals */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Hospital className="w-5 h-5" />
                      <span>Recent Hospitals</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {hospitalsLoading ? (
                      <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
                        ))}
                      </div>
                    ) : hospitals.length === 0 ? (
                      <div className="text-center py-8">
                        <Hospital className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No hospitals added yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {hospitals.slice(0, 5).map((hospital: any) => (
                          <div key={hospital.id} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                            <div>
                              <p className="font-medium text-foreground">{hospital.name}</p>
                              <p className="text-sm text-muted-foreground">{hospital.address}</p>
                            </div>
                            <div className={`w-2 h-2 rounded-full ${hospital.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* System Health */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="w-5 h-5" />
                      <span>System Health</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Overall System</span>
                          <span className="text-sm text-emerald-600">98.5%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-emerald-500 h-2 rounded-full" style={{ width: "98.5%" }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">SMS Service</span>
                          <span className="text-sm text-emerald-600">99.2%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-emerald-500 h-2 rounded-full" style={{ width: "99.2%" }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">AI Assistant</span>
                          <span className="text-sm text-emerald-600">97.8%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-emerald-500 h-2 rounded-full" style={{ width: "97.8%" }}></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="hospitals">
              <HospitalManagement />
            </TabsContent>

            <TabsContent value="users">
              <UserManagement />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Advanced analytics dashboard coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
