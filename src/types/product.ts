export interface ProductMedia {
  id: string;
  product_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  display_order: number;
  created_at: string;
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
  media?: ProductMedia[];
}

export interface CartItem extends Product {
  quantity: number;
}
