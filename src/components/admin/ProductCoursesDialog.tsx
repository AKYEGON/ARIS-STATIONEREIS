import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Faculty { id: string; name: string; display_order: number; }
interface Course { id: string; name: string; faculty_id: string; display_order: number; }

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  productId: string | null;
  productName?: string;
}

export const ProductCoursesDialog = ({ open, onOpenChange, productId, productName }: Props) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [initial, setInitial] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open || !productId) return;
    (async () => {
      setLoading(true);
      const [{ data: fac }, { data: crs }, { data: cp }] = await Promise.all([
        supabase.from("faculties").select("id,name,display_order").eq("is_active", true).order("display_order"),
        supabase.from("courses").select("id,name,faculty_id,display_order").eq("is_active", true).order("display_order"),
        supabase.from("course_products").select("course_id").eq("product_id", productId),
      ]);
      setFaculties(fac || []);
      setCourses(crs || []);
      const init = new Set<string>((cp || []).map((r: any) => r.course_id));
      setInitial(init);
      setSelected(new Set(init));
      setLoading(false);
    })();
  }, [open, productId]);

  const term = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    const grouped: Record<string, Course[]> = {};
    for (const c of courses) {
      const fac = faculties.find((f) => f.id === c.faculty_id);
      const matches = !term || c.name.toLowerCase().includes(term) || (fac?.name.toLowerCase().includes(term) ?? false);
      if (!matches) continue;
      (grouped[c.faculty_id] ||= []).push(c);
    }
    return grouped;
  }, [courses, faculties, term]);

  const visibleCourseIds = useMemo(() => {
    const ids: string[] = [];
    Object.values(filtered).forEach((arr) => arr.forEach((c) => ids.push(c.id)));
    return ids;
  }, [filtered]);

  const toggleCourse = (id: string, on: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id); else next.delete(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      visibleCourseIds.forEach((id) => next.add(id));
      return next;
    });
  };
  const clearVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      visibleCourseIds.forEach((id) => next.delete(id));
      return next;
    });
  };

  const toggleCollapse = (fid: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(fid)) next.delete(fid); else next.add(fid);
      return next;
    });
  };

  const handleSave = async () => {
    if (!productId) return;
    const toAdd = [...selected].filter((id) => !initial.has(id));
    const toRemove = [...initial].filter((id) => !selected.has(id));
    if (toAdd.length === 0 && toRemove.length === 0) {
      onOpenChange(false);
      return;
    }
    setSaving(true);
    try {
      if (toRemove.length) {
        // Find course_products rows to remove, then cascade course_product_years
        const { data: cpRows } = await supabase
          .from("course_products")
          .select("id")
          .eq("product_id", productId)
          .in("course_id", toRemove);
        const cpIds = (cpRows || []).map((r: any) => r.id);
        if (cpIds.length) {
          await supabase.from("course_product_years").delete().in("course_product_id", cpIds);
          await supabase.from("course_products").delete().in("id", cpIds);
        }
      }
      if (toAdd.length) {
        const rows = toAdd.map((cid) => ({ course_id: cid, product_id: productId }));
        const { error } = await supabase.from("course_products").insert(rows);
        if (error) throw error;
      }
      toast.success(`Updated: +${toAdd.length} / -${toRemove.length} courses`);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="truncate">Manage courses{productName ? `: ${productName}` : ""}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search faculties or courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <Badge variant="secondary">In {selected.size} course{selected.size === 1 ? "" : "s"}</Badge>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={selectAllVisible} disabled={loading}>Select all visible</Button>
              <Button size="sm" variant="outline" onClick={clearVisible} disabled={loading}>Clear visible</Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto border rounded-md divide-y">
            {loading ? (
              <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : faculties.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">No faculties.</p>
            ) : (
              faculties.map((f) => {
                const list = filtered[f.id];
                if (!list || list.length === 0) return null;
                const selCount = list.filter((c) => selected.has(c.id)).length;
                const isCollapsed = collapsed.has(f.id);
                return (
                  <div key={f.id}>
                    <button
                      type="button"
                      onClick={() => toggleCollapse(f.id)}
                      className="w-full flex items-center justify-between px-3 py-2 bg-muted/50 hover:bg-muted text-left"
                    >
                      <div className="flex items-center gap-2 font-medium text-sm">
                        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        {f.name}
                      </div>
                      <Badge variant={selCount > 0 ? "default" : "outline"} className="text-[10px]">
                        {selCount} / {list.length}
                      </Badge>
                    </button>
                    {!isCollapsed && (
                      <div className="py-1">
                        {list.map((c) => (
                          <label key={c.id} className="flex items-center gap-3 px-5 py-2 hover:bg-muted/30 cursor-pointer">
                            <Checkbox
                              checked={selected.has(c.id)}
                              onCheckedChange={(v) => toggleCourse(c.id, !!v)}
                            />
                            <span className="text-sm">{c.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
