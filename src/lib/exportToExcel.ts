import { Order, STATUS_LABELS } from '@/types/order';
import { format } from 'date-fns';

export const exportOrdersToCSV = (orders: Order[]) => {
  const headers = ['Order ID', 'Customer Name', 'Phone', 'Items', 'Status', 'Created At', 'Last Updated'];
  
  const rows = orders.map(order => {
    const lastUpdate = order.timestamps.length > 0 
      ? format(new Date(order.timestamps[order.timestamps.length - 1].timestamp), 'yyyy-MM-dd HH:mm:ss')
      : '';
    
    return [
      order.orderId,
      order.customerName,
      order.phone,
      order.items.toString(),
      STATUS_LABELS[order.status],
      format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm:ss'),
      lastUpdate,
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `orders_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
