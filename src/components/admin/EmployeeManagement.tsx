import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Users, Shield, UserCheck } from "lucide-react";
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
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    phone: "",
    role: "employee" as "employee" | "manager"
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      // Fetch employee profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("employee_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles for these users
      const userIds = (profiles || []).map(p => p.user_id);
      
      if (userIds.length === 0) {
        setStaff([]);
        return;
      }

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*")
        .in("user_id", userIds)
        .in("role", ["employee", "manager"]);

      if (rolesError) throw rolesError;

      const staffMembers: StaffMember[] = (profiles || []).map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.user_id);
        return {
          ...profile,
          role: (userRole?.role as "employee" | "manager") || "employee"
        };
      });

      setStaff(staffMembers);
    } catch (error) {
      console.error("Error fetching staff:", error);
      toast.error("Failed to load staff members");
    }
  };

  const handleAddStaff = async () => {
    if (!formData.email || !formData.name) {
      toast.error("Please fill in email and name");
      return;
    }

    setLoading(true);
    try {
      // Look up user by email using edge function or direct auth lookup
      // Since we can't query auth.users directly from client, we'll use a workaround
      // The admin needs to provide the email of a user who has already signed up
      
      // Try to find if there's already an employee profile with this email
      // We need to use a different approach - store the email lookup via an edge function
      // For now, we'll use signInWithOtp to check if user exists, but better approach:
      // Just create the profile and role, the user_id will need to be found
      
      // Alternative: Use supabase admin API through edge function
      const { data: fnData, error: fnError } = await supabase.functions.invoke('manage-staff', {
        body: {
          action: 'add',
          email: formData.email.trim().toLowerCase(),
          name: formData.name,
          phone: formData.phone || null,
          role: formData.role
        }
      });

      if (fnError) {
        const errMsg = fnData?.error || fnError.message || "Failed to add staff member";
        throw new Error(errMsg);
      }
      if (fnData?.error) throw new Error(fnData.error);

      toast.success(`${formData.name} added as ${formData.role}!`);
      setIsAddDialogOpen(false);
      setFormData({ email: "", name: "", phone: "", role: "employee" });
      fetchStaff();
    } catch (error: any) {
      console.error("Error adding staff:", error);
      toast.error(error.message || "Failed to add staff member");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (member: StaffMember) => {
    try {
      const { error } = await supabase
        .from("employee_profiles")
        .update({ is_active: !member.is_active })
        .eq("id", member.id);

      if (error) throw error;

      toast.success(`${member.name} ${member.is_active ? 'deactivated' : 'activated'}`);
      fetchStaff();
    } catch (error) {
      console.error("Error toggling staff status:", error);
      toast.error("Failed to update staff status");
    }
  };

  const handleUpdateRole = async (member: StaffMember, newRole: "employee" | "manager") => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke('manage-staff', {
        body: {
          action: 'update-role',
          user_id: member.user_id,
          role: newRole
        }
      });

      if (fnError) throw fnError;
      if (fnData?.error) throw new Error(fnData.error);

      toast.success(`${member.name}'s role updated to ${newRole}`);
      fetchStaff();
    } catch (error: any) {
      console.error("Error updating role:", error);
      toast.error(error.message || "Failed to update role");
    }
  };

  const handleRemoveStaff = async (member: StaffMember) => {
    if (!confirm(`Remove ${member.name} from staff? They will lose all access.`)) return;

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke('manage-staff', {
        body: {
          action: 'remove',
          user_id: member.user_id
        }
      });

      if (fnError) throw fnError;
      if (fnData?.error) throw new Error(fnData.error);

      toast.success(`${member.name} removed from staff`);
      fetchStaff();
    } catch (error: any) {
      console.error("Error removing staff:", error);
      toast.error(error.message || "Failed to remove staff member");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-lg sm:text-2xl font-bold">{staff.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Managers</CardTitle>
            <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-lg sm:text-2xl font-bold">
              {staff.filter(s => s.role === "manager").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Active</CardTitle>
            <UserCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-lg sm:text-2xl font-bold">
              {staff.filter(s => s.is_active).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base sm:text-lg">Staff Members</CardTitle>
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2 w-full sm:w-auto" size="sm">
              <Plus className="h-4 w-4" />
              Add Staff
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-6 pt-0">
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No staff members yet. Add your first team member!
                    </TableCell>
                  </TableRow>
                ) : (
                  staff.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="p-2 sm:p-4">
                        <div>
                          <div className="font-medium text-xs sm:text-sm">{member.name}</div>
                          <div className="text-[10px] sm:text-xs text-muted-foreground sm:hidden">{member.phone || '-'}</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs sm:text-sm">{member.phone || '-'}</TableCell>
                      <TableCell className="p-2 sm:p-4">
                        <Select
                          value={member.role}
                          onValueChange={(value: "employee" | "manager") => handleUpdateRole(member, value)}
                        >
                          <SelectTrigger className="h-7 sm:h-8 text-[10px] sm:text-xs w-[90px] sm:w-[110px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="employee">Employee</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="p-2 sm:p-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={member.is_active}
                            onCheckedChange={() => handleToggleActive(member)}
                            className="scale-75 sm:scale-100"
                          />
                          <Badge
                            variant={member.is_active ? "default" : "secondary"}
                            className="text-[10px] sm:text-xs hidden xs:inline-flex"
                          >
                            {member.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right p-2 sm:p-4">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handleRemoveStaff(member)}
                          className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Staff Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm sm:text-base">Add Staff Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <p className="text-xs sm:text-sm text-muted-foreground">
              The staff member must have already signed up with this email address.
            </p>
            <div>
              <Label htmlFor="staff-email" className="text-xs sm:text-sm">Email Address *</Label>
              <Input
                id="staff-email"
                type="email"
                placeholder="staff@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-9 sm:h-10 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="staff-name" className="text-xs sm:text-sm">Full Name *</Label>
              <Input
                id="staff-name"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-9 sm:h-10 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="staff-phone" className="text-xs sm:text-sm">Phone (Optional)</Label>
              <Input
                id="staff-phone"
                placeholder="+254..."
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="h-9 sm:h-10 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="staff-role" className="text-xs sm:text-sm">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value: "employee" | "manager") => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger className="h-9 sm:h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee - Quick Sale & Orders only</SelectItem>
                  <SelectItem value="manager">Manager - Inventory & Sales access</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddStaff} className="w-full h-9 sm:h-10 text-sm" disabled={loading}>
              {loading ? "Adding..." : "Add Staff Member"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
