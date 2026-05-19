import { Product } from "./product";

export interface BogoOffer {
  id: string;
  name: string;
  product_id: string;
  buy_quantity: number;
  get_quantity: number;
  free_product_id: string | null;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  display_order: number;
  created_at: string;
  product?: Product;
  free_product?: Product | null;
}
