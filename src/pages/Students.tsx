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

      <main className="flex-1 py-6 sm:py-8 md:py-12" style={{ background: "#EFF6F0" }}>
        <div className="max-w-screen-xl mx-auto px-4 md:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-6 text-[11px] sm:text-[12px] font-medium flex-wrap uppercase tracking-wide" style={{ color: "#7A8C80" }}>
            <button onClick={goHome} className="transition-colors" style={{ color: "#5C7A5F" }}>
              Faculties
            </button>
            {activeFaculty && (
              <>
                <ChevronRight className="h-3 w-3" />
                <button
                  onClick={() => goFaculty(activeFaculty.id)}
                  className="transition-colors"
                  style={{ color: "#5C7A5F" }}
                >
                  {activeFaculty.name}
                </button>
              </>
            )}
            {activeCourse && (
              <>
                <ChevronRight className="h-3 w-3" />
                <span style={{ color: "#2C3E35", fontWeight: 600 }}>{activeCourse.name}</span>
              </>
            )}
          </div>

          {/* Hero header */}
          <div className="mb-6 md:mb-8 flex items-center gap-3 pb-0">
            {/* Accent pip */}
            <span
              className="hidden sm:block w-1 h-6 rounded-full"
              style={{ background: "linear-gradient(180deg,#5C7A5F,#A8C5AB)" }}
            />
            <div>
              <p
                className="text-[10px] tracking-[0.15em] uppercase font-semibold mb-0.5"
                style={{ color: "#7A9E7E" }}
              >
                {activeCourse ? "Course Essentials" : "Shop by Course"}
              </p>
              <h1
                className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-semibold leading-tight"
                style={{ color: "#2C3E35", fontFamily: "Georgia, serif" }}
              >
                {activeCourse
                  ? activeCourse.name
                  : activeFaculty
                  ? activeFaculty.name
                  : "Shop by Course"}
              </h1>
            </div>
          </div>

          <p
            className="text-[13px] sm:text-[14px] mb-6 md:mb-8 max-w-2xl"
            style={{ color: "#7A8C80" }}
          >
            {activeCourse
              ? `Stationery curated specifically for ${activeCourse.name} students.`
              : activeFaculty
              ? `Browse all courses in ${activeFaculty.name} and find the right supplies.`
              : "Find the right stationery for your course — pick a faculty to begin."}
          </p>

          {(activeFaculty || activeCourse) && (
            <button
              onClick={() => {
                setSearch("");
                activeCourse ? goFaculty(facultyId!) : goHome();
              }}
              className="mb-6 flex items-center gap-2 text-[12.5px] font-medium rounded-lg px-3.5 py-2 transition-colors"
              style={{ color: "#5C7A5F", background: "#fff", border: "1px solid #C8DCCA" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#5C7A5F";
                (e.currentTarget as HTMLElement).style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#fff";
                (e.currentTarget as HTMLElement).style.color = "#5C7A5F";
              }}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {activeCourse ? "Back to Courses" : "Back to Faculties"}
            </button>
          )}

          {/* Search bar — visible on faculty + course pickers */}
          {!activeCourse && (
            <div className="relative mb-6 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#7A8C80" }} />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={activeFaculty ? "Search courses..." : "Search faculties or courses..."}
                className="pl-9 rounded-lg border"
                style={{ borderColor: "#DDE8DF", background: "#fff" }}
              />
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: "#5C7A5F" }}></div>
            </div>
          ) : !activeFaculty ? (
            // Faculty grid (with search across faculties + courses)
            (() => {
              const q = search.trim().toLowerCase();
              const filtered = q
                ? faculties.filter((f) => f.name.toLowerCase().includes(q))
                : faculties;
              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                  {filtered.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => { setSearch(""); goFaculty(f.id); }}
                      className="group text-left"
                    >
                      <div
                        className="h-full rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 flex flex-col p-4 sm:p-5"
                        style={{
                          background: "#FFFFFF",
                          border: "1px solid #DDE8DF",
                          boxShadow: "0 1px 4px rgba(92,122,95,0.06)",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.boxShadow =
                            "0 10px 32px rgba(92,122,95,0.14)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.boxShadow =
                            "0 1px 4px rgba(92,122,95,0.06)";
                        }}
                      >
                        <div
                          className="p-3 rounded-xl w-fit mb-3 group-hover:scale-110 transition-transform"
                          style={{ background: "#EFF6F0" }}
                        >
                          {renderIcon(f.icon, "h-5 w-5")}
                        </div>
                        <h3
                          className="font-semibold text-sm sm:text-base leading-snug mb-1"
                          style={{ color: "#2C3E35", fontFamily: "Georgia, serif" }}
                        >
                          {f.name}
                        </h3>
                        {f.description && (
                          <p className="text-xs line-clamp-2 mb-2" style={{ color: "#7A8C80" }}>
                            {f.description}
                          </p>
                        )}
                        <p
                          className="text-[10px] font-medium mt-auto"
                          style={{ color: "#7A9E7E" }}
                        >
                          {counts[f.id] || 0} Courses
                        </p>
                      </div>
                    </button>
                  ))}
                  {filtered.length === 0 && (
                    <div className="col-span-full text-center py-16" style={{ color: "#7A8C80" }}>
                      <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-40" />
                      <p className="text-[13px] sm:text-[14px]">No faculties match your search.</p>
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
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                  {filtered.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSearchParams({ faculty: facultyId!, course: c.id })}
                      className="group text-left"
                    >
                      <div
                        className="h-full rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 flex flex-col p-4 sm:p-5"
                        style={{
                          background: "#FFFFFF",
                          border: "1px solid #DDE8DF",
                          boxShadow: "0 1px 4px rgba(92,122,95,0.06)",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.boxShadow =
                            "0 10px 32px rgba(92,122,95,0.14)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.boxShadow =
                            "0 1px 4px rgba(92,122,95,0.06)";
                        }}
                      >
                        <div
                          className="p-2.5 rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform"
                          style={{ background: "#EFF6F0" }}
                        >
                          <BookOpen className="h-5 w-5" style={{ color: "#5C7A5F" }} />
                        </div>
                        <h3
                          className="font-semibold text-sm sm:text-base leading-snug"
                          style={{ color: "#2C3E35", fontFamily: "Georgia, serif" }}
                        >
                          {c.name}
                        </h3>
                        {c.description && (
                          <p className="text-xs line-clamp-2 mt-1" style={{ color: "#7A8C80" }}>
                            {c.description}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                  {filtered.length === 0 && (
                    <div className="col-span-full text-center py-16" style={{ color: "#7A8C80" }}>
                      <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-40" />
                      <p className="text-[13px] sm:text-[14px]">{courses.length === 0 ? "No courses in this faculty yet." : "No courses match your search."}</p>
                    </div>
                  )}
                </div>
              );
            })()
          ) : (
            // Products for selected course
            <>
              {products.length === 0 ? (
                <div className="text-center py-16" style={{ color: "#7A8C80" }}>
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-40" />
                  <p className="text-[13px] sm:text-[14px]">No stationery has been allocated to this course yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
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
