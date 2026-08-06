import {
  BarChart3,
  ClipboardList,
  KeyRound,
  LayoutDashboard,
  Package,
  Percent,
  Settings,
  ShoppingBag,
  Star,
  TrendingUp,
  UsersRound,
  Warehouse,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface AdminTabMeta {
  value: string;
  label: string;
  icon: any;
  group: string;
  hint: string;
}

/**
 * Single source of truth for admin navigation. Tabs are grouped by the job
 * being done (sell, fulfil, merchandise, run the business) instead of one flat
 * row of eleven buttons.
 */
export const ADMIN_TABS: AdminTabMeta[] = [
  { value: "orders", label: "Orders", icon: ShoppingBag, group: "Selling", hint: "Live orders and fulfilment" },
  { value: "sales", label: "Sales", icon: TrendingUp, group: "Selling", hint: "Revenue and profit" },
  { value: "offers", label: "Offers", icon: Percent, group: "Selling", hint: "Flash sales, bundles, BOGO" },

  { value: "products", label: "Products", icon: Package, group: "Catalogue", hint: "Add, edit and import products" },
  { value: "inventory", label: "Inventory", icon: Warehouse, group: "Catalogue", hint: "Stock levels and movements" },
  { value: "categories", label: "Categories", icon: BarChart3, group: "Catalogue", hint: "Category tree" },

  { value: "homepage", label: "Homepage", icon: LayoutDashboard, group: "Storefront", hint: "Hero slides and picks" },
  { value: "testimonials", label: "Reviews", icon: Star, group: "Storefront", hint: "Customer reviews and stories" },
  { value: "lists", label: "School lists", icon: ClipboardList, group: "Storefront", hint: "Submitted shopping lists" },

  { value: "team", label: "Team", icon: UsersRound, group: "Business", hint: "Staff and roles" },
  { value: "settings", label: "Settings", icon: Settings, group: "Business", hint: "Checkout options and zones" },
  { value: "api", label: "API keys", icon: KeyRound, group: "Business", hint: "Marketplace integrations" },
];

const GROUP_ORDER = ["Selling", "Catalogue", "Storefront", "Business"];

interface Props {
  visibleTabs: string[];
  activeTab: string;
  onChange: (tab: string) => void;
}

export const AdminNav = ({ visibleTabs, activeTab, onChange }: Props) => {
  const tabs = ADMIN_TABS.filter((t) => visibleTabs.includes(t.value));
  const groups = GROUP_ORDER.map((g) => ({ name: g, items: tabs.filter((t) => t.group === g) })).filter(
    (g) => g.items.length > 0,
  );
  const current = tabs.find((t) => t.value === activeTab);

  return (
    <div className="mb-6">
      {/* Mobile: one grouped dropdown instead of a scrolling wall of tabs */}
      <div className="lg:hidden">
        <Select value={activeTab} onValueChange={onChange}>
          <SelectTrigger className="w-full h-11">
            <SelectValue placeholder="Choose a section" />
          </SelectTrigger>
          <SelectContent>
            {groups.map((g) => (
              <SelectGroup key={g.name}>
                <SelectLabel className="text-[11px] uppercase tracking-wide">{g.name}</SelectLabel>
                {g.items.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <span className="flex items-center gap-2">
                      <t.icon className="h-4 w-4" />
                      {t.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
        {current && <p className="text-xs text-muted-foreground mt-2">{current.hint}</p>}
      </div>

      {/* Desktop: grouped rail so related tools sit together */}
      <div className="hidden lg:flex flex-wrap items-start gap-x-6 gap-y-3 border-b pb-3">
        {groups.map((g) => (
          <div key={g.name} className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {g.name}
            </p>
            <div className="flex items-center gap-1">
              {g.items.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  title={t.hint}
                  onClick={() => onChange(t.value)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                    activeTab === t.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <t.icon className="h-4 w-4" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminNav;
