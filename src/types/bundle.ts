import { Product } from "./product";

export interface BundleItem {
  id: string;
  bundle_id: string;
  product_id: string;
  quantity: number;
  product?: Product;
}

export interface Bundle {
  id: string;
  name: string;
  description: string | null;
  bundle_price: number;
  original_total_price: number;
  image: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  items?: BundleItem[];
}

export interface CartBundle extends Bundle {
  quantity: number;
}
