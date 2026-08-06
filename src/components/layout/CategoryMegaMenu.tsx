import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, LayoutGrid } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import CategoryIcon from "@/components/products/CategoryIcon";
import { useCategoryTree } from "@/hooks/use-category-tree";

/** Desktop mega menu. Categories come from the database, never hardcoded. */
export const CategoryMegaMenu = () => {
  const { data } = useCategoryTree();
  const tree = data?.tree || [];
  if (tree.length === 0) return null;

  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="h-9 bg-transparent px-3 font-medium">
            <LayoutGrid className="mr-2 h-4 w-4" aria-hidden="true" />
            Categories
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[640px] grid-cols-2 gap-x-6 gap-y-5 p-5 lg:w-[760px] lg:grid-cols-3">
              {tree.map((main) => (
                <li key={main.id}>
                  <NavigationMenuLink asChild>
                    <Link
                      to={`/category/${main.slug}`}
                      className="flex items-center gap-2 text-sm font-semibold hover:text-primary"
                    >
                      <CategoryIcon name={main.icon} className="h-4 w-4 text-primary" />
                      {main.name}
                    </Link>
                  </NavigationMenuLink>
                  {main.children.length > 0 && (
                    <ul className="mt-2 space-y-1.5 border-l border-border pl-3">
                      {main.children.map((child) => (
                        <li key={child.id}>
                          <NavigationMenuLink asChild>
                            <Link
                              to={`/category/${main.slug}/${child.slug}`}
                              className="block text-sm text-muted-foreground hover:text-primary"
                            >
                              {child.name}
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};

/** Mobile equivalent: a sheet with tap-to-expand main categories. */
export const CategoryMobileMenu = () => {
  const [open, setOpen] = useState(false);
  const { data } = useCategoryTree();
  const tree = data?.tree || [];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="md:hidden gap-1.5" aria-label="Open categories menu">
          <LayoutGrid className="h-4 w-4" aria-hidden="true" />
          <span className="text-xs">Categories</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[85vw] max-w-sm overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle>Categories</SheetTitle>
        </SheetHeader>
        <Accordion type="multiple" className="mt-3">
          {tree.map((main) =>
            main.children.length > 0 ? (
              <AccordionItem key={main.id} value={main.id}>
                <AccordionTrigger className="py-3 text-sm font-semibold hover:no-underline">
                  <span className="flex items-center gap-2">
                    <CategoryIcon name={main.icon} className="h-4 w-4 text-primary" />
                    {main.name}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-1 pl-6">
                    <li>
                      <Link
                        to={`/category/${main.slug}`}
                        onClick={() => setOpen(false)}
                        className="block py-1.5 text-sm font-medium text-primary"
                      >
                        All {main.name}
                      </Link>
                    </li>
                    {main.children.map((child) => (
                      <li key={child.id}>
                        <Link
                          to={`/category/${main.slug}/${child.slug}`}
                          onClick={() => setOpen(false)}
                          className="block py-1.5 text-sm text-muted-foreground"
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ) : (
              <div key={main.id} className="border-b">
                <Link
                  to={`/category/${main.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between py-3 text-sm font-semibold"
                >
                  <span className="flex items-center gap-2">
                    <CategoryIcon name={main.icon} className="h-4 w-4 text-primary" />
                    {main.name}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </Link>
              </div>
            ),
          )}
        </Accordion>
      </SheetContent>
    </Sheet>
  );
};
