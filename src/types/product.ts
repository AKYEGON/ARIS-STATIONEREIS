export interface ProductMedia {
  id: string;
  product_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  display_order: number;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  variant_type: string;
  variant_value: string;
  price: number;
  cost_price: number;
  stock: number;
  sku: string | null;
  is_active: boolean;
  display_order: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  costPrice?: number;
  stock?: number;
  image: string;
  category: string;
  categories?: string[];
  is_featured?: boolean;
  display_order?: number;
  media?: ProductMedia[];
  variants?: ProductVariant[];
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  display_order: number;
  is_active: boolean;
}

export interface CartItem extends Product {
  quantity: number;
  selectedVariant?: ProductVariant;
}
