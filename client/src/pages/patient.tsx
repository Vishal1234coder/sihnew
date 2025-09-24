import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthHeaders, useAuth } from "@/lib/auth";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import StatsOverview from "@/components/dashboard/stats-overview";
import MedicineList from "@/components/patient/medicine-list";
import ComplianceTracker from "@/components/patient/compliance-tracker";
import AIAssistantChat from "@/components/ai/assistant-chat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Pill, Activity, MessageSquareMore, Calendar, Clock } from "lucide-react";

export default function Patient() {
  const [activeTab, setActiveTab] = useState("overview");
  const { user } = useAuth();
  const authHeaders = useAuthHeaders();

  const { data: patient } = useQuery({
    queryKey: ["/api/patients", "by-user", user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/patients?userId=${user?.id}`, {
        headers: authHeaders,
      });
      const patients = await response.json();
      return patients[0];
    },
    enabled: !!user?.id,
  });

  const { data: prescriptions = [] } = useQuery({
    queryKey: ["/api/prescriptions", patient?.id],
    queryFn: async () => {
      if (!patient?.id) return [];
      const response = await fetch(`/api/prescriptions?patientId=${patient.id}`, {
        headers: authHeaders,
      });
      if (!response.ok) throw new Error("Failed to fetch prescriptions");
      return response.json();
    },
    enabled: !!patient?.id,
  });

  const { data: todayStatuses = [] } = useQuery({
    queryKey: ["/api/medicine-status", patient?.id, "today"],
    queryFn: async () => {
      if (!patient?.id) return [];
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/medicine-status?patientId=${patient.id}&date=${today}`, {
        headers: authHeaders,
      });
      if (!response.ok) throw new Error("Failed to fetch medicine status");
      return response.json();
    },
    enabled: !!patient?.id,
  });

  const getNextMedicine = () => {
    const now = new Date();
    const activePrescriptions = prescriptions.filter((p: any) => p.isActive);
    
    for (const prescription of activePrescriptions) {
      if (prescription.reminderTimes) {
        for (const time of prescription.reminderTimes) {
          const [hours, minutes] = time.split(':');
          const reminderTime = new Date();
          reminderTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          
          if (reminderTime > now) {
            return {
              medicine: prescription.medicine?.name || 'Unknown',
              time: reminderTime.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              }),
            };
          }
        }
      }
    }
    return null;
  };

  const nextMedicine = getNextMedicine();

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
                <h1 className="text-3xl font-bold text-foreground">My Health Dashboard</h1>
                <p className="text-muted-foreground mt-1">Track your medicines and stay healthy</p>
              </div>
              <div className="mt-4 sm:mt-0 flex space-x-3">
                <Button data-testid="button-ai-assistant">
                  <MessageSquareMore className="w-4 h-4 mr-2" />
                  Ask AI Assistant
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <StatsOverview />

          {/* Next Medicine Alert */}
          {nextMedicine && (
            <Card className="mb-8 border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-amber-900">Next Medicine</p>
                    <p className="text-sm text-amber-700">
                      Take {nextMedicine.medicine} at {nextMedicine.time}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                    Upcoming
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
              <TabsTrigger value="medicines" data-testid="tab-medicines">My Medicines</TabsTrigger>
              <TabsTrigger value="progress" data-testid="tab-progress">Progress</TabsTrigger>
              <TabsTrigger value="assistant" data-testid="tab-assistant">AI Assistant</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Today's Medicines */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Pill className="w-5 h-5" />
                      <span>Today's Medicines</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {todayStatuses.length === 0 ? (
                      <div className="text-center py-8">
                        <Pill className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No medicines scheduled for today</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {todayStatuses.slice(0, 5).map((status: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                            <div>
                              <p className="font-medium text-foreground">Medicine {index + 1}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(status.scheduledTime).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </p>
                            </div>
                            <Badge
                              className={
                                status.status === 'taken' ? 'bg-emerald-100 text-emerald-700' :
                                status.status === 'missed' ? 'bg-red-100 text-red-700' :
                                'bg-amber-100 text-amber-700'
                              }
                            >
                              {status.status === 'taken' ? 'Taken' :
                               status.status === 'missed' ? 'Missed' : 'Pending'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start" data-testid="button-mark-taken">
                      <Pill className="w-4 h-4 mr-2" />
                      Mark Medicine as Taken
                    </Button>
                    <Button variant="outline" className="w-full justify-start" data-testid="button-view-schedule">
                      <Calendar className="w-4 h-4 mr-2" />
                      View Medicine Schedule
                    </Button>
                    <Button variant="outline" className="w-full justify-start" data-testid="button-contact-doctor">
                      <MessageSquareMore className="w-4 h-4 mr-2" />
                      Contact Doctor
                    </Button>
                    <Button variant="outline" className="w-full justify-start" data-testid="button-health-tips">
                      <Activity className="w-4 h-4 mr-2" />
                      Health Tips
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="medicines">
              <MedicineList prescriptions={prescriptions} patientId={patient?.id} />
            </TabsContent>

            <TabsContent value="progress">
              <ComplianceTracker patientId={patient?.id} />
            </TabsContent>

            <TabsContent value="assistant">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-foreground mb-2">AI Health Assistant</h2>
                <p className="text-muted-foreground">
                  Ask questions about your medicines, side effects, or general health concerns in English or Hindi
                </p>
              </div>
              <AIAssistantChat />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
