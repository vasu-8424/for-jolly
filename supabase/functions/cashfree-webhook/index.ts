import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import * as crypto from "https://deno.land/std@0.168.0/crypto/mod.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function verifySignature(payload: string, timestamp: string, signature: string, secretKey: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(timestamp + payload);
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secretKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  
  const hmac = await crypto.subtle.sign("HMAC", key, data);
  const generatedSignature = base64Encode(new Uint8Array(hmac));
  return generatedSignature === signature;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    const timestamp = req.headers.get('x-webhook-timestamp') || '';
    const signature = req.headers.get('x-webhook-signature') || '';
    const cashfreeSecretKey = Deno.env.get('CASHFREE_SECRET_KEY') || '';

    const isValid = await verifySignature(rawBody, timestamp, signature, cashfreeSecretKey);

    if (!isValid) {
      return new Response('Invalid Signature', { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { order, payment } = payload.data;
    const orderId = order.order_id;
    const paymentStatus = payment.payment_status; // e.g. SUCCESS, FAILED
    
    let appStatus = 'Pending';
    if (paymentStatus === 'SUCCESS') appStatus = 'Paid';
    if (paymentStatus === 'FAILED') appStatus = 'Failed';

    await supabase.from('payment_logs').insert({
      order_id: orderId,
      action: 'WEBHOOK_RECEIVED',
      response_data: payload
    });

    await supabase.from('payments')
      .update({ 
        status: appStatus,
        transaction_id: payment.cf_payment_id?.toString(),
        updated_at: new Date().toISOString()
      })
      .eq('gateway_order_id', order.cf_order_id);

    if (appStatus === 'Paid') {
      await supabase.from('orders')
        .update({ payment_status: 'Paid', status: 'Pending' })
        .eq('order_number', orderId);
        
      // TODO: Call Resend API to send email
    }

    return new Response(JSON.stringify({ status: 'OK' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
