import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Star, Loader2, Camera, Video, Upload, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import CameraCapture from "@/components/testimonials/CameraCapture";
import SEO from "@/components/common/SEO";

interface RequestData {
  id: string;
  status: string;
  product_id: string;
  order_id: string;
  customer_name: string | null;
  product: { name: string; image_url: string | null } | null;
}

export default function ReviewSubmit() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<RequestData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState("");
  const [showPhotoCamera, setShowPhotoCamera] = useState(false);
  const [showVideoCamera, setShowVideoCamera] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.body.classList.add("stories-open");
    return () => document.body.classList.remove("stories-open");
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("review_requests")
        .select(`
          id, status, product_id, order_id, customer_name,
          product:products ( name, image_url )
        `)
        .eq("token", token)
        .maybeSingle();

      if (error || !data) {
        setErrorMsg("This review link is invalid or has expired.");
      } else if (data.status === "submitted") {
        setErrorMsg("You've already submitted a review for this product. Thank you!");
      } else {
        setRequest(data as unknown as RequestData);
        setCustomerName(data.customer_name || "");
      }
      setLoading(false);
    };
    load();
  }, [token]);

  const uploadFile = async (file: File, bucket: string): Promise<string> => {
    const ext = file.name.split(".").pop();
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(name, file);
    if (error) throw error;
    return supabase.storage.from(bucket).getPublicUrl(name).data.publicUrl;
  };

  const handlePhotoFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) return toast.error("Photo must be under 5MB");
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };
  const handleVideoFile = (file: File) => {
    if (file.size > 50 * 1024 * 1024) return toast.error("Video must be under 50MB");
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request) return;
    if (!customerName.trim()) return toast.error("Please enter your name");
    if (reviewText.trim().length < 10) return toast.error("Review must be at least 10 characters");
    if (reviewText.length > 500) return toast.error("Review must be under 500 characters");

    setSubmitting(true);
    try {
      let photoUrl: string | null = null;
      let videoUrl: string | null = null;
      if (photoFile) photoUrl = await uploadFile(photoFile, "customer-photos");
      if (videoFile) videoUrl = await uploadFile(videoFile, "testimonial-videos");

      const { error } = await supabase.rpc("submit_review_by_token", {
        p_token: token!,
        p_customer_name: customerName.trim(),
        p_rating: rating,
        p_review_text: reviewText.trim(),
        p_customer_photo: photoUrl,
        p_video_url: videoUrl,
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success("Thank you! Your review has been submitted.");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-2xl font-bold">Review Link</h1>
          <p className="text-muted-foreground">{errorMsg}</p>
          <Link to="/" className="inline-block">
            <Button>Back to shop</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
          <h1 className="text-2xl font-bold">Thank you!</h1>
          <p className="text-muted-foreground">
            Your review has been submitted and will appear after a quick review by our team.
          </p>
          <Link to="/" className="inline-block">
            <Button>Continue shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <SEO title="Share Your Review | ARIS STATIONERIES" noindex />
      <div className="max-w-xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-1">Share Your Review</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Your honest feedback helps fellow students choose with confidence.
        </p>

        {request?.product && (
          <div className="flex items-center gap-3 p-3 border rounded-lg mb-6 bg-muted/30">
            {request.product.image_url && (
              <img
                src={request.product.image_url}
                alt={request.product.name}
                className="w-16 h-16 object-contain rounded bg-white"
              />
            )}
            <div>
              <p className="text-xs text-muted-foreground">You're reviewing</p>
              <p className="font-semibold">{request.product.name}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="name">Your Name *</Label>
            <Input
              id="name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              maxLength={100}
              required
            />
          </div>

          <div>
            <Label>Rating *</Label>
            <div className="flex gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className="focus:outline-none"
                  aria-label={`${s} star${s > 1 ? "s" : ""}`}
                >
                  <Star className={`h-9 w-9 ${s <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="review">Your Review *</Label>
            <Textarea
              id="review"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="What did you like? How was the quality?"
              rows={5}
              maxLength={500}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              {reviewText.length}/500 (min 10)
            </p>
          </div>

          <div>
            <Label>Add a photo (optional)</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Take or upload a photo with the product. If skipped, we'll use the product image.
            </p>
            <div className="flex flex-wrap gap-3">
              {photoPreview ? (
                <div className="relative">
                  <img src={photoPreview} className="h-28 w-28 rounded-lg object-cover" alt="" />
                  <button
                    type="button"
                    onClick={() => { setPhotoFile(null); setPhotoPreview(""); }}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setShowPhotoCamera(true)}
                    className="flex flex-col items-center justify-center h-28 w-28 border-2 border-dashed rounded-lg gap-1 hover:bg-accent"
                  >
                    <Camera className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Take photo</span>
                  </button>
                  <label className="flex flex-col items-center justify-center h-28 w-28 border-2 border-dashed rounded-lg gap-1 hover:bg-accent cursor-pointer">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handlePhotoFile(e.target.files[0])}
                    />
                  </label>
                </>
              )}
            </div>
          </div>

          <div>
            <Label>Add a short video (optional)</Label>
            <p className="text-xs text-muted-foreground mb-2">Max 50MB.</p>
            <div className="flex flex-wrap gap-3">
              {videoPreview ? (
                <div className="relative">
                  <video src={videoPreview} className="h-28 w-auto rounded-lg" controls />
                  <button
                    type="button"
                    onClick={() => { setVideoFile(null); setVideoPreview(""); }}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setShowVideoCamera(true)}
                    className="flex flex-col items-center justify-center h-28 w-28 border-2 border-dashed rounded-lg gap-1 hover:bg-accent"
                  >
                    <Video className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Record</span>
                  </button>
                  <label className="flex flex-col items-center justify-center h-28 w-28 border-2 border-dashed rounded-lg gap-1 hover:bg-accent cursor-pointer">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Upload</span>
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleVideoFile(e.target.files[0])}
                    />
                  </label>
                </>
              )}
            </div>
          </div>

          <div
            className="sticky bottom-0 -mx-4 px-4 py-3 bg-background border-t z-10"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
          >
            <Button type="submit" disabled={submitting} size="lg" className="w-full">
              {submitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</>
              ) : (
                "Submit Review"
              )}
            </Button>
          </div>
        </form>

        <CameraCapture
          type="photo"
          isOpen={showPhotoCamera}
          onCapture={(f) => { handlePhotoFile(f); setShowPhotoCamera(false); }}
          onClose={() => setShowPhotoCamera(false)}
        />
        <CameraCapture
          type="video"
          isOpen={showVideoCamera}
          onCapture={(f) => { handleVideoFile(f); setShowVideoCamera(false); }}
          onClose={() => setShowVideoCamera(false)}
        />
      </div>
    </div>
  );
}
