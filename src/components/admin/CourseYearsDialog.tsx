import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Layers } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CourseYear {
  id: string;
  label: string;
  display_order: number;
  is_active: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseName: string;
}

export const CourseYearsDialog = ({ open, onOpenChange, courseId, courseName }: Props) => {
  const [years, setYears] = useState<CourseYear[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("course_years")
      .select("*")
      .eq("course_id", courseId)
      .order("display_order", { ascending: true });
    if (error) toast.error("Failed to load years");
    else setYears((data as CourseYear[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (open && courseId) load();
  }, [open, courseId]);

  const add = async () => {
    if (!newLabel.trim()) return;
    const { error } = await supabase.from("course_years").insert({
      course_id: courseId,
      label: newLabel.trim(),
      display_order: years.length,
    });
    if (error) return toast.error(error.message);
    setNewLabel("");
    load();
  };

  const update = async (id: string, patch: Partial<CourseYear>) => {
    const { error } = await supabase.from("course_years").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const remove = async (y: CourseYear) => {
    if (!confirm(`Delete "${y.label}"? Products and bundles tagged to this year will lose the tag.`)) return;
    const { error } = await supabase.from("course_years").delete().eq("id", y.id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-4 w-4" /> Years · {courseName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="e.g. Year 1, Clinical Year"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
            />
            <Button onClick={add} size="sm" className="shrink-0">
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
          {loading ? (
            <p className="text-xs text-muted-foreground">Loading...</p>
          ) : years.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              No years yet. Add labels like "Year 1", "Year 2"...
            </p>
          ) : (
            <div className="space-y-2">
              {years.map((y) => (
                <div key={y.id} className="flex items-center gap-2 p-2 border rounded-md">
                  <Input
                    value={y.label}
                    onChange={(e) =>
                      setYears((prev) => prev.map((p) => (p.id === y.id ? { ...p, label: e.target.value } : p)))
                    }
                    onBlur={(e) => update(y.id, { label: e.target.value.trim() })}
                    className="h-8"
                  />
                  <Input
                    type="number"
                    value={y.display_order}
                    onChange={(e) =>
                      setYears((prev) =>
                        prev.map((p) => (p.id === y.id ? { ...p, display_order: parseInt(e.target.value) || 0 } : p))
                      )
                    }
                    onBlur={(e) => update(y.id, { display_order: parseInt(e.target.value) || 0 })}
                    className="h-8 w-16"
                    title="Order"
                  />
                  <Switch
                    checked={y.is_active}
                    onCheckedChange={(c) => update(y.id, { is_active: c })}
                  />
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove(y)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
