import { cn } from '@/lib/utils';
import { OrderStatus, STATUS_LABELS } from '@/types/order';
import { Droplets, Wind, Sparkles, Package, CheckCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const statusIcons: Record<OrderStatus, React.ReactNode> = {
  received: <Package className="w-3.5 h-3.5" />,
  washing: <Droplets className="w-3.5 h-3.5" />,
  ironing: <Wind className="w-3.5 h-3.5" />,
  ready: <Sparkles className="w-3.5 h-3.5" />,
  delivered: <CheckCircle className="w-3.5 h-3.5" />,
};

const statusColors: Record<OrderStatus, string> = {
  received: 'bg-status-received text-primary-foreground',
  washing: 'bg-status-washing text-primary-foreground',
  ironing: 'bg-status-ironing text-primary-foreground',
  ready: 'bg-status-ready text-primary-foreground',
  delivered: 'bg-status-delivered text-primary-foreground',
};

export const StatusBadge = ({ status, size = 'md', showIcon = true }: StatusBadgeProps) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium transition-all',
        statusColors[status],
        sizeClasses[size]
      )}
    >
      {showIcon && statusIcons[status]}
      {STATUS_LABELS[status]}
    </span>
  );
};
