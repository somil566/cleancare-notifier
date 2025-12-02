import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Phone, Shirt, Plus, Sparkles } from 'lucide-react';
import { Order } from '@/types/order';
import { QRCodeSVG } from 'qrcode.react';

interface OrderFormProps {
  onSubmit: (customerName: string, phone: string, items: number) => Order;
}

export const OrderForm = ({ onSubmit }: OrderFormProps) => {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [items, setItems] = useState('');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerName.trim() || !phone.trim() || !items) return;

    const order = onSubmit(customerName.trim(), phone.trim(), parseInt(items));
    setCreatedOrder(order);
    
    // Reset form
    setCustomerName('');
    setPhone('');
    setItems('');
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="border-border/50 bg-gradient-to-b from-card to-card/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            New Order Entry
          </CardTitle>
          <CardDescription>
            Enter customer details to create a new laundry order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerName" className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                Customer Name
              </Label>
              <Input
                id="customerName"
                placeholder="Enter customer name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                maxLength={100}
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                Mobile Number
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                maxLength={20}
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="items" className="flex items-center gap-2">
                <Shirt className="w-4 h-4 text-muted-foreground" />
                Number of Items
              </Label>
              <Input
                id="items"
                type="number"
                min="1"
                placeholder="Enter number of clothes"
                value={items}
                onChange={(e) => setItems(e.target.value)}
                required
                className="bg-background/50"
              />
            </div>

            <Button type="submit" className="w-full gap-2" size="lg">
              <Sparkles className="w-4 h-4" />
              Create Order
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Created Order Preview */}
      {createdOrder && (
        <Card className="border-primary/30 bg-gradient-to-br from-accent/50 to-card animate-fade-in">
          <CardHeader className="text-center">
            <CardTitle className="text-primary">Order Created!</CardTitle>
            <CardDescription>
              Show this QR code to the customer
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <div className="bg-card p-4 rounded-xl border border-border shadow-lg">
              <QRCodeSVG
                value={createdOrder.orderId}
                size={180}
                level="H"
                bgColor="transparent"
                fgColor="hsl(var(--foreground))"
                includeMargin
              />
            </div>
            
            <div className="text-center space-y-1">
              <p className="font-mono text-xl font-bold text-primary">
                {createdOrder.orderId}
              </p>
              <p className="text-sm text-muted-foreground">
                {createdOrder.customerName} • {createdOrder.items} items
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
