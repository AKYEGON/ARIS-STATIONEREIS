import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus, Pencil, Trash2, GraduationCap, BookOpen, Package, ChevronRight, ArrowLeft, Layers, icons,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CourseYearsDialog } from "./CourseYearsDialog";
import { CourseBundlesDialog } from "./CourseBundlesDialog";
import { YearTemplatesManager } from "./YearTemplatesManager";

const SUGGESTED_ICONS = [
  "GraduationCap", "Wrench", "FlaskConical", "Stethoscope", "Scale",
  "Briefcase", "Calculator", "Code", "Palette", "Globe",
  "BookOpen", "Microscope", "Cpu", "HeartPulse", "Building2",
];

const renderIcon = (iconName: string | null, className = "h-4 w-4") => {
  if (!iconName) return <GraduationCap className={className} />;
  const IconComp = (icons as Record<string, any>)[iconName];
  return IconComp ? <IconComp className={className} /> : <GraduationCap className={className} />;
};

interface Faculty {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  display_order: number;
  is_active: boolean;
}

interface Course {
  id: string;
  faculty_id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
}

interface ProductLite {
  id: string;
  name: string;
  image: string;
  price: number;
}

export const FacultyManager = () => {
  const [view, setView] = useState<"faculties" | "courses" | "products">("faculties");
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeFaculty, setActiveFaculty] = useState<Faculty | null>(null);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [allProducts, setAllProducts] = useState<ProductLite[]>([]);
  const [assignedProductIds, setAssignedProductIds] = useState<Set<string>>(new Set());
  // courseProductId per productId for the active course
  const [cpIdByProduct, setCpIdByProduct] = useState<Record<string, string>>({});
  // courseYears for active course
  const [courseYears, setCourseYears] = useState<{ id: string; label: string }[]>([]);
  // For each productId: Set of course_year_ids it is tagged to (empty = all years)
  const [productYearTags, setProductYearTags] = useState<Record<string, Set<string>>>({});
  const [productSearch, setProductSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [yearsDialogCourse, setYearsDialogCourse] = useState<Course | null>(null);
  const [bundlesDialogCourse, setBundlesDialogCourse] = useState<Course | null>(null);

  // Faculty form
  const [facDialogOpen, setFacDialogOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [facForm, setFacForm] = useState({ name: "", description: "", icon: "GraduationCap", display_order: 0, is_active: true });

  // Course form
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseForm, setCourseForm] = useState({ name: "", description: "", display_order: 0, is_active: true });

  const fetchFaculties = async () => {
    const { data, error } = await supabase
      .from("faculties")
      .select("*")
      .order("display_order", { ascending: true });
    if (error) toast.error("Failed to load faculties");
    else setFaculties((data as Faculty[]) || []);
    setLoading(false);
  };

  const fetchCourses = async (facultyId: string) => {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("faculty_id", facultyId)
      .order("display_order", { ascending: true });
    if (error) toast.error("Failed to load courses");
    else setCourses((data as Course[]) || []);
  };

  const fetchProductsForCourse = async (courseId: string) => {
    const [{ data: prods }, { data: assigned }, { data: yrs }] = await Promise.all([
      supabase.from("products").select("id, name, image, price").order("name", { ascending: true }),
      supabase.from("course_products").select("id, product_id").eq("course_id", courseId),
      supabase.from("course_years").select("id, label").eq("course_id", courseId).eq("is_active", true).order("display_order"),
    ]);
    setAllProducts((prods as ProductLite[]) || []);
    setCourseYears((yrs as { id: string; label: string }[]) || []);

    const cpMap: Record<string, string> = {};
    const assignedIds = new Set<string>();
    (assigned || []).forEach((r: any) => {
      cpMap[r.product_id] = r.id;
      assignedIds.add(r.product_id);
    });
    setCpIdByProduct(cpMap);
    setAssignedProductIds(assignedIds);

    const cpIds = Object.values(cpMap);
    const tagMap: Record<string, Set<string>> = {};
    if (cpIds.length > 0) {
      const { data: tagRows } = await supabase
        .from("course_product_years")
        .select("course_product_id, course_year_id")
        .in("course_product_id", cpIds);
      const productByCpId: Record<string, string> = {};
      Object.entries(cpMap).forEach(([pid, cpid]) => { productByCpId[cpid] = pid; });
      (tagRows || []).forEach((r: any) => {
        const pid = productByCpId[r.course_product_id];
        if (!pid) return;
        (tagMap[pid] ||= new Set()).add(r.course_year_id);
      });
    }
    setProductYearTags(tagMap);
  };

  useEffect(() => {
    fetchFaculties();
  }, []);

  // Faculty CRUD
  const resetFacForm = () => setFacForm({ name: "", description: "", icon: "GraduationCap", display_order: 0, is_active: true });

  const openAddFaculty = () => { setEditingFaculty(null); resetFacForm(); setFacDialogOpen(true); };
  const openEditFaculty = (f: Faculty) => {
    setEditingFaculty(f);
    setFacForm({ name: f.name, description: f.description || "", icon: f.icon || "GraduationCap", display_order: f.display_order, is_active: f.is_active });
    setFacDialogOpen(true);
  };

  const saveFaculty = async () => {
    if (!facForm.name.trim()) return toast.error("Name is required");
    const payload = {
      name: facForm.name.trim(),
      description: facForm.description.trim() || null,
      icon: facForm.icon || null,
      display_order: facForm.display_order,
      is_active: facForm.is_active,
    };
    const { error } = editingFaculty
      ? await supabase.from("faculties").update(payload).eq("id", editingFaculty.id)
      : await supabase.from("faculties").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(editingFaculty ? "Faculty updated" : "Faculty added");
    setFacDialogOpen(false);
    fetchFaculties();
  };

  const deleteFaculty = async (f: Faculty) => {
    if (!confirm(`Delete "${f.name}"? All its courses and product allocations will be removed.`)) return;
    const { error } = await supabase.from("faculties").delete().eq("id", f.id);
    if (error) return toast.error(error.message);
    toast.success("Faculty deleted");
    fetchFaculties();
  };

  // Course CRUD
  const resetCourseForm = () => setCourseForm({ name: "", description: "", display_order: 0, is_active: true });

  const openAddCourse = () => { setEditingCourse(null); resetCourseForm(); setCourseDialogOpen(true); };
  const openEditCourse = (c: Course) => {
    setEditingCourse(c);
    setCourseForm({ name: c.name, description: c.description || "", display_order: c.display_order, is_active: c.is_active });
    setCourseDialogOpen(true);
  };

  const saveCourse = async () => {
    if (!activeFaculty) return;
    if (!courseForm.name.trim()) return toast.error("Course name is required");
    const payload = {
      faculty_id: activeFaculty.id,
      name: courseForm.name.trim(),
      description: courseForm.description.trim() || null,
      display_order: courseForm.display_order,
      is_active: courseForm.is_active,
    };
    const { error } = editingCourse
      ? await supabase.from("courses").update(payload).eq("id", editingCourse.id)
      : await supabase.from("courses").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(editingCourse ? "Course updated" : "Course added");
    setCourseDialogOpen(false);
    fetchCourses(activeFaculty.id);
  };

  const deleteCourse = async (c: Course) => {
    if (!confirm(`Delete "${c.name}"? All product allocations to this course will be removed.`)) return;
    const { error } = await supabase.from("courses").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("Course deleted");
    if (activeFaculty) fetchCourses(activeFaculty.id);
  };

  // Product allocation
  const toggleProduct = async (productId: string, checked: boolean) => {
    if (!activeCourse) return;
    if (checked) {
      const { data, error } = await supabase
        .from("course_products")
        .insert({ course_id: activeCourse.id, product_id: productId })
        .select("id")
        .single();
      if (error || !data) return toast.error("Failed to assign");
      setAssignedProductIds((prev) => new Set(prev).add(productId));
      setCpIdByProduct((prev) => ({ ...prev, [productId]: data.id }));
    } else {
      const { error } = await supabase
        .from("course_products")
        .delete()
        .eq("course_id", activeCourse.id)
        .eq("product_id", productId);
      if (error) return toast.error("Failed to remove");
      setAssignedProductIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
      setCpIdByProduct((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
      setProductYearTags((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
    }
  };

  const toggleProductYear = async (productId: string, yearId: string, checked: boolean) => {
    const cpId = cpIdByProduct[productId];
    if (!cpId) return;
    if (checked) {
      const { error } = await supabase
        .from("course_product_years")
        .insert({ course_product_id: cpId, course_year_id: yearId });
      if (error) return toast.error("Failed to tag year");
      setProductYearTags((prev) => {
        const next = { ...prev };
        const set = new Set(next[productId] || []);
        set.add(yearId);
        next[productId] = set;
        return next;
      });
    } else {
      const { error } = await supabase
        .from("course_product_years")
        .delete()
        .eq("course_product_id", cpId)
        .eq("course_year_id", yearId);
      if (error) return toast.error("Failed to untag year");
      setProductYearTags((prev) => {
        const next = { ...prev };
        const set = new Set(next[productId] || []);
        set.delete(yearId);
        next[productId] = set;
        return next;
      });
    }
  };

  const filteredProducts = allProducts.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  // ============ Render ============
  if (loading) return <p className="text-sm text-muted-foreground">Loading faculties...</p>;

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 space-y-0 pb-4">
        <div className="min-w-0 flex-1">
          <CardTitle className="text-sm sm:text-base flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <GraduationCap className="h-4 w-4 shrink-0" />
            <button
              onClick={() => { setView("faculties"); setActiveFaculty(null); setActiveCourse(null); }}
              className={view === "faculties" ? "" : "text-muted-foreground hover:text-primary"}
            >
              Shop by Course
            </button>
            {activeFaculty && (
              <>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <button
                  onClick={() => { setView("courses"); setActiveCourse(null); }}
                  className={`truncate max-w-[140px] sm:max-w-none ${view === "courses" ? "" : "text-muted-foreground hover:text-primary"}`}
                >
                  {activeFaculty.name}
                </button>
              </>
            )}
            {activeCourse && (
              <>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <span className="truncate max-w-[140px] sm:max-w-none">{activeCourse.name}</span>
              </>
            )}
          </CardTitle>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">
            {view === "faculties" && "Add faculties (e.g. Engineering, Business, Medicine)"}
            {view === "courses" && "Add courses under this faculty"}
            {view === "products" && "Tick the stationery this course needs"}
          </p>
        </div>
        {view === "faculties" && (
          <Button size="sm" className="bg-primary hover:bg-primary/90 self-start sm:self-auto shrink-0" onClick={openAddFaculty}>
            <Plus className="h-4 w-4 mr-1" /> Faculty
          </Button>
        )}
        {view === "courses" && (
          <Button size="sm" className="bg-primary hover:bg-primary/90 self-start sm:self-auto shrink-0" onClick={openAddCourse}>
            <Plus className="h-4 w-4 mr-1" /> Course
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {view !== "faculties" && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (view === "products") { setView("courses"); setActiveCourse(null); }
              else { setView("faculties"); setActiveFaculty(null); }
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        )}

        {/* Faculties grid */}
        {view === "faculties" && (
          <div className="space-y-3">
            <YearTemplatesManager />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {faculties.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between gap-2 p-3 border rounded-lg hover:border-primary/40 transition"
                >
                  <button
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    onClick={() => { setActiveFaculty(f); setView("courses"); fetchCourses(f.id); }}
                  >
                    <div className="bg-primary/10 text-primary p-2 rounded-lg shrink-0">
                      {renderIcon(f.icon)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{f.name}</p>
                      <Badge variant={f.is_active ? "default" : "secondary"} className="text-[10px] mt-0.5">
                        {f.is_active ? "Active" : "Hidden"}
                      </Badge>
                    </div>
                  </button>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-[10px]"
                      onClick={() => { setActiveFaculty(f); setView("courses"); fetchCourses(f.id); }}
                    >
                      <BookOpen className="h-3 w-3 mr-1" /> Courses
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditFaculty(f)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteFaculty(f)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {faculties.length === 0 && (
                <p className="col-span-full text-center text-sm text-muted-foreground py-6">
                  No faculties yet. Add one to begin.
                </p>
              )}
              {faculties.length > 0 && (
                <p className="col-span-full text-[11px] text-muted-foreground italic mt-1">
                  💡 Tip: Click a faculty (or its "Courses" button) to add courses and allocate products.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Courses list */}
        {view === "courses" && activeFaculty && (
          <div className="space-y-2">
            {courses.map((c) => (
              <div
                key={c.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 border rounded-lg hover:border-primary/40 transition"
              >
                <button
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  onClick={() => { setActiveCourse(c); setView("products"); fetchProductsForCourse(c.id); }}
                >
                  <div className="bg-primary/10 text-primary p-2 rounded-lg shrink-0">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{c.name}</p>
                    {c.description && (
                      <p className="text-xs text-muted-foreground truncate">{c.description}</p>
                    )}
                  </div>
                </button>
                <div className="flex gap-1 shrink-0 flex-wrap justify-end">
                  <Button size="sm" variant="outline" className="h-7 px-2 text-[10px]" onClick={() => setYearsDialogCourse(c)}>
                    <Layers className="h-3 w-3 mr-1" /> Years
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 px-2 text-[10px]" onClick={() => setBundlesDialogCourse(c)}>
                    <Package className="h-3 w-3 mr-1" /> Bundles
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 px-2 text-[10px]" onClick={() => { setActiveCourse(c); setView("products"); fetchProductsForCourse(c.id); }}>
                    <Package className="h-3 w-3 mr-1" /> Allocate
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditCourse(c)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteCourse(c)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            {courses.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-6">
                No courses yet in {activeFaculty.name}.
              </p>
            )}
          </div>
        )}

        {/* Product allocation */}
        {view === "products" && activeCourse && (
          <div className="space-y-3">
            <Input
              placeholder="Search products..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {assignedProductIds.size} of {allProducts.length} products assigned
            </p>
            <ScrollArea className="h-[400px] border rounded-lg p-2">
              <div className="space-y-1">
                {filteredProducts.map((p) => {
                  const checked = assignedProductIds.has(p.id);
                  const tags = productYearTags[p.id] || new Set<string>();
                  return (
                    <div key={p.id} className="rounded hover:bg-muted p-2">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <Checkbox checked={checked} onCheckedChange={(v) => toggleProduct(p.id, !!v)} />
                        <img src={p.image} alt={p.name} className="h-10 w-10 object-contain rounded bg-muted" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground">Ksh {p.price.toFixed(0)}</p>
                        </div>
                      </label>
                      {checked && courseYears.length > 0 && (
                        <div className="pl-8 pt-2 flex flex-wrap gap-1.5">
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground self-center mr-1">
                            Years:
                          </span>
                          {courseYears.map((y) => {
                            const on = tags.has(y.id);
                            return (
                              <button
                                key={y.id}
                                type="button"
                                onClick={() => toggleProductYear(p.id, y.id, !on)}
                                className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide border transition-colors ${
                                  on
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-background border-border hover:border-primary/50"
                                }`}
                              >
                                {y.label}
                              </button>
                            );
                          })}
                          {tags.size === 0 && (
                            <span className="text-[10px] text-muted-foreground italic self-center">
                              (visible in all years)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-6">No products found</p>
                )}
              </div>
            </ScrollArea>
            {activeCourse && courseYears.length === 0 && (
              <p className="text-[11px] text-amber-600 italic">
                💡 Add years on this course (Years button) to tag products to specific academic years.
              </p>
            )}
          </div>
        )}
      </CardContent>

      {/* Faculty Dialog */}
      <Dialog open={facDialogOpen} onOpenChange={setFacDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingFaculty ? "Edit Faculty" : "Add Faculty"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Faculty Name *</Label>
              <Input value={facForm.name} onChange={(e) => setFacForm({ ...facForm, name: e.target.value })} placeholder="e.g. Engineering" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={facForm.description} onChange={(e) => setFacForm({ ...facForm, description: e.target.value })} placeholder="Short tagline shown on the card" rows={2} />
            </div>
            <div>
              <Label>Icon</Label>
              <Select value={facForm.icon} onValueChange={(v) => setFacForm({ ...facForm, icon: v })}>
                <SelectTrigger>
                  <SelectValue>
                    <span className="flex items-center gap-2">{renderIcon(facForm.icon)} {facForm.icon}</span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {SUGGESTED_ICONS.map((n) => (
                    <SelectItem key={n} value={n}>
                      <span className="flex items-center gap-2">{renderIcon(n)} {n}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Display Order</Label>
              <Input type="number" value={facForm.display_order} onChange={(e) => setFacForm({ ...facForm, display_order: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={facForm.is_active} onCheckedChange={(c) => setFacForm({ ...facForm, is_active: c })} />
            </div>
            <Button onClick={saveFaculty} className="w-full bg-primary hover:bg-primary/90">
              {editingFaculty ? "Save Changes" : "Add Faculty"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Course Dialog */}
      <Dialog open={courseDialogOpen} onOpenChange={setCourseDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingCourse ? "Edit Course" : "Add Course"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Course Name *</Label>
              <Input value={courseForm.name} onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })} placeholder="e.g. Mechanical Engineering" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} rows={2} />
            </div>
            <div>
              <Label>Display Order</Label>
              <Input type="number" value={courseForm.display_order} onChange={(e) => setCourseForm({ ...courseForm, display_order: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={courseForm.is_active} onCheckedChange={(c) => setCourseForm({ ...courseForm, is_active: c })} />
            </div>
            <Button onClick={saveCourse} className="w-full bg-primary hover:bg-primary/90">
              {editingCourse ? "Save Changes" : "Add Course"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {yearsDialogCourse && (
        <CourseYearsDialog
          open={!!yearsDialogCourse}
          onOpenChange={(o) => {
            if (!o) {
              setYearsDialogCourse(null);
              if (activeCourse?.id === yearsDialogCourse.id) fetchProductsForCourse(activeCourse.id);
            }
          }}
          courseId={yearsDialogCourse.id}
          courseName={yearsDialogCourse.name}
        />
      )}
      {bundlesDialogCourse && (
        <CourseBundlesDialog
          open={!!bundlesDialogCourse}
          onOpenChange={(o) => { if (!o) setBundlesDialogCourse(null); }}
          courseId={bundlesDialogCourse.id}
          courseName={bundlesDialogCourse.name}
        />
      )}
    </Card>
  );
};
