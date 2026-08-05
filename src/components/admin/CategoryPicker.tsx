import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { renderCategoryIcon } from "./CategoryTreeManager";

export interface PickerCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  parent_id?: string | null;
  display_order?: number;
}

interface Props {
  categories: PickerCategory[];
  selected: string[];
  onChange: (ids: string[]) => void;
  idPrefix?: string;
}

/**
 * Shared taxonomy picker used by the add and edit product dialogs. Shows the
 * real main-category / subcategory hierarchy so staff can never file a product
 * under a subcategory without seeing which section it belongs to.
 */
export const CategoryPicker = ({ categories, selected, onChange, idPrefix = "cat" }: Props) => {
  const [query, setQuery] = useState("");

  const { mains, childrenOf } = useMemo(() => {
    const sorted = [...categories].sort(
      (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0),
    );
    const childrenOf: Record<string, PickerCategory[]> = {};
    sorted.forEach((c) => {
      if (c.parent_id) (childrenOf[c.parent_id] ||= []).push(c);
    });
    return { mains: sorted.filter((c) => !c.parent_id), childrenOf };
  }, [categories]);

  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  const matches = (c: PickerCategory) =>
    !query.trim() || c.name.toLowerCase().includes(query.trim().toLowerCase());

  const row = (cat: PickerCategory, sub = false) => (
    <div key={cat.id} className={`flex items-center gap-2 ${sub ? "pl-6" : ""}`}>
      <Checkbox
        id={`${idPrefix}-${cat.id}`}
        checked={selected.includes(cat.id)}
        onCheckedChange={() => toggle(cat.id)}
      />
      <label
        htmlFor={`${idPrefix}-${cat.id}`}
        className={`text-sm cursor-pointer flex items-center gap-1.5 ${sub ? "" : "font-medium"}`}
      >
        {renderCategoryIcon(cat.icon, "h-3.5 w-3.5 text-muted-foreground")}
        {cat.name}
      </label>
    </div>
  );

  const selectedNames = categories.filter((c) => selected.includes(c.id));

  return (
    <div className="space-y-2 mt-1">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search categories"
          className="pl-8 h-8 text-sm"
        />
      </div>

      <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2.5">
        {mains.map((main) => {
          const kids = (childrenOf[main.id] || []).filter(matches);
          if (!matches(main) && kids.length === 0) return null;
          return (
            <div key={main.id} className="space-y-1.5">
              {row(main)}
              {kids.map((k) => row(k, true))}
            </div>
          );
        })}
        {categories.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No categories yet. Create them under Settings, Category Tree.
          </p>
        )}
      </div>

      {selectedNames.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedNames.map((c) => (
            <Badge key={c.id} variant="secondary" className="text-[10px]">
              {c.name}
            </Badge>
          ))}
        </div>
      )}
      <p className="text-[11px] text-muted-foreground">
        First selected category becomes the product's primary label.
      </p>
    </div>
  );
};

export default CategoryPicker;
