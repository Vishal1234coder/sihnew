import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthHeaders, useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Edit, Search, Mail, Phone, UserCheck, User as UserIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface UserFormData {
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
}

interface UserManagementProps {
  userType?: "doctor" | "patient";
  hospitalId?: string;
}

export default function UserManagement({ userType, hospitalId }: UserManagementProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    email: "",
    phoneNumber: "",
    role: userType || "hospital_admin",
  });

  const { user } = useAuth();
  const authHeaders = useAuthHeaders();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["/api/users", userType || "all"],
    queryFn: async () => {
      let url = "/api/users";
      if (userType) {
        url += `?role=${userType}`;
      }
      const response = await fetch(url, { headers: authHeaders });
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const userResponse = await apiRequest("POST", "/api/users", data);
      const newUser = await userResponse.json();
      
      // If creating a doctor or patient, create the additional record
      if (data.role === "doctor" && hospitalId) {
        await apiRequest("POST", "/api/doctors", {
          userId: newUser.id,
          hospitalId,
          specialization: "General Medicine", // Default specialization
          licenseNumber: `LIC-${Date.now()}`, // Generate temporary license number
        });
      } else if (data.role === "patient" && hospitalId) {
        await apiRequest("POST", "/api/patients", {
          userId: newUser.id,
          hospitalId,
          dateOfBirth: new Date().toISOString(), // Default DOB
          gender: "male", // Default gender
        });
      }
      
      return newUser;
    },
    onSuccess: () => {
      toast({
        title: "User created",
        description: `${userType ? userType.charAt(0).toUpperCase() + userType.slice(1) : "User"} has been created successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/doctors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phoneNumber: "",
      role: userType || "hospital_admin",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(formData);
  };

  const filteredUsers = users.filter((user: any) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "doctor":
        return <UserCheck className="w-4 h-4" />;
      case "patient":
        return <UserIcon className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-purple-100 text-purple-700";
      case "hospital_admin":
        return "bg-blue-100 text-blue-700";
      case "doctor":
        return "bg-emerald-100 text-emerald-700";
      case "patient":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getTitle = () => {
    if (userType === "doctor") return "Doctor Management";
    if (userType === "patient") return "Patient Management";
    return "User Management";
  };

  const getAddButtonText = () => {
    if (userType === "doctor") return "Add Doctor";
    if (userType === "patient") return "Add Patient";
    return "Add User";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>{getTitle()}</span>
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} data-testid={`button-add-${userType || "user"}`}>
                <Plus className="w-4 h-4 mr-2" />
                {getAddButtonText()}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{getAddButtonText()}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    data-testid="input-user-name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                    data-testid="input-user-email"
                  />
                </div>
                <div>
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    data-testid="input-user-phone"
                  />
                </div>
                {!userType && (
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                    >
                      <SelectTrigger data-testid="select-user-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {user?.role === "super_admin" && (
                          <>
                            <SelectItem value="hospital_admin">Hospital Admin</SelectItem>
                            <SelectItem value="doctor">Doctor</SelectItem>
                            <SelectItem value="patient">Patient</SelectItem>
                          </>
                        )}
                        {user?.role === "hospital_admin" && (
                          <>
                            <SelectItem value="doctor">Doctor</SelectItem>
                            <SelectItem value="patient">Patient</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex space-x-3">
                  <Button
                    type="submit"
                    disabled={createUserMutation.isPending}
                    data-testid="button-save-user"
                  >
                    {createUserMutation.isPending ? "Creating..." : getAddButtonText()}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    data-testid="button-cancel-user"
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
            placeholder={`Search ${userType || "users"}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search-users"
          />
        </div>

        {/* Users List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm 
                ? `No ${userType || "users"} found matching your search` 
                : `No ${userType || "users"} added yet`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((user: any) => (
              <Card key={user.id} className="border" data-testid={`user-card-${user.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        {getRoleIcon(user.role)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{user.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Mail className="w-3 h-3" />
                            <span>{user.email}</span>
                          </div>
                          {user.phoneNumber && (
                            <div className="flex items-center space-x-1">
                              <Phone className="w-3 h-3" />
                              <span>{user.phoneNumber}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getRoleColor(user.role)}>
                        {user.role.replace("_", " ").toUpperCase()}
                      </Badge>
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
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
