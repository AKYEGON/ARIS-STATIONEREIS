import { useQuery } from "@tanstack/react-query";
import { buildTree, fetchCategoryRecords, CategoryRecord, CategoryNode } from "@/lib/categories";

export interface CategoryTree {
  records: CategoryRecord[];
  tree: CategoryNode[];
}

export function useCategoryTree() {
  return useQuery<CategoryTree>({
    queryKey: ["category-tree"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const records = await fetchCategoryRecords();
      return { records, tree: buildTree(records) };
    },
  });
}
