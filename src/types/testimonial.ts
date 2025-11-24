export interface CustomerTestimonial {
  id: string;
  customer_name: string;
  customer_photo: string;
  product_name?: string;
  review_text: string;
  rating: 1 | 2 | 3 | 4 | 5;
  video_url?: string;
  display_order: number;
  is_featured: boolean;
  is_published: boolean;
  created_at: string;
  views?: number;
  completed_views?: number;
  completion_rate?: number;
  average_view_duration?: number;
  engagement_score?: number;
}
