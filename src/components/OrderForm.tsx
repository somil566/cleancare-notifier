import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Phone, Shirt, Plus, Sparkles, Loader2, Printer } from 'lucide-react';
import { Order } from '@/types/order';
import { QRCodeSVG } from 'qrcode.react';
import { orderSchema } from '@/lib/validations/order';
import { printQRCode } from '@/components/PrintableQR';

interface OrderFormProps {
  onSubmit: (customerName: string, phone: string, items: number) => Promise<Order>;
}

export const OrderForm = ({ onSubmit }: OrderFormProps) => {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [items, setItems] = useState('');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ customerName?: string; phone?: string; items?: string }>({});

  const validateForm = () => {
    const result = orderSchema.safeParse({
      customerName: customerName.trim(),
      phone: phone.trim(),
      items: parseInt(items) || 0,
    });

    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof typeof errors;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const order = await onSubmit(customerName.trim(), phone.trim(), parseInt(items));
      setCreatedOrder(order);
      
      // Reset form
      setCustomerName('');
      setPhone('');
      setItems('');
      setErrors({});
    } catch (error) {
      console.error('Failed to create order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    if (createdOrder) {
      printQRCode(createdOrder);
    }
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
                className={`bg-background/50 ${errors.customerName ? 'border-destructive' : ''}`}
                disabled={isSubmitting}
              />
              {errors.customerName && (
                <p className="text-sm text-destructive">{errors.customerName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                Mobile Number
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter mobile number (e.g., +1234567890)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                maxLength={20}
                className={`bg-background/50 ${errors.phone ? 'border-destructive' : ''}`}
                disabled={isSubmitting}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone}</p>
              )}
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
                max="1000"
                placeholder="Enter number of clothes"
                value={items}
                onChange={(e) => setItems(e.target.value)}
                required
                className={`bg-background/50 ${errors.items ? 'border-destructive' : ''}`}
                disabled={isSubmitting}
              />
              {errors.items && (
                <p className="text-sm text-destructive">{errors.items}</p>
              )}
            </div>

            <Button type="submit" className="w-full gap-2" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {isSubmitting ? 'Creating...' : 'Create Order'}
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

            <Button onClick={handlePrint} variant="outline" className="gap-2">
              <Printer className="w-4 h-4" />
              Print Receipt
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
