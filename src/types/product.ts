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
}

export interface CartItem extends Product {
  quantity: number;
}
