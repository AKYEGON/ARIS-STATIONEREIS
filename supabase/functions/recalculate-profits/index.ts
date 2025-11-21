import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderWithItems {
  id: string;
  total: number;
  original_total: number | null;
  discount_amount: number | null;
  subtotal: number | null;
  order_items: {
    id: string;
    price: number;
    quantity: number;
    cost_price: number | null;
    product_name: string;
  }[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify admin access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      console.error('User auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      console.error('Admin check error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting profit recalculation for user:', user.id);

    // Fetch all orders with discounts
    const { data: orders, error: ordersError } = await supabaseClient
      .from('orders')
      .select(`
        id,
        total,
        original_total,
        discount_amount,
        subtotal,
        order_items (
          id,
          price,
          quantity,
          cost_price,
          product_name
        )
      `)
      .not('discount_amount', 'is', null)
      .gt('discount_amount', 0) as { data: OrderWithItems[] | null; error: any };

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      throw ordersError;
    }

    if (!orders || orders.length === 0) {
      console.log('No orders with discounts found');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No orders with discounts found',
          ordersProcessed: 0,
          itemsUpdated: 0
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${orders.length} orders with discounts to recalculate`);

    let ordersProcessed = 0;
    let itemsUpdated = 0;
    const errors: string[] = [];

    // Process each order
    for (const order of orders) {
      try {
        const originalTotal = order.original_total || order.subtotal || order.total;
        const discountAmount = order.discount_amount || 0;

        if (!order.order_items || order.order_items.length === 0) {
          console.log(`Order ${order.id} has no items, skipping`);
          continue;
        }

        let newTotalProfit = 0;

        // Recalculate profit for each item
        for (const item of order.order_items) {
          const itemSubtotal = Number(item.price) * item.quantity;
          const itemProportion = originalTotal > 0 ? itemSubtotal / originalTotal : 0;
          const itemDiscount = discountAmount * itemProportion;
          const itemActualRevenue = itemSubtotal - itemDiscount;
          const itemCost = Number(item.cost_price || 0) * item.quantity;
          const itemProfit = itemActualRevenue - itemCost;

          newTotalProfit += itemProfit;

          // Update item profit
          const { error: updateItemError } = await supabaseClient
            .from('order_items')
            .update({ profit: itemProfit })
            .eq('id', item.id);

          if (updateItemError) {
            console.error(`Error updating item ${item.id}:`, updateItemError);
            errors.push(`Failed to update item ${item.product_name} in order ${order.id}`);
          } else {
            itemsUpdated++;
          }
        }

        // Update order profit
        const { error: updateOrderError } = await supabaseClient
          .from('orders')
          .update({ profit: newTotalProfit })
          .eq('id', order.id);

        if (updateOrderError) {
          console.error(`Error updating order ${order.id}:`, updateOrderError);
          errors.push(`Failed to update order ${order.id}`);
        } else {
          ordersProcessed++;
          console.log(`Order ${order.id} updated with new profit: ${newTotalProfit}`);
        }
      } catch (error: any) {
        console.error(`Error processing order ${order.id}:`, error);
        errors.push(`Exception processing order ${order.id}: ${error?.message || 'Unknown error'}`);
      }
    }

    const result = {
      success: true,
      message: `Profit recalculation complete`,
      ordersProcessed,
      itemsUpdated,
      totalOrders: orders.length,
      errors: errors.length > 0 ? errors : undefined
    };

    console.log('Recalculation complete:', result);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Fatal error in recalculate-profits:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
