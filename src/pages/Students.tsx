import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/common/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ChevronRight, GraduationCap, BookOpen, Package, Search, Layers } from "lucide-react";
import { icons } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { Product, ProductVariant } from "@/types/product";
import { Bundle } from "@/types/bundle";
import ProductCard from "@/components/products/ProductCard";
import { smartMatch as sharedSmartMatch } from "@/lib/smart-search";

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

interface CourseYear {
  id: string;
  label: string;
  display_order: number;
}

interface CourseBundleRow {
  id: string;
  course_year_id: string;
  name: string;
  description: string | null;
  image: string;
  bundle_price: number;
  original_total_price: number;
  display_order: number;
  items?: { id: string; product_id: string; quantity: number }[];
}

const renderIcon = (iconName: string | null, className = "h-7 w-7") => {
  if (!iconName) return <GraduationCap className={className} />;
  const IconComp = (icons as Record<string, any>)[iconName];
  return IconComp ? <IconComp className={className} /> : <GraduationCap className={className} />;
};

const Students = () => {
  const { addToCart, addBundleToCart, getCartItemCount } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const facultyId = searchParams.get("faculty");
  const courseId = searchParams.get("course");

  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  // map: productId -> Set of courseYearId tagged (empty Set = all years)
  const [productYears, setProductYears] = useState<Record<string, Set<string>>>({});
  const [years, setYears] = useState<CourseYear[]>([]);
  const [courseBundles, setCourseBundles] = useState<CourseBundleRow[]>([]);
  const [activeYearId, setActiveYearId] = useState<string>("all");
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [{ data: facs }, { data: crs }] = await Promise.all([
        supabase.from("faculties").select("*").eq("is_active", true).order("display_order", { ascending: true }),
        supabase.from("courses").select("*").eq("is_active", true).order("display_order", { ascending: true }),
      ]);
      setFaculties((facs as Faculty[]) || []);
      setAllCourses((crs as Course[]) || []);
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
    setCourses(allCourses.filter((c) => c.faculty_id === facultyId));
  }, [facultyId, allCourses]);

  const smartMatch = (text: string, query: string) =>
    sharedSmartMatch(query, [text], { fuzzy: true });

  useEffect(() => {
    if (!courseId) {
      setProducts([]);
      setYears([]);
      setCourseBundles([]);
      setProductYears({});
      setActiveYearId("all");
      return;
    }
    const loadCourseData = async () => {
      const [{ data: cpRows }, { data: yearRows }, { data: bundleRows }] = await Promise.all([
        supabase
          .from("course_products")
          .select("id, display_order, product:products(*, media:product_media(*), variants:product_variants(*))")
          .eq("course_id", courseId)
          .order("display_order", { ascending: true }),
        supabase
          .from("course_years")
          .select("id, label, display_order")
          .eq("course_id", courseId)
          .eq("is_active", true)
          .order("display_order", { ascending: true }),
        supabase
          .from("course_bundles")
          .select("*")
          .eq("course_id", courseId)
          .eq("is_active", true)
          .order("display_order", { ascending: true }),
      ]);
      const bundleIds = (bundleRows || []).map((b: any) => b.id);
      let itemsByBundle: Record<string, { id: string; product_id: string; quantity: number }[]> = {};
      if (bundleIds.length > 0) {
        const { data: itemRows } = await supabase
          .from("course_bundle_items")
          .select("id, course_bundle_id, product_id, quantity")
          .in("course_bundle_id", bundleIds);
        (itemRows || []).forEach((it: any) => {
          (itemsByBundle[it.course_bundle_id] ||= []).push({
            id: it.id, product_id: it.product_id, quantity: it.quantity,
          });
        });
      }
      const bundlesWithItems: CourseBundleRow[] = (bundleRows || []).map((b: any) => ({
        id: b.id,
        course_year_id: b.course_year_id,
        name: b.name,
        description: b.description,
        image: b.image,
        bundle_price: Number(b.bundle_price),
        original_total_price: Number(b.original_total_price),
        display_order: b.display_order,
        items: itemsByBundle[b.id] || [],
      }));

      const cpIds = (cpRows || []).map((r: any) => r.id);
      let yearsByCp: Record<string, string[]> = {};
      if (cpIds.length > 0) {
        const { data: cpyRows } = await supabase
          .from("course_product_years")
          .select("course_product_id, course_year_id")
          .in("course_product_id", cpIds);
        (cpyRows || []).forEach((r: any) => {
          (yearsByCp[r.course_product_id] ||= []).push(r.course_year_id);
        });
      }

      const mapped: Product[] = [];
      const py: Record<string, Set<string>> = {};
      (cpRows || []).forEach((row: any) => {
        const p = row.product;
        if (!p) return;
        mapped.push({
          id: p.id,
          name: p.name,
          description: p.description || "",
          price: Number(p.price),
          originalPrice: p.original_price ? Number(p.original_price) : undefined,
          saleStartsAt: p.sale_starts_at || null,
          saleEndsAt: p.sale_ends_at || null,
          costPrice: p.cost_price ? Number(p.cost_price) : undefined,
          image: p.image,
          category: p.category,
          stock: p.stock ?? 0,
          is_featured: p.is_featured,
          slug: p.slug,
          media: (p.media || []).sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0)),
          variants: (p.variants || [])
            .filter((v: any) => v.is_active !== false)
            .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0)),
        });
        py[p.id] = new Set(yearsByCp[row.id] || []);
      });
      setProducts(mapped);
      setProductYears(py);
      setYears((yearRows as CourseYear[]) || []);
      setCourseBundles(bundlesWithItems);
      setActiveYearId("all");
    };
    loadCourseData();
  }, [courseId]);

  const activeFaculty = useMemo(
    () => faculties.find((f) => f.id === facultyId),
    [faculties, facultyId]
  );
  const activeCourse = useMemo(
    () => courses.find((c) => c.id === courseId),
    [courses, courseId]
  );

  const filteredProducts = useMemo(() => {
    if (activeYearId === "all") return products;
    return products.filter((p) => {
      const tags = productYears[p.id];
      if (!tags || tags.size === 0) return true; // untagged = all years
      return tags.has(activeYearId);
    });
  }, [products, productYears, activeYearId]);

  const filteredBundles = useMemo(() => {
    if (activeYearId === "all") return courseBundles;
    return courseBundles.filter((b) => b.course_year_id === activeYearId);
  }, [courseBundles, activeYearId]);

  const handleAddToCart = (product: Product, variant?: ProductVariant) => {
    addToCart(product, variant);
  };

  const handleAddBundle = (b: CourseBundleRow) => {
    const bundle: Bundle = {
      id: b.id,
      name: b.name,
      description: b.description,
      bundle_price: Number(b.bundle_price),
      original_total_price: Number(b.original_total_price),
      image: b.image,
      is_active: true,
      display_order: b.display_order,
      created_at: "",
      items: (b.items || []).map((it) => ({
        id: it.id,
        bundle_id: b.id,
        product_id: it.product_id,
        quantity: it.quantity,
      })),
    };
    addBundleToCart(bundle);
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
        description="Find the exact stationery you need for your course. Browse by faculty, course and academic year."
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
              {activeCourse ? activeCourse.name : activeFaculty ? activeFaculty.name : "SHOP BY COURSE"}
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
            (() => {
              const q = search.trim();
              const filteredFaculties = faculties.filter((f) =>
                smartMatch(`${f.name} ${f.description || ""}`, q)
              );
              const matchingCourses = q
                ? allCourses.filter((c) => smartMatch(`${c.name} ${c.description || ""}`, q))
                : [];
              const facultyById = (id: string) => faculties.find((f) => f.id === id);
              return (
                <div className="space-y-8">
                  {filteredFaculties.length > 0 && (
                    <div>
                      {q && (
                        <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3">
                          Faculties · {filteredFaculties.length}
                        </h2>
                      )}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                        {filteredFaculties.map((f) => (
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
                                    <p className="text-xs text-muted-foreground line-clamp-2">{f.description}</p>
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
                      </div>
                    </div>
                  )}

                  {q && matchingCourses.length > 0 && (
                    <div>
                      <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3">
                        Courses · {matchingCourses.length}
                      </h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                        {matchingCourses.map((c) => {
                          const fac = facultyById(c.faculty_id);
                          return (
                            <button
                              key={c.id}
                              onClick={() => { setSearch(""); setSearchParams({ faculty: c.faculty_id, course: c.id }); }}
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
                                  {fac && (
                                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider w-fit">
                                      {fac.name}
                                    </Badge>
                                  )}
                                  {c.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>
                                  )}
                                </CardContent>
                              </Card>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {q && filteredFaculties.length === 0 && matchingCourses.length === 0 && (
                    <div className="text-center py-16 text-muted-foreground">
                      <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-40" />
                      <p>No faculties or courses match "{q}".</p>
                    </div>
                  )}
                </div>
              );
            })()
          ) : !activeCourse ? (
            (() => {
              const q = search.trim();
              const filtered = courses.filter((c) =>
                smartMatch(`${c.name} ${c.description || ""}`, q)
              );
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
                            <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>
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
            // Products + Bundles for selected course
            <>
              {/* Year chips */}
              {years.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-2 text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                    <Layers className="h-3.5 w-3.5" /> Academic Year
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setActiveYearId("all")}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border-2 transition-all ${
                        activeYearId === "all"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:border-primary/50"
                      }`}
                    >
                      All Years
                    </button>
                    {years.map((y) => (
                      <button
                        key={y.id}
                        onClick={() => setActiveYearId(y.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border-2 transition-all ${
                          activeYearId === y.id
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border hover:border-primary/50"
                        }`}
                      >
                        {y.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Course bundles for the selected year */}
              {filteredBundles.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-sm uppercase tracking-widest text-muted-foreground font-semibold mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4" /> Bundle Offers · {filteredBundles.length}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredBundles.map((b) => {
                      const savings = Number(b.original_total_price) - Number(b.bundle_price);
                      const yearLabel = years.find((y) => y.id === b.course_year_id)?.label;
                      return (
                        <Card key={b.id} className="overflow-hidden border-2 hover:border-primary/40 transition-all">
                          <div className="aspect-video bg-muted relative">
                            <img src={b.image} alt={b.name} className="w-full h-full object-cover" />
                            {yearLabel && (
                              <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground uppercase text-[10px]">
                                {yearLabel}
                              </Badge>
                            )}
                          </div>
                          <CardContent className="p-4 space-y-2">
                            <h3 className="font-bold text-base uppercase tracking-tight">{b.name}</h3>
                            {b.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">{b.description}</p>
                            )}
                            <div className="flex items-baseline gap-2">
                              <span className="text-lg font-bold text-primary">Ksh {Number(b.bundle_price).toFixed(0)}</span>
                              <span className="text-xs text-muted-foreground line-through">
                                Ksh {Number(b.original_total_price).toFixed(0)}
                              </span>
                              {savings > 0 && (
                                <Badge variant="secondary" className="text-[10px]">Save Ksh {savings.toFixed(0)}</Badge>
                              )}
                            </div>
                            <Button onClick={() => handleAddBundle(b)} className="w-full mt-1" size="sm">
                              Add Bundle
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {filteredProducts.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-40" />
                  <p>
                    {products.length === 0
                      ? "No stationery has been allocated to this course yet."
                      : "No stationery tagged for this year yet."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                  {filteredProducts.map((p) => (
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
