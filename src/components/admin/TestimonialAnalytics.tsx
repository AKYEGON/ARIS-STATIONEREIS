import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, CheckCircle, TrendingUp, Clock } from "lucide-react";

interface TestimonialStats {
  id: string;
  customer_name: string;
  customer_photo: string;
  product_name?: string;
  views: number;
  completed_views: number;
  last_viewed_at?: string;
  is_published: boolean;
  is_featured: boolean;
}

interface DetailedView {
  id: string;
  viewed_at: string;
  completed: boolean;
  view_duration?: number;
}

const TestimonialAnalytics = () => {
  const [stats, setStats] = useState<TestimonialStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTestimonial, setSelectedTestimonial] = useState<string | null>(null);
  const [detailedViews, setDetailedViews] = useState<DetailedView[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from("customer_testimonials")
        .select("id, customer_name, customer_photo, product_name, views, completed_views, last_viewed_at, is_published, is_featured")
        .order("views", { ascending: false });

      if (error) throw error;
      setStats(data || []);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetailedViews = async (testimonialId: string) => {
    try {
      const { data, error } = await supabase
        .from("story_views")
        .select("id, viewed_at, completed, view_duration")
        .eq("testimonial_id", testimonialId)
        .order("viewed_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setDetailedViews(data || []);
    } catch (error) {
      console.error("Error fetching detailed views:", error);
    }
  };

  const handleRowClick = (testimonialId: string) => {
    if (selectedTestimonial === testimonialId) {
      setSelectedTestimonial(null);
      setDetailedViews([]);
    } else {
      setSelectedTestimonial(testimonialId);
      fetchDetailedViews(testimonialId);
    }
  };

  const totalViews = stats.reduce((sum, stat) => sum + stat.views, 0);
  const totalCompletedViews = stats.reduce((sum, stat) => sum + stat.completed_views, 0);
  const avgCompletionRate = totalViews > 0 ? ((totalCompletedViews / totalViews) * 100).toFixed(1) : 0;

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all testimonials
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Views</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCompletedViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Stories watched fully
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgCompletionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Average across all stories
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats Table */}
      <Card>
        <CardHeader>
          <CardTitle>Testimonial Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-center">Views</TableHead>
                  <TableHead className="text-center">Completed</TableHead>
                  <TableHead className="text-center">Completion %</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Viewed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.map((stat) => {
                  const completionRate = stat.views > 0 ? ((stat.completed_views / stat.views) * 100).toFixed(0) : 0;
                  return (
                    <>
                      <TableRow 
                        key={stat.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleRowClick(stat.id)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <img 
                              src={stat.customer_photo} 
                              alt={stat.customer_name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <span className="font-medium">{stat.customer_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{stat.product_name || "-"}</TableCell>
                        <TableCell className="text-center font-semibold">{stat.views}</TableCell>
                        <TableCell className="text-center">{stat.completed_views}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={Number(completionRate) > 70 ? "default" : "secondary"}>
                            {completionRate}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {stat.is_published && <Badge variant="outline">Published</Badge>}
                            {stat.is_featured && <Badge>Featured</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          {stat.last_viewed_at ? (
                            <span className="text-xs text-muted-foreground">
                              {new Date(stat.last_viewed_at).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Never</span>
                          )}
                        </TableCell>
                      </TableRow>
                      
                      {/* Detailed Views Expansion */}
                      {selectedTestimonial === stat.id && detailedViews.length > 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-muted/30 p-4">
                            <div className="space-y-2">
                              <h4 className="font-semibold text-sm flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Recent Views (Last 50)
                              </h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {detailedViews.map((view) => (
                                  <div key={view.id} className="text-xs bg-background p-2 rounded border">
                                    <div className="font-medium">
                                      {new Date(view.viewed_at).toLocaleString()}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant={view.completed ? "default" : "secondary"} className="text-xs">
                                        {view.completed ? "Completed" : "Partial"}
                                      </Badge>
                                      {view.view_duration && (
                                        <span className="text-muted-foreground">
                                          {(view.view_duration / 1000).toFixed(1)}s
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestimonialAnalytics;
