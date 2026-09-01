import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { CategoryRecord } from "@/lib/categories";

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  parent_id: string | null;
  display_order: number;
  image: string | null;
  is_active: boolean;
  intro_copy: string | null;
  meta_title: string | null;
  meta_description: string | null;
  children: CategoryNode[];
}

export interface CategoryTree {
  /** Main categories (no parent), each carrying its subcategories. */
  tree: CategoryNode[];
  /** Every active category, flat. */
  all: CategoryNode[];
  bySlug: Record<string, CategoryNode>;
  loading: boolean;
  /** react-query-style shape used by the category landing pages. */
  data: { records: CategoryRecord[]; tree: CategoryNode[] };
  isLoading: boolean;
}

let cache: { tree: CategoryNode[]; all: CategoryNode[] } | null = null;

/**
 * Single source of truth for the taxonomy. /shop, the mega-menu, the footer
 * and the category pages all read the same shape, so a new main category or
 * subcategory shows up everywhere the moment it is switched active in admin.
 */
export function useCategoryTree(): CategoryTree {
  const [state, setState] = useState<{ tree: CategoryNode[]; all: CategoryNode[] }>(
    cache ?? { tree: [], all: [] },
  );
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("product_categories")
        .select("id,name,slug,icon,parent_id,display_order,is_active,image,intro_copy,meta_title,meta_description")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (cancelled) return;

      const all: CategoryNode[] = (data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        icon: c.icon ?? null,
        parent_id: c.parent_id ?? null,
        display_order: c.display_order ?? 0,
        image: c.image ?? null,
        is_active: c.is_active ?? true,
        intro_copy: c.intro_copy ?? null,
        meta_title: c.meta_title ?? null,
        meta_description: c.meta_description ?? null,
        children: [],
      }));

      const byId = new Map(all.map((c) => [c.id, c]));
      const tree: CategoryNode[] = [];
      all.forEach((c) => {
        if (c.parent_id && byId.has(c.parent_id)) byId.get(c.parent_id)!.children.push(c);
        else if (!c.parent_id) tree.push(c);
      });
      tree.forEach((m) => m.children.sort((a, b) => a.display_order - b.display_order));
      tree.sort((a, b) => a.display_order - b.display_order);

      cache = { tree, all };
      setState(cache);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const bySlug: Record<string, CategoryNode> = {};
  state.all.forEach((c) => (bySlug[c.slug] = c));

  return {
    tree: state.tree,
    all: state.all,
    bySlug,
    loading,
    data: { records: state.all, tree: state.tree },
    isLoading: loading,
  };
}

/** Main category that owns a given category (itself if it is already a main). */
export function findMain(tree: CategoryNode[], slug?: string | null): CategoryNode | undefined {
  if (!slug) return undefined;
  return tree.find((m) => m.slug === slug || m.children.some((c) => c.slug === slug));
}
