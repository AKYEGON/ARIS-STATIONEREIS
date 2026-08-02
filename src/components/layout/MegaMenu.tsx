import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCategoryTree, CategoryNode } from "@/hooks/use-category-tree";
import { getCategoryIcon, IconArrowRight } from "@/components/icons/aris-icons";
import { Skeleton } from "@/components/ui/skeleton";

interface QuickItem {
  name: string;
  slug: string | null;
  id: string;
}

const itemCache = new Map<string, QuickItem[]>();

/**
 * Three columns visible at once: mains, the subcategories under the active
 * main, then a handful of real products inside the active subcategory.
 * Every link points at a category or product URL that already exists.
 */
const MegaMenu = ({ onNavigate }: { onNavigate?: () => void }) => {
  const { tree, loading } = useCategoryTree();
  const [mainSlug, setMainSlug] = useState<string | null>(null);
  const [subSlug, setSubSlug] = useState<string | null>(null);
  const [items, setItems] = useState<QuickItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  const activeMain: CategoryNode | undefined = useMemo(
    () => tree.find((m) => m.slug === mainSlug) || tree[0],
    [tree, mainSlug],
  );
  const activeSub: CategoryNode | undefined = useMemo(
    () => activeMain?.children.find((c) => c.slug === subSlug) || activeMain?.children[0],
    [activeMain, subSlug],
  );

  useEffect(() => {
    if (!activeSub) {
      setItems([]);
      return;
    }
    const key = activeSub.id;
    if (itemCache.has(key)) {
      setItems(itemCache.get(key)!);
      return;
    }
    let cancelled = false;
    setItemsLoading(true);
    (async () => {
      const { data: assigns } = await supabase
        .from("product_category_assignments")
        .select("product_id")
        .eq("category_id", key)
        .limit(6);

      let rows: any[] = [];
      const ids = (assigns || []).map((a: any) => a.product_id);
      if (ids.length > 0) {
        const { data } = await supabase
          .from("products")
          .select("id,name,slug")
          .in("id", ids)
          .order("is_featured", { ascending: false })
          .limit(5);
        rows = data || [];
      } else {
        const { data } = await supabase
          .from("products")
          .select("id,name,slug")
          .eq("category", activeSub.name)
          .order("is_featured", { ascending: false })
          .limit(5);
        rows = data || [];
      }
      if (cancelled) return;
      const mapped = rows.map((r) => ({ id: r.id, name: r.name, slug: r.slug }));
      itemCache.set(key, mapped);
      setItems(mapped);
      setItemsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [activeSub]);

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-6 p-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            {Array.from({ length: 5 }).map((_, j) => (
              <Skeleton key={j} className="h-7 w-full rounded-md" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[1.1fr_1fr_1fr] divide-x divide-border">
      {/* Column 1: main categories */}
      <ul className="p-2">
        {tree.map((m) => {
          const Icon = getCategoryIcon(m.slug);
          const active = activeMain?.slug === m.slug;
          return (
            <li key={m.id}>
              <Link
                to={`/category/${m.slug}`}
                onMouseEnter={() => {
                  setMainSlug(m.slug);
                  setSubSlug(null);
                }}
                onFocus={() => {
                  setMainSlug(m.slug);
                  setSubSlug(null);
                }}
                onClick={onNavigate}
                className={`flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm transition-colors ${
                  active ? "bg-primary/10 font-semibold text-primary" : "hover:bg-secondary"
                }`}
              >
                <Icon size={18} />
                <span className="flex-1 truncate">{m.name}</span>
                <IconArrowRight size={14} className={active ? "opacity-100" : "opacity-0"} />
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Column 2: subcategories under the active main */}
      <div className="p-2">
        {activeMain && activeMain.children.length > 0 ? (
          <ul>
            {activeMain.children.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/category/${c.slug}`}
                  onMouseEnter={() => setSubSlug(c.slug)}
                  onFocus={() => setSubSlug(c.slug)}
                  onClick={onNavigate}
                  className={`block truncate rounded-md px-3 py-2.5 text-sm transition-colors ${
                    activeSub?.slug === c.slug ? "bg-secondary font-medium" : "hover:bg-secondary"
                  }`}
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-3 py-3 text-sm text-muted-foreground">
            {activeMain?.name} is a single shelf. Open it to see everything in stock.
          </p>
        )}
      </div>

      {/* Column 3: real products in the active subcategory */}
      <div className="bg-secondary/30 p-2">
        {itemsLoading ? (
          <div className="space-y-2 p-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full rounded" />
            ))}
          </div>
        ) : items.length > 0 ? (
          <>
            <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              In {activeSub?.name}
            </p>
            <ul>
              {items.map((it) => (
                <li key={it.id}>
                  <Link
                    to={`/product/${it.slug || it.id}`}
                    onClick={onNavigate}
                    className="block truncate rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    {it.name}
                  </Link>
                </li>
              ))}
              {activeSub && (
                <li>
                  <Link
                    to={`/category/${activeSub.slug}`}
                    onClick={onNavigate}
                    className="mt-1 inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-primary hover:underline"
                  >
                    View all {activeSub.name}
                    <IconArrowRight size={14} />
                  </Link>
                </li>
              )}
            </ul>
          </>
        ) : (
          <p className="px-3 py-3 text-sm text-muted-foreground">
            Nothing listed here yet.
          </p>
        )}
      </div>
    </div>
  );
};

export default MegaMenu;
