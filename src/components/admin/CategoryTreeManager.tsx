import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  Package,
  Pencil,
  Plus,
  Tag,
  Trash2,
  icons,
} from "lucide-react";

const SUGGESTED_ICONS = [
  "Ruler", "Calculator", "PenTool", "BookOpen", "FolderOpen",
  "Palette", "Paperclip", "ClipboardCheck", "Gift", "Package",
  "Pencil", "Compass", "FlaskConical", "GraduationCap", "Scissors",
  "Printer", "Monitor", "Laptop", "Briefcase", "Archive",
];

export const renderCategoryIcon = (iconName: string | null, className = "h-4 w-4") => {
  if (!iconName) return <Package className={className} />;
  if (/[^\x00-\x7F]/.test(iconName)) return <span className="text-sm">{iconName}</span>;
  const IconComp = (icons as Record<string, any>)[iconName];
  return IconComp ? <IconComp className={className} /> : <Package className={className} />;
};

interface Row {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  parent_id: string | null;
  display_order: number;
  is_active: boolean;
}

const slugify = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const emptyForm = {
  name: "",
  slug: "",
  icon: "",
  parent_id: null as string | null,
  is_active: true,
};

/**
 * Nested, drag-reorderable taxonomy tree. Main categories are collapsible rows
 * with their real children indented underneath, live product counts, and an
 * inline "add subcategory" affordance so staff never pick a parent from a
 * dropdown after the fact.
 */
