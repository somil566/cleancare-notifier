import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { OrderCard } from '@/components/OrderCard';
import { StatsCards } from '@/components/StatsCards';
import { useOrders } from '@/hooks/useOrders';
import { OrderStatus, STATUS_LABELS, STATUS_ORDER } from '@/types/order';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Filter, LayoutGrid, List, Package, Download, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportOrdersToCSV } from '@/lib/exportToExcel';
import { toast } from '@/hooks/use-toast';

const Admin = () => {
  const { orders, updateOrderStatus, deleteOrder, getOrdersByStatus } = useOrders();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
            Export to Excel
          </Button>
        </div>

        {/* Real-time indicator */}
        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
          <RefreshCw className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
          <span>Live updates enabled</span>
        </div>

        {/* Stats */}
        <div className="mb-8 animate-slide-in">
          <StatsCards orders={orders} />
        </div>

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
    </div>
  );
};

export default Admin;
