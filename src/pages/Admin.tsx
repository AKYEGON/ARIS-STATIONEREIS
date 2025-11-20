import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
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
import { Product } from "@/types/product";
import { Pencil, Trash2, Plus, Package, ShoppingBag, X, LogOut, TrendingUp, Warehouse, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { InventoryDashboard } from "@/components/admin/InventoryDashboard";
import { SalesDashboard } from "@/components/admin/SalesDashboard";

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
}

const Admin = () => {
  const navigate = useNavigate();
  const { getCartItemCount } = useCart();
  const [productList, setProductList] = useState<Product[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState("products");
  const [ordersList, setOrdersList] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  
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

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchProducts();
      if (activeTab === "orders") {
        fetchOrders();
      }
    }
  }, [activeTab, isAdmin]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
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
        image: p.image
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

  const fetchOrders = async () => {
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
    setIsEditDialogOpen(true);
  };

  const openOrderDialog = (order: Order) => {
    setSelectedOrder(order);
    setNewTag("");
    setIsOrderDialogOpen(true);
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

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      // If status is being changed to delivered, handle stock reduction and profit calculation
      if (newStatus === "delivered") {
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
          // Get the product to access cost_price and current stock
          const { data: product, error: productError } = await supabase
            .from("products")
            .select("id, cost_price, stock, name")
            .eq("name", item.product_name)
            .single();

          if (productError || !product) {
            console.warn(`Product not found for: ${item.product_name}`);
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
        <div className="flex justify-between items-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">Admin Portal</h1>
          <Button variant="outline" onClick={handleSignOut} className="gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Warehouse className="h-4 w-4" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="sales" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Sales & Profit
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Orders
            </TabsTrigger>
          </TabsList>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6">
            <InventoryDashboard />
          </TabsContent>

          {/* Sales Dashboard Tab */}
          <TabsContent value="sales" className="space-y-6">
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

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
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
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 transition-all duration-200 hover:scale-105 active:scale-95"
                              onClick={() => openOrderDialog(order)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                </div>
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
                    <p>{selectedOrder.customer_phone}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">Delivery Address</Label>
                  <p className="text-sm">{selectedOrder.delivery_address}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => (
                      <Button
                        key={status}
                        size="sm"
                        variant={selectedOrder.status === status ? 'default' : 'outline'}
                        onClick={() => updateOrderStatus(selectedOrder.id, status)}
                        className={selectedOrder.status === status ? 'bg-primary hover:bg-primary/90' : ''}
                      >
                        {status}
                      </Button>
                    ))}
                  </div>
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
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
      
      <Footer />
    </div>
  );
};

export default Admin;
