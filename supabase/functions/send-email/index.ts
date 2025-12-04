import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  orderId: string;
  customerName: string;
  email: string;
  status: string;
}

const STATUS_MESSAGES: Record<string, { subject: string; message: string }> = {
  received: {
    subject: "Order Received - CleanCare Laundry",
    message: "Your laundry order has been received and is being processed.",
  },
  washing: {
    subject: "Order Update - Washing in Progress",
    message: "Great news! Your laundry is now being washed.",
  },
  ironing: {
    subject: "Order Update - Ironing in Progress", 
    message: "Your laundry has been washed and is now being ironed.",
  },
  ready: {
    subject: "Order Ready for Pickup!",
    message: "Your laundry is ready! Please visit our store to pick it up.",
  },
  delivered: {
    subject: "Order Delivered - Thank You!",
    message: "Your laundry has been delivered. Thank you for choosing CleanCare!",
  },
};

const STATUS_EMOJIS: Record<string, string> = {
  received: "📦",
  washing: "🧺",
  ironing: "👔",
  ready: "✅",
  delivered: "🚀",
};

serve(async (req: Request): Promise<Response> => {
  console.log("Email notification function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check user role
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["staff", "admin"]);

    if (!roleData || roleData.length === 0) {
      console.error("User does not have staff/admin role");
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: EmailRequest = await req.json();
    const { orderId, customerName, email, status } = body;

    console.log("Processing email for:", { orderId, customerName, email, status });

    // Validate inputs
    if (!orderId || !customerName || !email || !status) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const statusInfo = STATUS_MESSAGES[status] || STATUS_MESSAGES.received;
    const emoji = STATUS_EMOJIS[status] || "📋";

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "CleanCare Laundry <onboarding@resend.dev>",
        to: [email],
        subject: `${emoji} ${statusInfo.subject}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #14b8a6, #0d9488); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .status-badge { display: inline-block; padding: 8px 16px; background: #14b8a6; color: white; border-radius: 20px; font-weight: bold; }
              .order-id { font-size: 24px; font-weight: bold; color: #14b8a6; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>${emoji} CleanCare Laundry</h1>
              </div>
              <div class="content">
                <p>Hello <strong>${customerName}</strong>,</p>
                <p>${statusInfo.message}</p>
                <p><strong>Order ID:</strong> <span class="order-id">${orderId}</span></p>
                <p><strong>Status:</strong> <span class="status-badge">${status.charAt(0).toUpperCase() + status.slice(1)}</span></p>
                <p>Track your order anytime at our website.</p>
                <p>Thank you for choosing CleanCare!</p>
              </div>
              <div class="footer">
                <p>© 2024 CleanCare Laundry. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const emailData = await emailResponse.json();
    console.log("Email sent successfully:", emailData);

    if (!emailResponse.ok) {
      console.error("Resend API error:", emailData);
      return new Response(JSON.stringify({ error: emailData.message || "Failed to send email" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, data: emailData }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
