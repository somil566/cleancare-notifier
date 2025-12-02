import { Order, OrderStatus, STATUS_ORDER } from '@/types/order';
import { StatusBadge } from './StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { User, Phone, Shirt, Clock, Trash2, ChevronRight } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';

interface OrderCardProps {
  order: Order;
  onUpdateStatus?: (orderId: string, status: OrderStatus) => void;
  onDelete?: (orderId: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

export const OrderCard = ({
  order,
  onUpdateStatus,
  onDelete,
  showActions = true,
  compact = false,
}: OrderCardProps) => {
  const currentIndex = STATUS_ORDER.indexOf(order.status);
  const canAdvance = currentIndex < STATUS_ORDER.length - 1;
  const nextStatus = canAdvance ? STATUS_ORDER[currentIndex + 1] : null;

  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Card className={cn(
      'group overflow-hidden transition-all duration-300 hover:shadow-lg border-border/50',
      'bg-gradient-to-b from-card to-card/80'
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm font-semibold text-primary">
                {order.orderId}
              </span>
              <StatusBadge status={order.status} size="sm" />
            </div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              {order.customerName}
            </h3>
          </div>
          
          {!compact && (
            <div className="bg-card p-2 rounded-lg border border-border shadow-sm">
              <QRCodeSVG
                value={order.orderId}
                size={60}
                level="M"
                bgColor="transparent"
                fgColor="hsl(var(--foreground))"
              />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="w-4 h-4" />
            <span>{order.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shirt className="w-4 h-4" />
            <span>{order.items} items</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/50">
          <Clock className="w-3.5 h-3.5" />
          <span>Created: {formattedDate}</span>
        </div>

        {showActions && (
          <div className="flex items-center gap-2 pt-2">
            {canAdvance && nextStatus && onUpdateStatus && (
              <Button
                size="sm"
                onClick={() => onUpdateStatus(order.orderId, nextStatus)}
                className="flex-1 gap-1"
              >
                Advance to {nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
            
            {onDelete && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(order.orderId)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
