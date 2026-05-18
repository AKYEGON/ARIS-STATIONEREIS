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
interface CourseYear { id: string; course_id: string; label: string; }

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  productId: string | null;
  productName?: string;
}

const norm = (s: string) => s.trim().toLowerCase();

export const ProductCoursesDialog = ({ open, onOpenChange, productId, productName }: Props) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [allYears, setAllYears] = useState<CourseYear[]>([]); // active years across all courses
  const [initial, setInitial] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // initial year-label tags per course (label keys, lowercased) for this product
  const [initialLabelsByCourse, setInitialLabelsByCourse] = useState<Record<string, Set<string>>>({});
  // labels chosen to apply across all currently-selected courses
  const [chosenLabels, setChosenLabels] = useState<Set<string>>(new Set()); // lowercase keys
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open || !productId) return;
    (async () => {
      setLoading(true);
      const [{ data: fac }, { data: crs }, { data: yrs }, { data: cp }] = await Promise.all([
        supabase.from("faculties").select("id,name,display_order").eq("is_active", true).order("display_order"),
        supabase.from("courses").select("id,name,faculty_id,display_order").eq("is_active", true).order("display_order"),
        supabase.from("course_years").select("id,course_id,label").eq("is_active", true).order("display_order"),
        supabase.from("course_products").select("id,course_id").eq("product_id", productId),
      ]);
      setFaculties(fac || []);
      setCourses(crs || []);
      setAllYears(yrs || []);
      const init = new Set<string>((cp || []).map((r: any) => r.course_id));
      setInitial(init);
      setSelected(new Set(init));

      // Load existing year tags for this product
      const cpRows = cp || [];
      const cpIds = cpRows.map((r: any) => r.id);
      const courseByCp: Record<string, string> = {};
      cpRows.forEach((r: any) => { courseByCp[r.id] = r.course_id; });
      const labelsByCourse: Record<string, Set<string>> = {};
      if (cpIds.length) {
        const { data: tagRows } = await supabase
          .from("course_product_years")
          .select("course_product_id,course_year_id")
          .in("course_product_id", cpIds);
        const yearById: Record<string, CourseYear> = {};
        (yrs || []).forEach((y: any) => { yearById[y.id] = y; });
        (tagRows || []).forEach((r: any) => {
          const cid = courseByCp[r.course_product_id];
          const y = yearById[r.course_year_id];
          if (!cid || !y) return;
          (labelsByCourse[cid] ||= new Set()).add(norm(y.label));
        });
      }
      setInitialLabelsByCourse(labelsByCourse);

      // Seed chosenLabels with labels that appear in ALL currently-tagged courses (most likely user intent)
      const taggedCourseIds = Object.keys(labelsByCourse);
      if (taggedCourseIds.length > 0) {
        const intersection = [...labelsByCourse[taggedCourseIds[0]]].filter((l) =>
          taggedCourseIds.every((cid) => labelsByCourse[cid].has(l))
        );
        setChosenLabels(new Set(intersection));
      } else {
        setChosenLabels(new Set());
      }
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

  // Year labels available across currently-selected courses
  const availableLabels = useMemo(() => {
    const map: Map<string, string> = new Map(); // key -> displayLabel
    allYears.forEach((y) => {
      if (selected.has(y.course_id)) map.set(norm(y.label), y.label);
    });
    return Array.from(map.entries()).map(([key, label]) => ({ key, label }));
  }, [allYears, selected]);

  const toggleCourse = (id: string, on: boolean) =>
    setSelected((p) => { const n = new Set(p); on ? n.add(id) : n.delete(id); return n; });

  const selectAllVisible = () =>
    setSelected((p) => { const n = new Set(p); visibleCourseIds.forEach((id) => n.add(id)); return n; });
  const clearVisible = () =>
    setSelected((p) => { const n = new Set(p); visibleCourseIds.forEach((id) => n.delete(id)); return n; });

  const toggleCollapse = (fid: string) =>
    setCollapsed((p) => { const n = new Set(p); n.has(fid) ? n.delete(fid) : n.add(fid); return n; });

  const toggleLabel = (key: string, on: boolean) =>
    setChosenLabels((p) => { const n = new Set(p); on ? n.add(key) : n.delete(key); return n; });

  const handleSave = async () => {
    if (!productId) return;
    const toAdd = [...selected].filter((id) => !initial.has(id));
    const toRemove = [...initial].filter((id) => !selected.has(id));
    setSaving(true);
    try {
      // 1. Remove unassigned course_products + cascade their year tags
      if (toRemove.length) {
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
      // 2. Insert new course_products
      if (toAdd.length) {
        const rows = toAdd.map((cid) => ({ course_id: cid, product_id: productId }));
        const { error } = await supabase.from("course_products").insert(rows);
        if (error) throw error;
      }

      // 3. Sync year-label tagging across all currently-selected courses
      // Re-fetch course_products for accurate IDs
      const { data: cpRows2 } = await supabase
        .from("course_products")
        .select("id,course_id")
        .eq("product_id", productId)
        .in("course_id", [...selected]);
      const cpByCourse: Record<string, string> = {};
      (cpRows2 || []).forEach((r: any) => { cpByCourse[r.course_id] = r.id; });

      const yearsByCourse: Record<string, CourseYear[]> = {};
      allYears.forEach((y) => { (yearsByCourse[y.course_id] ||= []).push(y); });

      const insertRows: { course_product_id: string; course_year_id: string }[] = [];
      const deleteYearIdsByCp: Record<string, string[]> = {};

      for (const cid of selected) {
        const cpId = cpByCourse[cid];
        if (!cpId) continue;
        const courseYears = yearsByCourse[cid] || [];
        const desiredYearIds = new Set<string>();
        courseYears.forEach((y) => { if (chosenLabels.has(norm(y.label))) desiredYearIds.add(y.id); });

        // Current tags for this course (from initial state — only valid for previously-assigned courses)
        const currentLabelKeys = initialLabelsByCourse[cid] || new Set<string>();
        const currentYearIds = new Set<string>();
        courseYears.forEach((y) => { if (currentLabelKeys.has(norm(y.label))) currentYearIds.add(y.id); });

        // Inserts: desired - current
        desiredYearIds.forEach((yid) => {
          if (!currentYearIds.has(yid)) insertRows.push({ course_product_id: cpId, course_year_id: yid });
        });
        // Deletes: current - desired
        const toDel: string[] = [];
        currentYearIds.forEach((yid) => { if (!desiredYearIds.has(yid)) toDel.push(yid); });
        if (toDel.length) deleteYearIdsByCp[cpId] = toDel;
      }

      // Apply deletes
      for (const [cpId, yIds] of Object.entries(deleteYearIdsByCp)) {
        await supabase.from("course_product_years")
          .delete()
          .eq("course_product_id", cpId)
          .in("course_year_id", yIds);
      }
      // Apply inserts
      if (insertRows.length) {
        await supabase.from("course_product_years").insert(insertRows);
      }

      toast.success(`Saved · ${selected.size} course${selected.size === 1 ? "" : "s"}${chosenLabels.size ? ` · ${chosenLabels.size} year tag${chosenLabels.size === 1 ? "" : "s"}` : ""}`);
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

          {/* Year-label chips */}
          {selected.size > 0 && (
            <div className="border rounded-md p-2.5 bg-muted/30 space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Apply to years (matched by label across picked courses)
              </p>
              {availableLabels.length === 0 ? (
                <p className="text-[11px] text-muted-foreground italic">
                  None of the picked courses have year labels yet — product will show in "All years".
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {availableLabels.map(({ key, label }) => {
                    const on = chosenLabels.has(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleLabel(key, !on)}
                        className={`px-2.5 py-1 rounded-full text-[11px] border transition-colors ${
                          on
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border hover:border-primary/50"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                  {chosenLabels.size === 0 && (
                    <span className="text-[11px] text-muted-foreground italic self-center">
                      = visible in all years
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

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
