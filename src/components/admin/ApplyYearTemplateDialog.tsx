import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Search, Loader2, CheckCircle2, CircleDot } from "lucide-react";
import { toast } from "sonner";
import { smartMatch } from "@/lib/smart-search";

interface Faculty { id: string; name: string; display_order: number; }
interface Course { id: string; name: string; faculty_id: string; display_order: number; }

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  templateId: string | null;
  templateName?: string;
  templateLabels: string[]; // ordered
}

type Status = "full" | "partial" | "none";

export const ApplyYearTemplateDialog = ({ open, onOpenChange, templateId, templateName, templateLabels }: Props) => {
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  // map: course_id -> set of existing label keys (lowercased)
  const [existingByCourse, setExistingByCourse] = useState<Record<string, Set<string>>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [hideApplied, setHideApplied] = useState(true);

  const templateKeys = useMemo(
    () => templateLabels.map((l) => l.trim().toLowerCase()).filter(Boolean),
    [templateLabels]
  );

  useEffect(() => {
    if (!open || !templateId) return;
    (async () => {
      setLoading(true);
      const [{ data: fac }, { data: crs }, { data: yrs }] = await Promise.all([
        supabase.from("faculties").select("id,name,display_order").eq("is_active", true).order("display_order"),
        supabase.from("courses").select("id,name,faculty_id,display_order").eq("is_active", true).order("display_order"),
        supabase.from("course_years").select("course_id,label"),
      ]);
      setFaculties(fac || []);
      setCourses(crs || []);
      const map: Record<string, Set<string>> = {};
      (yrs || []).forEach((r: any) => {
        (map[r.course_id] ||= new Set()).add(String(r.label).trim().toLowerCase());
      });
      setExistingByCourse(map);
      setSelected(new Set());
      setLoading(false);
    })();
  }, [open, templateId]);

  const statusFor = (courseId: string): Status => {
    if (templateKeys.length === 0) return "none";
    const have = existingByCourse[courseId];
    if (!have || have.size === 0) return "none";
    const hits = templateKeys.filter((k) => have.has(k)).length;
    if (hits === 0) return "none";
    if (hits >= templateKeys.length) return "full";
    return "partial";
  };

  const filtered = useMemo(() => {
    const grouped: Record<string, Course[]> = {};
    for (const c of courses) {
      const fac = faculties.find((f) => f.id === c.faculty_id);
      const matches = smartMatch(search, [c.name, fac?.name]);
      if (!matches) continue;
      if (hideApplied && statusFor(c.id) === "full") continue;
      (grouped[c.faculty_id] ||= []).push(c);
    }
    return grouped;
  }, [courses, faculties, search, existingByCourse, templateKeys, hideApplied]);

  const visibleIds = useMemo(() => {
    const ids: string[] = [];
    Object.values(filtered).forEach((arr) => arr.forEach((c) => ids.push(c.id)));
    return ids;
  }, [filtered]);

  const toggleCollapse = (fid: string) => setCollapsed((p) => { const n = new Set(p); n.has(fid) ? n.delete(fid) : n.add(fid); return n; });
  const toggleCourse = (id: string, on: boolean) => setSelected((p) => { const n = new Set(p); on ? n.add(id) : n.delete(id); return n; });
  // "Select all visible" skips fully-applied courses to avoid wasted operations
  const selectAllVisible = () => setSelected((p) => {
    const n = new Set(p);
    visibleIds.forEach((i) => { if (statusFor(i) !== "full") n.add(i); });
    return n;
  });
  const clearVisible = () => setSelected((p) => { const n = new Set(p); visibleIds.forEach((i) => n.delete(i)); return n; });

  const counts = useMemo(() => {
    let full = 0, partial = 0, none = 0;
    courses.forEach((c) => {
      const s = statusFor(c.id);
      if (s === "full") full++; else if (s === "partial") partial++; else none++;
    });
    return { full, partial, none };
  }, [courses, existingByCourse, templateKeys]);

  const handleApply = async () => {
    if (!templateId || selected.size === 0 || templateLabels.length === 0) return;
    setApplying(true);
    try {
      const courseIds = [...selected];
      const { data: existing, error } = await supabase
        .from("course_years")
        .select("course_id,label,display_order")
        .in("course_id", courseIds);
      if (error) throw error;

      const byCourse: Record<string, { labels: Set<string>; maxOrder: number }> = {};
      courseIds.forEach((cid) => (byCourse[cid] = { labels: new Set(), maxOrder: -1 }));
      (existing || []).forEach((r: any) => {
        const bucket = byCourse[r.course_id];
        if (!bucket) return;
        bucket.labels.add(String(r.label).trim().toLowerCase());
        if (r.display_order > bucket.maxOrder) bucket.maxOrder = r.display_order;
      });

      const rows: { course_id: string; label: string; display_order: number; is_active: boolean }[] = [];
      let totalAdded = 0;
      let coursesTouched = 0;
      let coursesSkipped = 0;
      for (const cid of courseIds) {
        const bucket = byCourse[cid];
        let order = bucket.maxOrder + 1;
        let addedHere = 0;
        for (const label of templateLabels) {
          const key = label.trim().toLowerCase();
          if (!key || bucket.labels.has(key)) continue;
          rows.push({ course_id: cid, label: label.trim(), display_order: order++, is_active: true });
          addedHere++;
        }
        if (addedHere > 0) coursesTouched++; else coursesSkipped++;
        totalAdded += addedHere;
      }

      if (rows.length === 0) {
        toast.message("Nothing to add — picked courses already have all labels.");
      } else {
        const { error: insErr } = await supabase.from("course_years").insert(rows);
        if (insErr) throw insErr;
        const skipMsg = coursesSkipped > 0 ? ` · ${coursesSkipped} already had everything` : "";
        toast.success(`Added ${totalAdded} year${totalAdded === 1 ? "" : "s"} across ${coursesTouched} course${coursesTouched === 1 ? "" : "s"}${skipMsg}.`);
      }
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to apply template");
    } finally {
      setApplying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="truncate">
            Apply template{templateName ? `: ${templateName}` : ""}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground self-center mr-1">Labels:</span>
            {templateLabels.map((l) => (
              <Badge key={l} variant="outline" className="text-[10px]">{l}</Badge>
            ))}
          </div>

          {/* Status summary */}
          <div className="flex flex-wrap gap-2 text-[11px]">
            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Fully applied · {counts.full}
            </Badge>
            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300">
              <CircleDot className="h-3 w-3 mr-1" /> Partial · {counts.partial}
            </Badge>
            <Badge variant="outline">Not applied · {counts.none}</Badge>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search faculties or courses..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-3">
              <Badge variant="secondary">{selected.size} course{selected.size === 1 ? "" : "s"} picked</Badge>
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <Checkbox checked={hideApplied} onCheckedChange={(v) => setHideApplied(!!v)} />
                <span>Hide already applied</span>
              </label>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={selectAllVisible} disabled={loading}>Select all visible</Button>
              <Button size="sm" variant="outline" onClick={clearVisible} disabled={loading}>Clear visible</Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto border rounded-md divide-y">
            {loading ? (
              <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : (
              faculties.map((f) => {
                const list = filtered[f.id];
                if (!list || list.length === 0) return null;
                const selCount = list.filter((c) => selected.has(c.id)).length;
                const isCollapsed = collapsed.has(f.id);
                return (
                  <div key={f.id}>
                    <button type="button" onClick={() => toggleCollapse(f.id)} className="w-full flex items-center justify-between px-3 py-2 bg-muted/50 hover:bg-muted text-left">
                      <div className="flex items-center gap-2 font-medium text-sm">
                        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        {f.name}
                      </div>
                      <Badge variant={selCount > 0 ? "default" : "outline"} className="text-[10px]">{selCount} / {list.length}</Badge>
                    </button>
                    {!isCollapsed && (
                      <div className="py-1">
                        {list.map((c) => {
                          const status = statusFor(c.id);
                          const isFull = status === "full";
                          return (
                            <label
                              key={c.id}
                              className={`flex items-center gap-3 px-5 py-2 hover:bg-muted/30 cursor-pointer ${
                                isFull ? "opacity-60" : ""
                              }`}
                            >
                              <Checkbox
                                checked={selected.has(c.id)}
                                onCheckedChange={(v) => toggleCourse(c.id, !!v)}
                              />
                              <span className="text-sm flex-1">{c.name}</span>
                              {status === "full" && (
                                <Badge className="text-[10px] bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300">
                                  <CheckCircle2 className="h-3 w-3 mr-1" /> Applied
                                </Badge>
                              )}
                              {status === "partial" && (
                                <Badge className="text-[10px] bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300">
                                  Partial
                                </Badge>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
          <p className="text-[11px] text-muted-foreground italic">
            Merge mode: existing years stay untouched; only missing labels are added. Fully-applied courses can still be picked but will be no-ops.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={applying}>Cancel</Button>
          <Button onClick={handleApply} disabled={applying || loading || selected.size === 0}>
            {applying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Apply to {selected.size} course{selected.size === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
