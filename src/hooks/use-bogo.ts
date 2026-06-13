import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BogoOffer } from "@/types/bogo";
import { Product } from "@/types/product";
import { CartItem } from "@/types/product";

/**
 * Loads active BOGO offers and computes "earned" free items from the cart,
 * regardless of where the qualifying product was added from (Home, Shop,
 * Course page, Deals page, etc.).
 *
 * A BOGO is earned when the matching product's total quantity in cart
 * is >= buy_quantity. For every buy_quantity multiple, we award get_quantity
 * units of the free product (defaults to the same product).
 */
export interface EarnedBogo {
  offer: BogoOffer;
  freeQty: number;
  freeProduct: Product;
}

const formatProduct = (p: any): Product => ({
  id: p.id,
  name: p.name,
  description: p.description || "",
  price: Number(p.price),
  image: p.image,
  category: p.category,
  slug: p.slug,
});

export const useBogoOffers = () => {
  const [offers, setOffers] = useState<BogoOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data } = await supabase
        .from("bogo_offers")
        .select(
          `*,
           product:products!bogo_offers_product_id_fkey(*),
           free_product:products!bogo_offers_free_product_id_fkey(*)`,
        )
        .eq("is_active", true);

      if (!active) return;
      const now = Date.now();
      const live = (data || []).filter((b: any) => {
        const starts = b.starts_at ? new Date(b.starts_at).getTime() : 0;
        const ends = b.ends_at ? new Date(b.ends_at).getTime() : Infinity;
        return now >= starts && now <= ends;
      });
      setOffers(
        live.map((b: any) => ({
          ...b,
          product: b.product ? formatProduct(b.product) : undefined,
          free_product: b.free_product ? formatProduct(b.free_product) : null,
        })),
      );
      setLoading(false);
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  return { offers, loading };
};

export const computeEarnedBogos = (
  offers: BogoOffer[],
  cartItems: CartItem[],
): EarnedBogo[] => {
  const qtyByProduct = cartItems.reduce<Record<string, number>>((acc, it) => {
    acc[it.id] = (acc[it.id] || 0) + it.quantity;
    return acc;
  }, {});

  const earned: EarnedBogo[] = [];
  for (const offer of offers) {
    const qty = qtyByProduct[offer.product_id] || 0;
    if (qty < offer.buy_quantity) continue;
    const multiples = Math.floor(qty / offer.buy_quantity);
    const freeQty = multiples * offer.get_quantity;
    const freeProduct = offer.free_product || offer.product;
    if (!freeProduct) continue;
    earned.push({ offer, freeQty, freeProduct });
  }
  return earned;
};

export const useEarnedBogos = (cartItems: CartItem[]) => {
  const { offers, loading } = useBogoOffers();
  const earned = useMemo(
    () => computeEarnedBogos(offers, cartItems),
    [offers, cartItems],
  );
  return { earned, loading };
};
