import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star, BadgeCheck } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Review {
  id: string;
  customer_name: string;
  customer_photo: string | null;
  review_text: string | null;
  rating: number | null;
  video_url: string | null;
  is_verified_purchase: boolean | null;
  created_at: string;
}

interface Props {
  productId: string;
  onLoaded?: (data: { count: number; average: number; reviews: Review[] }) => void;
}

const Stars = ({ value, size = 14 }: { value: number; size?: number }) => (
  <div className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        style={{ width: size, height: size }}
        className={n <= Math.round(value) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"}
      />
    ))}
  </div>
);

const ProductReviews = ({ productId, onLoaded }: Props) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("customer_testimonials")
        .select("id, customer_name, customer_photo, review_text, rating, video_url, is_verified_purchase, created_at")
        .eq("product_id", productId)
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      const rows = (data || []) as Review[];
      setReviews(rows);
      setLoading(false);
      const ratings = rows.filter((r) => r.rating && r.rating > 0).map((r) => r.rating as number);
      const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
      onLoaded?.({ count: rows.length, average: avg, reviews: rows });
    };
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const ratings = reviews.filter((r) => r.rating && r.rating > 0).map((r) => r.rating as number);
  const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

  return (
    <section className="pt-6 border-t" id="reviews">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <h2 className="text-lg sm:text-xl font-bold">Customer Reviews</h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Stars value={avg} size={16} />
            <span className="font-semibold">{avg.toFixed(1)}</span>
            <span className="text-muted-foreground">· {reviews.length} review{reviews.length === 1 ? "" : "s"}</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading reviews…</div>
      ) : reviews.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          No reviews yet. Be the first to review this product after your purchase.
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {reviews.map((r) => (
            <Card key={r.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {r.customer_photo ? (
                    <img
                      src={r.customer_photo}
                      alt={r.customer_name}
                      className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold flex-shrink-0">
                      {r.customer_name?.[0]?.toUpperCase() || "C"}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{r.customer_name}</p>
                    <div className="flex items-center gap-2">
                      {r.rating ? <Stars value={r.rating} /> : null}
                      {r.is_verified_purchase && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-green-700 font-medium">
                          <BadgeCheck className="h-3 w-3" />
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
              </div>
              {r.review_text && (
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {r.review_text}
                </p>
              )}
              {r.video_url && (
                <video src={r.video_url} className="w-full rounded-md max-h-60" controls />
              )}
            </Card>
          ))}
        </div>
      )}
    </section>
  );
};

export default ProductReviews;
