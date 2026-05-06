import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/common/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ChevronRight, GraduationCap, BookOpen, Package, Search } from "lucide-react";
import { icons } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { Product, ProductVariant } from "@/types/product";
import ProductCard from "@/components/products/ProductCard";

interface Faculty {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
}

interface Course {
  id: string;
  faculty_id: string;
  name: string;
  description: string | null;
}

const renderIcon = (iconName: string | null, className = "h-7 w-7") => {
  if (!iconName) return <GraduationCap className={className} />;
  const IconComp = (icons as Record<string, any>)[iconName];
  return IconComp ? <IconComp className={className} /> : <GraduationCap className={className} />;
};

const Students = () => {
  const { addToCart, getCartItemCount } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const facultyId = searchParams.get("faculty");
  const courseId = searchParams.get("course");

  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: facs } = await supabase
        .from("faculties")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      setFaculties((facs as Faculty[]) || []);

      const { data: crs } = await supabase
        .from("courses")
        .select("id, faculty_id")
        .eq("is_active", true);
      const c: Record<string, number> = {};
      (crs || []).forEach((row: any) => {
        c[row.faculty_id] = (c[row.faculty_id] || 0) + 1;
      });
      setCounts(c);
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (!facultyId) {
      setCourses([]);
      return;
    }
    supabase
      .from("courses")
      .select("*")
      .eq("faculty_id", facultyId)
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .then(({ data }) => setCourses((data as Course[]) || []));
  }, [facultyId]);

  useEffect(() => {
    if (!courseId) {
      setProducts([]);
      return;
    }
    const loadProducts = async () => {
      const { data } = await supabase
        .from("course_products")
        .select("display_order, product:products(*)")
        .eq("course_id", courseId)
        .order("display_order", { ascending: true });
      const mapped: Product[] = (data || [])
        .map((row: any) => row.product)
        .filter(Boolean)
        .map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description || "",
          price: Number(p.price),
          originalPrice: p.original_price ? Number(p.original_price) : undefined,
          image: p.image,
          category: p.category,
          stock: p.stock ?? 0,
          is_featured: p.is_featured,
        }));
      setProducts(mapped);
    };
    loadProducts();
  }, [courseId]);

  const activeFaculty = useMemo(
    () => faculties.find((f) => f.id === facultyId),
    [faculties, facultyId]
  );
  const activeCourse = useMemo(
    () => courses.find((c) => c.id === courseId),
    [courses, courseId]
  );

  const handleAddToCart = (product: Product, variant?: ProductVariant) => {
    addToCart(product, variant);
  };

  const goHome = () => setSearchParams({});
  const goFaculty = (id: string) => setSearchParams({ faculty: id });

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Shop by Course", url: "/students" },
    ...(activeFaculty ? [{ name: activeFaculty.name, url: `/students?faculty=${activeFaculty.id}` }] : []),
    ...(activeCourse ? [{ name: activeCourse.name, url: `/students?faculty=${facultyId}&course=${activeCourse.id}` }] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0">
      <SEO
        title="Shop Stationery by Course | Aris Stationeries Kenya"
        description="Find the exact stationery you need for your course. Browse by faculty and course — Engineering, Business, Medicine and more."
        canonicalUrl="/students"
        breadcrumbs={breadcrumbs}
      />
      <Header cartItemCount={getCartItemCount()} />

      <main className="flex-1 container py-6 sm:py-8 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-4 text-xs sm:text-sm text-muted-foreground flex-wrap uppercase tracking-wide">
            <button onClick={goHome} className="hover:text-primary transition-colors font-semibold">
              FACULTIES
            </button>
            {activeFaculty && (
              <>
                <ChevronRight className="h-3 w-3" />
                <button
                  onClick={() => goFaculty(activeFaculty.id)}
                  className="hover:text-primary transition-colors font-semibold"
                >
                  {activeFaculty.name.toUpperCase()}
                </button>
              </>
            )}
            {activeCourse && (
              <>
                <ChevronRight className="h-3 w-3" />
                <span className="text-foreground font-bold">{activeCourse.name.toUpperCase()}</span>
              </>
            )}
          </div>

          {/* Hero header */}
          <div className="border-b border-border pb-5 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-primary/10 text-primary p-2 rounded-lg">
                <GraduationCap className="h-5 w-5" />
              </div>
              <Badge variant="outline" className="text-[10px] uppercase tracking-widest">
                For Students
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-primary uppercase tracking-tight">
              {activeCourse
                ? activeCourse.name
                : activeFaculty
                ? activeFaculty.name
                : "SHOP BY COURSE"}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {activeCourse
                ? `Stationery curated for ${activeCourse.name} students.`
                : activeFaculty
                ? `Choose your course in ${activeFaculty.name}.`
                : "Find the right stationery for your course — pick a faculty to begin."}
            </p>
          </div>

          {(activeFaculty || activeCourse) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                activeCourse ? goFaculty(facultyId!) : goHome();
              }}
              className="mb-6 uppercase tracking-wide"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {activeCourse ? "Back to Courses" : "Back to Faculties"}
            </Button>
          )}

          {/* Search bar — visible on faculty + course pickers */}
          {!activeCourse && (
            <div className="relative mb-5 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={activeFaculty ? "Search courses..." : "Search faculties or courses..."}
                className="pl-9 bg-secondary border-primary/30 focus-visible:ring-primary"
              />
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : !activeFaculty ? (
            // Faculty grid (with search across faculties + courses)
            (() => {
              const q = search.trim().toLowerCase();
              const filtered = q
                ? faculties.filter((f) => f.name.toLowerCase().includes(q))
                : faculties;
              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                  {filtered.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => { setSearch(""); goFaculty(f.id); }}
                      className="group text-left"
                    >
                      <Card className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/40 border-2">
                        <CardContent className="p-4 sm:p-6 flex flex-col items-start gap-3">
                          <div className="bg-primary/10 text-primary p-3 rounded-xl group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            {renderIcon(f.icon)}
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-bold text-sm sm:text-base uppercase tracking-tight leading-tight">
                              {f.name}
                            </h3>
                            {f.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {f.description}
                              </p>
                            )}
                          </div>
                          <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                            <BookOpen className="h-3 w-3 mr-1" />
                            {counts[f.id] || 0} Courses
                          </Badge>
                        </CardContent>
                      </Card>
                    </button>
                  ))}
                  {filtered.length === 0 && (
                    <div className="col-span-full text-center py-16 text-muted-foreground">
                      <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-40" />
                      <p>No faculties match your search.</p>
                    </div>
                  )}
                </div>
              );
            })()
          ) : !activeCourse ? (
            // Course grid for selected faculty
            (() => {
              const q = search.trim().toLowerCase();
              const filtered = q
                ? courses.filter((c) =>
                    c.name.toLowerCase().includes(q) ||
                    (c.description || "").toLowerCase().includes(q)
                  )
                : courses;
              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                  {filtered.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSearchParams({ faculty: facultyId!, course: c.id })}
                      className="group text-left"
                    >
                      <Card className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/40 border-2">
                        <CardContent className="p-4 sm:p-5 flex flex-col gap-2">
                          <div className="bg-primary/10 text-primary p-2.5 rounded-lg w-fit group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            <BookOpen className="h-5 w-5" />
                          </div>
                          <h3 className="font-bold text-sm sm:text-base uppercase tracking-tight leading-tight">
                            {c.name}
                          </h3>
                          {c.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {c.description}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </button>
                  ))}
                  {filtered.length === 0 && (
                    <div className="col-span-full text-center py-16 text-muted-foreground">
                      <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-40" />
                      <p>{courses.length === 0 ? "No courses in this faculty yet." : "No courses match your search."}</p>
                    </div>
                  )}
                </div>
              );
            })()
          ) : (
            // Products for selected course
            <>
              {products.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-40" />
                  <p>No stationery has been allocated to this course yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                  {products.map((p) => (
                    <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Students;
