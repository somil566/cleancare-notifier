import { useState, useEffect, useCallback } from 'react';
import { Order, OrderStatus, STATUS_MESSAGES } from '@/types/order';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

const generateOrderId = (): string => {
  const prefix = 'LD';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

interface DbOrder {
  id: string;
  order_id: string;
  customer_name: string;
  phone: string;
  items: number;
  status: string;
  timestamps: Json;
  created_at: string;
}

const mapDbToOrder = (dbOrder: DbOrder): Order => ({
  orderId: dbOrder.order_id,
  customerName: dbOrder.customer_name,
  phone: dbOrder.phone,
  items: dbOrder.items,
  status: dbOrder.status as OrderStatus,
  timestamps: (dbOrder.timestamps as unknown as { status: OrderStatus; timestamp: string }[]) || [],
  createdAt: dbOrder.created_at,
});

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load orders from database
  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load orders',
        variant: 'destructive',
      });
      return;
    }

    if (data) {
      setOrders(data.map((d) => mapDbToOrder(d as DbOrder)));
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const addOrder = useCallback(async (customerName: string, phone: string, items: number): Promise<Order> => {
    const orderId = generateOrderId();
    const timestamps = [{ status: 'received', timestamp: new Date().toISOString() }];

    const { data, error } = await supabase
      .from('orders')
      .insert({
        order_id: orderId,
        customer_name: customerName,
        phone: phone,
        items: items,
        status: 'received',
        timestamps: timestamps as unknown as Json,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create order:', error);
      toast({
        title: 'Error',
        description: 'Failed to create order',
        variant: 'destructive',
      });
      throw error;
    }

    const newOrder = mapDbToOrder(data as DbOrder);
    setOrders((prev) => [newOrder, ...prev]);
    
    toast({
      title: 'Order Created!',
      description: `Order ${newOrder.orderId} has been created successfully.`,
    });

    return newOrder;
  }, []);

  const updateOrderStatus = useCallback(async (orderId: string, newStatus: OrderStatus) => {
    const order = orders.find(o => o.orderId === orderId);
    if (!order) return;

    const newTimestamp = { status: newStatus, timestamp: new Date().toISOString() };
    const updatedTimestamps = [...order.timestamps, newTimestamp];

    const { error } = await supabase
      .from('orders')
      .update({
        status: newStatus,
        timestamps: updatedTimestamps as unknown as Json,
      })
      .eq('order_id', orderId);

    if (error) {
      console.error('Failed to update order:', error);
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive',
      });
      return;
    }

    setOrders((prev) =>
      prev.map((o) => {
        if (o.orderId === orderId) {
          return {
            ...o,
            status: newStatus,
            timestamps: updatedTimestamps as { status: OrderStatus; timestamp: string }[],
          };
        }
        return o;
      })
    );

    toast({
      title: 'Status Updated',
      description: STATUS_MESSAGES[newStatus],
    });
  }, [orders]);

  const deleteOrder = useCallback(async (orderId: string) => {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('order_id', orderId);

    if (error) {
      console.error('Failed to delete order:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete order',
        variant: 'destructive',
      });
      return;
    }

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
