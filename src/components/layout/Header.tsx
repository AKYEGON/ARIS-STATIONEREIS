import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Menu } from "lucide-react";
import icon from "@/assets/aris-icon.png.asset.json";
import SearchBar from "@/components/layout/SearchBar";
import MegaMenu from "@/components/layout/MegaMenu";
import { useCategoryTree } from "@/hooks/use-category-tree";
import {
  IconHome,
  IconStorefront,
  IconPriceDrop,
  IconCustomers,
  IconCart,
  IconSearch,
  getCategoryIcon,
} from "@/components/icons/aris-icons";

interface HeaderProps {
  cartItemCount: number;
}

const bottomTabs = [
  { to: "/", label: "Home", icon: IconHome },
  { to: "/shop", label: "Shop", icon: IconStorefront },
  { to: "/deals", label: "Deals", icon: IconPriceDrop },
  { to: "/testimonials", label: "Customers", icon: IconCustomers },
  { to: "/cart", label: "Cart", icon: IconCart },
] as const;

const desktopNav = [
  { to: "/shop", label: "Shop", icon: IconStorefront },
  { to: "/deals", label: "Deals", icon: IconPriceDrop },
  { to: "/testimonials", label: "Customers", icon: IconCustomers },
] as const;

const Header = ({ cartItemCount }: HeaderProps) => {
  const location = useLocation();
  const { tree } = useCategoryTree();
  const [menuOpen, setMenuOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container flex h-16 items-center gap-3 px-4 sm:h-[70px] sm:gap-5">
          {/* Brand */}
          <Link
            to="/"
            className="flex min-w-0 shrink-0 items-center gap-2 transition-transform duration-200 hover:scale-[1.01]"
            aria-label="ARIS. Spend less. Study better."
          >
            <img src={icon.url} alt="" aria-hidden="true" className="h-9 w-auto sm:h-11" />
            <span className="flex min-w-0 flex-col leading-none">
              <span className="font-display text-xl font-black tracking-tight text-primary sm:text-2xl">
                ARIS
              </span>
              <span className="mt-0.5 hidden text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground sm:block">
                Spend less. Study better.
              </span>
            </span>
          </Link>

          {/* Persistent search, tablet + desktop */}
          <div className="hidden min-w-0 flex-1 justify-center md:flex">
            <SearchBar className="w-full max-w-xl" />
          </div>


          {/* Desktop nav */}
          <nav className="hidden shrink-0 items-center gap-1 lg:flex">
            <div
              className="relative"
              onMouseEnter={() => setMegaOpen(true)}
              onMouseLeave={() => setMegaOpen(false)}
            >
              <button
                type="button"
                onClick={() => setMegaOpen((o) => !o)}
                aria-expanded={megaOpen}
                className={`inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors ${
                  megaOpen || location.pathname.startsWith("/category")
                    ? "bg-secondary text-primary"
                    : "hover:bg-secondary"
                }`}
              >
                Categories
                <span
                  className={`text-[10px] transition-transform ${megaOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                >
                  ▾
                </span>
              </button>

              {megaOpen && (
                <div className="absolute right-0 top-full z-50 w-[min(860px,calc(100vw-2rem))] pt-2">
                  <div className="overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
                    <MegaMenu onNavigate={() => setMegaOpen(false)} />
                  </div>
                </div>
              )}
            </div>

            {desktopNav.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors ${
                  isActive(to) ? "bg-secondary text-primary" : "hover:bg-secondary"
                }`}
              >
                <Icon size={17} />
                {label}
              </Link>
            ))}

            <Link
              to="/cart"
              className={`relative ml-1 inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm font-medium transition-colors hover:bg-secondary ${
                isActive("/cart") ? "text-primary" : ""
              }`}
            >
              <IconCart size={17} />
              Cart
              {cartItemCount > 0 && (
                <Badge className="ml-0.5 h-5 min-w-5 justify-center p-0 px-1 text-[10px]">
                  {cartItemCount}
                </Badge>
              )}
            </Link>
          </nav>

          {/* Mobile + tablet controls */}
          <div className="ml-auto flex items-center gap-1 lg:hidden">
            <Link
              to="/cart"
              aria-label="Cart"
              className={`relative hidden h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm font-medium transition-colors hover:bg-secondary md:inline-flex ${
                isActive("/cart") ? "text-primary" : ""
              }`}
            >
              <IconCart size={17} />
              Cart
              {cartItemCount > 0 && (
                <Badge className="ml-0.5 h-5 min-w-5 justify-center p-0 px-1 text-[10px]">
                  {cartItemCount}
                </Badge>
              )}
            </Link>


            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Browse categories">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[88vw] max-w-sm overflow-y-auto p-0">
                <div className="border-b border-border p-4">
                  <p className="font-display text-lg font-bold">Browse ARIS</p>
                  <p className="text-xs text-muted-foreground">Every shelf, one tap away.</p>
                </div>
                <Accordion type="single" collapsible className="px-2">
                  {tree.map((m) => {
                    const Icon = getCategoryIcon(m.slug);
                    return (
                      <AccordionItem key={m.id} value={m.slug} className="border-b-0">
                        <AccordionTrigger className="rounded-md px-2 py-3 text-sm hover:bg-secondary hover:no-underline">
                          <span className="flex items-center gap-2.5">
                            <Icon size={18} />
                            {m.name}
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="pb-1 pl-9">
                          <Link
                            to={`/category/${m.slug}`}
                            onClick={() => setMenuOpen(false)}
                            className="block py-2 text-sm font-medium text-primary"
                          >
                            All {m.name}
                          </Link>
                          {m.children.map((c) => (
                            <Link
                              key={c.id}
                              to={`/category/${c.slug}`}
                              onClick={() => setMenuOpen(false)}
                              className="block py-2 text-sm text-muted-foreground"
                            >
                              {c.name}
                            </Link>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
                <div className="mt-2 border-t border-border p-3">
                  <Link
                    to="/shop"
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-md bg-primary px-3 py-2.5 text-center text-sm font-semibold text-primary-foreground"
                  >
                    Browse everything
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

      </header>

      {/* Mobile / tablet full-width search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-[120] lg:hidden">
          <button
            aria-label="Close search"
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setSearchOpen(false)}
          />
          <div className="relative border-b border-border bg-background p-3 shadow-lg">
            <div className="flex items-center gap-2">
              <SearchBar className="flex-1" autoFocus onSubmitted={() => setSearchOpen(false)} />
              <Button variant="ghost" size="sm" onClick={() => setSearchOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom tab bar */}
      <nav
        data-bottom-nav
        className="fixed bottom-0 left-0 right-0 z-[100] border-t border-border bg-background shadow-[0_-4px_20px_rgba(0,0,0,0.15)] lg:hidden"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 4px)" }}
      >
        <div className="flex items-center justify-around" style={{ height: "clamp(52px, 8vh, 64px)" }}>
          {bottomTabs.map(({ to, label, icon: Icon }) => {
            const active = isActive(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex h-full flex-1 flex-col items-center justify-center gap-0.5 transition-colors ${
                  active ? "font-semibold text-primary" : "text-muted-foreground"
                }`}
              >
                <span className="relative">
                  <Icon size={21} />
                  {to === "/cart" && cartItemCount > 0 && (
                    <Badge className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center bg-primary p-0 text-[9px]">
                      {cartItemCount}
                    </Badge>
                  )}
                </span>
                <span className="text-[clamp(9px,1.2vh,11px)] font-medium leading-none">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default Header;
