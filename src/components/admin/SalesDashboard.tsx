import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, Package, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SalesStats {
  totalSales: number;
  totalProfit: number;
  totalOrders: number;
  averageOrderValue: number;
}

interface ProductSales {
  product_name: string;
  total_quantity: number;
  total_revenue: number;
  total_profit: number;
}

interface DailySales {
  date: string;
  total_sales: number;
  total_profit: number;
  order_count: number;
}

export const SalesDashboard = () => {
  const [stats, setStats] = useState<SalesStats>({
    totalSales: 0,
    totalProfit: 0,
    totalOrders: 0,
    averageOrderValue: 0
  });
  const [topProducts, setTopProducts] = useState<ProductSales[]>([]);
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month">("month");

  useEffect(() => {
    fetchSalesData();
  }, [timeRange]);

  const fetchSalesData = async () => {
    try {
      // Calculate date range
      const now = new Date();
      const startDate = new Date();
      if (timeRange === "day") {
        startDate.setDate(now.getDate() - 1);
      } else if (timeRange === "week") {
        startDate.setDate(now.getDate() - 7);
      } else {
        startDate.setMonth(now.getMonth() - 1);
      }

      // Fetch completed orders
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .eq("status", "Fulfilled")
        .gte("completed_at", startDate.toISOString());

      if (ordersError) throw ordersError;

      // Calculate stats
      const totalSales = orders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
      const totalProfit = orders?.reduce((sum, order) => sum + Number(order.profit || 0), 0) || 0;
      const totalOrders = orders?.length || 0;
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

      setStats({
        totalSales,
        totalProfit,
        totalOrders,
        averageOrderValue
      });

      // Fetch top selling products
      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select("product_name, quantity, price, profit, order_id")
        .in("order_id", orders?.map(o => o.id) || []);

      if (itemsError) throw itemsError;

      // Group by product
      const productMap = new Map<string, ProductSales>();
      orderItems?.forEach(item => {
        const existing = productMap.get(item.product_name) || {
          product_name: item.product_name,
          total_quantity: 0,
          total_revenue: 0,
          total_profit: 0
        };
        existing.total_quantity += item.quantity;
        existing.total_revenue += Number(item.price) * item.quantity;
        existing.total_profit += Number(item.profit || 0) * item.quantity;
        productMap.set(item.product_name, existing);
      });

      const topProductsList = Array.from(productMap.values())
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, 10);

      setTopProducts(topProductsList);

      // Group by day for daily sales
      const dailyMap = new Map<string, DailySales>();
      orders?.forEach(order => {
        const date = new Date(order.completed_at || order.created_at).toLocaleDateString();
        const existing = dailyMap.get(date) || {
          date,
          total_sales: 0,
          total_profit: 0,
          order_count: 0
        };
        existing.total_sales += Number(order.total);
        existing.total_profit += Number(order.profit || 0);
        existing.order_count += 1;
        dailyMap.set(date, existing);
      });

      const dailyList = Array.from(dailyMap.values())
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setDailySales(dailyList);

    } catch (error) {
      console.error("Error fetching sales data:", error);
      toast.error("Failed to load sales data");
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
        <TabsList>
          <TabsTrigger value="day">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KSh {stats.totalSales.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              KSh {stats.totalProfit.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KSh {stats.averageOrderValue.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Units Sold</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{product.product_name}</TableCell>
                    <TableCell>{product.total_quantity}</TableCell>
                    <TableCell>KSh {product.total_revenue.toFixed(2)}</TableCell>
                    <TableCell className="text-green-600 font-medium">
                      KSh {product.total_profit.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Sales</TableHead>
                  <TableHead>Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailySales.map((day, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{day.date}</TableCell>
                    <TableCell>{day.order_count}</TableCell>
                    <TableCell>KSh {day.total_sales.toFixed(2)}</TableCell>
                    <TableCell className="text-green-600 font-medium">
                      KSh {day.total_profit.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
