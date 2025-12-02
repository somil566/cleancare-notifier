import { Order, OrderStatus, STATUS_LABELS } from '@/types/order';
import { Card, CardContent } from '@/components/ui/card';
import { Package, Droplets, Wind, Sparkles, CheckCircle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardsProps {
  orders: Order[];
}

const statConfig: { status: OrderStatus; icon: React.ReactNode; color: string }[] = [
  { status: 'received', icon: <Package className="w-5 h-5" />, color: 'text-status-received' },
  { status: 'washing', icon: <Droplets className="w-5 h-5" />, color: 'text-status-washing' },
  { status: 'ironing', icon: <Wind className="w-5 h-5" />, color: 'text-status-ironing' },
  { status: 'ready', icon: <Sparkles className="w-5 h-5" />, color: 'text-status-ready' },
  { status: 'delivered', icon: <CheckCircle className="w-5 h-5" />, color: 'text-status-delivered' },
];

export const StatsCards = ({ orders }: StatsCardsProps) => {
  const getCount = (status: OrderStatus) => orders.filter((o) => o.status === status).length;
  const totalItems = orders.reduce((sum, o) => sum + o.items, 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {/* Total Orders Card */}
      <Card className="col-span-2 md:col-span-1 border-primary/30 bg-gradient-to-br from-primary/10 to-accent/30">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold text-foreground">{orders.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                <TrendingUp className="w-3 h-3 inline mr-1" />
                {totalItems} items
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Package className="w-6 h-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Cards */}
      {statConfig.map(({ status, icon, color }) => (
        <Card
          key={status}
          className="border-border/50 hover:border-border transition-colors"
        >
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {STATUS_LABELS[status]}
                </p>
                <p className="text-2xl font-bold text-foreground">{getCount(status)}</p>
              </div>
              <div className={cn('w-10 h-10 rounded-full bg-muted flex items-center justify-center', color)}>
                {icon}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
