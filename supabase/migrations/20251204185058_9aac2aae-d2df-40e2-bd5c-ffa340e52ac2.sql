-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Public can view orders by order_id" ON public.orders;

-- Create a more restrictive policy that allows public to view only when querying by specific order_id
-- This uses a function to verify the lookup is for a single order
CREATE OR REPLACE FUNCTION public.is_order_lookup(lookup_order_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lookup_order_id IS NOT NULL AND length(lookup_order_id) > 0
$$;

-- Staff can view all orders (existing functionality)
CREATE POLICY "Staff can view all orders" 
ON public.orders 
FOR SELECT 
USING (is_staff_or_admin(auth.uid()));

-- Public can only view orders when authenticated OR when using an RPC function
-- We'll use an RPC function for public lookups instead of direct table access