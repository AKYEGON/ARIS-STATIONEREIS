import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Star, Upload, X, Loader2, Camera, Video } from "lucide-react";
import CameraCapture from "./CameraCapture";

interface ReviewSubmissionFormProps {
  onSuccess: () => void;
  prefillData?: {
    customerName?: string;
    phone?: string;
    productName?: string;
  };
}

const ReviewSubmissionForm = ({ onSuccess, prefillData }: ReviewSubmissionFormProps) => {
  const [formData, setFormData] = useState({
    customer_name: prefillData?.customerName || "",
    phone: prefillData?.phone || "",
    product_name: prefillData?.productName || "",
    review_text: "",
    rating: 5 as 1 | 2 | 3 | 4 | 5,
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPhotoCamera, setShowPhotoCamera] = useState(false);
  const [showVideoCamera, setShowVideoCamera] = useState(false);

  // Hide bottom navigation bar while review form is open so submit button stays accessible
  useEffect(() => {
    document.body.classList.add('stories-open');
    return () => document.body.classList.remove('stories-open');
  }, []);

  // Update form when prefill data changes
  useEffect(() => {
    if (prefillData) {
      setFormData(prev => ({
        ...prev,
        customer_name: prefillData.customerName || prev.customer_name,
        phone: prefillData.phone || prev.phone,
        product_name: prefillData.productName || prev.product_name,
      }));
    }
  }, [prefillData]);

  const handlePhotoCapture = (file: File) => {
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setShowPhotoCamera(false);
  };

  const handleVideoCapture = (file: File) => {
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setShowVideoCamera(false);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Photo must be less than 5MB");
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error("Video must be less than 50MB");
        return;
      }
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const uploadFile = async (file: File, bucket: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customer_name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (formData.review_text.trim().length < 10) {
      toast.error("Review must be at least 10 characters");
      return;
    }

    if (formData.review_text.trim().length > 500) {
      toast.error("Review must be less than 500 characters");
      return;
    }

    setIsSubmitting(true);

    try {
      let photoUrl = null;
      let videoUrl = null;

      // Upload photo if provided
      if (photoFile) {
        photoUrl = await uploadFile(photoFile, 'customer-photos');
      }

      // Upload video if provided
      if (videoFile) {
        videoUrl = await uploadFile(videoFile, 'testimonial-videos');
      }

      // Insert testimonial with is_published = false
      const { error } = await supabase
        .from("customer_testimonials")
        .insert({
          customer_name: formData.customer_name.trim(),
          customer_photo: photoUrl,
          product_name: formData.product_name.trim() || null,
          review_text: formData.review_text.trim(),
          rating: formData.rating,
          video_url: videoUrl,
          is_published: false,
          is_featured: false,
          display_order: 0
        });

      if (error) throw error;

      toast.success("Thank you! Your review has been submitted for approval.");
      onSuccess();

      // Reset form
      setFormData({
        customer_name: "",
        phone: "",
        product_name: "",
        review_text: "",
        rating: 5,
      });
      setPhotoFile(null);
      setPhotoPreview("");
      setVideoFile(null);
      setVideoPreview("");
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Customer Name */}
      <div>
        <Label htmlFor="customer_name">Your Name *</Label>
        <Input
          id="customer_name"
          value={formData.customer_name}
          onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
          placeholder="John Doe"
          maxLength={100}
          required
        />
      </div>

      {/* Phone (optional, for admin contact) */}
      <div>
        <Label htmlFor="phone">Phone/WhatsApp (optional)</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="+1234567890"
        />
        <p className="text-xs text-muted-foreground mt-1">We may contact you to feature your review</p>
      </div>

      {/* Product Name */}
      <div>
        <Label htmlFor="product_name">Product (optional)</Label>
        <Input
          id="product_name"
          value={formData.product_name}
          onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
          placeholder="e.g., Premium Notebook"
        />
      </div>

      {/* Rating */}
      <div>
        <Label>Rating *</Label>
        <div className="flex gap-1 mt-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setFormData({ ...formData, rating: star as 1 | 2 | 3 | 4 | 5 })}
              className="focus:outline-none"
            >
              <Star
                className={`h-8 w-8 ${
                  star <= formData.rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Review Text */}
      <div>
        <Label htmlFor="review_text">Your Review *</Label>
        <Textarea
          id="review_text"
          value={formData.review_text}
          onChange={(e) => setFormData({ ...formData, review_text: e.target.value })}
          placeholder="Share your experience with ARIS..."
          rows={4}
          maxLength={500}
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          {formData.review_text.length}/500 characters (min 10)
        </p>
      </div>

      {/* Photo Upload (Optional) */}
      <div>
        <Label>Your Photo (optional)</Label>
        <div className="mt-2 flex flex-wrap gap-3">
          {photoPreview ? (
            <div className="relative inline-block">
              <img
                src={photoPreview}
                alt="Preview"
                className="h-32 w-32 rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setPhotoFile(null);
                  setPhotoPreview("");
                }}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              {/* Camera capture button */}
              <button
                type="button"
                onClick={() => setShowPhotoCamera(true)}
                className="flex flex-col items-center justify-center h-32 w-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent gap-2"
              >
                <Camera className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Take Photo</span>
              </button>
              
              {/* Upload button */}
              <label
                htmlFor="photo"
                className="flex flex-col items-center justify-center h-32 w-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent gap-2"
              >
                <Upload className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Upload</span>
                <input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            </>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">Max 5MB</p>
      </div>

      {/* Video Upload (Optional) */}
      <div>
        <Label>Video Testimonial (optional)</Label>
        <div className="mt-2 flex flex-wrap gap-3">
          {videoPreview ? (
            <div className="relative inline-block">
              <video
                src={videoPreview}
                className="h-32 w-auto rounded-lg"
                controls
              />
              <button
                type="button"
                onClick={() => {
                  setVideoFile(null);
                  setVideoPreview("");
                }}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              {/* Camera record button */}
              <button
                type="button"
                onClick={() => setShowVideoCamera(true)}
                className="flex flex-col items-center justify-center h-32 w-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent gap-2"
              >
                <Video className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Record Video</span>
              </button>
              
              {/* Upload button */}
              <label
                htmlFor="video"
                className="flex flex-col items-center justify-center h-32 w-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent gap-2"
              >
                <Upload className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Upload</span>
                <input
                  id="video"
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="hidden"
                />
              </label>
            </>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">Max 50MB</p>
      </div>

      {/* Submit Button - sticky on mobile so it's always reachable */}
      <div className="sticky bottom-0 -mx-4 sm:mx-0 px-4 sm:px-0 py-3 bg-background border-t sm:border-t-0 sm:bg-transparent sm:py-0 sm:pt-4 sm:flex sm:justify-end z-10" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}>
        <Button type="submit" disabled={isSubmitting} size="lg" className="w-full sm:w-auto">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Review"
          )}
        </Button>
      </div>

      {/* Camera Capture Modals */}
      <CameraCapture
        type="photo"
        isOpen={showPhotoCamera}
        onCapture={handlePhotoCapture}
        onClose={() => setShowPhotoCamera(false)}
      />
      <CameraCapture
        type="video"
        isOpen={showVideoCamera}
        onCapture={handleVideoCapture}
        onClose={() => setShowVideoCamera(false)}
      />
    </form>
  );
};

export default ReviewSubmissionForm;
