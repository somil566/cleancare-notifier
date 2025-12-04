import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  phone: string;
  customerName: string;
  orderId: string;
  status: string;
  statusMessage: string;
  channel: 'sms' | 'whatsapp' | 'both';
}

const STATUS_EMOJIS: Record<string, string> = {
  received: '📥',
  washing: '🧺',
  ironing: '👔',
  ready: '✅',
  delivered: '🎉',
};

// Input validation functions
function isValidPhone(phone: string): boolean {
  // Allow international format with optional + and spaces/dashes
  const phoneRegex = /^[+]?[\d\s-]{7,20}$/;
  return phoneRegex.test(phone.trim());
}

function isValidCustomerName(name: string): boolean {
  // Name should be 1-100 chars, no script tags or special chars
  const sanitized = name.trim();
  if (sanitized.length < 1 || sanitized.length > 100) return false;
  // Block potential XSS/injection patterns
  const dangerousPatterns = /<script|javascript:|on\w+=/i;
  return !dangerousPatterns.test(sanitized);
}

function isValidOrderId(orderId: string): boolean {
  // Order IDs should match format like LD-XXXXXXXX-XXXX
  const orderIdRegex = /^LD-[A-Z0-9]{8}-[A-Z0-9]{4}$/;
  return orderIdRegex.test(orderId);
}

function isValidStatus(status: string): boolean {
  const validStatuses = ['received', 'washing', 'ironing', 'ready', 'delivered'];
  return validStatuses.includes(status);
}

function isValidChannel(channel: string): boolean {
  return ['sms', 'whatsapp', 'both'].includes(channel);
}

function sanitizeMessage(text: string): string {
  // Remove any potential injection characters
  return text.replace(/[<>]/g, '').trim().substring(0, 500);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the user is authenticated and has staff/admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Extract JWT token from Authorization header
    const jwt = authHeader.replace('Bearer ', '');
    
    // Use service role client to verify the user
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authenticated user from the JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user has staff or admin role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['staff', 'admin']);

    if (roleError || !roleData || roleData.length === 0) {
      console.error("User does not have required role:", roleError);
      return new Response(
        JSON.stringify({ error: "Forbidden: Staff or Admin role required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: NotificationRequest = await req.json();
    const { phone, customerName, orderId, status, statusMessage, channel } = body;

    // Validate all inputs
    const validationErrors: string[] = [];

    if (!phone || !isValidPhone(phone)) {
      validationErrors.push("Invalid phone number format");
    }
    if (!customerName || !isValidCustomerName(customerName)) {
      validationErrors.push("Invalid customer name");
    }
    if (!orderId || !isValidOrderId(orderId)) {
      validationErrors.push("Invalid order ID format");
    }
    if (!status || !isValidStatus(status)) {
      validationErrors.push("Invalid status");
    }
    if (!channel || !isValidChannel(channel)) {
      validationErrors.push("Invalid channel");
    }

    if (validationErrors.length > 0) {
      console.error("Validation errors:", validationErrors);
      return new Response(
        JSON.stringify({ error: "Validation failed", details: validationErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the order exists
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('order_id')
      .eq('order_id', orderId)
      .single();

    if (orderError || !orderData) {
      console.error("Order not found:", orderId);
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending ${channel} notification to ${phone} for order ${orderId} by user ${user.id}`);

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");
    const twilioWhatsApp = Deno.env.get("TWILIO_WHATSAPP_NUMBER");

    if (!accountSid || !authToken) {
      throw new Error("Twilio credentials not configured");
    }

    const emoji = STATUS_EMOJIS[status] || '📋';
    const sanitizedName = sanitizeMessage(customerName);
    const sanitizedStatusMsg = sanitizeMessage(statusMessage);
    const message = `${emoji} Smart Laundry Update\n\nHi ${sanitizedName}!\n\n${sanitizedStatusMsg}\n\nOrder ID: ${orderId}\n\nTrack your order anytime!`;

    const results: { sms?: boolean; whatsapp?: boolean } = {};

    // Send SMS
    if ((channel === 'sms' || channel === 'both') && twilioPhone) {
      try {
        const smsResponse = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              "Authorization": `Basic ${btoa(`${accountSid}:${authToken}`)}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              To: phone.trim(),
              From: twilioPhone,
              Body: message,
            }),
          }
        );

        const smsData = await smsResponse.json();
        console.log("SMS response:", smsData);
        results.sms = smsResponse.ok;
      } catch (error) {
        console.error("SMS error:", error);
        results.sms = false;
      }
    }

    // Send WhatsApp
    if ((channel === 'whatsapp' || channel === 'both') && twilioWhatsApp) {
      try {
        const whatsappResponse = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              "Authorization": `Basic ${btoa(`${accountSid}:${authToken}`)}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              To: `whatsapp:${phone.trim()}`,
              From: `whatsapp:${twilioWhatsApp}`,
              Body: message,
            }),
          }
        );

        const waData = await whatsappResponse.json();
        console.log("WhatsApp response:", waData);
        results.whatsapp = whatsappResponse.ok;
      } catch (error) {
        console.error("WhatsApp error:", error);
        results.whatsapp = false;
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in send-notification:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
