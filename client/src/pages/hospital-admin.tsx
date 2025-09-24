import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthHeaders } from "@/lib/auth";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import StatsOverview from "@/components/dashboard/stats-overview";
import UserManagement from "@/components/admin/user-management";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCheck, Users, Plus, Building } from "lucide-react";

export default function HospitalAdmin() {
  const [activeTab, setActiveTab] = useState("overview");
  const authHeaders = useAuthHeaders();

  const { data: hospital } = useQuery({
    queryKey: ["/api/hospitals", "my-hospital"],
    queryFn: async () => {
      const response = await fetch("/api/hospitals", { headers: authHeaders });
      if (!response.ok) throw new Error("Failed to fetch hospital");
      const hospitals = await response.json();
      return hospitals[0]; // Hospital admin manages their own hospital
    },
  });

  const { data: doctors = [], isLoading: doctorsLoading } = useQuery({
    queryKey: ["/api/doctors", hospital?.id],
    queryFn: async () => {
      if (!hospital?.id) return [];
      const response = await fetch(`/api/doctors?hospitalId=${hospital.id}`, {
        headers: authHeaders,
      });
      if (!response.ok) throw new Error("Failed to fetch doctors");
      return response.json();
    },
    enabled: !!hospital?.id,
  });

  const { data: patients = [], isLoading: patientsLoading } = useQuery({
    queryKey: ["/api/patients", hospital?.id],
    queryFn: async () => {
      if (!hospital?.id) return [];
      const response = await fetch(`/api/patients?hospitalId=${hospital.id}`, {
        headers: authHeaders,
      });
      if (!response.ok) throw new Error("Failed to fetch patients");
      return response.json();
    },
    enabled: !!hospital?.id,
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
                <h1 className="text-3xl font-bold text-foreground">Hospital Admin Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                  Manage doctors and patients for {hospital?.name || "your hospital"}
                </p>
              </div>
              <div className="mt-4 sm:mt-0 flex space-x-3">
                <Button data-testid="button-add-doctor">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Doctor
                </Button>
                <Button variant="outline" data-testid="button-add-patient">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Patient
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <StatsOverview />

          {/* Hospital Info Card */}
          {hospital && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="w-5 h-5" />
                  <span>Hospital Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Hospital Name</p>
                    <p className="font-medium text-foreground">{hospital.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Address</p>
                    <p className="font-medium text-foreground">{hospital.address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Contact</p>
                    <p className="font-medium text-foreground">{hospital.phoneNumber}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
              <TabsTrigger value="doctors" data-testid="tab-doctors">Doctors</TabsTrigger>
              <TabsTrigger value="patients" data-testid="tab-patients">Patients</TabsTrigger>
              <TabsTrigger value="reports" data-testid="tab-reports">Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Recent Doctors */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <UserCheck className="w-5 h-5" />
                      <span>Recent Doctors</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {doctorsLoading ? (
                      <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
                        ))}
                      </div>
                    ) : doctors.length === 0 ? (
                      <div className="text-center py-8">
                        <UserCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No doctors added yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {doctors.slice(0, 5).map((doctor: any) => (
                          <div key={doctor.id} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                            <div>
                              <p className="font-medium text-foreground">Dr. {doctor.name || "Unknown"}</p>
                              <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                            </div>
                            <div className={`w-2 h-2 rounded-full ${doctor.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Patients */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="w-5 h-5" />
                      <span>Recent Patients</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {patientsLoading ? (
                      <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
                        ))}
                      </div>
                    ) : patients.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No patients registered yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {patients.slice(0, 5).map((patient: any) => (
                          <div key={patient.id} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                            <div>
                              <p className="font-medium text-foreground">{patient.name || "Unknown"}</p>
                              <p className="text-sm text-muted-foreground">
                                {patient.gender} • {patient.dateOfBirth ? new Date(patient.dateOfBirth).getFullYear() : "N/A"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="doctors">
              <UserManagement userType="doctor" hospitalId={hospital?.id} />
            </TabsContent>

            <TabsContent value="patients">
              <UserManagement userType="patient" hospitalId={hospital?.id} />
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Hospital Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Building className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Hospital reporting dashboard coming soon</p>
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
