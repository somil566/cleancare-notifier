import { cn } from '@/lib/utils';
import { OrderStatus, STATUS_ORDER, STATUS_LABELS } from '@/types/order';
import { Check, Droplets, Wind, Sparkles, Package, CheckCircle } from 'lucide-react';

interface ProgressTrackerProps {
  currentStatus: OrderStatus;
  timestamps?: { status: OrderStatus; timestamp: string }[];
}

const statusIcons: Record<OrderStatus, React.ReactNode> = {
  received: <Package className="w-5 h-5" />,
  washing: <Droplets className="w-5 h-5" />,
  ironing: <Wind className="w-5 h-5" />,
  ready: <Sparkles className="w-5 h-5" />,
  delivered: <CheckCircle className="w-5 h-5" />,
};

export const ProgressTracker = ({ currentStatus, timestamps = [] }: ProgressTrackerProps) => {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);

  const getTimestamp = (status: OrderStatus) => {
    const found = timestamps.find((t) => t.status === status);
    if (found) {
      return new Date(found.timestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return null;
  };

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="relative flex items-center justify-between mb-4">
        {/* Background Line */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-muted rounded-full" />
        
        {/* Progress Line */}
        <div
          className="absolute top-5 left-0 h-1 bg-primary rounded-full transition-all duration-500"
          style={{ width: `${(currentIndex / (STATUS_ORDER.length - 1)) * 100}%` }}
        />

        {/* Status Nodes */}
        {STATUS_ORDER.map((status, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const timestamp = getTimestamp(status);

          return (
            <div key={status} className="relative flex flex-col items-center z-10">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
                  isCompleted
                    ? 'bg-primary text-primary-foreground shadow-glow'
                    : 'bg-muted text-muted-foreground',
                  isCurrent && 'ring-4 ring-primary/20 animate-pulse-soft'
                )}
              >
                {isCompleted && index < currentIndex ? (
                  <Check className="w-5 h-5" />
                ) : (
                  statusIcons[status]
                )}
              </div>
              
              <div className="mt-2 text-center">
                <p
                  className={cn(
                    'text-xs font-medium',
                    isCompleted ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {STATUS_LABELS[status]}
                </p>
                {timestamp && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">{timestamp}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
