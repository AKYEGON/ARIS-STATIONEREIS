import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { getCategoryIcon } from "@/components/icons/aris-icons";

interface MainCategory {
  id: string;
  name: string;
  slug: string;
  child_count: number;
}

/**
 * Primary navigation moment on the homepage: main categories only, each with
 * its own purpose-built glyph, linking straight to the category page.
 * New main categories appear here automatically once switched active in admin.
 */
const CategoryStrip = () => {
  const [cats, setCats] = useState<MainCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("product_categories")
        .select("id,name,slug,parent_id,is_active,display_order")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (cancelled) return;
      const rows = data || [];
      const mains = rows
        .filter((c: any) => !c.parent_id)
        .map((c: any) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          child_count: rows.filter((r: any) => r.parent_id === c.id).length,
        }));
      setCats(mains);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="categories" className="container scroll-mt-20 px-4 py-10 sm:py-14">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
            Categories
          </h2>

        </div>
        <Link to="/shop" className="shrink-0 text-sm font-medium text-primary hover:underline">
          All products
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {cats.map((c) => {
            const Icon = getCategoryIcon(c.slug);
            return (
              <Link
                key={c.id}
                to={`/category/${c.slug}`}
                className="group flex flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon size={24} />
                </span>
                <span className="mt-4">
                  <span className="block text-sm font-semibold leading-tight">{c.name}</span>
                  {c.child_count > 0 && (
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">
                      {c.child_count} {c.child_count === 1 ? "section" : "sections"}
                    </span>
                  )}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default CategoryStrip;
