export type OrderStatus = 'received' | 'washing' | 'ironing' | 'ready' | 'delivered';

export interface OrderTimestamp {
  status: OrderStatus;
  timestamp: string;
}

export interface Order {
  orderId: string;
  customerName: string;
  phone: string;
  items: number;
  status: OrderStatus;
  timestamps: OrderTimestamp[];
  createdAt: string;
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  received: 'Received',
  washing: 'Washing',
  ironing: 'Ironing',
  ready: 'Ready for Pickup',
  delivered: 'Delivered',
};

export const STATUS_ORDER: OrderStatus[] = ['received', 'washing', 'ironing', 'ready', 'delivered'];

export const STATUS_MESSAGES: Record<OrderStatus, string> = {
  received: 'Your order has been received!',
  washing: 'Your clothes are being washed',
  ironing: 'Your clothes are being ironed',
  ready: 'Your clothes are ready for pickup!',
  delivered: 'Your order has been delivered',
};
