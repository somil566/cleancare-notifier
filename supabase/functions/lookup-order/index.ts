import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  console.log("Order lookup function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();

    // Validate orderId format - must be alphanumeric with hyphens, 8-20 chars
    if (!orderId || typeof orderId !== "string") {
      return new Response(JSON.stringify({ error: "Order ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sanitizedOrderId = orderId.trim().toUpperCase();
    
    // Validate format to prevent injection
    const orderIdRegex = /^[A-Z0-9-]{4,20}$/;
    if (!orderIdRegex.test(sanitizedOrderId)) {
      return new Response(JSON.stringify({ error: "Invalid order ID format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to bypass RLS for this specific lookup
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: order, error } = await supabaseClient
      .from("orders")
      .select("order_id, customer_name, items, status, timestamps, created_at")
      .eq("order_id", sanitizedOrderId)
      .single();

    if (error || !order) {
      console.log("Order not found:", sanitizedOrderId);
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return only necessary fields - exclude phone for privacy
    const safeOrder = {
      orderId: order.order_id,
      customerName: order.customer_name,
      items: order.items,
      status: order.status,
      timestamps: order.timestamps,
      createdAt: order.created_at,
    };

    console.log("Order found:", sanitizedOrderId);

    return new Response(JSON.stringify({ order: safeOrder }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error looking up order:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
