import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, GraduationCap, MapPin, Store } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface University {
  id: string;
  name: string;
  is_active: boolean;
  display_order: number;
}

interface Branch {
  id: string;
  university_id: string;
  name: string;
  is_active: boolean;
  display_order: number;
}

interface Outlet {
  id: string;
  name: string;
  location: string | null;
  is_active: boolean;
  display_order: number;
}

export const CheckoutOptionsManager = () => {
  const [universities, setUniversities] = useState<University[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [newUni, setNewUni] = useState("");
  const [newBranch, setNewBranch] = useState("");
  const [selectedUniId, setSelectedUniId] = useState<string>("");
  const [newOutlet, setNewOutlet] = useState("");
  const [newOutletLocation, setNewOutletLocation] = useState("");

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const [uniRes, branchRes, outletRes] = await Promise.all([
      supabase.from("universities").select("*").order("display_order"),
      supabase.from("campus_branches").select("*").order("display_order"),
      supabase.from("pickup_outlets").select("*").order("display_order"),
    ]);
    if (uniRes.data) {
      setUniversities(uniRes.data as University[]);
      if (!selectedUniId && uniRes.data.length > 0) setSelectedUniId(uniRes.data[0].id);
    }
    if (branchRes.data) setBranches(branchRes.data as Branch[]);
    if (outletRes.data) setOutlets(outletRes.data as Outlet[]);
  };

  const addUniversity = async () => {
    if (!newUni.trim()) return;
    const { error } = await supabase.from("universities").insert({ name: newUni.trim(), display_order: universities.length });
    if (error) { toast.error(error.message); return; }
    toast.success("University added");
    setNewUni("");
    fetchAll();
  };

  const toggleUni = async (id: string, is_active: boolean) => {
    await supabase.from("universities").update({ is_active: !is_active }).eq("id", id);
    fetchAll();
  };

  const deleteUni = async (id: string) => {
    await supabase.from("universities").delete().eq("id", id);
    toast.success("University deleted");
    fetchAll();
  };

  const addBranch = async () => {
    if (!newBranch.trim() || !selectedUniId) return;
    const uniBranches = branches.filter(b => b.university_id === selectedUniId);
    const { error } = await supabase.from("campus_branches").insert({ 
      university_id: selectedUniId, name: newBranch.trim(), display_order: uniBranches.length 
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Branch added");
    setNewBranch("");
    fetchAll();
  };

  const toggleBranch = async (id: string, is_active: boolean) => {
    await supabase.from("campus_branches").update({ is_active: !is_active }).eq("id", id);
    fetchAll();
  };

  const deleteBranch = async (id: string) => {
    await supabase.from("campus_branches").delete().eq("id", id);
    toast.success("Branch deleted");
    fetchAll();
  };

  const addOutlet = async () => {
    if (!newOutlet.trim()) return;
    const { error } = await supabase.from("pickup_outlets").insert({ 
      name: newOutlet.trim(), location: newOutletLocation.trim() || null, display_order: outlets.length 
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Outlet added");
    setNewOutlet("");
    setNewOutletLocation("");
    fetchAll();
  };

  const toggleOutlet = async (id: string, is_active: boolean) => {
    await supabase.from("pickup_outlets").update({ is_active: !is_active }).eq("id", id);
    fetchAll();
  };

  const deleteOutlet = async (id: string) => {
    await supabase.from("pickup_outlets").delete().eq("id", id);
    toast.success("Outlet deleted");
    fetchAll();
  };

  const filteredBranches = branches.filter(b => b.university_id === selectedUniId);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="universities">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="universities" className="gap-1.5">
            <GraduationCap className="h-4 w-4" />
            <span className="hidden sm:inline">Universities</span>
          </TabsTrigger>
          <TabsTrigger value="branches" className="gap-1.5">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Branches</span>
          </TabsTrigger>
          <TabsTrigger value="outlets" className="gap-1.5">
            <Store className="h-4 w-4" />
            <span className="hidden sm:inline">Outlets</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="universities">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Universities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="New university name" value={newUni} onChange={e => setNewUni(e.target.value)} onKeyDown={e => e.key === "Enter" && addUniversity()} />
                <Button onClick={addUniversity} size="sm"><Plus className="h-4 w-4" /></Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-20">Active</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {universities.map(u => (
                    <TableRow key={u.id}>
                      <TableCell>{u.name}</TableCell>
                      <TableCell><Switch checked={u.is_active} onCheckedChange={() => toggleUni(u.id, u.is_active)} /></TableCell>
                      <TableCell><Button variant="ghost" size="icon" onClick={() => deleteUni(u.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branches">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Campus Branches</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <select className="border rounded-md px-3 py-2 text-sm bg-background" value={selectedUniId} onChange={e => setSelectedUniId(e.target.value)}>
                  {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <div className="flex gap-2 flex-1">
                  <Input placeholder="New branch name" value={newBranch} onChange={e => setNewBranch(e.target.value)} onKeyDown={e => e.key === "Enter" && addBranch()} />
                  <Button onClick={addBranch} size="sm"><Plus className="h-4 w-4" /></Button>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Branch</TableHead>
                    <TableHead className="w-20">Active</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBranches.map(b => (
                    <TableRow key={b.id}>
                      <TableCell>{b.name}</TableCell>
                      <TableCell><Switch checked={b.is_active} onCheckedChange={() => toggleBranch(b.id, b.is_active)} /></TableCell>
                      <TableCell><Button variant="ghost" size="icon" onClick={() => deleteBranch(b.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                    </TableRow>
                  ))}
                  {filteredBranches.length === 0 && (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No branches yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outlets">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pickup Outlets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <Input placeholder="Outlet name" value={newOutlet} onChange={e => setNewOutlet(e.target.value)} />
                <Input placeholder="Location (optional)" value={newOutletLocation} onChange={e => setNewOutletLocation(e.target.value)} onKeyDown={e => e.key === "Enter" && addOutlet()} />
                <Button onClick={addOutlet} size="sm"><Plus className="h-4 w-4" /></Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="w-20">Active</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outlets.map(o => (
                    <TableRow key={o.id}>
                      <TableCell>{o.name}</TableCell>
                      <TableCell className="text-muted-foreground">{o.location || "—"}</TableCell>
                      <TableCell><Switch checked={o.is_active} onCheckedChange={() => toggleOutlet(o.id, o.is_active)} /></TableCell>
                      <TableCell><Button variant="ghost" size="icon" onClick={() => deleteOutlet(o.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                    </TableRow>
                  ))}
                  {outlets.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No outlets yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
