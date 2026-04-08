import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, MapPin } from "lucide-react";
import { toast } from "sonner";

interface AgentZone {
  id: string;
  name: string;
  is_active: boolean;
  display_order: number;
}

export const AgentZoneManager = () => {
  const [zones, setZones] = useState<AgentZone[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchZones = async () => {
    const { data, error } = await supabase
      .from("agent_zones")
      .select("*")
      .order("display_order", { ascending: true });
    if (error) toast.error("Failed to load agent zones");
    else setZones(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchZones(); }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const { error } = await supabase.from("agent_zones").insert({
      name: newName.trim(),
      display_order: zones.length,
    });
    if (error) toast.error("Failed to add zone");
    else { toast.success("Zone added"); setNewName(""); fetchZones(); }
  };

  const handleToggle = async (zone: AgentZone) => {
    const { error } = await supabase
      .from("agent_zones")
      .update({ is_active: !zone.is_active })
      .eq("id", zone.id);
    if (error) toast.error("Failed to update");
    else fetchZones();
  };

  const handleDelete = async (zone: AgentZone) => {
    if (!confirm(`Delete zone "${zone.name}"?`)) return;
    const { error } = await supabase.from("agent_zones").delete().eq("id", zone.id);
    if (error) toast.error("Failed to delete zone");
    else { toast.success("Zone deleted"); fetchZones(); }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading zones...</p>;

  return (
    <Card>
      <CardHeader className="p-3 sm:p-6">
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Agent Zones
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-0 space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="New zone name (e.g. Nairobi CBD)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="h-9 text-sm"
          />
          <Button size="sm" onClick={handleAdd} className="h-9 gap-1">
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Zone Name</TableHead>
              <TableHead className="w-20">Active</TableHead>
              <TableHead className="w-16 text-right">Del</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {zones.map((zone) => (
              <TableRow key={zone.id}>
                <TableCell className="text-sm font-medium">{zone.name}</TableCell>
                <TableCell>
                  <Switch checked={zone.is_active} onCheckedChange={() => handleToggle(zone)} className="scale-75" />
                </TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(zone)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {zones.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                  No agent zones yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
