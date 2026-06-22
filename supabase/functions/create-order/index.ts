import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  product_id?: string;
  product_name: string;
  product_image: string;
  quantity: number;
  price: number;
}

interface OrderRequest {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  items: OrderItem[];
  agent_zone_id?: string | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: OrderRequest = await req.json();
    console.log("Received order request:", JSON.stringify(body, null, 2));

    // Validate required fields
    if (!body.customer_name || body.customer_name.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: "Customer name must be at least 2 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!body.customer_phone || body.customer_phone.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "Please provide a valid phone number" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!body.delivery_address || body.delivery_address.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Delivery address is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!body.items || body.items.length === 0) {
      return new Response(
        JSON.stringify({ error: "Order must contain at least one item" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate each item
    for (const item of body.items) {
      if (!item.product_name || item.product_name.trim().length === 0) {
        return new Response(
          JSON.stringify({ error: "Product name is required for all items" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (!item.quantity || item.quantity < 1 || !Number.isInteger(item.quantity)) {
        return new Response(
          JSON.stringify({ error: `Invalid quantity for ${item.product_name}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (item.quantity > 100) {
        return new Response(
          JSON.stringify({ error: `Quantity exceeds maximum limit (100) for ${item.product_name}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (typeof item.price !== "number" || item.price < 0) {
        return new Response(
          JSON.stringify({ error: `Invalid price for ${item.product_name}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // For items with product_id, verify prices against database
    const itemsWithIds = body.items.filter(item => item.product_id);
    if (itemsWithIds.length > 0) {
      const productIds = itemsWithIds.map(item => item.product_id);
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id, name, price")
        .in("id", productIds);

      if (productsError) {
        console.error("Error fetching products:", productsError);
        return new Response(
          JSON.stringify({ error: "Failed to verify product prices" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const productMap = new Map(products?.map(p => [p.id, p]) || []);

      for (const item of itemsWithIds) {
        const product = productMap.get(item.product_id!);
        if (product) {
          // Verify price matches (allow small floating point differences)
          if (Math.abs(Number(product.price) - item.price) > 0.01) {
            console.log(`Price mismatch for ${item.product_name}: submitted ${item.price}, actual ${product.price}`);
            // Use the actual price from database
            item.price = Number(product.price);
          }
        }
      }
    }

    // Calculate server-side total
    const calculatedTotal = body.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    console.log("Server-calculated total:", calculatedTotal);

    // Validate total is reasonable
    if (calculatedTotal <= 0) {
      return new Response(
        JSON.stringify({ error: "Order total must be greater than zero" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (calculatedTotal > 1000000) {
      return new Response(
        JSON.stringify({ error: "Order total exceeds maximum limit" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create order with server-calculated total
    const orderId = crypto.randomUUID();
    const orderInsert: any = {
      id: orderId,
      customer_name: body.customer_name.trim(),
      customer_email: body.customer_email ? body.customer_email.trim() : null,
      customer_phone: body.customer_phone.trim(),
      delivery_address: body.delivery_address.trim(),
      total: calculatedTotal,
      subtotal: calculatedTotal,
      status: "Pending"
    };

    // Add agent zone if provided
    if (body.agent_zone_id) {
      orderInsert.agent_zone_id = body.agent_zone_id;
    }

    const { error: orderError } = await supabase
      .from("orders")
      .insert(orderInsert);

    if (orderError) {
      console.error("Error creating order:", orderError);
      return new Response(
        JSON.stringify({ error: "Failed to create order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Order created:", orderId);

    // Create order items
    const orderItems = body.items.map(item => ({
      order_id: orderId,
      product_name: item.product_name.trim(),
      product_image: item.product_image,
      quantity: item.quantity,
      price: item.price
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Error creating order items:", itemsError);
      // Attempt to clean up the order
      await supabase.from("orders").delete().eq("id", orderId);
      return new Response(
        JSON.stringify({ error: "Failed to create order items" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Order items created successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        orderId, 
        total: calculatedTotal 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
