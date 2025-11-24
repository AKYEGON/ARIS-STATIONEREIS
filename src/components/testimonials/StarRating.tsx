import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  size?: number;
}

const StarRating = ({ rating, size = 20 }: StarRatingProps) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted"}
        />
      ))}
    </div>
  );
};

export default StarRating;
