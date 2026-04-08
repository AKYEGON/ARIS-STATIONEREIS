import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, Package, ShoppingCart, Store, Globe, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SalesStats {
  totalSales: number;
  totalProfit: number;
  totalOrders: number;
  averageOrderValue: number;
  quickSaleCount: number;
  onlineOrderCount: number;
  quickSaleRevenue: number;
  onlineOrderRevenue: number;
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

interface AgentZoneStats {
  zone_id: string;
  zone_name: string;
  order_count: number;
  total_revenue: number;
  delivered_count: number;
}

type TimeRange = "today" | "week" | "month" | "3months" | "6months" | "year" | "all";

interface SalesDashboardProps {
  hideProfitData?: boolean;
}

export const SalesDashboard = ({ hideProfitData = false }: SalesDashboardProps) => {
  const [stats, setStats] = useState<SalesStats>({
    totalSales: 0,
    totalProfit: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    quickSaleCount: 0,
    onlineOrderCount: 0,
    quickSaleRevenue: 0,
    onlineOrderRevenue: 0,
  });
  const [topProducts, setTopProducts] = useState<ProductSales[]>([]);
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [agentZoneStats, setAgentZoneStats] = useState<AgentZoneStats[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchSalesData();
  }, [timeRange]);

  const getStartDate = (): Date | null => {
    const now = new Date();
    switch (timeRange) {
      case "today":
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case "week":
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        return weekStart;
      case "month":
        const monthStart = new Date(now);
        monthStart.setMonth(now.getMonth() - 1);
        return monthStart;
      case "3months":
        const threeMonths = new Date(now);
        threeMonths.setMonth(now.getMonth() - 3);
        return threeMonths;
      case "6months":
        const sixMonths = new Date(now);
        sixMonths.setMonth(now.getMonth() - 6);
        return sixMonths;
      case "year":
        const yearStart = new Date(now);
        yearStart.setFullYear(now.getFullYear() - 1);
        return yearStart;
      case "all":
        return null;
    }
  };

  const fetchSalesData = async () => {
    setIsLoading(true);
    try {
      const startDate = getStartDate();

      // Build query for completed orders
      let query = supabase
        .from("orders")
        .select("*")
        .in("status", ["delivered", "fulfilled", "completed", "Delivered", "Fulfilled", "Completed"]);

      if (startDate) {
        query = query.gte("created_at", startDate.toISOString());
      }

      const { data: orders, error: ordersError } = await query;
      if (ordersError) throw ordersError;

      // Separate quick sales (Walk-in tagged) from online orders
      const quickSales = orders?.filter(o => o.tags && o.tags.includes("Walk-in")) || [];
      const onlineOrders = orders?.filter(o => !o.tags || !o.tags.includes("Walk-in")) || [];

      const totalSales = orders?.reduce((sum, o) => sum + Number(o.total), 0) || 0;
      const totalProfit = orders?.reduce((sum, o) => sum + Number(o.profit || 0), 0) || 0;
      const totalOrders = orders?.length || 0;
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

      setStats({
        totalSales,
        totalProfit,
        totalOrders,
        averageOrderValue,
        quickSaleCount: quickSales.length,
        onlineOrderCount: onlineOrders.length,
        quickSaleRevenue: quickSales.reduce((s, o) => s + Number(o.total), 0),
        onlineOrderRevenue: onlineOrders.reduce((s, o) => s + Number(o.total), 0),
      });

      // Fetch top selling products
      const orderIds = orders?.map(o => o.id) || [];
      if (orderIds.length > 0) {
        const { data: orderItems, error: itemsError } = await supabase
          .from("order_items")
          .select("product_name, quantity, price, profit, order_id")
          .in("order_id", orderIds);

        if (itemsError) throw itemsError;

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
          existing.total_profit += Number(item.profit || 0);
          productMap.set(item.product_name, existing);
        });

        setTopProducts(
          Array.from(productMap.values())
            .sort((a, b) => b.total_revenue - a.total_revenue)
            .slice(0, 10)
        );
      } else {
        setTopProducts([]);
      }

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

      setDailySales(
        Array.from(dailyMap.values())
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      );

    } catch (error) {
      console.error("Error fetching sales data:", error);
      toast.error("Failed to load sales data");
    } finally {
      setIsLoading(false);
    }
  };

  const timeRangeLabel: Record<TimeRange, string> = {
    today: "Today",
    week: "7 Days",
    month: "30 Days",
    "3months": "3 Months",
    "6months": "6 Months",
    year: "1 Year",
    all: "All Time",
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Time Range Tabs */}
      <div className="overflow-x-auto -mx-2 px-2">
        <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
          <TabsList className="h-8 sm:h-10 w-max">
            {(Object.keys(timeRangeLabel) as TimeRange[]).map(key => (
              <TabsTrigger key={key} value={key} className="text-[10px] sm:text-xs px-2 sm:px-3">
                {timeRangeLabel[key]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {isLoading && (
        <div className="text-center text-muted-foreground text-sm py-4">Loading sales data...</div>
      )}

      {/* Summary Cards */}
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

      {/* Source Breakdown */}
      <div className="grid gap-2 sm:gap-4 grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-2.5 sm:p-6">
            <CardTitle className="text-[10px] xs:text-xs sm:text-sm font-medium">Walk-in Sales</CardTitle>
            <Store className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-2.5 pt-0 sm:p-6 sm:pt-0">
            <div className="text-sm xs:text-base sm:text-xl font-bold">{stats.quickSaleCount} orders</div>
            <p className="text-[10px] xs:text-xs text-muted-foreground">KSh {stats.quickSaleRevenue.toFixed(0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-2.5 sm:p-6">
            <CardTitle className="text-[10px] xs:text-xs sm:text-sm font-medium">Online Orders</CardTitle>
            <Globe className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-2.5 pt-0 sm:p-6 sm:pt-0">
            <div className="text-sm xs:text-base sm:text-xl font-bold">{stats.onlineOrderCount} orders</div>
            <p className="text-[10px] xs:text-xs text-muted-foreground">KSh {stats.onlineOrderRevenue.toFixed(0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
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
                  {topProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={hideProfitData ? 3 : 4} className="text-center text-muted-foreground text-xs py-8">
                        No sales data for this period
                      </TableCell>
                    </TableRow>
                  ) : topProducts.map((product, index) => (
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
                  {dailySales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={hideProfitData ? 3 : 4} className="text-center text-muted-foreground text-xs py-8">
                        No sales data for this period
                      </TableCell>
                    </TableRow>
                  ) : dailySales.map((day, index) => (
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
