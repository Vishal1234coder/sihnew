import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthHeaders, useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, Filter, User, Bell, Eye, TriangleAlert } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { MedicineStatusUpdate } from "@/lib/types";

interface PatientMedicineCardProps {
  patient: any;
  onSendReminder: (patientId: string, urgent?: boolean) => void;
  onViewDetails: (patientId: string) => void;
}

function PatientMedicineCard({ patient, onSendReminder, onViewDetails }: PatientMedicineCardProps) {
  const getComplianceColor = (rate: number) => {
    if (rate >= 90) return "text-emerald-600 bg-emerald-500";
    if (rate >= 70) return "text-amber-600 bg-amber-500";
    return "text-red-600 bg-red-500";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "taken":
        return "bg-emerald-100 text-emerald-700";
      case "missed":
        return "bg-red-100 text-red-700";
      case "pending":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-blue-100 text-blue-700";
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">{patient.name}</p>
              <p className="text-xs text-muted-foreground">#{patient.id.slice(-6)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${getComplianceColor(patient.complianceRate).split(" ")[1]}`}></div>
            <span className={`text-xs font-medium ${getComplianceColor(patient.complianceRate).split(" ")[0]}`}>
              {patient.complianceRate}%
            </span>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {patient.medicines?.map((medicine: any, index: number) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{medicine.name}</span>
              <Badge className={`text-xs ${getStatusColor(medicine.status)}`}>
                {medicine.status === "taken" ? "Taken" : 
                 medicine.status === "missed" ? "Missed" : 
                 medicine.status === "pending" ? `Due in ${medicine.dueIn}` : medicine.status}
              </Badge>
            </div>
          )) || (
            <p className="text-sm text-muted-foreground">No active medicines</p>
          )}
        </div>

        <div className="flex space-x-2">
          <Button
            size="sm"
            variant={patient.complianceRate < 70 ? "destructive" : "default"}
            className="flex-1 text-xs"
            onClick={() => onSendReminder(patient.id, patient.complianceRate < 70)}
            data-testid={`button-send-reminder-${patient.id}`}
          >
            {patient.complianceRate < 70 ? (
              <>
                <TriangleAlert className="w-3 h-3 mr-1" />
                Urgent
              </>
            ) : (
              <>
                <Bell className="w-3 h-3 mr-1" />
                Send Reminder
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewDetails(patient.id)}
            data-testid={`button-view-details-${patient.id}`}
          >
            <Eye className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MedicineTracking() {
  const { user } = useAuth();
  const authHeaders = useAuthHeaders();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get doctor info
  const { data: doctor } = useQuery({
    queryKey: ["/api/doctors", "by-user", user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/doctors?userId=${user?.id}`, {
        headers: authHeaders,
      });
      return response.json();
    },
    enabled: !!user?.id && user?.role === "doctor",
  });

  // Get patients with their medicine status
  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["/api/patients", "with-medicines", doctor?.id],
    queryFn: async () => {
      const response = await fetch(`/api/patients?doctorId=${doctor?.id}`, {
        headers: authHeaders,
      });
      const patientsData = await response.json();
      
      // Mock enhanced data for demo - in real app, this would come from backend
      return patientsData.map((patient: any, index: number) => ({
        ...patient,
        complianceRate: [94, 67, 91][index % 3],
        medicines: [
          [
            { name: "Metformin 500mg", status: "taken" },
            { name: "Lisinopril 10mg", status: "pending", dueIn: "2h" },
          ],
          [
            { name: "Insulin", status: "missed" },
            { name: "Metoprolol 25mg", status: "taken" },
          ],
          [
            { name: "Atorvastatin 20mg", status: "taken" },
            { name: "Aspirin 81mg", status: "pending", dueIn: "at 8PM" },
          ],
        ][index % 3],
      }));
    },
    enabled: !!doctor?.id,
  });

  const sendReminderMutation = useMutation({
    mutationFn: async ({ patientId, urgent }: { patientId: string; urgent: boolean }) => {
      const message = urgent 
        ? "This is an urgent reminder to take your medication. Please contact your doctor if you have concerns."
        : "This is a friendly reminder to take your prescribed medication.";
        
      return apiRequest("POST", "/api/reminders/send", {
        patientId,
        message,
        type: "sms",
      });
    },
    onSuccess: () => {
      toast({
        title: "Reminder sent",
        description: "SMS reminder has been sent to the patient",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send reminder",
        variant: "destructive",
      });
    },
  });

  const handleSendReminder = (patientId: string, urgent = false) => {
    sendReminderMutation.mutate({ patientId, urgent });
  };

  const handleViewDetails = (patientId: string) => {
    // Navigate to patient details page
    toast({
      title: "Patient Details",
      description: "Navigating to patient details page",
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Patient Medicine Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Patient Medicine Tracking</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search patients..."
                className="pl-9 w-64"
                data-testid="input-search-patients"
              />
            </div>
            <Button variant="outline" size="sm" data-testid="button-filter">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {patients.length === 0 ? (
          <div className="text-center py-8">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No patients assigned yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {patients.map((patient: any) => (
              <PatientMedicineCard
                key={patient.id}
                patient={patient}
                onSendReminder={handleSendReminder}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
