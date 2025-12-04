import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { OrderCard } from '@/components/OrderCard';
import { StatsCards } from '@/components/StatsCards';
import { DashboardAnalytics } from '@/components/DashboardAnalytics';
import { QRScanner } from '@/components/QRScanner';
import { useOrders } from '@/hooks/useOrders';
import { useAuth } from '@/hooks/useAuth';
import { OrderStatus, STATUS_LABELS, STATUS_ORDER } from '@/types/order';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Filter, LayoutGrid, List, Package, Download, RefreshCw, LogOut, Shield, User, Users, ScanLine, BarChart3, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportOrdersToCSV } from '@/lib/exportToExcel';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Admin = () => {
  const { orders, updateOrderStatus, deleteOrder, getOrdersByStatus, getOrderById } = useOrders();
  const { user, isAdmin, signOut } = useAuth();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showScanner, setShowScanner] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleQRScan = (orderId: string) => {
    setShowScanner(false);
    const order = getOrderById(orderId);
    if (order) {
      setSearchQuery(orderId);
      setStatusFilter('all');
      toast({ title: 'Order Found', description: `Found order ${orderId}` });
    } else {
      toast({ title: 'Order Not Found', description: `No order with ID ${orderId}`, variant: 'destructive' });
    }
  };

  const filteredOrders = getOrdersByStatus(statusFilter).filter(
    (order) =>
      order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.phone.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/20">
      <Navbar />
      
      <main className="container px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage all laundry orders and track their progress
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground border border-border rounded-lg px-3 py-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">{user?.email}</span>
              <Badge variant={isAdmin ? 'default' : 'secondary'} className="text-xs">
                {isAdmin ? (
                  <>
                    <Shield className="w-3 h-3 mr-1" />
                    Admin
                  </>
                ) : (
                  'Staff'
                )}
              </Badge>
            </div>
            {isAdmin && (
              <>
                <Link to="/roles">
                  <Button variant="outline" className="gap-2">
                    <Users className="w-4 h-4" />
                    <span className="hidden sm:inline">Roles</span>
                  </Button>
                </Link>
                <Link to="/audit-logs">
                  <Button variant="outline" className="gap-2">
                    <History className="w-4 h-4" />
                    <span className="hidden sm:inline">Audit</span>
                  </Button>
                </Link>
              </>
            )}
            <Button 
              variant="outline" 
              onClick={() => {
                if (orders.length === 0) {
                  toast({ title: 'No Data', description: 'No orders to export', variant: 'destructive' });
                  return;
                }
                exportOrdersToCSV(orders);
                toast({ title: 'Export Successful', description: 'Orders exported to CSV file' });
              }} 
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button variant="outline" size="icon" onClick={handleSignOut} title="Sign Out">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Real-time indicator */}
        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
          <RefreshCw className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
          <span>Live updates enabled</span>
        </div>

        {/* Stats & Analytics Tabs */}
        <Tabs defaultValue="overview" className="mb-8 animate-slide-in">
          <TabsList className="mb-4">
            <TabsTrigger value="overview" className="gap-2">
              <Package className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <StatsCards orders={orders} />
          </TabsContent>
          <TabsContent value="analytics">
            <DashboardAnalytics orders={orders} />
          </TabsContent>
        </Tabs>

        {/* Filters and Controls */}
        <Card className="mb-6 border-border/50">
          <CardContent className="py-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-1 gap-4 w-full md:w-auto">
                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search orders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-background/50"
                  />
                </div>

                {/* QR Scanner Button */}
                <Button
                  variant="outline"
                  onClick={() => setShowScanner(true)}
                  className="gap-2"
                >
                  <ScanLine className="w-4 h-4" />
                  <span className="hidden sm:inline">Scan QR</span>
                </Button>

                {/* Status Filter */}
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as OrderStatus | 'all')}
                >
                  <SelectTrigger className="w-44 bg-background/50">
                    <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Orders</SelectItem>
                    {STATUS_ORDER.map((status) => (
                      <SelectItem key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'h-8 px-3',
                    viewMode === 'grid' && 'bg-background shadow-sm'
                  )}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'h-8 px-3',
                    viewMode === 'list' && 'bg-background shadow-sm'
                  )}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Grid/List */}
        {filteredOrders.length > 0 ? (
          <div
            className={cn(
              'gap-4 animate-fade-in',
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                : 'flex flex-col'
            )}
          >
            {filteredOrders.map((order, index) => (
              <div
                key={order.orderId}
                style={{ animationDelay: `${index * 50}ms` }}
                className="animate-fade-in"
              >
                <OrderCard
                  order={order}
                  onUpdateStatus={updateOrderStatus}
                  onDelete={deleteOrder}
                  compact={viewMode === 'list'}
                />
              </div>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-16">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Package className="w-8 h-8 text-muted-foreground" />
                </div>
                <CardTitle className="mb-2">No Orders Found</CardTitle>
                <CardDescription>
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria'
                    : 'Start by creating a new order from the New Order page'}
                </CardDescription>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />
      )}
    </div>
  );
};

export default Admin;
