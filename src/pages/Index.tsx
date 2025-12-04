import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { ProgressTracker } from '@/components/ProgressTracker';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrders } from '@/hooks/useOrders';
import { Search, Shirt, User, Phone, Calendar, AlertCircle, ShieldCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const Index = () => {
  const [searchId, setSearchId] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<ReturnType<typeof getOrderById> | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const { getOrderById } = useOrders();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    
    const order = getOrderById(searchId.trim());
    setSearchedOrder(order);
    setHasSearched(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/20">
      <Navbar />
      
      <main className="container px-4 py-8 md:py-12">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-4">
            <Shirt className="w-4 h-4" />
            Smart Laundry Tracking
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Track Your{' '}
            <span className="text-primary">Laundry Order</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Enter your order ID to see real-time updates on your clothes
          </p>
        </div>

        {/* Search Form */}
        <div className="max-w-lg mx-auto mb-12">
          <Card className="border-border/50 shadow-lg bg-gradient-to-b from-card to-card/80">
            <CardContent className="pt-6">
              <form onSubmit={handleSearch} className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Enter Order ID (e.g., LD-XXXXX)"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value.toUpperCase())}
                    className="pl-10 h-12 text-lg font-mono bg-background/50"
                  />
                </div>
                <Button type="submit" size="lg" className="h-12 px-6">
                  Track
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Search Results */}
        {hasSearched && (
          <div className="max-w-2xl mx-auto animate-fade-in">
            {searchedOrder ? (
              <Card className="border-border/50 shadow-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/30 pb-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="font-mono text-xl">
                          {searchedOrder.orderId}
                        </CardTitle>
                        <StatusBadge status={searchedOrder.status} />
                      </div>
                      <CardDescription className="text-base">
                        Order found! Here's the current status of your laundry.
                      </CardDescription>
                    </div>
                    <div className="bg-card p-2 rounded-lg border border-border shadow-sm">
                      <QRCodeSVG
                        value={searchedOrder.orderId}
                        size={70}
                        level="M"
                        bgColor="transparent"
                        fgColor="hsl(var(--foreground))"
                      />
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-6 space-y-6">
                  {/* Order Details */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground text-xs">Customer</p>
                        <p className="font-medium">{searchedOrder.customerName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground text-xs">Phone</p>
                        <p className="font-medium">{searchedOrder.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Shirt className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground text-xs">Items</p>
                        <p className="font-medium">{searchedOrder.items} pieces</p>
                      </div>
                    </div>
                  </div>

                  {/* Progress Tracker */}
                  <div className="pt-4 border-t border-border/50">
                    <h3 className="text-sm font-medium text-muted-foreground mb-6">
                      Order Progress
                    </h3>
                    <ProgressTracker
                      currentStatus={searchedOrder.status}
                      timestamps={searchedOrder.timestamps}
                    />
                  </div>

                  {/* Created Date */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-4 border-t border-border/50">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      Order placed:{' '}
                      {new Date(searchedOrder.createdAt).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-destructive/30 bg-destructive/5">
                <CardContent className="py-8">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                      <AlertCircle className="w-8 h-8 text-destructive" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Order Not Found
                    </h3>
                    <p className="text-muted-foreground max-w-sm">
                      We couldn't find an order with ID "{searchId}". Please check the ID and try again.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Staff Login Link */}
        <div className="text-center mt-12 pt-8 border-t border-border/50">
          <Link to="/auth">
            <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
              <ShieldCheck className="w-4 h-4" />
              Staff Portal
            </Button>
          </Link>
        </div>

        {/* Features Section */}
        {!hasSearched && (
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto animate-slide-in">
            {[
              {
                icon: <Search className="w-6 h-6" />,
                title: 'Real-Time Tracking',
                description: 'Track your order status from received to delivered',
              },
              {
                icon: <Shirt className="w-6 h-6" />,
                title: 'Smart Notifications',
                description: 'Get instant updates when your laundry status changes',
              },
              {
                icon: <Calendar className="w-6 h-6" />,
                title: 'Order History',
                description: 'View complete timeline of your laundry journey',
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className="group border-border/50 hover:border-primary/30 transition-all hover:shadow-lg"
              >
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
