import { Navbar } from '@/components/Navbar';
import { OrderForm } from '@/components/OrderForm';
import { useOrders } from '@/hooks/useOrders';

const NewOrder = () => {
  const { addOrder } = useOrders();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/20">
      <Navbar />
      
      <main className="container px-4 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground mb-2">Create New Order</h1>
          <p className="text-muted-foreground">
            Enter customer details to register a new laundry order
          </p>
        </div>

        {/* Order Form */}
        <div className="animate-slide-in">
          <OrderForm onSubmit={addOrder} />
        </div>
      </main>
    </div>
  );
};

export default NewOrder;