export const CategoryTreeManager = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [dragging, setDragging] = useState<Row | null>(null);

  const fetchAll = async () => {
    const [{ data: cats, error }, { data: assignments }] = await Promise.all([
      supabase
        .from("product_categories")
        .select("id,name,slug,icon,parent_id,display_order,is_active")
        .order("display_order", { ascending: true }),
      supabase.from("product_category_assignments").select("category_id"),
    ]);

    if (error) {
      toast.error("Failed to load categories");
    } else {
      setRows((cats || []) as Row[]);
      const tally: Record<string, number> = {};
      (assignments || []).forEach((a: any) => {
        tally[a.category_id] = (tally[a.category_id] || 0) + 1;
      });
      setCounts(tally);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const { mains, childrenOf } = useMemo(() => {
    const mains = rows
      .filter((r) => !r.parent_id)
      .sort((a, b) => a.display_order - b.display_order);
    const childrenOf: Record<string, Row[]> = {};
    rows
      .filter((r) => r.parent_id)
      .forEach((r) => {
        (childrenOf[r.parent_id!] ||= []).push(r);
      });
    Object.values(childrenOf).forEach((list) =>
      list.sort((a, b) => a.display_order - b.display_order),
    );
    return { mains, childrenOf };
  }, [rows]);

  const totalCount = (cat: Row) =>
    (counts[cat.id] || 0) +
    (childrenOf[cat.id] || []).reduce((s, c) => s + (counts[c.id] || 0), 0);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const openAdd = (parentId: string | null) => {
    setEditing(null);
    setForm({ ...emptyForm, parent_id: parentId });
    setDialogOpen(true);
  };

  const openEdit = (cat: Row) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon || "",
      parent_id: cat.parent_id,
      is_active: cat.is_active,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    const payload = {
      name: form.name.trim(),
      slug: form.slug || slugify(form.name),
      icon: form.icon || null,
      parent_id: form.parent_id,
      is_active: form.is_active,
    };

    if (editing) {
      const { error } = await supabase
        .from("product_categories")
        .update(payload)
        .eq("id", editing.id);
      if (error) return toast.error("Failed to update category");
      toast.success("Category updated");
    } else {
      const siblings = form.parent_id ? childrenOf[form.parent_id] || [] : mains;
      const { error } = await supabase
        .from("product_categories")
        .insert({ ...payload, display_order: siblings.length });
      if (error) return toast.error("Failed to add category");
      toast.success("Category added");
      if (form.parent_id) setExpanded((prev) => new Set(prev).add(form.parent_id!));
    }
    setDialogOpen(false);
    fetchAll();
  };

  const remove = async (cat: Row) => {
    const kids = childrenOf[cat.id]?.length || 0;
    if (kids > 0) {
      toast.error("Move or delete the subcategories first");
      return;
    }
    if (!confirm(`Delete "${cat.name}"? Products keep their current category value.`)) return;
    const { error } = await supabase.from("product_categories").delete().eq("id", cat.id);
    if (error) return toast.error("Failed to delete category");
    toast.success("Category deleted");
    fetchAll();
  };

  /** Reorder within a single level by persisting new display_order values. */
  const reorder = async (target: Row) => {
    const src = dragging;
    setDragging(null);
    if (!src || src.id === target.id) return;
    if ((src.parent_id ?? null) !== (target.parent_id ?? null)) {
      toast.error("Drag within the same level only");
      return;
    }
    const level = src.parent_id ? [...(childrenOf[src.parent_id] || [])] : [...mains];
    const from = level.findIndex((r) => r.id === src.id);
    const to = level.findIndex((r) => r.id === target.id);
    if (from < 0 || to < 0) return;
    level.splice(to, 0, level.splice(from, 1)[0]);

    setRows((prev) =>
      prev.map((r) => {
        const i = level.findIndex((l) => l.id === r.id);
        return i >= 0 ? { ...r, display_order: i } : r;
      }),
    );

    await Promise.all(
      level.map((r, i) =>
        supabase.from("product_categories").update({ display_order: i }).eq("id", r.id),
      ),
    );
    fetchAll();
  };

  const rowActions = (cat: Row) => (
    <div className="flex items-center gap-0.5">
      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(cat)}>
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-destructive hover:text-destructive"
        onClick={() => remove(cat)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );

  if (loading) return <p className="text-sm text-muted-foreground">Loading categories...</p>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Category Tree
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {mains.length} main · {rows.length - mains.length} sub · drag to reorder within a level
          </p>
        </div>
        <Button size="sm" onClick={() => openAdd(null)}>
          <Plus className="h-4 w-4 mr-1" /> Main category
        </Button>
      </CardHeader>
      <CardContent className="space-y-1">
        {mains.map((main) => {
          const kids = childrenOf[main.id] || [];
          const open = expanded.has(main.id);
          return (
            <div key={main.id} className="rounded-md border border-border/60">
              <div
                draggable
                onDragStart={() => setDragging(main)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => reorder(main)}
                className={`flex items-center gap-2 px-2 py-2 ${
                  dragging?.id === main.id ? "opacity-50" : ""
                }`}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0" />
                <button
                  type="button"
                  onClick={() => toggle(main.id)}
                  className="p-0.5 rounded hover:bg-muted shrink-0"
                  aria-label="Toggle subcategories"
                >
                  {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                {renderCategoryIcon(main.icon, "h-4 w-4 shrink-0 text-primary")}
                <span className="font-medium text-sm truncate">{main.name}</span>
                <Badge variant="secondary" className="text-[10px] h-5 shrink-0">
                  {totalCount(main)}
                </Badge>
                {!main.is_active && (
                  <Badge variant="outline" className="text-[10px] h-5 shrink-0">
                    Hidden
                  </Badge>
                )}
                <div className="ml-auto shrink-0">{rowActions(main)}</div>
              </div>

              {open && (
                <div className="border-t border-border/60 bg-muted/20 px-2 py-1.5 space-y-1">
                  {kids.map((sub) => (
                    <div
                      key={sub.id}
                      draggable
                      onDragStart={() => setDragging(sub)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => reorder(sub)}
                      className={`flex items-center gap-2 pl-6 pr-1 py-1.5 rounded hover:bg-background ${
                        dragging?.id === sub.id ? "opacity-50" : ""
                      }`}
                    >
                      <GripVertical className="h-3.5 w-3.5 text-muted-foreground cursor-grab shrink-0" />
                      {renderCategoryIcon(sub.icon, "h-3.5 w-3.5 shrink-0 text-muted-foreground")}
                      <span className="text-sm truncate">{sub.name}</span>
                      <Badge variant="secondary" className="text-[10px] h-5 shrink-0">
                        {counts[sub.id] || 0}
                      </Badge>
                      {!sub.is_active && (
                        <Badge variant="outline" className="text-[10px] h-5 shrink-0">
                          Hidden
                        </Badge>
                      )}
                      <div className="ml-auto shrink-0">{rowActions(sub)}</div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => openAdd(main.id)}
                    className="flex items-center gap-1.5 pl-6 py-1.5 text-xs text-primary hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add subcategory under {main.name}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editing
                ? `Edit ${editing.parent_id ? "subcategory" : "category"}`
                : form.parent_id
                  ? "Add subcategory"
                  : "Add main category"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {form.parent_id && (
              <p className="text-xs text-muted-foreground">
                Parent: {rows.find((r) => r.id === form.parent_id)?.name}
              </p>
            )}
            <div>
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value, slug: slugify(e.target.value) }))
                }
                placeholder="e.g. Engineering & Drawing"
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                placeholder="auto-generated"
              />
            </div>
            <div>
              <Label>Icon</Label>
              <Select
                value={form.icon || ""}
                onValueChange={(val) => setForm((p) => ({ ...p, icon: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an icon">
                    {form.icon && (
                      <span className="flex items-center gap-2">
                        {renderCategoryIcon(form.icon)}
                        <span>{form.icon}</span>
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {SUGGESTED_ICONS.map((name) => (
                    <SelectItem key={name} value={name}>
                      <span className="flex items-center gap-2">
                        {renderCategoryIcon(name)}
                        <span>{name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Visible on the site</Label>
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm((p) => ({ ...p, is_active: v }))}
              />
            </div>
            <Button onClick={save} className="w-full">
              {editing ? "Save changes" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default CategoryTreeManager;
