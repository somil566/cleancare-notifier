import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, customerName, orderId, status, statusMessage, channel }: NotificationRequest = await req.json();

    console.log(`Sending ${channel} notification to ${phone} for order ${orderId}`);

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");
    const twilioWhatsApp = Deno.env.get("TWILIO_WHATSAPP_NUMBER");

    if (!accountSid || !authToken) {
      throw new Error("Twilio credentials not configured");
    }

    const emoji = STATUS_EMOJIS[status] || '📋';
    const message = `${emoji} Smart Laundry Update\n\nHi ${customerName}!\n\n${statusMessage}\n\nOrder ID: ${orderId}\n\nTrack your order anytime!`;

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
              To: phone,
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
              To: `whatsapp:${phone}`,
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
