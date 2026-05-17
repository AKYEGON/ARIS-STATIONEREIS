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
import { Trash2, Users, Shield, UserCheck, UserPlus, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RegisteredUser {
  id: string;
  email: string;
  created_at: string;
  email_confirmed_at: string | null;
  roles: string[];
  profile: {
    id: string;
    name: string;
    phone: string | null;
    is_active: boolean;
  } | null;
}

export const EmployeeManagement = () => {
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [approveDialogUser, setApproveDialogUser] = useState<RegisteredUser | null>(null);
  const [approveLoading, setApproveLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    role: "employee" as "employee" | "manager" | "agent"
  });
  const [agentZones, setAgentZones] = useState<{id: string; name: string}[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState("");

  useEffect(() => {
    fetchUsers();
    fetchAgentZones();
  }, []);

  const fetchAgentZones = async () => {
    const { data } = await supabase
      .from("agent_zones")
      .select("id, name")
      .eq("is_active", true)
      .order("display_order");
    if (data) setAgentZones(data);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-staff', {
        body: { action: 'list-users' }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setUsers(data.users || []);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const pendingUsers = users.filter(u => !u.roles.some(r => ["employee", "manager", "admin", "agent"].includes(r)));
  const staffMembers = users.filter(u => u.roles.some(r => ["employee", "manager", "agent"].includes(r)));

  const handleApprove = async () => {
    if (!approveDialogUser || !formData.name) {
      toast.error("Please enter the staff member's name");
      return;
    }

    if (formData.role === "agent" && !selectedZoneId) {
      toast.error("Please select a zone for the agent");
      return;
    }

    setApproveLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-staff', {
        body: {
          action: 'approve',
          user_id: approveDialogUser.id,
          name: formData.name,
          phone: formData.phone || null,
          role: formData.role,
          zone_id: formData.role === "agent" ? selectedZoneId : undefined,
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`${formData.name} approved as ${formData.role}!`);
      setApproveDialogUser(null);
      setFormData({ name: "", phone: "", role: "employee" });
      setSelectedZoneId("");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to approve user");
    } finally {
      setApproveLoading(false);
    }
  };

  const handleToggleActive = async (member: RegisteredUser) => {
    if (!member.profile) return;
    try {
      const { error } = await supabase
        .from("employee_profiles")
        .update({ is_active: !member.profile.is_active })
        .eq("user_id", member.id);

      if (error) throw error;
      toast.success(`${member.profile.name} ${member.profile.is_active ? 'deactivated' : 'activated'}`);
      fetchUsers();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleUpdateRole = async (member: RegisteredUser, newRole: "employee" | "manager" | "agent") => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-staff', {
        body: { action: 'update-role', user_id: member.id, role: newRole }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`Role updated to ${newRole}`);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to update role");
    }
  };

  const handleRemoveStaff = async (member: RegisteredUser) => {
    const name = member.profile?.name || member.email;
    if (!confirm(`Remove ${name} from staff? They will lose all access.`)) return;

    try {
      const { data, error } = await supabase.functions.invoke('manage-staff', {
        body: { action: 'remove', user_id: member.id }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`${name} removed from staff`);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to remove staff member");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Role privileges legend */}
      <Card className="border-primary/20">
        <CardHeader className="p-3 sm:p-4 pb-2">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Role Privileges
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-xs sm:text-sm">
          <div className="rounded-md border bg-muted/30 p-2.5">
            <div className="font-semibold text-primary mb-1">Admin</div>
            <p className="text-muted-foreground leading-snug">Full access. Sees cost &amp; profit. Manages team, products, bundles, reviews and settings.</p>
          </div>
          <div className="rounded-md border bg-muted/30 p-2.5">
            <div className="font-semibold text-primary mb-1">Manager</div>
            <p className="text-muted-foreground leading-snug">Orders, inventory (adjust stock), sales view and settings. No cost / profit. No team, products, bundles or reviews.</p>
          </div>
          <div className="rounded-md border bg-muted/30 p-2.5">
            <div className="font-semibold text-primary mb-1">Employee</div>
            <p className="text-muted-foreground leading-snug">Orders &amp; Quick Sale only. Cannot adjust stock or see any financial analytics.</p>
          </div>
          <div className="rounded-md border bg-muted/30 p-2.5">
            <div className="font-semibold text-primary mb-1">Agent</div>
            <p className="text-muted-foreground leading-snug">View &amp; update only orders inside their assigned zone. No Quick Sale, no inventory, no financials.</p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-lg sm:text-2xl font-bold">{staffMembers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Pending</CardTitle>
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-lg sm:text-2xl font-bold text-primary">{pendingUsers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Managers</CardTitle>
            <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-lg sm:text-2xl font-bold">
              {staffMembers.filter(s => s.roles.includes("manager")).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approval Section */}
      {pendingUsers.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" />
              Pending Approval ({pendingUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-6 pt-0">
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead className="hidden sm:table-cell">Signed Up</TableHead>
                    <TableHead className="text-right w-[100px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="p-2 sm:p-4">
                        <div className="text-xs sm:text-sm font-medium">{user.email}</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground sm:hidden">
                          {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs sm:text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right p-2 sm:p-4">
                        <Button
                          size="sm"
                          onClick={() => {
                            setApproveDialogUser(user);
                            setFormData({ name: "", phone: "", role: "employee" });
                          }}
                          className="h-7 sm:h-8 text-xs sm:text-sm gap-1"
                        >
                          <UserCheck className="h-3 w-3" />
                          Approve
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Staff */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Staff Members</CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-6 pt-0">
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      {loading ? "Loading..." : "No staff members yet. Approve pending users above!"}
                    </TableCell>
                  </TableRow>
                ) : (
                  staffMembers.map((member) => {
                    const currentRole = member.roles.includes("manager") ? "manager" : member.roles.includes("agent") ? "agent" : "employee";
                    return (
                      <TableRow key={member.id}>
                        <TableCell className="p-2 sm:p-4">
                          <div>
                            <div className="font-medium text-xs sm:text-sm">{member.profile?.name || "—"}</div>
                            <div className="text-[10px] sm:text-xs text-muted-foreground sm:hidden">{member.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-xs sm:text-sm">{member.email}</TableCell>
                        <TableCell className="p-2 sm:p-4">
                          <Select
                            value={currentRole}
                            onValueChange={(value: "employee" | "manager" | "agent") => handleUpdateRole(member, value)}
                          >
                            <SelectTrigger className="h-7 sm:h-8 text-[10px] sm:text-xs w-[90px] sm:w-[110px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="employee">Employee</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="agent">Agent</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="p-2 sm:p-4">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={member.profile?.is_active ?? false}
                              onCheckedChange={() => handleToggleActive(member)}
                              className="scale-75 sm:scale-100"
                            />
                            <Badge
                              variant={member.profile?.is_active ? "default" : "secondary"}
                              className="text-[10px] sm:text-xs hidden xs:inline-flex"
                            >
                              {member.profile?.is_active ? "Active" : "Inactive"}
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
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={!!approveDialogUser} onOpenChange={(open) => !open && setApproveDialogUser(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm sm:text-base">Approve Staff Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Approving <span className="font-medium text-foreground">{approveDialogUser?.email}</span> as staff.
            </p>
            <div>
              <Label htmlFor="approve-name" className="text-xs sm:text-sm">Display Name *</Label>
              <Input
                id="approve-name"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-9 sm:h-10 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="approve-phone" className="text-xs sm:text-sm">Phone (Optional)</Label>
              <Input
                id="approve-phone"
                placeholder="+254..."
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="h-9 sm:h-10 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="approve-role" className="text-xs sm:text-sm">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value: "employee" | "manager" | "agent") => {
                  setFormData({ ...formData, role: value });
                  if (value !== "agent") setSelectedZoneId("");
                }}
              >
                <SelectTrigger className="h-9 sm:h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee - Quick Sale & Orders only</SelectItem>
                  <SelectItem value="manager">Manager - Inventory & Sales access</SelectItem>
                  <SelectItem value="agent">Agent - Zone-based order access</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.role === "agent" && (
              <div>
                <Label className="text-xs sm:text-sm">Assign Zone *</Label>
                <Select value={selectedZoneId} onValueChange={setSelectedZoneId}>
                  <SelectTrigger className="h-9 sm:h-10 text-sm">
                    <SelectValue placeholder="Select agent zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {agentZones.map(z => (
                      <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button onClick={handleApprove} className="w-full h-9 sm:h-10 text-sm" disabled={approveLoading}>
              {approveLoading ? "Approving..." : "Approve & Set Role"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
