import { useState, useEffect, useCallback } from 'react';
import { Order, OrderStatus, STATUS_MESSAGES } from '@/types/order';
import { toast } from '@/hooks/use-toast';

const STORAGE_KEY = 'laundry_orders';

const generateOrderId = (): string => {
  const prefix = 'LD';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load orders from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setOrders(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse orders:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save orders to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    }
  }, [orders, isLoaded]);

  const addOrder = useCallback((customerName: string, phone: string, items: number): Order => {
    const newOrder: Order = {
      orderId: generateOrderId(),
      customerName,
      phone,
      items,
      status: 'received',
      timestamps: [{ status: 'received', timestamp: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
    };

    setOrders((prev) => [newOrder, ...prev]);
    
    toast({
      title: 'Order Created!',
      description: `Order ${newOrder.orderId} has been created successfully.`,
    });

    return newOrder;
  }, []);

  const updateOrderStatus = useCallback((orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.orderId === orderId) {
          const newTimestamp = { status: newStatus, timestamp: new Date().toISOString() };
          return {
            ...order,
            status: newStatus,
            timestamps: [...order.timestamps, newTimestamp],
          };
        }
        return order;
      })
    );

    toast({
      title: 'Status Updated',
      description: STATUS_MESSAGES[newStatus],
    });
  }, []);

  const deleteOrder = useCallback((orderId: string) => {
    setOrders((prev) => prev.filter((order) => order.orderId !== orderId));
    
    toast({
      title: 'Order Deleted',
      description: `Order ${orderId} has been removed.`,
      variant: 'destructive',
    });
  }, []);

  const getOrderById = useCallback((orderId: string): Order | undefined => {
    return orders.find((order) => order.orderId.toLowerCase() === orderId.toLowerCase());
  }, [orders]);

  const getOrdersByStatus = useCallback((status: OrderStatus | 'all'): Order[] => {
    if (status === 'all') return orders;
    return orders.filter((order) => order.status === status);
  }, [orders]);

  return {
    orders,
    isLoaded,
    addOrder,
    updateOrderStatus,
    deleteOrder,
    getOrderById,
    getOrdersByStatus,
  };
};
