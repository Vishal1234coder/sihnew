import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthHeaders } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Pill, Clock, CheckCircle, XCircle, AlertCircle, Calendar } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface MedicineListProps {
  prescriptions: any[];
  patientId?: string;
}

export default function MedicineList({ prescriptions, patientId }: MedicineListProps) {
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [statusAction, setStatusAction] = useState<"taken" | "missed">("taken");

  const authHeaders = useAuthHeaders();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/medicine-status", data);
    },
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: `Medicine marked as ${statusAction}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/medicine-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsDialogOpen(false);
      setNotes("");
      setSelectedPrescription(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update medicine status",
        variant: "destructive",
      });
    },
  });

  const handleStatusUpdate = (prescription: any, status: "taken" | "missed") => {
    setSelectedPrescription(prescription);
    setStatusAction(status);
    setIsDialogOpen(true);
  };

  const confirmStatusUpdate = () => {
    if (!selectedPrescription) return;

    const statusData = {
      prescriptionId: selectedPrescription.id,
      scheduledTime: new Date().toISOString(), // In real app, this would be the scheduled time
      actualTime: statusAction === "taken" ? new Date().toISOString() : null,
      status: statusAction,
      notes: notes.trim() || null,
    };

    updateStatusMutation.mutate(statusData);
  };

  const formatReminderTimes = (times: string[]) => {
    return times.map(time => {
      const [hours, minutes] = time.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }).join(', ');
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (!prescriptions || prescriptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Pill className="w-5 h-5" />
            <span>My Medicines</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Pill className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No medicines prescribed yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activePrescriptions = prescriptions.filter(p => p.isActive);

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Pill className="w-5 h-5" />
              <span>Active Prescriptions ({activePrescriptions.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activePrescriptions.map((prescription) => (
                <Card key={prescription.id} className="border" data-testid={`medicine-card-${prescription.id}`}>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      {/* Medicine Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg text-foreground">
                            {prescription.medicine?.name || "Unknown Medicine"}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {prescription.medicine?.strength} • {prescription.medicine?.form}
                          </p>
                        </div>
                        <Badge variant="default" className="bg-emerald-100 text-emerald-700">
                          Active
                        </Badge>
                      </div>

                      {/* Dosage Information */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <Pill className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Dosage:</span>
                          <span className="font-medium">{prescription.dosage}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Times:</span>
                          <span className="font-medium">
                            {prescription.reminderTimes ? formatReminderTimes(prescription.reminderTimes) : "Not set"}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Days remaining:</span>
                          <span className="font-medium">{getDaysRemaining(prescription.endDate)} days</span>
                        </div>
                      </div>

                      {/* Instructions */}
                      {prescription.instructions && (
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <p className="text-sm text-blue-800">
                            <strong>Instructions:</strong> {prescription.instructions}
                          </p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(prescription, "taken")}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                          data-testid={`button-mark-taken-${prescription.id}`}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark as Taken
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleStatusUpdate(prescription, "missed")}
                          className="flex-1"
                          data-testid={`button-mark-missed-${prescription.id}`}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Mark as Missed
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Side Effects Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5" />
              <span>Important Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activePrescriptions.map((prescription) => {
                const medicine = prescription.medicine;
                if (!medicine || (!medicine.sideEffects?.length && !medicine.contraindications?.length)) {
                  return null;
                }

                return (
                  <div key={prescription.id} className="border rounded-lg p-4">
                    <h4 className="font-medium text-foreground mb-3">{medicine.name}</h4>
                    
                    {medicine.sideEffects?.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Possible Side Effects:</p>
                        <div className="flex flex-wrap gap-1">
                          {medicine.sideEffects.map((effect: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {effect}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {medicine.contraindications?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Contraindications:</p>
                        <div className="flex flex-wrap gap-1">
                          {medicine.contraindications.map((contraindication: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs bg-red-50 text-red-700">
                              {contraindication}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Update Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Mark Medicine as {statusAction === "taken" ? "Taken" : "Missed"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-3 rounded-lg">
              <p className="font-medium">{selectedPrescription?.medicine?.name}</p>
              <p className="text-sm text-muted-foreground">{selectedPrescription?.dosage}</p>
            </div>
            
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder={
                  statusAction === "taken" 
                    ? "Any observations after taking the medicine..."
                    : "Reason for missing the dose..."
                }
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-20"
                data-testid="textarea-status-notes"
              />
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={confirmStatusUpdate}
                disabled={updateStatusMutation.isPending}
                className={statusAction === "taken" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                data-testid="button-confirm-status"
              >
                {updateStatusMutation.isPending ? "Updating..." : `Mark as ${statusAction}`}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                data-testid="button-cancel-status"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
