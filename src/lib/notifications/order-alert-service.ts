import nodemailer from "nodemailer";
import { createAdminClient } from "@/lib/supabase/admin";

export interface OrderAlertPayload {
  order_id?: string;
  order_number: string;
  total_amount: number | string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  payment_method: string;
  delivery_address: string;
  delivery_slot?: string;
  delivery_otp?: string;
  google_maps_url?: string;
  items?: Array<{
    title?: string;
    name?: string;
    quantity?: number;
    price?: number;
    total_price?: number;
    selected_prep_option?: { name: string } | null;
    selected_extras?: Array<{ name: string }> | null;
  }>;
  owner_phone?: string;
}

export interface DispatchResult {
  supabase_notification: boolean;
  email_sent: boolean;
  sms_sent: boolean;
  whatsapp_sent: boolean;
  google_maps_url: string;
  whatsapp_chat_url: string;
  summary: string;
  errors: string[];
}

export async function dispatchOrderAlert(payload: OrderAlertPayload): Promise<DispatchResult> {
  const ownerPhone = payload.owner_phone || process.env.OWNER_PHONE || "9030982289";
  const ownerEmail = process.env.OWNER_EMAIL || "kakinadafresh@gmail.com";
  const errors: string[] = [];

  // 1. Format clean address & Google Maps navigation link
  const rawAddress = (payload.delivery_address || "").trim() || "Kakinada, Andhra Pradesh";
  const searchAddress = rawAddress.toLowerCase().includes("kakinada")
    ? rawAddress
    : `${rawAddress}, Kakinada, Andhra Pradesh`;

  const mapsUrl =
    payload.google_maps_url ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchAddress)}`;

  // 2. Format Items text
  const itemsText = Array.isArray(payload.items) && payload.items.length > 0
    ? payload.items
        .map((i) => {
          const prep = i.selected_prep_option?.name ? ` [${i.selected_prep_option.name}]` : "";
          const extras =
            Array.isArray(i.selected_extras) && i.selected_extras.length > 0
              ? ` (+${i.selected_extras.map((e) => e.name).join(", ")})`
              : "";
          return `• ${i.title || i.name || "Item"} x ${i.quantity || 1} - ₹${Number(i.total_price || i.price || 0).toFixed(0)}${prep}${extras}`;
        })
        .join("\n")
    : "Items attached in order summary";

  // 3. Compose Plaintext Alert
  const plainTextAlert = `🚨 NEW ORDER RECEIVED!
━━━━━━━━━━━━━━━━━━━━
Order #: ${payload.order_number}
Amount: ₹${Number(payload.total_amount).toFixed(2)}
Payment: ${payload.payment_method || "Cash on Delivery"}
Slot: ${payload.delivery_slot || "15-Min Express Delivery"}
OTP: ${payload.delivery_otp || "N/A"}

👤 CUSTOMER:
Name: ${payload.customer_name || "Customer"}
Phone: ${payload.customer_phone || "N/A"}

📍 DELIVERY ADDRESS:
${rawAddress}

🗺️ GOOGLE MAPS LINK:
${mapsUrl}

