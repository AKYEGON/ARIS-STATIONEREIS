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

interface SalesDashboardProps {
  hideProfitData?: boolean;
}

export const SalesDashboard = ({ hideProfitData = false }: SalesDashboardProps) => {
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

      // Fetch completed orders (case-insensitive status check using ilike or multiple values)
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .or("status.ilike.delivered,status.ilike.fulfilled")
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
    <div className="space-y-4 sm:space-y-6">
      <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
        <TabsList className="h-8 sm:h-10">
          <TabsTrigger value="day" className="text-xs sm:text-sm px-2.5 sm:px-3">Today</TabsTrigger>
          <TabsTrigger value="week" className="text-xs sm:text-sm px-2.5 sm:px-3">Week</TabsTrigger>
          <TabsTrigger value="month" className="text-xs sm:text-sm px-2.5 sm:px-3">Month</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-2 sm:gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-2.5 sm:p-6">
            <CardTitle className="text-[10px] xs:text-xs sm:text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-2.5 pt-0 sm:p-6 sm:pt-0">
            <div className="text-sm xs:text-base sm:text-2xl font-bold">KSh {stats.totalSales.toFixed(0)}</div>
          </CardContent>
        </Card>
        {!hideProfitData && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-2.5 sm:p-6">
              <CardTitle className="text-[10px] xs:text-xs sm:text-sm font-medium">Profit</CardTitle>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-2.5 pt-0 sm:p-6 sm:pt-0">
              <div className="text-sm xs:text-base sm:text-2xl font-bold text-green-600">
                KSh {stats.totalProfit.toFixed(0)}
              </div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-2.5 sm:p-6">
            <CardTitle className="text-[10px] xs:text-xs sm:text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-2.5 pt-0 sm:p-6 sm:pt-0">
            <div className="text-sm xs:text-base sm:text-2xl font-bold">{stats.totalOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-2.5 sm:p-6">
            <CardTitle className="text-[10px] xs:text-xs sm:text-sm font-medium">Avg Order</CardTitle>
            <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-2.5 pt-0 sm:p-6 sm:pt-0">
            <div className="text-sm xs:text-base sm:text-2xl font-bold">
              KSh {stats.averageOrderValue.toFixed(0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-sm sm:text-base">Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-6 pt-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">Product</TableHead>
                    <TableHead className="text-xs sm:text-sm w-[50px]">Qty</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden xs:table-cell">Revenue</TableHead>
                    {!hideProfitData && <TableHead className="text-xs sm:text-sm">Profit</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.map((product, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium text-xs sm:text-sm p-2 sm:p-4 max-w-[120px] truncate">{product.product_name}</TableCell>
                      <TableCell className="text-xs sm:text-sm p-2 sm:p-4">{product.total_quantity}</TableCell>
                      <TableCell className="text-xs sm:text-sm p-2 sm:p-4 hidden xs:table-cell">KSh {product.total_revenue.toFixed(0)}</TableCell>
                      {!hideProfitData && (
                        <TableCell className="text-green-600 font-medium text-xs sm:text-sm p-2 sm:p-4">
                          KSh {product.total_profit.toFixed(0)}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-sm sm:text-base">Daily Sales</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-6 pt-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">Date</TableHead>
                    <TableHead className="text-xs sm:text-sm w-[40px]">Ord</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden xs:table-cell">Sales</TableHead>
                    {!hideProfitData && <TableHead className="text-xs sm:text-sm">Profit</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailySales.map((day, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium text-xs sm:text-sm p-2 sm:p-4">{day.date}</TableCell>
                      <TableCell className="text-xs sm:text-sm p-2 sm:p-4">{day.order_count}</TableCell>
                      <TableCell className="text-xs sm:text-sm p-2 sm:p-4 hidden xs:table-cell">KSh {day.total_sales.toFixed(0)}</TableCell>
                      {!hideProfitData && (
                        <TableCell className="text-green-600 font-medium text-xs sm:text-sm p-2 sm:p-4">
                          KSh {day.total_profit.toFixed(0)}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
