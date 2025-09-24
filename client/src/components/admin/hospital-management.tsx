import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthHeaders } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Hospital, Plus, Edit, Search, Phone, MapPin, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface HospitalFormData {
  name: string;
  address: string;
  phoneNumber: string;
  adminId: string;
}

export default function HospitalManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHospital, setEditingHospital] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<HospitalFormData>({
    name: "",
    address: "",
    phoneNumber: "",
    adminId: "",
  });

  const authHeaders = useAuthHeaders();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: hospitals = [], isLoading } = useQuery({
    queryKey: ["/api/hospitals"],
    queryFn: async () => {
      const response = await fetch("/api/hospitals", { headers: authHeaders });
      if (!response.ok) throw new Error("Failed to fetch hospitals");
      return response.json();
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users", "hospital_admin"],
    queryFn: async () => {
      const response = await fetch("/api/users?role=hospital_admin", { headers: authHeaders });
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
  });

  const createHospitalMutation = useMutation({
    mutationFn: async (data: HospitalFormData) => {
      return apiRequest("POST", "/api/hospitals", data);
    },
    onSuccess: () => {
      toast({
        title: "Hospital created",
        description: "Hospital has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/hospitals"] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create hospital",
        variant: "destructive",
      });
    },
  });

  const updateHospitalMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<HospitalFormData> }) => {
      return apiRequest("PUT", `/api/hospitals/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Hospital updated",
        description: "Hospital has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/hospitals"] });
      setIsDialogOpen(false);
      setEditingHospital(null);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update hospital",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      phoneNumber: "",
      adminId: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingHospital) {
      updateHospitalMutation.mutate({ id: editingHospital.id, data: formData });
    } else {
      createHospitalMutation.mutate(formData);
    }
  };

  const handleEdit = (hospital: any) => {
    setEditingHospital(hospital);
    setFormData({
      name: hospital.name,
      address: hospital.address,
      phoneNumber: hospital.phoneNumber,
      adminId: hospital.adminId || "",
    });
    setIsDialogOpen(true);
  };

  const filteredHospitals = hospitals.filter((hospital: any) =>
    hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hospital.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAdminName = (adminId: string) => {
    const admin = users.find((user: any) => user.id === adminId);
    return admin?.name || "Unassigned";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Hospital className="w-5 h-5" />
            <span>Hospital Management</span>
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} data-testid="button-add-hospital">
                <Plus className="w-4 h-4 mr-2" />
                Add Hospital
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingHospital ? "Edit Hospital" : "Add New Hospital"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Hospital Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    data-testid="input-hospital-name"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    required
                    data-testid="input-hospital-address"
                  />
                </div>
                <div>
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    required
                    data-testid="input-hospital-phone"
                  />
                </div>
                <div>
                  <Label htmlFor="adminId">Hospital Admin</Label>
                  <Select
                    value={formData.adminId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, adminId: value }))}
                  >
                    <SelectTrigger data-testid="select-hospital-admin">
                      <SelectValue placeholder="Select admin..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No admin assigned</SelectItem>
                      {users.map((user: any) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex space-x-3">
                  <Button
                    type="submit"
                    disabled={createHospitalMutation.isPending || updateHospitalMutation.isPending}
                    data-testid="button-save-hospital"
                  >
                    {createHospitalMutation.isPending || updateHospitalMutation.isPending
                      ? "Saving..."
                      : editingHospital ? "Update Hospital" : "Create Hospital"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    data-testid="button-cancel-hospital"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="mb-6 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search hospitals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search-hospitals"
          />
        </div>

        {/* Hospitals List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : filteredHospitals.length === 0 ? (
          <div className="text-center py-12">
            <Hospital className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? "No hospitals found matching your search" : "No hospitals added yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHospitals.map((hospital: any) => (
              <Card key={hospital.id} className="border" data-testid={`hospital-card-${hospital.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">{hospital.name}</h3>
                        <Badge variant={hospital.isActive ? "default" : "secondary"}>
                          {hospital.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span>{hospital.address}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4" />
                          <span>{hospital.phoneNumber}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>Admin: {getAdminName(hospital.adminId)}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(hospital)}
                      data-testid={`button-edit-hospital-${hospital.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
