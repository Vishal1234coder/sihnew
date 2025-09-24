import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthHeaders, useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface PrescriptionFormData {
  patientId: string;
  medicineId: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  reminderTimes: string[];
  startDate: string;
  endDate: string;
}

interface PrescriptionFormProps {
  onClose?: () => void;
}

export default function PrescriptionForm({ onClose }: PrescriptionFormProps) {
  const { user } = useAuth();
  const authHeaders = useAuthHeaders();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<PrescriptionFormData>({
    patientId: "",
    medicineId: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: "",
    reminderTimes: [""],
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
  });

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

  // Get patients for this doctor
  const { data: patients = [] } = useQuery({
    queryKey: ["/api/patients", "by-doctor", doctor?.id],
    queryFn: async () => {
      const response = await fetch(`/api/patients?doctorId=${doctor?.id}`, {
        headers: authHeaders,
      });
      return response.json();
    },
    enabled: !!doctor?.id,
  });

  // Get medicines
  const { data: medicines = [] } = useQuery({
    queryKey: ["/api/medicines"],
    queryFn: async () => {
      const response = await fetch("/api/medicines", {
        headers: authHeaders,
      });
      return response.json();
    },
  });

  const createPrescriptionMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/prescriptions", data);
    },
    onSuccess: () => {
      toast({
        title: "Prescription created",
        description: "Prescription created successfully and reminders scheduled",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/prescriptions"] });
      if (onClose) onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create prescription",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!doctor?.id) {
      toast({
        title: "Error",
        description: "Doctor information not found",
        variant: "destructive",
      });
      return;
    }

    const endDate = new Date(formData.startDate);
    const durationDays = parseInt(formData.duration.split(" ")[0]) || 30;
    endDate.setDate(endDate.getDate() + durationDays);

    const prescriptionData = {
      ...formData,
      doctorId: doctor.id,
      endDate: endDate.toISOString(),
      reminderTimes: formData.reminderTimes.filter(time => time.trim() !== ""),
    };

    createPrescriptionMutation.mutate(prescriptionData);
  };

  const addReminderTime = () => {
    setFormData(prev => ({
      ...prev,
      reminderTimes: [...prev.reminderTimes, ""],
    }));
  };

  const updateReminderTime = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      reminderTimes: prev.reminderTimes.map((time, i) => i === index ? value : time),
    }));
  };

  const removeReminderTime = (index: number) => {
    setFormData(prev => ({
      ...prev,
      reminderTimes: prev.reminderTimes.filter((_, i) => i !== index),
    }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Create New Prescription</CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-form">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="patient">Patient</Label>
              <Select
                value={formData.patientId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, patientId: value }))}
              >
                <SelectTrigger data-testid="select-patient">
                  <SelectValue placeholder="Select patient..." />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient: any) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name} - #{patient.id.slice(-6)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="medicine">Medicine</Label>
              <Select
                value={formData.medicineId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, medicineId: value }))}
              >
                <SelectTrigger data-testid="select-medicine">
                  <SelectValue placeholder="Select medicine..." />
                </SelectTrigger>
                <SelectContent>
                  {medicines.map((medicine: any) => (
                    <SelectItem key={medicine.id} value={medicine.id}>
                      {medicine.name} {medicine.strength}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dosage">Dosage</Label>
              <Input
                id="dosage"
                placeholder="e.g., 1 tablet twice daily"
                value={formData.dosage}
                onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                data-testid="input-dosage"
              />
            </div>

            <div>
              <Label htmlFor="frequency">Frequency</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}
              >
                <SelectTrigger data-testid="select-frequency">
                  <SelectValue placeholder="Select frequency..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once_daily">Once daily</SelectItem>
                  <SelectItem value="twice_daily">Twice daily</SelectItem>
                  <SelectItem value="three_times_daily">Three times daily</SelectItem>
                  <SelectItem value="as_needed">As needed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                placeholder="e.g., 30 days"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                data-testid="input-duration"
              />
            </div>

            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                data-testid="input-start-date"
              />
            </div>
          </div>

          <div>
            <Label>Reminder Times</Label>
            <div className="space-y-2">
              {formData.reminderTimes.map((time, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => updateReminderTime(index, e.target.value)}
                    className="flex-1"
                    data-testid={`input-reminder-time-${index}`}
                  />
                  {formData.reminderTimes.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeReminderTime(index)}
                      data-testid={`button-remove-reminder-${index}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addReminderTime}
                data-testid="button-add-reminder"
              >
                Add Reminder Time
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="instructions">Special Instructions</Label>
            <Textarea
              id="instructions"
              placeholder="Any special instructions for the patient..."
              value={formData.instructions}
              onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
              className="h-20"
              data-testid="textarea-instructions"
            />
          </div>

          <div className="flex space-x-3">
            <Button
              type="submit"
              disabled={createPrescriptionMutation.isPending}
              data-testid="button-create-prescription"
            >
              {createPrescriptionMutation.isPending ? "Creating..." : "Create Prescription"}
            </Button>
            <Button type="button" variant="outline" data-testid="button-save-draft">
              Save as Draft
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
