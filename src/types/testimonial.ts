export interface CustomerTestimonial {
  id: string;
  customer_name: string;
  customer_photo: string | null;
  product_name?: string;
  product_id?: string | null;
  review_text: string;
  rating: 1 | 2 | 3 | 4 | 5;
  video_url?: string;
  display_order: number;
  is_featured: boolean;
  is_published: boolean;
  is_verified_purchase?: boolean;
  created_at: string;
}
