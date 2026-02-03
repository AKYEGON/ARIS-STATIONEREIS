import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { products } from "@/data/products";
import { Product, ProductMedia } from "@/types/product";
import { CustomerTestimonial } from "@/types/testimonial";
import { Bundle } from "@/types/bundle";
import { Pencil, Trash2, Plus, Package, ShoppingBag, X, LogOut, TrendingUp, Warehouse, Download, Percent, DollarSign, Store, ImagePlus, Video, Trash, Users, BarChart3, Tag, Phone, MessageCircle } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { InventoryDashboard } from "@/components/admin/InventoryDashboard";
import { SalesDashboard } from "@/components/admin/SalesDashboard";
import { QuickSaleDialog } from "@/components/admin/QuickSaleDialog";
import TestimonialAnalytics from "@/components/admin/TestimonialAnalytics";
import { BundlesTab } from "@/components/admin/BundlesTab";
import { PullToRefresh } from "@/components/common/PullToRefresh";
import { OrderStatusModal } from "@/components/admin/OrderStatusModal";
import { OrderQuickActions } from "@/components/admin/OrderQuickActions";
import { OrderCommunicationHistory } from "@/components/admin/OrderCommunicationHistory";

interface OrderItem {
  product_name: string;
  product_image: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  total: number;
  status: string;
  tags: string[];
  created_at: string;
  order_items?: OrderItem[];
  discount_amount?: number;
  discount_type?: string;
  original_total?: number;
}

const VALID_TABS = ["products", "orders", "inventory", "sales", "testimonials", "bundles"];

