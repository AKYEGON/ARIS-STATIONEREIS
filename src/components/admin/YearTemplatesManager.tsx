import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Layers, Send, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ApplyYearTemplateDialog } from "./ApplyYearTemplateDialog";

interface Template {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
  items: { id: string; label: string; display_order: number }[];
}

const sb = supabase as any;

export const YearTemplatesManager = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [formName, setFormName] = useState("");
  const [formLabels, setFormLabels] = useState<string[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [applyFor, setApplyFor] = useState<Template | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: tpls, error } = await sb
      .from("year_templates")
      .select("id,name,display_order,is_active")
      .order("display_order");
    if (error) { toast.error("Failed to load templates"); setLoading(false); return; }
    const ids = (tpls || []).map((t: any) => t.id);
    let items: any[] = [];
    if (ids.length) {
      const { data: itemRows } = await sb
        .from("year_template_items")
        .select("id,template_id,label,display_order")
        .in("template_id", ids)
        .order("display_order");
      items = itemRows || [];
    }
    const merged: Template[] = (tpls || []).map((t: any) => ({
      ...t,
      items: items.filter((i) => i.template_id === t.id).map((i) => ({ id: i.id, label: i.label, display_order: i.display_order })),
    }));
    setTemplates(merged);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setFormName("");
    setFormLabels(["Year 1", "Year 2", "Year 3", "Year 4"]);
    setNewLabel("");
    setEditorOpen(true);
  };
  const openEdit = (t: Template) => {
    setEditing(t);
    setFormName(t.name);
    setFormLabels(t.items.map((i) => i.label));
    setNewLabel("");
    setEditorOpen(true);
  };

  const addLabel = () => {
    const v = newLabel.trim();
    if (!v) return;
    if (formLabels.some((l) => l.toLowerCase() === v.toLowerCase())) { toast.error("Already in list"); return; }
    setFormLabels((p) => [...p, v]);
    setNewLabel("");
  };
  const removeLabel = (i: number) => setFormLabels((p) => p.filter((_, idx) => idx !== i));

  const save = async () => {
    if (!formName.trim()) return toast.error("Name is required");
    if (formLabels.length === 0) return toast.error("Add at least one year label");
    setSaving(true);
    try {
      let templateId = editing?.id;
      if (editing) {
        const { error } = await sb.from("year_templates").update({ name: formName.trim() }).eq("id", editing.id);
        if (error) throw error;
        await sb.from("year_template_items").delete().eq("template_id", editing.id);
      } else {
        const { data, error } = await sb
          .from("year_templates")
          .insert({ name: formName.trim(), display_order: templates.length })
          .select("id")
          .single();
        if (error || !data) throw error || new Error("Insert failed");
        templateId = data.id;
      }
      const rows = formLabels.map((label, i) => ({ template_id: templateId, label: label.trim(), display_order: i }));
      const { error: insErr } = await sb.from("year_template_items").insert(rows);
      if (insErr) throw insErr;
      toast.success(editing ? "Template updated" : "Template created");
      setEditorOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (t: Template) => {
    if (!confirm(`Delete template "${t.name}"? (Years already added to courses stay.)`)) return;
    const { error } = await sb.from("year_templates").delete().eq("id", t.id);
    if (error) return toast.error(error.message);
    toast.success("Template deleted");
    load();
  };

  return (
    <div className="border rounded-lg p-3 bg-muted/30 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Layers className="h-4 w-4 text-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold">Year Templates</p>
            <p className="text-[11px] text-muted-foreground">Create once, apply to many courses — no more retyping Year 1, Year 2…</p>
          </div>
        </div>
        <Button size="sm" onClick={openNew} className="bg-primary hover:bg-primary/90 shrink-0">
          <Plus className="h-3.5 w-3.5 mr-1" /> Template
        </Button>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading...</p>
      ) : templates.length === 0 ? (
        <p className="text-xs text-muted-foreground italic text-center py-3">
          No templates yet. Create e.g. "Standard 4-Year" → Year 1–4 and apply to all eligible courses in one click.
        </p>
      ) : (
        <div className="space-y-2">
          {templates.map((t) => (
            <div key={t.id} className="flex items-start justify-between gap-2 p-2.5 bg-background rounded-md border">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{t.name}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {t.items.length === 0 ? (
                    <span className="text-[10px] text-muted-foreground italic">No labels</span>
                  ) : t.items.map((i) => (
                    <Badge key={i.id} variant="secondary" className="text-[10px] font-normal">{i.label}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="sm" variant="outline" className="h-7 px-2 text-[10px]" onClick={() => setApplyFor(t)} disabled={t.items.length === 0}>
                  <Send className="h-3 w-3 mr-1" /> Apply
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(t)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove(t)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit template" : "New year template"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium">Template name</label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Standard 4-Year, Medicine 6-Year" />
            </div>
            <div>
              <label className="text-xs font-medium">Year labels (in order)</label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLabel())}
                  placeholder="e.g. Year 1, Clinical Year"
                />
                <Button size="sm" onClick={addLabel} className="shrink-0"><Plus className="h-4 w-4" /></Button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2 min-h-[28px]">
                {formLabels.length === 0 ? (
                  <span className="text-[11px] text-muted-foreground italic">No labels yet</span>
                ) : formLabels.map((l, i) => (
                  <Badge key={`${l}-${i}`} variant="default" className="text-[10px] pr-1 flex items-center gap-1">
                    {i + 1}. {l}
                    <button onClick={() => removeLabel(i)} className="hover:bg-primary-foreground/20 rounded">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? "Save changes" : "Create template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ApplyYearTemplateDialog
        open={!!applyFor}
        onOpenChange={(o) => { if (!o) setApplyFor(null); }}
        templateId={applyFor?.id ?? null}
        templateName={applyFor?.name}
        templateLabels={applyFor?.items.map((i) => i.label) ?? []}
      />
    </div>
  );
};