📦 ORDER ITEMS:
${itemsText}
━━━━━━━━━━━━━━━━━━━━
Store Owner Phone: ${ownerPhone}`;

  // 4. Generate WhatsApp Direct Click-to-Chat URL
  const whatsappChatUrl = `https://api.whatsapp.com/send?phone=91${ownerPhone.replace(/\D/g, "").slice(-10)}&text=${encodeURIComponent(plainTextAlert)}`;

  let supabaseNotificationSuccess = false;
  let emailSuccess = false;
  let smsSuccess = false;
  let whatsappSuccess = false;

  // --- CHANNEL 1: Supabase Database Notification ---
  try {
    const supabase = await createAdminClient();
    const { error: dbError } = await supabase.from("notifications").insert([
      {
        title: `🚨 New Order #${payload.order_number} (₹${Number(payload.total_amount).toFixed(0)})`,
        message: plainTextAlert,
        type: "Order",
        status: "Sent",
        is_read: false,
        deep_link: payload.order_id ? `/orders/${payload.order_id}` : `/orders`,
        created_at: new Date().toISOString(),
      },
    ]);

    if (!dbError) {
      supabaseNotificationSuccess = true;
    } else {
      errors.push(`Supabase notification table insert: ${dbError.message}`);
    }
  } catch (err: any) {
    errors.push(`Supabase notification: ${err?.message}`);
  }

  // --- CHANNEL 2: Direct Email via Nodemailer (SMTP / Gmail) ---
  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER || "kakinadafresh@gmail.com";
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD;

  if (smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: process.env.SMTP_SERVICE || (smtpUser.includes("@gmail.com") ? "gmail" : undefined),
        host: process.env.SMTP_HOST || (smtpUser.includes("@gmail.com") ? "smtp.gmail.com" : undefined),
        port: Number(process.env.SMTP_PORT) || 465,
        secure: process.env.SMTP_SECURE !== "false",
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const htmlContent = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <div style="background: linear-gradient(135deg, #15803d, #166534); color: #ffffff; padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">🚨 NEW ORDER RECEIVED!</h1>
            <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Order #${payload.order_number} • ₹${Number(payload.total_amount).toFixed(2)}</p>
          </div>
          
          <div style="padding: 24px;">
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 20px; border-left: 4px solid #16a34a;">
              <h3 style="margin: 0 0 8px 0; font-size: 15px; color: #0f172a;">📍 Delivery Address</h3>
              <p style="margin: 0 0 12px 0; font-size: 14px; color: #334155; line-height: 1.5;">${rawAddress}</p>
              
              <a href="${mapsUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 13px; padding: 10px 18px; border-radius: 6px;">
                🗺️ Open in Google Maps Navigation
              </a>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Customer Name:</td>
                <td style="padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right;">${payload.customer_name || "Customer"}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Customer Phone:</td>
                <td style="padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right;">
                  <a href="tel:${payload.customer_phone}" style="color: #16a34a; text-decoration: none;">${payload.customer_phone || "N/A"}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Payment Mode:</td>
                <td style="padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right;">${payload.payment_method || "COD"}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Delivery OTP:</td>
                <td style="padding: 8px 0; color: #16a34a; font-weight: 800; font-size: 16px; text-align: right;">${payload.delivery_otp || "N/A"}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Total Amount:</td>
                <td style="padding: 8px 0; color: #166534; font-weight: 900; font-size: 18px; text-align: right;">₹${Number(payload.total_amount).toFixed(2)}</td>
              </tr>
            </table>

            <div style="background-color: #f1f5f9; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
              <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #334155;">📦 Ordered Items:</h4>
              <pre style="margin: 0; font-family: inherit; font-size: 13px; color: #1e293b; white-space: pre-wrap; line-height: 1.6;">${itemsText}</pre>
            </div>

            <div style="text-align: center; margin-top: 24px;">
              <a href="${whatsappChatUrl}" target="_blank" style="display: inline-block; background-color: #22c55e; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 24px; border-radius: 8px;">
                💬 Open in WhatsApp
              </a>
            </div>
          </div>
          
          <div style="background-color: #f8fafc; padding: 12px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
            Kakinada Fresh Automated Store Order Dispatch System • Owner Contact: ${ownerPhone}
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: `"Kakinada Fresh Orders" <${smtpUser}>`,
        to: `${ownerEmail}, ${smtpUser}`,
        subject: `🚨 NEW ORDER #${payload.order_number} - ₹${Number(payload.total_amount).toFixed(0)} [${rawAddress.slice(0, 30)}]`,
        text: plainTextAlert,
        html: htmlContent,
      });

      emailSuccess = true;
    } catch (mailErr: any) {
      errors.push(`Nodemailer email error: ${mailErr?.message}`);
    }
  } else {
    // FormSubmit / Webhook fallback
    try {
      await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(ownerEmail)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Origin: "https://kakinadafresh.com",
          Referer: "https://kakinadafresh.com/",
        },
        body: JSON.stringify({
          _subject: `🚨 NEW ORDER #${payload.order_number} - ₹${Number(payload.total_amount).toFixed(0)}`,
          order_number: payload.order_number,
          amount: `₹${Number(payload.total_amount).toFixed(2)}`,
          customer: `${payload.customer_name} (${payload.customer_phone})`,
          delivery_address: rawAddress,
          google_maps_link: mapsUrl,
          items: itemsText,
          owner_phone: ownerPhone,
        }),
      });
      emailSuccess = true;
    } catch (fsErr: any) {
      errors.push(`Email webhook fallback error: ${fsErr?.message}`);
    }
  }

  // --- CHANNEL 3: Fast2SMS API (for Indian Mobile Numbers) ---
  const fast2SmsKey = process.env.FAST2SMS_API_KEY;
  if (fast2SmsKey) {
    try {
      const cleanPhone = ownerPhone.replace(/\D/g, "").slice(-10);
      const smsText = `🚨 NEW ORDER #${payload.order_number}! Amt: Rs.${Number(payload.total_amount).toFixed(0)}. Cust: ${payload.customer_name} (${payload.customer_phone}). Addr: ${rawAddress.slice(0, 40)}. Map: ${mapsUrl}`;
      const f2sUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(
        fast2SmsKey
      )}&route=q&message=${encodeURIComponent(smsText)}&language=english&flash=0&numbers=${cleanPhone}`;

      const f2sRes = await fetch(f2sUrl, { method: "GET" });
      const f2sJson = await f2sRes.json();
      if (f2sJson.return) {
        smsSuccess = true;
      } else {
        errors.push(`Fast2SMS API response: ${JSON.stringify(f2sJson)}`);
      }
    } catch (smsErr: any) {
      errors.push(`Fast2SMS error: ${smsErr?.message}`);
    }
  }

  // --- CHANNEL 4: CallMeBot WhatsApp API ---
  const callMeBotKey = process.env.CALLMEBOT_API_KEY;
  if (callMeBotKey) {
    try {
      const internationalPhone = `+91${ownerPhone.replace(/\D/g, "").slice(-10)}`;
      const cmbUrl = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(
        internationalPhone
      )}&text=${encodeURIComponent(plainTextAlert)}&apikey=${encodeURIComponent(callMeBotKey)}`;

      const cmbRes = await fetch(cmbUrl, { method: "GET" });
      if (cmbRes.ok) {
        whatsappSuccess = true;
      } else {
        errors.push(`CallMeBot WhatsApp HTTP ${cmbRes.status}`);
      }
    } catch (cmbErr: any) {
      errors.push(`CallMeBot error: ${cmbErr?.message}`);
    }
  }

  // --- CHANNEL 5: Twilio SMS / WhatsApp ---
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

  if (twilioSid && twilioAuth && twilioFrom) {
    try {
      const twilioTo = `+91${ownerPhone.replace(/\D/g, "").slice(-10)}`;
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const basicAuth = Buffer.from(`${twilioSid}:${twilioAuth}`).toString("base64");

      const twilioRes = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: twilioFrom,
          To: twilioTo,
          Body: plainTextAlert,
        }).toString(),
      });

      if (twilioRes.ok) {
        smsSuccess = true;
      } else {
        const twErr = await twilioRes.text();
        errors.push(`Twilio dispatch error: ${twErr}`);
      }
    } catch (twErr: any) {
      errors.push(`Twilio error: ${twErr?.message}`);
    }
  }

  return {
    supabase_notification: supabaseNotificationSuccess,
    email_sent: emailSuccess,
    sms_sent: smsSuccess,
    whatsapp_sent: whatsappSuccess,
    google_maps_url: mapsUrl,
    whatsapp_chat_url: whatsappChatUrl,
    summary: `Order alert processed for #${payload.order_number} to owner ${ownerPhone}`,
    errors,
  };
}
