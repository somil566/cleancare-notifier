import { Order, STATUS_LABELS } from '@/types/order';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';

interface PrintableQRProps {
  order: Order;
}

export const PrintableQR = ({ order }: PrintableQRProps) => {
  const trackingUrl = `${window.location.origin}/track?id=${order.orderId}`;
  
  return (
    <div className="print-content p-8 bg-white text-black" style={{ width: '300px' }}>
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold">Smart Laundry</h2>
        <p className="text-sm text-gray-600">Order Receipt</p>
      </div>
      
      <div className="flex justify-center mb-4">
        <QRCodeSVG
          value={trackingUrl}
          size={150}
          level="H"
          bgColor="white"
          fgColor="black"
          includeMargin
        />
      </div>
      
      <div className="text-center mb-4">
        <p className="font-mono text-lg font-bold">{order.orderId}</p>
      </div>
      
      <div className="border-t border-b border-gray-300 py-3 my-3 space-y-1 text-sm">
        <p><span className="font-semibold">Customer:</span> {order.customerName}</p>
        <p><span className="font-semibold">Phone:</span> {order.phone}</p>
        <p><span className="font-semibold">Items:</span> {order.items}</p>
        <p><span className="font-semibold">Status:</span> {STATUS_LABELS[order.status]}</p>
        <p><span className="font-semibold">Date:</span> {format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm')}</p>
      </div>
      
      <div className="text-center text-xs text-gray-500">
        <p>Scan QR code to track your order</p>
        <p>Thank you for choosing us!</p>
      </div>
    </div>
  );
};

export const printQRCode = (order: Order) => {
  const trackingUrl = `${window.location.origin}/track?id=${order.orderId}`;
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const content = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Order ${order.orderId}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          display: flex;
          justify-content: center;
        }
        .receipt {
          width: 300px;
          padding: 20px;
          border: 1px solid #ccc;
        }
        .header {
          text-align: center;
          margin-bottom: 15px;
        }
        .header h2 {
          margin: 0;
          font-size: 20px;
        }
        .header p {
          margin: 5px 0 0;
          color: #666;
          font-size: 12px;
        }
        .qr-container {
          display: flex;
          justify-content: center;
          margin: 15px 0;
        }
        .order-id {
          text-align: center;
          font-family: monospace;
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 15px;
        }
        .details {
          border-top: 1px solid #ddd;
          border-bottom: 1px solid #ddd;
          padding: 10px 0;
          margin: 10px 0;
          font-size: 13px;
        }
        .details p {
          margin: 5px 0;
        }
        .details span {
          font-weight: bold;
        }
        .footer {
          text-align: center;
          font-size: 11px;
          color: #888;
        }
        @media print {
          body { padding: 0; }
          .receipt { border: none; }
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <h2>Smart Laundry</h2>
          <p>Order Receipt</p>
        </div>
        <div class="qr-container">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(trackingUrl)}" alt="QR Code" />
        </div>
        <div class="order-id">${order.orderId}</div>
        <div class="details">
          <p><span>Customer:</span> ${order.customerName}</p>
          <p><span>Phone:</span> ${order.phone}</p>
          <p><span>Items:</span> ${order.items}</p>
          <p><span>Status:</span> ${STATUS_LABELS[order.status]}</p>
          <p><span>Date:</span> ${format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm')}</p>
        </div>
        <div class="footer">
          <p>Scan QR code to track your order</p>
          <p>Thank you for choosing us!</p>
        </div>
      </div>
      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() { window.close(); }
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(content);
  printWindow.document.close();
};
