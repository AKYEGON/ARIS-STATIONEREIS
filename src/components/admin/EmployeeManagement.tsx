import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { UserPlus, Users, Shield, Trash2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StaffMember {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  role: "employee" | "manager";
  email?: string;
}

export const EmployeeManagement = () => {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    phone: "",
    role: "employee" as "employee" | "manager"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      // Fetch employee profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("employee_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // For each profile, get their role
      const staffWithRoles: StaffMember[] = [];
      
      for (const profile of profiles || []) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", profile.user_id)
          .in("role", ["employee", "manager"])
          .single();

        if (roleData) {
          staffWithRoles.push({
            ...profile,
            role: roleData.role as "employee" | "manager"
          });
        }
      }

      setStaffList(staffWithRoles);
    } catch (error) {
      console.error("Error fetching staff:", error);
      toast.error("Failed to load staff members");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStaff = async () => {
    if (!formData.email || !formData.name) {
      toast.error("Please enter email and name");
      return;
    }

    setIsSubmitting(true);
    try {
      // First, find the user by email using admin API or by looking up auth.users
      // Since we can't directly query auth.users from client, we need to use a different approach
      // The user must have already signed up, and we'll use their email to find them
      
      // For now, let's create a simplified flow where admin enters the user_id directly
      // or we can use edge function to look up user by email
      
      // Alternative: Check if user exists by trying to get their profile
      // This is a workaround - in production you'd want an edge function for this
      
      // For MVP, we'll ask admin to get user_id from the authentication logs
      // or implement a lookup edge function
      
      toast.error("To add staff, the user must first sign up at /auth. After they sign up, get their user ID from the logs and use it here.");
      
      // Placeholder for when we have edge function
      // const { data, error } = await supabase.functions.invoke('lookup-user-by-email', {
      //   body: { email: formData.email }
      // });

      setIsSubmitting(false);
      return;

    } catch (error) {
      console.error("Error adding staff:", error);
      toast.error("Failed to add staff member");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddStaffByUserId = async (userId: string) => {
    if (!userId || !formData.name) {
      toast.error("Please enter user ID and name");
      return;
    }

    setIsSubmitting(true);
    try {
      // Insert into user_roles
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: userId,
          role: formData.role
        });

      if (roleError) {
        if (roleError.code === "23505") {
          toast.error("This user already has a role assigned");
        } else {
          throw roleError;
        }
        return;
      }

      // Insert into employee_profiles
      const { error: profileError } = await supabase
        .from("employee_profiles")
        .insert({
          user_id: userId,
          name: formData.name,
          phone: formData.phone || null,
          is_active: true
        });

      if (profileError) throw profileError;

      toast.success(`${formData.role === "manager" ? "Manager" : "Employee"} added successfully!`);
      setIsAddDialogOpen(false);
      setFormData({ email: "", name: "", phone: "", role: "employee" });
      fetchStaff();
    } catch (error) {
      console.error("Error adding staff:", error);
      toast.error("Failed to add staff member");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStaffActive = async (staff: StaffMember) => {
    try {
      const { error } = await supabase
        .from("employee_profiles")
        .update({ is_active: !staff.is_active })
        .eq("id", staff.id);

      if (error) throw error;

      toast.success(staff.is_active ? "Staff member deactivated" : "Staff member activated");
      fetchStaff();
    } catch (error) {
      console.error("Error toggling staff status:", error);
      toast.error("Failed to update staff status");
    }
  };

  const updateStaffRole = async (staff: StaffMember, newRole: "employee" | "manager") => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", staff.user_id);

      if (error) throw error;

      toast.success(`Role updated to ${newRole}`);
      fetchStaff();
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update role");
    }
  };

  const removeStaff = async (staff: StaffMember) => {
    if (!confirm(`Remove ${staff.name} from staff? They will lose access to the admin panel.`)) {
      return;
    }

    try {
      // Delete from user_roles
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", staff.user_id)
        .in("role", ["employee", "manager"]);

      // Delete from employee_profiles
      const { error } = await supabase
        .from("employee_profiles")
        .delete()
        .eq("id", staff.id);

      if (error) throw error;

      toast.success("Staff member removed");
      fetchStaff();
    } catch (error) {
      console.error("Error removing staff:", error);
      toast.error("Failed to remove staff member");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-semibold">Team Management</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">Add and manage staff access</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={fetchStaff}
            disabled={isLoading}
            className="gap-2"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 flex-1 sm:flex-none" size="sm">
                <UserPlus className="h-4 w-4" />
                Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Staff Member</DialogTitle>
                <DialogDescription>
                  The user must have already signed up at /auth before you can add them as staff.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="user-id">User ID *</Label>
                  <Input
                    id="user-id"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Paste user UUID from sign-up"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    User ID is shown in browser console after they sign up
                  </p>
                </div>
                <div>
                  <Label htmlFor="name">Display Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Staff member's name"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: "employee" | "manager") => 
                      setFormData({ ...formData, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">
                        <div className="flex flex-col items-start">
                          <span>Employee</span>
                          <span className="text-xs text-muted-foreground">Quick Sale & Orders only</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="manager">
                        <div className="flex flex-col items-start">
                          <span>Manager</span>
                          <span className="text-xs text-muted-foreground">Orders, Inventory & Sales (no profit data)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => handleAddStaffByUserId(formData.email)}
                  disabled={isSubmitting || !formData.email || !formData.name}
                  className="w-full"
                >
                  {isSubmitting ? "Adding..." : "Add Staff Member"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Staff
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staffList.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Managers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {staffList.filter(s => s.role === "manager").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {staffList.filter(s => s.role === "employee").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Staff Members</CardTitle>
          <CardDescription>Manage access and roles for your team</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Loading staff...</p>
          ) : staffList.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No staff members yet. Add your first team member above.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffList.map((staff) => (
                    <TableRow key={staff.id}>
                      <TableCell className="font-medium">{staff.name}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {staff.phone || "-"}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={staff.role}
                          onValueChange={(value: "employee" | "manager") => 
                            updateStaffRole(staff, value)
                          }
                        >
                          <SelectTrigger className="w-[110px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="employee">Employee</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={staff.is_active}
                            onCheckedChange={() => toggleStaffActive(staff)}
                          />
                          <Badge variant={staff.is_active ? "default" : "secondary"}>
                            {staff.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeStaff(staff)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