const Admin = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { getCartItemCount } = useCart();
  const [productList, setProductList] = useState<Product[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Get active tab from URL, default to "products"
  const urlTab = searchParams.get("tab");
  const activeTab = VALID_TABS.includes(urlTab || "") ? urlTab! : "products";
  
  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };
  const [ordersList, setOrdersList] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [isQuickSaleOpen, setIsQuickSaleOpen] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  
  // Order status modal state
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{ orderId: string; newStatus: string } | null>(null);
  
  // Testimonials state
  const [testimonialsList, setTestimonialsList] = useState<CustomerTestimonial[]>([]);
  const [isTestimonialDialogOpen, setIsTestimonialDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<CustomerTestimonial | null>(null);
  const [testimonialFormData, setTestimonialFormData] = useState({
    customer_name: "",
    product_name: "",
    review_text: "",
    rating: 5 as 1 | 2 | 3 | 4 | 5,
    is_featured: false,
    is_published: false,
    display_order: 0
  });
  const [testimonialPhotoFile, setTestimonialPhotoFile] = useState<File | null>(null);
  const [testimonialPhotoPreview, setTestimonialPhotoPreview] = useState("");
  const [testimonialVideoFile, setTestimonialVideoFile] = useState<File | null>(null);
  const [testimonialVideoPreview, setTestimonialVideoPreview] = useState("");
  const [testimonialSearchQuery, setTestimonialSearchQuery] = useState("");
  const [testimonialFilter, setTestimonialFilter] = useState<"all" | "pending" | "published">("all");
  
  // Bundles state
  const [bundlesList, setBundlesList] = useState<Bundle[]>([]);
  const [isBundleDialogOpen, setIsBundleDialogOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);
  const [bundleFormData, setBundleFormData] = useState({
    name: "",
    description: "",
    bundle_price: "",
    image: "",
    is_active: true,
    display_order: 0
  });
  const [bundleImageFile, setBundleImageFile] = useState<File | null>(null);
  const [bundleImagePreview, setBundleImagePreview] = useState("");
  const [selectedBundleProducts, setSelectedBundleProducts] = useState<Array<{ product_id: string; quantity: number }>>([]);
  const [bundleSearchQuery, setBundleSearchQuery] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    costPrice: "",
    stock: "",
    category: "",
    image: "/placeholder.svg"
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imageInputMode, setImageInputMode] = useState<"file" | "url">("file");
  const [imageUrl, setImageUrl] = useState("");
  
  // Additional media state
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState<string[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>("");
  const [existingMedia, setExistingMedia] = useState<ProductMedia[]>([]);
  const [mediaToDelete, setMediaToDelete] = useState<string[]>([]);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchProducts();
      if (activeTab === "orders") {
        fetchOrders();
      }
      if (activeTab === "testimonials") {
        fetchTestimonials();
      }
      if (activeTab === "bundles") {
        fetchBundles();
      }
    }
  }, [activeTab, isAdmin]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          product_media (
            id,
            product_id,
            media_url,
            media_type,
            display_order,
            created_at
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const formattedProducts = (data || []).map(p => ({
        id: p.id,
        name: p.name,
        description: p.description || "",
        price: Number(p.price),
        originalPrice: p.original_price ? Number(p.original_price) : undefined,
        costPrice: p.cost_price ? Number(p.cost_price) : 0,
        stock: p.stock || 0,
        category: p.category,
        image: p.image,
        media: (p.product_media || []).map((m: any) => ({
          ...m,
          media_type: m.media_type as 'image' | 'video'
        }))
      }));
      
      setProductList(formattedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    }
  };

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .single();

      if (error || !data) {
        toast.error("Access denied. Admin privileges required.");
        navigate("/");
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error("Auth check error:", error);
      navigate("/auth");
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  const fetchOrders = useCallback(async () => {
    setIsLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            product_name,
            product_image,
            quantity,
            price
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Normalize tags to ensure it's never null
      const normalizedOrders = (data || []).map(order => ({
        ...order,
        tags: order.tags || []
      }));
      
      setOrdersList(normalizedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  const handleRefreshOrders = useCallback(async () => {
    await fetchOrders();
  }, [fetchOrders]);

  const fetchTestimonials = async () => {
    try {
      const { data, error } = await supabase
        .from("customer_testimonials")
        .select("*")
        .order("display_order", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTestimonialsList((data || []).map(t => ({
        ...t,
        rating: t.rating as 1 | 2 | 3 | 4 | 5
      })));
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      toast.error("Failed to load testimonials");
    }
  };

  const fetchBundles = async () => {
    try {
      const { data, error } = await supabase
        .from("bundles")
        .select(`
          *,
          items:bundle_items(
            *,
            product:products(*)
          )
        `)
        .order("display_order", { ascending: false })
        .order("created_at", { ascending: false});

      if (error) throw error;
      setBundlesList(data || []);
    } catch (error) {
      console.error("Error fetching bundles:", error);
      toast.error("Failed to load bundles");
    }
  };

  const handleAddBundle = async () => {
    if (!bundleFormData.name || !bundleFormData.bundle_price || selectedBundleProducts.length === 0) {
      toast.error("Please fill required fields and select products");
      return;
    }

    try {
      let imageUrl = bundleFormData.image;
      if (bundleImageFile) {
        imageUrl = await handleImageUpload(bundleImageFile);
      }

      let originalTotal = 0;
      for (const sp of selectedBundleProducts) {
        const product = productList.find(p => p.id === sp.product_id);
        if (product) originalTotal += product.price * sp.quantity;
      }

      const { data: bundleData, error: bundleError } = await supabase
        .from("bundles")
        .insert({
          name: bundleFormData.name,
          description: bundleFormData.description || null,
          bundle_price: parseFloat(bundleFormData.bundle_price),
          original_total_price: originalTotal,
          image: imageUrl,
          is_active: bundleFormData.is_active,
          display_order: bundleFormData.display_order
        })
        .select()
        .single();

      if (bundleError) throw bundleError;

      const itemsToInsert = selectedBundleProducts.map(sp => ({
        bundle_id: bundleData.id,
        product_id: sp.product_id,
        quantity: sp.quantity
      }));

      const { error: itemsError } = await supabase
        .from("bundle_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast.success("Bundle created!");
      setIsBundleDialogOpen(false);
      setBundleFormData({ name: "", description: "", bundle_price: "", image: "", is_active: true, display_order: 0 });
      setBundleImageFile(null);
      setBundleImagePreview("");
      setSelectedBundleProducts([]);
      setEditingBundle(null);
      fetchBundles();
    } catch (error) {
      console.error("Error adding bundle:", error);
      toast.error("Failed to create bundle");
    }
  };

  const handleDeleteBundle = async (id: string) => {
    if (!confirm("Delete this bundle?")) return;

    try {
      const { error } = await supabase
        .from("bundles")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Bundle deleted!");
      fetchBundles();
    } catch (error) {
      console.error("Error deleting bundle:", error);
      toast.error("Failed to delete bundle");
    }
  };

  const handleUpdateBundle = async () => {
    if (!editingBundle || !bundleFormData.name || !bundleFormData.bundle_price) {
      toast.error("Please fill required fields");
      return;
    }

    try {
      let imageUrl = bundleFormData.image;
      if (bundleImageFile) {
        imageUrl = await handleImageUpload(bundleImageFile);
      }

      let originalTotal = 0;
      for (const sp of selectedBundleProducts) {
        const product = productList.find(p => p.id === sp.product_id);
        if (product) originalTotal += product.price * sp.quantity;
      }

      const { error: bundleError } = await supabase
        .from("bundles")
        .update({
          name: bundleFormData.name,
          description: bundleFormData.description || null,
          bundle_price: parseFloat(bundleFormData.bundle_price),
          original_total_price: originalTotal,
          image: imageUrl,
          is_active: bundleFormData.is_active,
          display_order: bundleFormData.display_order
        })
        .eq("id", editingBundle.id);

      if (bundleError) throw bundleError;

      // Delete existing items
      await supabase
        .from("bundle_items")
        .delete()
        .eq("bundle_id", editingBundle.id);

      // Add new items
      if (selectedBundleProducts.length > 0) {
        const itemsToInsert = selectedBundleProducts.map(sp => ({
          bundle_id: editingBundle.id,
          product_id: sp.product_id,
          quantity: sp.quantity
        }));

        const { error: itemsError } = await supabase
          .from("bundle_items")
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      toast.success("Bundle updated!");
      setIsBundleDialogOpen(false);
      setBundleFormData({ name: "", description: "", bundle_price: "", image: "", is_active: true, display_order: 0 });
      setBundleImageFile(null);
      setBundleImagePreview("");
      setSelectedBundleProducts([]);
      setEditingBundle(null);
      fetchBundles();
    } catch (error) {
      console.error("Error updating bundle:", error);
      toast.error("Failed to update bundle");
    }
  };

  const openBundleEditDialog = (bundle: Bundle) => {
    setEditingBundle(bundle);
    setBundleFormData({
      name: bundle.name,
      description: bundle.description || "",
      bundle_price: bundle.bundle_price.toString(),
      image: bundle.image,
      is_active: bundle.is_active,
      display_order: bundle.display_order
    });
    setBundleImagePreview(bundle.image);
    setSelectedBundleProducts(
      (bundle.items || []).map(item => ({
        product_id: item.product_id,
        quantity: item.quantity
      }))
    );
    setIsBundleDialogOpen(true);
  };

  const resetTestimonialForm = () => {
    setTestimonialFormData({
      customer_name: "",
      product_name: "",
      review_text: "",
      rating: 5,
      is_featured: false,
      is_published: false,
      display_order: 0
    });
    setTestimonialPhotoFile(null);
    setTestimonialPhotoPreview("");
    setTestimonialVideoFile(null);
    setTestimonialVideoPreview("");
    setEditingTestimonial(null);
  };

  const handleTestimonialFileUpload = async (file: File, bucket: string): Promise<string> => {
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

  const handleAddTestimonial = async () => {
    if (!testimonialFormData.customer_name || !testimonialFormData.review_text) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      let photoUrl = null;
      if (testimonialPhotoFile) {
        photoUrl = await handleTestimonialFileUpload(testimonialPhotoFile, 'customer-photos');
      }
      
      let videoUrl = null;
      if (testimonialVideoFile) {
        videoUrl = await handleTestimonialFileUpload(testimonialVideoFile, 'testimonial-videos');
      }

      const { error } = await supabase
        .from("customer_testimonials")
        .insert({
          customer_name: testimonialFormData.customer_name,
          customer_photo: photoUrl,
          product_name: testimonialFormData.product_name || null,
          review_text: testimonialFormData.review_text,
          rating: testimonialFormData.rating,
          video_url: videoUrl,
          display_order: testimonialFormData.display_order,
          is_featured: testimonialFormData.is_featured,
          is_published: testimonialFormData.is_published
        });

      if (error) throw error;

      toast.success("Testimonial added successfully!");
      setIsTestimonialDialogOpen(false);
      resetTestimonialForm();
      fetchTestimonials();
    } catch (error) {
      console.error("Error adding testimonial:", error);
      toast.error("Failed to add testimonial");
    }
  };

  const handleUpdateTestimonial = async () => {
    if (!editingTestimonial || !testimonialFormData.customer_name || !testimonialFormData.review_text) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      let photoUrl = editingTestimonial.customer_photo;
      let videoUrl = editingTestimonial.video_url;

      if (testimonialPhotoFile) {
        photoUrl = await handleTestimonialFileUpload(testimonialPhotoFile, 'customer-photos');
      }

      if (testimonialVideoFile) {
        videoUrl = await handleTestimonialFileUpload(testimonialVideoFile, 'testimonial-videos');
      }

      const { error } = await supabase
        .from("customer_testimonials")
        .update({
          customer_name: testimonialFormData.customer_name,
          customer_photo: photoUrl,
          product_name: testimonialFormData.product_name || null,
          review_text: testimonialFormData.review_text,
          rating: testimonialFormData.rating,
          video_url: videoUrl,
          display_order: testimonialFormData.display_order,
          is_featured: testimonialFormData.is_featured,
          is_published: testimonialFormData.is_published
        })
        .eq("id", editingTestimonial.id);

      if (error) throw error;

      toast.success("Testimonial updated successfully!");
      setIsTestimonialDialogOpen(false);
      resetTestimonialForm();
      fetchTestimonials();
    } catch (error) {
      console.error("Error updating testimonial:", error);
      toast.error("Failed to update testimonial");
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    if (!confirm("Are you sure you want to delete this testimonial?")) return;

    try {
      const { error } = await supabase
        .from("customer_testimonials")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Testimonial deleted successfully!");
      fetchTestimonials();
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      toast.error("Failed to delete testimonial");
    }
  };

  const handleQuickApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from("customer_testimonials")
        .update({ is_published: true })
        .eq("id", id);

      if (error) throw error;

      toast.success("Review approved and published!");
      fetchTestimonials();
    } catch (error) {
      console.error("Error approving testimonial:", error);
      toast.error("Failed to approve review");
    }
  };

  const handleQuickUnpublish = async (id: string) => {
    try {
      const { error } = await supabase
        .from("customer_testimonials")
        .update({ is_published: false })
        .eq("id", id);

      if (error) throw error;

      toast.success("Review unpublished!");
      fetchTestimonials();
    } catch (error) {
      console.error("Error unpublishing testimonial:", error);
      toast.error("Failed to unpublish review");
    }
  };

  const openTestimonialEditDialog = (testimonial: CustomerTestimonial) => {
    setEditingTestimonial(testimonial);
    setTestimonialFormData({
      customer_name: testimonial.customer_name,
      product_name: testimonial.product_name || "",
      review_text: testimonial.review_text,
      rating: testimonial.rating,
      is_featured: testimonial.is_featured,
      is_published: testimonial.is_published,
      display_order: testimonial.display_order
    });
    setTestimonialPhotoPreview(testimonial.customer_photo || "");
    if (testimonial.video_url) {
      setTestimonialVideoPreview(testimonial.video_url);
    }
    setIsTestimonialDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      originalPrice: "",
      costPrice: "",
      stock: "",
      category: "",
      image: "/placeholder.svg"
    });
    setSelectedImageFile(null);
    setImageUrl("");
    setImageInputMode("file");
    setAdditionalImages([]);
    setAdditionalImagePreviews([]);
    setVideoFile(null);
    setVideoPreview("");
    setExistingMedia([]);
    setMediaToDelete([]);
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleAddProduct = async () => {
    if (!formData.name || !formData.price) {
      toast.error("Please fill in required fields");
      return;
    }

    setUploadingImage(true);
    try {
      let imageUrl = formData.image;

      console.log("Starting product add with form data:", formData);
      console.log("Image input mode:", imageInputMode);

      if (imageInputMode === "file" && selectedImageFile) {
        console.log("Uploading image file:", selectedImageFile.name);
        imageUrl = await handleImageUpload(selectedImageFile);
        console.log("Image uploaded successfully:", imageUrl);
      } else if (imageInputMode === "url" && imageUrl.trim()) {
        imageUrl = imageUrl.trim();
        console.log("Using image URL:", imageUrl);
      }

      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        original_price: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        cost_price: formData.costPrice ? parseFloat(formData.costPrice) : 0,
        stock: formData.stock ? parseInt(formData.stock) : 0,
        category: formData.category,
        image: imageUrl
      };

      console.log("Inserting product data:", productData);

      const { data, error } = await supabase
        .from("products")
        .insert(productData)
        .select();

      console.log("Insert result:", { data, error });

      if (error) {
        console.error("Database error:", error);
        throw error;
      }

      if (data && data[0]) {
        const productId = data[0].id;
        
        // Upload additional images
        let displayOrder = 0;
        for (const imgFile of additionalImages) {
          const imgUrl = await handleImageUpload(imgFile);
          await supabase.from("product_media").insert({
            product_id: productId,
            media_url: imgUrl,
            media_type: 'image',
            display_order: displayOrder++
          });
        }
        
        // Upload video if exists
        if (videoFile) {
          const videoUrl = await handleImageUpload(videoFile);
          await supabase.from("product_media").insert({
            product_id: productId,
            media_url: videoUrl,
            media_type: 'video',
            display_order: displayOrder
          });
        }
      }

      console.log("Product inserted successfully, fetching products...");
      await fetchProducts();
      toast.success("Product added successfully");
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Error adding product:", error);
      const errorMessage = error?.message || "Failed to add product";
      console.error("Error details:", JSON.stringify(error, null, 2));
      toast.error(`Failed to add product: ${errorMessage}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEditProduct = async () => {
    if (!editingProduct || !formData.name || !formData.price) {
      toast.error("Please fill in required fields");
      return;
    }

    setUploadingImage(true);
    try {
      let imageUrl = formData.image;

      if (imageInputMode === "file" && selectedImageFile) {
        imageUrl = await handleImageUpload(selectedImageFile);
      } else if (imageInputMode === "url" && imageUrl.trim()) {
        imageUrl = imageUrl.trim();
      }

      const { error } = await supabase
        .from("products")
        .update({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          original_price: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
          cost_price: formData.costPrice ? parseFloat(formData.costPrice) : 0,
          stock: formData.stock ? parseInt(formData.stock) : 0,
          category: formData.category,
          image: imageUrl
        })
        .eq("id", editingProduct.id);

      if (error) throw error;

      // Delete marked media
      if (mediaToDelete.length > 0) {
        await supabase
          .from("product_media")
          .delete()
          .in("id", mediaToDelete);
      }

      // Upload new additional images
      let displayOrder = existingMedia.filter(m => !mediaToDelete.includes(m.id)).length;
      for (const imgFile of additionalImages) {
        const imgUrl = await handleImageUpload(imgFile);
        await supabase.from("product_media").insert({
          product_id: editingProduct.id,
          media_url: imgUrl,
          media_type: 'image',
          display_order: displayOrder++
        });
      }
      
      // Upload video if exists
      if (videoFile) {
        const videoUrl = await handleImageUpload(videoFile);
        await supabase.from("product_media").insert({
          product_id: editingProduct.id,
          media_url: videoUrl,
          media_type: 'video',
          display_order: displayOrder
        });
      }

      await fetchProducts();
      toast.success("Product updated successfully");
      setIsEditDialogOpen(false);
      setEditingProduct(null);
      resetForm();
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await fetchProducts();
      toast.success("Product deleted successfully");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    }
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      originalPrice: product.originalPrice?.toString() || "",
      costPrice: product.costPrice?.toString() || "0",
      stock: product.stock?.toString() || "0",
      category: product.category,
      image: product.image
    });
    setSelectedImageFile(null);
    setImageUrl(product.image);
    setImageInputMode("url");
    setExistingMedia(product.media || []);
    setAdditionalImages([]);
    setAdditionalImagePreviews([]);
    setVideoFile(null);
    setVideoPreview("");
    setMediaToDelete([]);
    setIsEditDialogOpen(true);
  };

  const openOrderDialog = (order: Order) => {
    setSelectedOrder(order);
    setNewTag("");
    setDiscountValue("");
    setDiscountType("percentage");
    setIsOrderDialogOpen(true);
  };

  const applyDiscount = async (orderId: string) => {
    if (!discountValue || parseFloat(discountValue) <= 0) {
      toast.error("Please enter a valid discount value");
      return;
    }

    const order = ordersList.find(o => o.id === orderId);
    if (!order) return;

    setApplyingDiscount(true);
    try {
      const originalTotal = order.original_total || order.total;
      let discountAmount = 0;
      let newTotal = originalTotal;

      if (discountType === "percentage") {
        const percentage = parseFloat(discountValue);
        if (percentage < 0 || percentage > 100) {
          toast.error("Percentage must be between 0 and 100");
          return;
        }
        discountAmount = originalTotal * (percentage / 100);
        newTotal = originalTotal - discountAmount;
      } else {
        discountAmount = parseFloat(discountValue);
        if (discountAmount > originalTotal) {
          toast.error("Discount cannot exceed order total");
          return;
        }
        newTotal = originalTotal - discountAmount;
      }

      // Fetch order items to recalculate profit
      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);

      if (itemsError) throw itemsError;

      // Recalculate profit for each item with discount distribution
      let newTotalProfit = 0;

      if (orderItems && orderItems.length > 0) {
        for (const item of orderItems) {
          const itemSubtotal = Number(item.price) * item.quantity;
          const itemProportion = originalTotal > 0 ? itemSubtotal / originalTotal : 0;
          const itemDiscount = discountAmount * itemProportion;
          const itemActualRevenue = itemSubtotal - itemDiscount;
          const itemCost = Number(item.cost_price || 0) * item.quantity;
          const itemProfit = itemActualRevenue - itemCost;
          
          newTotalProfit += itemProfit;

          // Update item profit
          const { error: updateItemError } = await supabase
            .from("order_items")
            .update({ profit: itemProfit })
            .eq("id", item.id);

          if (updateItemError) throw updateItemError;
        }
      }

      // Update order with discount and new profit
      const { error } = await supabase
        .from("orders")
        .update({
          discount_amount: discountAmount,
          discount_type: discountType,
          original_total: originalTotal,
          total: newTotal,
          profit: newTotalProfit
        })
        .eq("id", orderId);

      if (error) throw error;

      // Update local state
      const updatedOrder = {
        ...order,
        discount_amount: discountAmount,
        discount_type: discountType,
        original_total: originalTotal,
        total: newTotal,
        profit: newTotalProfit
      };

      setOrdersList(ordersList.map(o => o.id === orderId ? updatedOrder : o));
      setSelectedOrder(updatedOrder);
      
      toast.success(`Discount applied! New profit: KSh ${newTotalProfit.toFixed(2)}`);
      setDiscountValue("");
    } catch (error) {
      console.error("Error applying discount:", error);
      toast.error("Failed to apply discount");
    } finally {
      setApplyingDiscount(false);
    }
  };

  const addTagToOrder = async (orderId: string) => {
    if (!newTag.trim()) return;
    
    const order = ordersList.find(o => o.id === orderId);
    if (!order) return;

    const updatedTags = [...(order.tags || []), newTag.trim()];

    try {
      const { error } = await supabase
        .from("orders")
        .update({ tags: updatedTags })
        .eq("id", orderId);

      if (error) throw error;

      setOrdersList(ordersList.map(o => 
        o.id === orderId ? { ...o, tags: updatedTags } : o
      ));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, tags: updatedTags });
      }
      setNewTag("");
      toast.success("Tag added successfully");
    } catch (error) {
      console.error("Error adding tag:", error);
      toast.error("Failed to add tag");
    }
  };

  const removeTagFromOrder = async (orderId: string, tagToRemove: string) => {
    const order = ordersList.find(o => o.id === orderId);
    if (!order) return;

    const updatedTags = (order.tags || []).filter(tag => tag !== tagToRemove);

    try {
      const { error } = await supabase
        .from("orders")
        .update({ tags: updatedTags })
        .eq("id", orderId);

      if (error) throw error;

      setOrdersList(ordersList.map(o => 
        o.id === orderId ? { ...o, tags: updatedTags } : o
      ));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, tags: updatedTags });
      }
      toast.success("Tag removed successfully");
    } catch (error) {
      console.error("Error removing tag:", error);
      toast.error("Failed to remove tag");
    }
  };

  const recalculateAllProfits = async () => {
    if (!confirm("This will recalculate profits for ALL orders with discounts. This may take a moment. Continue?")) {
      return;
    }

    setIsRecalculating(true);
    try {
      const { data, error } = await supabase.functions.invoke('recalculate-profits', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (error) throw error;

      toast.success(
        `✅ Recalculation complete!\n📦 ${data.ordersProcessed} orders updated\n📝 ${data.itemsUpdated} items updated`,
        { duration: 5000 }
      );

      // Refresh orders to show updated data
      if (activeTab === "orders" || activeTab === "analytics") {
        await fetchOrders();
      }
    } catch (error: any) {
      console.error("Error recalculating profits:", error);
      toast.error(`Failed to recalculate profits: ${error.message || 'Unknown error'}`);
    } finally {
      setIsRecalculating(false);
    }
  };

  // Handler to trigger status change modal
  const initiateStatusChange = (orderId: string, newStatus: string) => {
    const order = ordersList.find(o => o.id === orderId);
    if (!order) return;
    
    // If status is same as current, do nothing
    if (order.status === newStatus) {
      toast.info(`Order is already ${newStatus}`);
      return;
    }
    
    // Set pending status and open modal
    setPendingStatusChange({ orderId, newStatus });
    setIsStatusModalOpen(true);
  };

  // Actual status update function (called after modal confirmation)
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      // Get current order status first to check if already delivered
      const currentOrder = ordersList.find(o => o.id === orderId);
      
      // If status is being changed to delivered, handle stock reduction and profit calculation
      if (newStatus === "delivered") {
        // CRITICAL: Check if order is already delivered to prevent duplicate stock deductions
        if (currentOrder?.status === "delivered") {
          toast.info("Order is already marked as delivered");
          return;
        }

        // Get the order items
        const { data: orderItems, error: itemsError } = await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", orderId);

        if (itemsError) throw itemsError;

        let totalProfit = 0;
        let totalSales = 0;

        // Process each item
        for (const item of orderItems || []) {
          // Extract the actual product name (handle bundle items which have format "Bundle Name - Product Name")
          const actualProductName = item.product_name.includes(" - ") 
            ? item.product_name.split(" - ").slice(1).join(" - ").trim()
            : item.product_name.trim();

          // Get the product to access cost_price and current stock
          // Try exact match first, then try trimmed match
          let product = null;
          const { data: exactMatch } = await supabase
            .from("products")
            .select("id, cost_price, stock, name")
            .eq("name", item.product_name.trim())
            .maybeSingle();
          
          if (exactMatch) {
            product = exactMatch;
          } else {
            // Try with extracted name (for bundle items)
            const { data: partialMatch } = await supabase
              .from("products")
              .select("id, cost_price, stock, name")
              .eq("name", actualProductName)
              .maybeSingle();
            product = partialMatch;
          }

          if (!product) {
            console.warn(`Product not found for: ${item.product_name} (tried: "${actualProductName}")`);
            continue;
          }

          // Calculate profit for this item
          const itemProfit = (Number(item.price) - Number(product.cost_price || 0)) * item.quantity;
          totalProfit += itemProfit;
          totalSales += Number(item.price) * item.quantity;

          // Update order_items with cost_price and profit
          await supabase
            .from("order_items")
            .update({
              cost_price: product.cost_price,
              profit: itemProfit
            })
            .eq("id", item.id);

          // Reduce stock using the adjust_stock function
          const { error: stockError } = await supabase.rpc("adjust_stock", {
            p_product_id: product.id,
            p_change: -item.quantity,
            p_reason: "sale",
            p_notes: `Order #${orderId.substring(0, 8)}`
          });

          if (stockError) {
            console.error(`Error adjusting stock for ${product.name}:`, stockError);
            throw new Error(`Failed to adjust stock for ${product.name}`);
          }
        }

        // Update the order with profit, subtotal, and completed_at
        const { error: orderError } = await supabase
          .from("orders")
          .update({
            status: newStatus,
            subtotal: totalSales,
            profit: totalProfit,
            completed_at: new Date().toISOString()
          })
          .eq("id", orderId);

        if (orderError) throw orderError;

        toast.success("Order delivered! Stock reduced and profit calculated.");
      } else {
        // For other status changes, just update the status
        const { error } = await supabase
          .from("orders")
          .update({ status: newStatus })
          .eq("id", orderId);

        if (error) throw error;

        toast.success("Status updated successfully");
      }

      // Refresh orders list and selected order
      setOrdersList(ordersList.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }

      // Refresh data to show updated values
      await fetchOrders();
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error(error.message || "Failed to update order status");
    }
  };

  const exportProductsToCSV = () => {
    try {
      // Define CSV headers
      const headers = ['Name', 'Description', 'Category', 'Price', 'Original Price', 'Cost Price', 'Stock', 'Created At'];
      
      // Convert products to CSV rows
      const rows = productList.map(product => [
        product.name,
        product.description || '',
        product.category,
        product.price.toFixed(2),
        product.originalPrice ? product.originalPrice.toFixed(2) : '',
        product.costPrice ? product.costPrice.toFixed(2) : '',
        product.stock || 0,
        new Date().toISOString().split('T')[0]
      ]);
      
      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `products_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Products exported successfully!');
    } catch (error) {
      console.error('Error exporting products:', error);
      toast.error('Failed to export products');
    }
  };

  const exportOrdersToCSV = () => {
    try {
      // Define CSV headers
      const headers = ['Order ID', 'Customer Name', 'Email', 'Phone', 'Delivery Address', 'Total', 'Status', 'Tags', 'Created At'];
      
      // Convert orders to CSV rows
      const rows = ordersList.map(order => [
        order.id,
        order.customer_name,
        order.customer_email,
        order.customer_phone,
        order.delivery_address,
        order.total.toFixed(2),
        order.status,
        (order.tags || []).join('; '),
        new Date(order.created_at).toLocaleDateString()
      ]);
      
      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Orders exported successfully!');
    } catch (error) {
      console.error('Error exporting orders:', error);
      toast.error('Failed to export orders');
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Checking access...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header cartItemCount={getCartItemCount()} />
      
      <main className="flex-1 container py-4 sm:py-6 md:py-8 px-4">
        <div className="flex justify-between items-center mb-4 sm:mb-6 md:mb-8 gap-2 sm:gap-4">
          <h1 className="text-xl sm:text-2xl md:text-4xl font-bold text-primary">Admin</h1>
          <div className="flex gap-1.5 sm:gap-2">
            <Button onClick={() => setIsQuickSaleOpen(true)} className="gap-1.5 sm:gap-2 bg-primary hover:bg-primary/90 h-8 sm:h-10 px-2.5 sm:px-4 text-xs sm:text-sm">
              <Store className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Quick Sale</span>
              <span className="xs:hidden">Sale</span>
            </Button>
            <Button variant="outline" onClick={handleSignOut} className="gap-1.5 sm:gap-2 h-8 sm:h-10 px-2.5 sm:px-4 text-xs sm:text-sm">
              <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="overflow-x-auto -mx-4 px-4 mb-6">
            <TabsList className="inline-flex w-auto min-w-full sm:grid sm:grid-cols-6 sm:w-full gap-1">
              <TabsTrigger value="products" className="flex items-center gap-1.5 px-2.5 sm:px-3 text-xs sm:text-sm whitespace-nowrap">
                <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Products</span>
                <span className="xs:hidden">Prod</span>
              </TabsTrigger>
              <TabsTrigger value="bundles" className="flex items-center gap-1.5 px-2.5 sm:px-3 text-xs sm:text-sm whitespace-nowrap">
                <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Bundles</span>
                <span className="xs:hidden">Bndl</span>
              </TabsTrigger>
              <TabsTrigger value="inventory" className="flex items-center gap-1.5 px-2.5 sm:px-3 text-xs sm:text-sm whitespace-nowrap">
                <Warehouse className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Inventory</span>
                <span className="xs:hidden">Inv</span>
              </TabsTrigger>
              <TabsTrigger value="sales" className="flex items-center gap-1.5 px-2.5 sm:px-3 text-xs sm:text-sm whitespace-nowrap">
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Sales</span>
                <span className="xs:hidden">Sale</span>
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center gap-1.5 px-2.5 sm:px-3 text-xs sm:text-sm whitespace-nowrap">
                <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Orders</span>
                <span className="xs:hidden">Ord</span>
              </TabsTrigger>
              <TabsTrigger value="testimonials" className="flex items-center gap-1.5 px-2.5 sm:px-3 text-xs sm:text-sm whitespace-nowrap">
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Reviews</span>
                <span className="xs:hidden">Rev</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6">
            <InventoryDashboard />
          </TabsContent>

          {/* Sales Dashboard Tab */}
          <TabsContent value="sales" className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-semibold">Sales Analytics</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">View sales performance and profit data</p>
              </div>
              <Button
                onClick={recalculateAllProfits}
                disabled={isRecalculating}
                variant="outline"
                className="gap-2 w-full sm:w-auto text-xs sm:text-sm"
                size="sm"
              >
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {isRecalculating ? "Recalculating..." : "Fix Historical Profits"}
              </Button>
            </div>
            <SalesDashboard />
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <p className="text-muted-foreground">Manage your product catalog</p>
              
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => resetForm()} className="w-full sm:w-auto transition-all duration-200 active:scale-95 bg-primary hover:bg-primary/90">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Product Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Enter product name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="Enter product description"
                      />
                    </div>
                    <div>
                      <Label htmlFor="price">Current Price (KSh) *</Label>
                      <Input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="originalPrice">Original Price (KSh)</Label>
                      <Input
                        id="originalPrice"
                        type="number"
                        value={formData.originalPrice}
                        onChange={(e) => setFormData({...formData, originalPrice: e.target.value})}
                        placeholder="Leave empty if no discount"
                      />
                    </div>
                    <div>
                      <Label htmlFor="costPrice">Cost Price (KSh) *</Label>
                      <Input
                        id="costPrice"
                        type="number"
                        value={formData.costPrice}
                        onChange={(e) => setFormData({...formData, costPrice: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="stock">Initial Stock</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={formData.stock}
                        onChange={(e) => setFormData({...formData, stock: e.target.value})}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Input
                        id="category"
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        placeholder="e.g., Notebooks, Pens"
                      />
                    </div>
                    <div>
                      <Label>Product Image</Label>
                      <Tabs value={imageInputMode} onValueChange={(v) => setImageInputMode(v as "file" | "url")} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="file">Upload File</TabsTrigger>
                          <TabsTrigger value="url">Image URL</TabsTrigger>
                        </TabsList>
                        <TabsContent value="file">
                          <Input
                            id="image-file"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setSelectedImageFile(file);
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setFormData({...formData, image: reader.result as string});
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="cursor-pointer"
                          />
                        </TabsContent>
                        <TabsContent value="url">
                          <Input
                            id="image-url"
                            type="url"
                            placeholder="https://example.com/image.jpg"
                            value={imageUrl}
                            onChange={(e) => {
                              setImageUrl(e.target.value);
                              setFormData({...formData, image: e.target.value});
                            }}
                          />
                        </TabsContent>
                      </Tabs>
                      {formData.image && formData.image !== "/placeholder.svg" && (
                        <div className="mt-2">
                          <img 
                            src={formData.image} 
                            alt="Preview" 
                            className="w-24 h-24 object-cover rounded border"
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Additional Images Section */}
                    <div>
                      <Label className="flex items-center gap-2">
                        <ImagePlus className="h-4 w-4" />
                        Additional Images (Max 3)
                      </Label>
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []).slice(0, 3);
                          setAdditionalImages(files);
                          
                          // Create previews
                          const previews: string[] = [];
                          files.forEach(file => {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              previews.push(reader.result as string);
                              if (previews.length === files.length) {
                                setAdditionalImagePreviews(previews);
                              }
                            };
                            reader.readAsDataURL(file);
                          });
                        }}
                        className="cursor-pointer"
                      />
                      {additionalImagePreviews.length > 0 && (
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {additionalImagePreviews.map((preview, idx) => (
                            <div key={idx} className="relative">
                              <img 
                                src={preview} 
                                alt={`Additional ${idx + 1}`}
                                className="w-20 h-20 object-cover rounded border"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                onClick={() => {
                                  setAdditionalImages(additionalImages.filter((_, i) => i !== idx));
                                  setAdditionalImagePreviews(additionalImagePreviews.filter((_, i) => i !== idx));
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Video Upload Section */}
                    <div>
                      <Label className="flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        Product Video (Optional)
                      </Label>
                      <Input
                        type="file"
                        accept="video/mp4,video/webm"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setVideoFile(file);
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setVideoPreview(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="cursor-pointer"
                      />
                      {videoPreview && (
                        <div className="relative mt-2">
                          <video 
                            src={videoPreview} 
                            className="w-32 h-32 object-cover rounded border"
                            controls
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                            onClick={() => {
                              setVideoFile(null);
                              setVideoPreview("");
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <Button 
                      onClick={handleAddProduct} 
                      className="w-full transition-all duration-200 active:scale-95 bg-primary hover:bg-primary/90"
                      disabled={uploadingImage}
                    >
                      {uploadingImage ? "Uploading..." : "Add Product"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Product Management</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="mb-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                  <Input
                    placeholder="Search products by name, category, or description..."
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    className="max-w-md"
                  />
                  <Button
                    onClick={exportProductsToCSV}
                    variant="outline"
                    className="gap-2 w-full sm:w-auto"
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px]">Name</TableHead>
                        <TableHead className="hidden md:table-cell min-w-[200px]">Description</TableHead>
                        <TableHead className="hidden sm:table-cell">Category</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productList
                        .filter(product => {
                          if (!productSearchQuery) return true;
                          const query = productSearchQuery.toLowerCase();
                          return (
                            product.name.toLowerCase().includes(query) ||
                            product.category.toLowerCase().includes(query) ||
                            (product.description && product.description.toLowerCase().includes(query))
                          );
                        })
                        .map((product, index) => (
                        <TableRow 
                          key={product.id}
                          className="animate-fade-in"
                          style={{ animationDelay: `${index * 0.03}s` }}
                        >
                          <TableCell className="font-medium text-xs sm:text-sm">{product.name}</TableCell>
                          <TableCell className="hidden md:table-cell max-w-xs truncate text-xs sm:text-sm">{product.description}</TableCell>
                          <TableCell className="hidden sm:table-cell text-xs sm:text-sm">{product.category}</TableCell>
                          <TableCell className="text-xs sm:text-sm">
                            {product.originalPrice ? (
                              <div className="flex flex-col">
                                <span className="line-through text-muted-foreground text-xs">KSh {product.originalPrice.toFixed(2)}</span>
                                <span className="font-bold">KSh {product.price.toFixed(2)}</span>
                              </div>
                            ) : (
                              <span>KSh {product.price.toFixed(2)}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1 sm:gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 sm:h-9 sm:w-9 transition-all duration-200 hover:scale-110 active:scale-95"
                                onClick={() => openEditDialog(product)}
                              >
                                <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8 sm:h-9 sm:w-9 transition-all duration-200 hover:scale-110 active:scale-95"
                                onClick={() => handleDeleteProduct(product.id)}
                              >
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bundles Tab */}
          <TabsContent value="bundles">
            <BundlesTab
              bundles={bundlesList}
              products={productList}
              isDialogOpen={isBundleDialogOpen}
              editingBundle={editingBundle}
              formData={bundleFormData}
              imagePreview={bundleImagePreview}
              selectedProducts={selectedBundleProducts}
              onOpenDialog={() => setIsBundleDialogOpen(true)}
              onCloseDialog={() => {
                setIsBundleDialogOpen(false);
                setBundleFormData({ name: "", description: "", bundle_price: "", image: "", is_active: true, display_order: 0 });
                setBundleImageFile(null);
                setBundleImagePreview("");
                setSelectedBundleProducts([]);
                setEditingBundle(null);
              }}
              onFormChange={(field, value) => setBundleFormData({ ...bundleFormData, [field]: value })}
              onImageChange={(file) => {
                setBundleImageFile(file);
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setBundleImagePreview(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }}
              onProductAdd={(productId) => setSelectedBundleProducts([...selectedBundleProducts, { product_id: productId, quantity: 1 }])}
              onProductRemove={(productId) => setSelectedBundleProducts(selectedBundleProducts.filter(sp => sp.product_id !== productId))}
              onProductQuantityChange={(productId, quantity) => {
                if (quantity <= 0) {
                  setSelectedBundleProducts(selectedBundleProducts.filter(sp => sp.product_id !== productId));
                } else {
                  setSelectedBundleProducts(selectedBundleProducts.map(sp => 
                    sp.product_id === productId ? { ...sp, quantity } : sp
                  ));
                }
              }}
              onSave={editingBundle ? handleUpdateBundle : handleAddBundle}
              onEdit={openBundleEditDialog}
              onDelete={handleDeleteBundle}
            />
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <PullToRefresh onRefresh={handleRefreshOrders} className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <p className="text-muted-foreground">View and manage customer orders</p>
            </div>

            <Card className="transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Orders Management</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="mb-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                  <Input
                    placeholder="Search orders by ID, customer name, email, or phone..."
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    className="max-w-md"
                  />
                  <Button
                    onClick={exportOrdersToCSV}
                    variant="outline"
                    className="gap-2 w-full sm:w-auto"
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
                <div className="overflow-x-auto">
                {isLoadingOrders ? (
                  <div className="text-center py-8">Loading orders...</div>
                ) : ordersList.filter(order => {
                  if (!orderSearchQuery) return true;
                  const query = orderSearchQuery.toLowerCase();
                  return (
                    order.id.toLowerCase().includes(query) ||
                    order.customer_name.toLowerCase().includes(query) ||
                    order.customer_email.toLowerCase().includes(query) ||
                    order.customer_phone.toLowerCase().includes(query) ||
                    order.status.toLowerCase().includes(query)
                  );
                }).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {orderSearchQuery ? 'No orders match your search' : 'No orders yet'}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[80px]">Order ID</TableHead>
                        <TableHead className="hidden sm:table-cell min-w-[120px]">Customer</TableHead>
                        <TableHead className="hidden md:table-cell">Status</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead className="hidden lg:table-cell">Tags</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ordersList
                        .filter(order => {
                          if (!orderSearchQuery) return true;
                          const query = orderSearchQuery.toLowerCase();
                          return (
                            order.id.toLowerCase().includes(query) ||
                            order.customer_name.toLowerCase().includes(query) ||
                            order.customer_email.toLowerCase().includes(query) ||
                            order.customer_phone.toLowerCase().includes(query) ||
                            order.status.toLowerCase().includes(query)
                          );
                        })
                        .map((order, index) => (
                        <TableRow 
                          key={order.id}
                          className="animate-fade-in"
                          style={{ animationDelay: `${index * 0.03}s` }}
                        >
                          <TableCell className="font-medium text-xs sm:text-sm">{order.id.slice(0, 8)}</TableCell>
                          <TableCell className="hidden sm:table-cell text-xs sm:text-sm">{order.customer_name}</TableCell>
                          <TableCell className="hidden md:table-cell text-xs sm:text-sm">
                            <Badge variant={
                              order.status === 'delivered' ? 'default' :
                              order.status === 'pending' ? 'secondary' : 'outline'
                            }>
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm font-semibold">KSh {order.total.toFixed(2)}</TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className="flex gap-1 flex-wrap">
                              {(order.tags || []).slice(0, 2).map((tag, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {(order.tags?.length || 0) > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{(order.tags?.length || 0) - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <OrderQuickActions 
                                order={{
                                  id: order.id,
                                  customer_name: order.customer_name,
                                  customer_phone: order.customer_phone,
                                  total: order.total,
                                  delivery_address: order.delivery_address,
                                  status: order.status
                                }}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 transition-all duration-200 hover:scale-105 active:scale-95"
                                onClick={() => openOrderDialog(order)}
                              >
                                View
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                </div>
              </CardContent>
            </Card>
            </PullToRefresh>
          </TabsContent>

          {/* Testimonials Tab */}
          <TabsContent value="testimonials" className="space-y-4 sm:space-y-6">
            {/* Status Filter Tabs */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4">
              <Button 
                variant={testimonialFilter === "all" ? "default" : "outline"}
                onClick={() => setTestimonialFilter("all")}
                size="sm"
                className="text-xs sm:text-sm px-2.5 sm:px-4"
              >
                All ({testimonialsList.length})
              </Button>
              <Button 
                variant={testimonialFilter === "pending" ? "default" : "outline"}
                onClick={() => setTestimonialFilter("pending")}
                className="relative text-xs sm:text-sm px-2.5 sm:px-4"
                size="sm"
              >
                <span className="hidden xs:inline">Pending</span>
                <span className="xs:hidden">Pend</span>
                {testimonialsList.filter(t => !t.is_published).length > 0 && (
                  <Badge className="ml-1.5 sm:ml-2 bg-yellow-500 hover:bg-yellow-600 text-[10px] sm:text-xs px-1.5">
                    {testimonialsList.filter(t => !t.is_published).length}
                  </Badge>
                )}
              </Button>
              <Button 
                variant={testimonialFilter === "published" ? "default" : "outline"}
                onClick={() => setTestimonialFilter("published")}
                size="sm"
                className="text-xs sm:text-sm px-2.5 sm:px-4"
              >
                <span className="hidden xs:inline">Published</span>
                <span className="xs:hidden">Pub</span>
                <span className="ml-1">({testimonialsList.filter(t => t.is_published).length})</span>
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <p className="text-muted-foreground">Manage customer testimonials and reviews</p>
              
              <Dialog open={isTestimonialDialogOpen} onOpenChange={(open) => {
                setIsTestimonialDialogOpen(open);
                if (!open) resetTestimonialForm();
              }}>
                <DialogTrigger asChild>
                  <Button onClick={() => resetTestimonialForm()} className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Testimonial
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingTestimonial ? "Edit Testimonial" : "Add New Testimonial"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="customer_name">Customer Name *</Label>
                      <Input
                        id="customer_name"
                        value={testimonialFormData.customer_name}
                        onChange={(e) => setTestimonialFormData({...testimonialFormData, customer_name: e.target.value})}
                        placeholder="Enter customer name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="product_name">Product Name</Label>
                      <Input
                        id="product_name"
                        value={testimonialFormData.product_name}
                        onChange={(e) => setTestimonialFormData({...testimonialFormData, product_name: e.target.value})}
                        placeholder="Which product did they buy? (optional)"
                      />
                    </div>
                    <div>
                      <Label htmlFor="review_text">Review / Testimonial *</Label>
                      <Textarea
                        id="review_text"
                        value={testimonialFormData.review_text}
                        onChange={(e) => setTestimonialFormData({...testimonialFormData, review_text: e.target.value})}
                        placeholder="Enter customer review or testimonial"
                        rows={5}
                      />
                    </div>
                     <div>
                      <Label htmlFor="customer_photo">Customer Photo (optional)</Label>
                      <Input
                        id="customer_photo"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setTestimonialPhotoFile(file);
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setTestimonialPhotoPreview(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="cursor-pointer"
                      />
                      {testimonialPhotoPreview && (
                        <div className="mt-2">
                          <img 
                            src={testimonialPhotoPreview} 
                            alt="Preview"
                            className="w-32 h-32 object-cover rounded border"
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="testimonial_video">Video (Optional)</Label>
                      <Input
                        id="testimonial_video"
                        type="file"
                        accept="video/mp4,video/webm"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setTestimonialVideoFile(file);
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setTestimonialVideoPreview(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="cursor-pointer"
                      />
                      {testimonialVideoPreview && (
                        <div className="mt-2">
                          <video 
                            src={testimonialVideoPreview} 
                            className="w-32 h-32 object-cover rounded border"
                            controls
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="display_order">Display Order</Label>
                      <Input
                        id="display_order"
                        type="number"
                        value={testimonialFormData.display_order}
                        onChange={(e) => setTestimonialFormData({...testimonialFormData, display_order: parseInt(e.target.value) || 0})}
                        placeholder="0"
                      />
                    </div>
                    <div className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="is_featured"
                          checked={testimonialFormData.is_featured}
                          onChange={(e) => setTestimonialFormData({...testimonialFormData, is_featured: e.target.checked})}
                          className="cursor-pointer"
                        />
                        <Label htmlFor="is_featured" className="cursor-pointer">Featured</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="is_published"
                          checked={testimonialFormData.is_published}
                          onChange={(e) => setTestimonialFormData({...testimonialFormData, is_published: e.target.checked})}
                          className="cursor-pointer"
                        />
                        <Label htmlFor="is_published" className="cursor-pointer">Published</Label>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => {
                      setIsTestimonialDialogOpen(false);
                      resetTestimonialForm();
                    }}>
                      Cancel
                    </Button>
                    <Button onClick={editingTestimonial ? handleUpdateTestimonial : handleAddTestimonial}>
                      {editingTestimonial ? "Update" : "Add"} Testimonial
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Testimonials Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Input
                    placeholder="Search testimonials by name or product..."
                    value={testimonialSearchQuery}
                    onChange={(e) => setTestimonialSearchQuery(e.target.value)}
                    className="max-w-md"
                  />
                </div>
                <div className="overflow-x-auto">
                  {testimonialsList.filter(t => {
                    // Apply status filter
                    if (testimonialFilter === "pending" && t.is_published) return false;
                    if (testimonialFilter === "published" && !t.is_published) return false;
                    
                    // Apply search filter
                    if (!testimonialSearchQuery) return true;
                    const query = testimonialSearchQuery.toLowerCase();
                    return (
                      t.customer_name.toLowerCase().includes(query) ||
                      (t.product_name && t.product_name.toLowerCase().includes(query)) ||
                      t.review_text.toLowerCase().includes(query)
                    );
                  }).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {testimonialSearchQuery ? 'No testimonials match your search' : 'No testimonials yet'}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12 sm:w-16">Photo</TableHead>
                          <TableHead className="min-w-[80px]">Customer</TableHead>
                          <TableHead className="hidden sm:table-cell">Product</TableHead>
                          <TableHead className="hidden md:table-cell">Submitted</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {testimonialsList
                          .filter(t => {
                            // Apply status filter
                            if (testimonialFilter === "pending" && t.is_published) return false;
                            if (testimonialFilter === "published" && !t.is_published) return false;
                            
                            // Apply search filter
                            if (!testimonialSearchQuery) return true;
                            const query = testimonialSearchQuery.toLowerCase();
                            return (
                              t.customer_name.toLowerCase().includes(query) ||
                              (t.product_name && t.product_name.toLowerCase().includes(query)) ||
                              t.review_text.toLowerCase().includes(query)
                            );
                          })
                          .map((testimonial, index) => {
                            const getInitials = (name: string) => {
                              return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                            };
                            
                            return (
                              <TableRow key={testimonial.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.03}s` }}>
                                <TableCell className="p-2 sm:p-4">
                                  {testimonial.customer_photo ? (
                                    <img 
                                      src={testimonial.customer_photo} 
                                      alt={testimonial.customer_name}
                                      className="w-8 h-8 sm:w-12 sm:h-12 object-cover rounded-full"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs sm:text-sm">
                                      {getInitials(testimonial.customer_name)}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="font-medium text-xs sm:text-sm p-2 sm:p-4">{testimonial.customer_name}</TableCell>
                                <TableCell className="hidden sm:table-cell text-xs sm:text-sm">{testimonial.product_name || "-"}</TableCell>
                                <TableCell className="hidden md:table-cell text-xs sm:text-sm text-muted-foreground">
                                  {new Date(testimonial.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="p-2 sm:p-4">
                                  <div className="flex flex-col xs:flex-row gap-1">
                                    {testimonial.is_published ? (
                                      <Badge className="bg-green-500 hover:bg-green-600 text-[10px] xs:text-xs">Pub</Badge>
                                    ) : (
                                      <Badge className="bg-yellow-500 hover:bg-yellow-600 text-[10px] xs:text-xs">Pend</Badge>
                                    )}
                                    {testimonial.is_featured && <Badge variant="secondary" className="text-[10px] xs:text-xs hidden xs:inline-flex">★</Badge>}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right p-2 sm:p-4">
                                  <div className="flex justify-end gap-1 sm:gap-2">
                                    {!testimonial.is_published ? (
                                      <>
                                        <Button
                                          variant="default"
                                          size="icon"
                                          onClick={() => handleQuickApprove(testimonial.id)}
                                          className="bg-green-600 hover:bg-green-700 h-7 w-7 sm:h-8 sm:w-8"
                                          title="Approve & Publish"
                                        >
                                          <span className="text-xs">✓</span>
                                        </Button>
                                        <Button
                                          variant="destructive"
                                          size="icon"
                                          onClick={() => handleDeleteTestimonial(testimonial.id)}
                                          title="Reject & Delete"
                                          className="h-7 w-7 sm:h-8 sm:w-8"
                                        >
                                          <span className="text-xs">✗</span>
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          onClick={() => openTestimonialEditDialog(testimonial)}
                                          title="Edit"
                                          className="h-7 w-7 sm:h-8 sm:w-8"
                                        >
                                          <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          onClick={() => handleQuickUnpublish(testimonial.id)}
                                          title="Unpublish"
                                          className="h-7 w-7 sm:h-8 sm:w-8"
                                        >
                                          <span className="text-xs">📤</span>
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          onClick={() => openTestimonialEditDialog(testimonial)}
                                          title="Edit"
                                          className="h-7 w-7 sm:h-8 sm:w-8"
                                        >
                                          <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                                        </Button>
                                        <Button
                                          variant="destructive"
                                          size="icon"
                                          onClick={() => handleDeleteTestimonial(testimonial.id)}
                                          title="Delete"
                                          className="h-7 w-7 sm:h-8 sm:w-8"
                                        >
                                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Story Analytics Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Story Analytics
                </CardTitle>
                <p className="text-sm text-muted-foreground">Track views and engagement for customer testimonials</p>
              </CardHeader>
              <CardContent>
                <TestimonialAnalytics />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Product Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Product Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter product description"
                />
              </div>
              <div>
                <Label htmlFor="edit-price">Current Price (KSh) *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="edit-originalPrice">Original Price (KSh)</Label>
                <Input
                  id="edit-originalPrice"
                  type="number"
                  value={formData.originalPrice}
                  onChange={(e) => setFormData({...formData, originalPrice: e.target.value})}
                  placeholder="Leave empty if no discount"
                />
              </div>
              <div>
                <Label htmlFor="edit-costPrice">Cost Price (KSh) *</Label>
                <Input
                  id="edit-costPrice"
                  type="number"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({...formData, costPrice: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="edit-stock">Stock</Label>
                <Input
                  id="edit-stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({...formData, stock: e.target.value})}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Input
                  id="edit-category"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  placeholder="e.g., Notebooks, Pens"
                />
              </div>
              <div>
                <Label>Product Image</Label>
                <Tabs value={imageInputMode} onValueChange={(v) => setImageInputMode(v as "file" | "url")} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="file">Upload File</TabsTrigger>
                    <TabsTrigger value="url">Image URL</TabsTrigger>
                  </TabsList>
                  <TabsContent value="file">
                    <Input
                      id="edit-image-file"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedImageFile(file);
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormData({...formData, image: reader.result as string});
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="cursor-pointer"
                    />
                  </TabsContent>
                  <TabsContent value="url">
                    <Input
                      id="edit-image-url"
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value);
                        setFormData({...formData, image: e.target.value});
                      }}
                    />
                  </TabsContent>
                  </Tabs>
                  {formData.image && formData.image !== "/placeholder.svg" && (
                    <div className="mt-2">
                      <img 
                        src={formData.image} 
                        alt="Preview" 
                        className="w-24 h-24 object-cover rounded border"
                      />
                    </div>
                  )}
                </div>
                
                {/* Existing Media Section */}
                {existingMedia.length > 0 && (
                  <div>
                    <Label>Existing Additional Media</Label>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {existingMedia
                        .filter(m => !mediaToDelete.includes(m.id))
                        .map((media) => (
                        <div key={media.id} className="relative">
                          {media.media_type === 'image' ? (
                            <img 
                              src={media.media_url} 
                              alt="Existing media"
                              className="w-20 h-20 object-cover rounded border"
                            />
                          ) : (
                            <video 
                              src={media.media_url} 
                              className="w-20 h-20 object-cover rounded border"
                            />
                          )}
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                            onClick={() => setMediaToDelete([...mediaToDelete, media.id])}
                          >
                            <Trash className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Additional Images Section */}
                <div>
                  <Label className="flex items-center gap-2">
                    <ImagePlus className="h-4 w-4" />
                    Add More Images (Max 3 total)
                  </Label>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []).slice(0, 3);
                      setAdditionalImages(files);
                      
                      // Create previews
                      const previews: string[] = [];
                      files.forEach(file => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          previews.push(reader.result as string);
                          if (previews.length === files.length) {
                            setAdditionalImagePreviews(previews);
                          }
                        };
                        reader.readAsDataURL(file);
                      });
                    }}
                    className="cursor-pointer"
                  />
                  {additionalImagePreviews.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {additionalImagePreviews.map((preview, idx) => (
                        <div key={idx} className="relative">
                          <img 
                            src={preview} 
                            alt={`New ${idx + 1}`}
                            className="w-20 h-20 object-cover rounded border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                            onClick={() => {
                              setAdditionalImages(additionalImages.filter((_, i) => i !== idx));
                              setAdditionalImagePreviews(additionalImagePreviews.filter((_, i) => i !== idx));
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Video Upload Section */}
                <div>
                  <Label className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Add Product Video (Optional)
                  </Label>
                  <Input
                    type="file"
                    accept="video/mp4,video/webm"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setVideoFile(file);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setVideoPreview(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="cursor-pointer"
                  />
                  {videoPreview && (
                    <div className="relative mt-2">
                      <video 
                        src={videoPreview} 
                        className="w-32 h-32 object-cover rounded border"
                        controls
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                        onClick={() => {
                          setVideoFile(null);
                          setVideoPreview("");
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              <Button 
                onClick={handleEditProduct} 
                className="w-full transition-all duration-200 active:scale-95 bg-primary hover:bg-primary/90"
                disabled={uploadingImage}
              >
                {uploadingImage ? "Uploading..." : "Update Product"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Order Dialog */}
        <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Order ID</Label>
                    <p className="font-mono text-sm">{selectedOrder.id.slice(0, 8)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Date</Label>
                    <p>{new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Customer</Label>
                    <p>{selectedOrder.customer_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <div className="flex items-center gap-2">
                      <p>{selectedOrder.customer_phone}</p>
                      <a
                        href={`tel:${selectedOrder.customer_phone}`}
                        className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-input bg-background hover:bg-green-50 hover:border-green-300 transition-colors"
                        title="Call customer"
                      >
                        <Phone className="h-3.5 w-3.5 text-green-600" />
                      </a>
                      <a
                        href={`sms:${selectedOrder.customer_phone}`}
                        className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-input bg-background hover:bg-blue-50 hover:border-blue-300 transition-colors"
                        title="Text customer"
                      >
                        <MessageCircle className="h-3.5 w-3.5 text-blue-600" />
                      </a>
                      <a
                        href={`https://wa.me/${selectedOrder.customer_phone.replace(/^0/, '254').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${selectedOrder.customer_name}! This is ARIS STATIONERIES following up on your order #${selectedOrder.id.slice(0, 8)}. How can we help you?`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center h-7 px-2 rounded-md border border-input bg-background hover:bg-green-50 hover:border-green-500 transition-colors gap-1"
                        title="WhatsApp customer"
                      >
                        <MessageCircle className="h-3.5 w-3.5 text-green-600" />
                        <span className="text-xs text-green-600 font-medium">WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">Delivery Address</Label>
                  <p className="text-sm">{selectedOrder.delivery_address}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(status => (
                      <Button
                        key={status}
                        size="sm"
                        variant={selectedOrder.status.toLowerCase() === status.toLowerCase() ? 'default' : 'outline'}
                        onClick={() => initiateStatusChange(selectedOrder.id, status)}
                        className={selectedOrder.status.toLowerCase() === status.toLowerCase() ? 'bg-primary hover:bg-primary/90' : ''}
                      >
                        {status}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Communication History */}
                <div>
                  <Label className="text-muted-foreground mb-2 block">Communication History</Label>
                  <OrderCommunicationHistory orderId={selectedOrder.id} />
                </div>

                <div>
                  <Label className="text-muted-foreground mb-2 block">Order Items</Label>
                  <div className="space-y-2">
                    {selectedOrder.order_items?.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 border rounded">
                        <img src={item.product_image} alt={item.product_name} className="w-12 h-12 object-cover rounded" />
                        <div className="flex-1">
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-muted-foreground">Qty: {item.quantity} × KSh {item.price.toFixed(2)}</p>
                        </div>
                        <p className="font-medium">KSh {(item.quantity * item.price).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center p-3 bg-primary/10 rounded mt-2">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-primary text-lg">KSh {selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground mb-2 block">Tags</Label>
                  <div className="flex gap-2 flex-wrap mb-3">
                    {(selectedOrder.tags || []).map((tag, i) => (
                      <Badge key={i} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <X 
                          className="h-3 w-3 cursor-pointer hover:text-destructive" 
                          onClick={() => removeTagFromOrder(selectedOrder.id, tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add new tag"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTagToOrder(selectedOrder.id)}
                    />
                    <Button onClick={() => addTagToOrder(selectedOrder.id)} size="sm" className="bg-primary hover:bg-primary/90">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <Label className="text-muted-foreground mb-3 block">Apply Discount</Label>
                  
                  {selectedOrder.discount_amount && selectedOrder.discount_amount > 0 && (
                    <div className="mb-3 p-3 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-900">
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-1">
                        <Badge variant="outline" className="bg-green-100 dark:bg-green-950">
                          Discount Applied
                        </Badge>
                      </div>
                      <div className="text-sm space-y-1">
                        <p>Original Total: <span className="line-through">KSh {selectedOrder.original_total?.toFixed(2)}</span></p>
                        <p className="font-semibold text-green-700 dark:text-green-400">
                          Discount: -KSh {selectedOrder.discount_amount.toFixed(2)} 
                          {selectedOrder.discount_type === "percentage" && ` (${((selectedOrder.discount_amount / (selectedOrder.original_total || 1)) * 100).toFixed(0)}%)`}
                        </p>
                        <p className="font-bold text-base">Final Total: KSh {selectedOrder.total.toFixed(2)}</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm mb-2 block">Discount Type</Label>
                      <RadioGroup value={discountType} onValueChange={(v) => setDiscountType(v as "percentage" | "fixed")} className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="percentage" id="percentage" />
                          <Label htmlFor="percentage" className="flex items-center gap-1 cursor-pointer">
                            <Percent className="h-4 w-4" />
                            Percentage
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="fixed" id="fixed" />
                          <Label htmlFor="fixed" className="flex items-center gap-1 cursor-pointer">
                            <DollarSign className="h-4 w-4" />
                            Fixed Amount
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label htmlFor="discount-value" className="text-sm">
                          {discountType === "percentage" ? "Discount Percentage" : "Discount Amount (KSh)"}
                        </Label>
                        <Input
                          id="discount-value"
                          type="number"
                          placeholder={discountType === "percentage" ? "e.g., 10" : "e.g., 100"}
                          value={discountValue}
                          onChange={(e) => setDiscountValue(e.target.value)}
                          min="0"
                          max={discountType === "percentage" ? "100" : undefined}
                          step={discountType === "percentage" ? "1" : "0.01"}
                        />
                      </div>
                      <Button 
                        onClick={() => applyDiscount(selectedOrder.id)} 
                        className="mt-6 bg-primary hover:bg-primary/90"
                        disabled={applyingDiscount || !discountValue}
                      >
                        {applyingDiscount ? "Applying..." : "Apply"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
      
      <Footer />

      {/* Quick Sale Dialog */}
      <QuickSaleDialog
        open={isQuickSaleOpen}
        onClose={() => setIsQuickSaleOpen(false)}
        products={productList}
        onSaleCompleted={() => {
          fetchProducts();
          fetchOrders();
        }}
      />

      {/* Order Status Modal */}
      {pendingStatusChange && (() => {
        const orderForModal = ordersList.find(o => o.id === pendingStatusChange.orderId);
        if (!orderForModal) return null;
        return (
          <OrderStatusModal
            isOpen={isStatusModalOpen}
            onClose={() => {
              setIsStatusModalOpen(false);
              setPendingStatusChange(null);
            }}
            order={{
              id: orderForModal.id,
              customer_name: orderForModal.customer_name,
              customer_phone: orderForModal.customer_phone,
              total: orderForModal.total,
              delivery_address: orderForModal.delivery_address,
              status: orderForModal.status
            }}
            newStatus={pendingStatusChange.newStatus}
            onConfirm={async (sendMessage) => {
              await updateOrderStatus(pendingStatusChange.orderId, pendingStatusChange.newStatus);
              setIsStatusModalOpen(false);
              setPendingStatusChange(null);
            }}
          />
        );
      })()}
    </div>
  );
};

export default Admin;
