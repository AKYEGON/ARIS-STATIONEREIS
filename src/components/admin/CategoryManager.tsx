import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Tag, Package, icons } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ProductCategory } from "@/types/product";

const SUGGESTED_ICONS = [
  "Ruler", "Calculator", "PenTool", "BookOpen", "FolderOpen",
  "Palette", "Paperclip", "ClipboardCheck", "Gift", "Package",
  "Pencil", "Compass", "FlaskConical", "GraduationCap", "Scissors",
  "Printer", "Monitor", "Laptop", "Briefcase", "Archive",
];

const renderIcon = (iconName: string | null, className = "h-4 w-4") => {
  if (!iconName) return <Package className={className} />;
  if (/[^\x00-\x7F]/.test(iconName)) return <span className="text-sm">{iconName}</span>;
  const IconComp = (icons as Record<string, any>)[iconName];
  return IconComp ? <IconComp className={className} /> : <Package className={className} />;
};

export const CategoryManager = () => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    icon: "",
    display_order: 0,
    is_active: true,
  });

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("product_categories")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      toast.error("Failed to load categories");
    } else {
      setCategories((data || []) as ProductCategory[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const resetForm = () => {
    setFormData({ name: "", slug: "", icon: "", display_order: 0, is_active: true });
  };

  const handleAdd = async () => {
    if (!formData.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    const slug = formData.slug || generateSlug(formData.name);

    const { error } = await supabase.from("product_categories").insert({
      name: formData.name.trim(),
      slug,
      icon: formData.icon || null,
      display_order: formData.display_order,
      is_active: formData.is_active,
    });

    if (error) {
      toast.error("Failed to add category");
    } else {
      toast.success("Category added");
      resetForm();
      setIsAddOpen(false);
      fetchCategories();
    }
  };

  const handleEdit = async () => {
    if (!editingCategory || !formData.name.trim()) return;

    const slug = formData.slug || generateSlug(formData.name);

    const { error } = await supabase
      .from("product_categories")
      .update({
        name: formData.name.trim(),
        slug,
        icon: formData.icon || null,
        display_order: formData.display_order,
        is_active: formData.is_active,
      })
      .eq("id", editingCategory.id);

    if (error) {
      toast.error("Failed to update category");
    } else {
      toast.success("Category updated");
      setIsEditOpen(false);
      setEditingCategory(null);
      fetchCategories();
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"? Products using this category will keep their current value.`)) return;

    const { error } = await supabase.from("product_categories").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete category");
    } else {
      toast.success("Category deleted");
      fetchCategories();
    }
  };

  const openEdit = (cat: ProductCategory) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon || "",
      display_order: cat.display_order,
      is_active: cat.is_active,
    });
    setIsEditOpen(true);
  };

  const CategoryForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="space-y-4">
      <div>
        <Label>Category Name *</Label>
        <Input
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) })
          }
          placeholder="e.g. Engineering & Drawing"
        />
      </div>
      <div>
        <Label>Slug</Label>
        <Input
          value={formData.slug}
          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
          placeholder="auto-generated"
          className="text-muted-foreground"
        />
      </div>
      <div>
        <Label>Icon (Lucide icon name)</Label>
        <Select
          value={formData.icon || ""}
          onValueChange={(val) => setFormData({ ...formData, icon: val })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select an icon">
              {formData.icon && (
                <span className="flex items-center gap-2">
                  {renderIcon(formData.icon)}
                  <span>{formData.icon}</span>
                </span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {SUGGESTED_ICONS.map((name) => (
              <SelectItem key={name} value={name}>
                <span className="flex items-center gap-2">
                  {renderIcon(name)}
                  <span>{name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Display Order</Label>
        <Input
          type="number"
          value={formData.display_order}
          onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label>Active</Label>
        <Switch
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
      </div>
      <Button onClick={onSubmit} className="w-full bg-primary hover:bg-primary/90">
        {submitLabel}
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
            Product Categories
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {categories.length} categories · Used in product forms and shop filters
          </p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={(o) => { setIsAddOpen(o); if (o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Add Category</DialogTitle>
            </DialogHeader>
            <CategoryForm onSubmit={handleAdd} submitLabel="Add Category" />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Slug</TableHead>
              <TableHead className="w-20">Status</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell className="text-muted-foreground text-xs">{cat.display_order}</TableCell>
                <TableCell className="font-medium">
                  {cat.icon && <span className="mr-1.5">{cat.icon}</span>}
                  {cat.name}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-xs text-muted-foreground font-mono">
                  {cat.slug}
                </TableCell>
                <TableCell>
                  <Badge variant={cat.is_active ? "default" : "secondary"} className="text-xs">
                    {cat.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(cat)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(cat.id, cat.name)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No categories yet. Add one to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <CategoryForm onSubmit={handleEdit} submitLabel="Save Changes" />
        </DialogContent>
      </Dialog>
    </Card>
  );
};
