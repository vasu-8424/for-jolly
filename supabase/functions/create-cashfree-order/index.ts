import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { order_id, order_amount, customer_id, customer_phone, customer_email, customer_name } = await req.json();
    
    if (!order_id || !order_amount) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cashfreeAppId = Deno.env.get('CASHFREE_APP_ID');
    const cashfreeSecretKey = Deno.env.get('CASHFREE_SECRET_KEY');
    const cashfreeEnv = Deno.env.get('CASHFREE_ENV') || 'SANDBOX';
    
    const baseUrl = cashfreeEnv === 'PRODUCTION' 
      ? 'https://api.cashfree.com/pg/orders' 
      : 'https://sandbox.cashfree.com/pg/orders';

    const orderData = {
      order_id: order_id,
      order_amount: order_amount,
      order_currency: "INR",
      customer_details: {
        customer_id: customer_id,
        customer_name: customer_name || 'Customer',
        customer_email: customer_email || 'test@test.com',
        customer_phone: customer_phone || '9999999999'
      },
      order_meta: {
        return_url: `https://example.com/return?order_id=${order_id}`
      }
    };

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': cashfreeAppId!,
        'x-client-secret': cashfreeSecretKey!,
        'x-api-version': '2022-09-01',
      },
      body: JSON.stringify(orderData)
    });

    const data = await response.json();
    
    if (data.payment_session_id) {
      // Log payment creation attempt
      await supabase.from('payment_logs').insert({
        order_id: order_id,
        action: 'ORDER_CREATED',
        response_data: data
      });

      return new Response(JSON.stringify({ payment_session_id: data.payment_session_id, cf_order_id: data.cf_order_id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      throw new Error(data.message || 'Failed to create order');
    }
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
