import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressTracker } from "@/components/ProgressTracker";
import { StatusBadge } from "@/components/StatusBadge";
import { Search, Package, Phone, User, Calendar, Shirt } from "lucide-react";
import type { Order, OrderStatus, OrderTimestamp } from "@/types/order";

export default function TrackOrder() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [orderId, setOrderId] = useState(searchParams.get("id") || "");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      setOrderId(id);
      searchOrder(id);
    }
  }, [searchParams]);

  const searchOrder = async (id?: string) => {
    const searchId = id || orderId.trim();
    if (!searchId) {
      setError("Please enter an order ID");
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const { data, error: fetchError } = await supabase
        .from("orders")
        .select("*")
        .eq("order_id", searchId.toUpperCase())
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (!data) {
        setError("Order not found. Please check your order ID and try again.");
        setOrder(null);
      } else {
        // Map database fields to Order type
        const mappedOrder: Order = {
          orderId: data.order_id,
          customerName: data.customer_name,
          phone: data.phone,
          items: data.items,
          status: data.status as OrderStatus,
          timestamps: data.timestamps as unknown as OrderTimestamp[],
          createdAt: data.created_at,
        };
        setOrder(mappedOrder);
        // Update URL with order ID for sharing
        navigate(`/track?id=${searchId.toUpperCase()}`, { replace: true });
      }
    } catch (err) {
      console.error("Error fetching order:", err);
      setError("Something went wrong. Please try again.");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchOrder();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Package className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Track Your Order</h1>
          <p className="text-muted-foreground">
            Enter your order ID to check the status of your laundry
          </p>
        </div>

        {/* Search Form */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Enter Order ID (e.g., LD-XXXXXXXX-XXXX)"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Searching..." : "Track"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && searched && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <p className="text-destructive text-center">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Order Details */}
        {order && (
          <div className="space-y-6 animate-in fade-in-50 duration-500">
            {/* Status Card */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardDescription>Order ID</CardDescription>
                    <CardTitle className="text-xl font-mono">{order.orderId}</CardTitle>
                  </div>
                  <StatusBadge status={order.status as OrderStatus} />
                </div>
              </CardHeader>
              <CardContent>
                <ProgressTracker 
                  currentStatus={order.status} 
                  timestamps={order.timestamps} 
                />
              </CardContent>
            </Card>

            {/* Order Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Customer Name</p>
                    <p className="font-medium">{order.customerName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{order.phone.replace(/(\d{3})(\d{3})(\d+)/, "$1-$2-$3")}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shirt className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Items</p>
                    <p className="font-medium">{order.items} piece{order.items !== 1 ? 's' : ''}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Order Placed</p>
                    <p className="font-medium">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Help Text */}
            <p className="text-center text-sm text-muted-foreground">
              Questions about your order? Contact us with your order ID.
            </p>
          </div>
        )}

        {/* Empty State */}
        {!order && !error && !searched && (
          <Card className="border-dashed">
            <CardContent className="pt-6 pb-8 text-center">
              <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                Enter your order ID above to see your laundry status
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
