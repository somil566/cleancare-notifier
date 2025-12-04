-- Create a policy for public read access to orders (for customer tracking)
CREATE POLICY "Public can view orders by order_id"
ON public.orders
FOR SELECT
USING (true);

-- Drop the restrictive staff-only select policy to allow public reads
DROP POLICY IF EXISTS "Staff can view orders" ON public.orders;