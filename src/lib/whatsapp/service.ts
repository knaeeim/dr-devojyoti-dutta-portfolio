/**
 * WhatsApp Messaging Service for International Patient OTP & Appointment Confirmations
 * Supports:
 * 1. UltraMsg / Green API (Scan QR code with your own phone to send directly from that number)
 * 2. Meta WhatsApp Business Cloud API (Official Meta Graph API)
 * 3. Twilio WhatsApp API
 */

export interface SendWhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: 'ultramsg' | 'greenapi' | 'meta_cloud' | 'twilio' | 'sandbox';
  raw?: unknown;
}

/**
 * Normalizes phone number to international E.164 without leading plus for some providers, or with plus
 */
export function formatInternationalWhatsAppNumber(phone: string): string {
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (!cleaned.startsWith('+')) {
    // If user entered e.g. 88017... without plus
    if (cleaned.startsWith('01') && cleaned.length === 11) {
      cleaned = '+88' + cleaned;
    } else {
      cleaned = '+' + cleaned;
    }
  }
  return cleaned;
}

/**
 * Dispatches a WhatsApp text message using configured provider
 */
export async function sendWhatsAppMessage(
  rawPhone: string,
  messageText: string
): Promise<SendWhatsAppResult> {
  const normalizedWithPlus = formatInternationalWhatsAppNumber(rawPhone);
  const normalizedDigitsOnly = normalizedWithPlus.replace(/\+/g, '');

  // 1. UltraMsg Provider (Scan QR code from your phone - easiest for custom personal/business SIM numbers)
  const ultramsgInstance = process.env.ULTRAMSG_INSTANCE_ID;
  const ultramsgToken = process.env.ULTRAMSG_TOKEN;
  if (ultramsgInstance && ultramsgToken) {
    try {
      const res = await fetch(`https://api.ultramsg.com/${ultramsgInstance}/messages/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          token: ultramsgToken,
          to: normalizedDigitsOnly,
          body: messageText
        })
      });
      const data = await res.json();
      if (data && (data.sent === 'true' || data.sent === true || data.id)) {
        console.log(`[WhatsApp UltraMsg] Message sent to ${normalizedWithPlus}, ID: ${data.id}`);
        return {
          success: true,
          messageId: String(data.id),
          provider: 'ultramsg',
          raw: data
        };
      }
      return {
        success: false,
        error: data.message || data.error || 'UltraMsg delivery failed',
        provider: 'ultramsg',
        raw: data
      };
    } catch (err: any) {
      console.error('[WhatsApp UltraMsg Error]:', err);
    }
  }

  // 2. Green-API Provider (Alternative QR code SIM scanner provider)
  const greenApiId = process.env.GREENAPI_INSTANCE_ID;
  const greenApiToken = process.env.GREENAPI_API_TOKEN;
  if (greenApiId && greenApiToken) {
    try {
      const res = await fetch(
        `https://api.green-api.com/waInstance${greenApiId}/sendMessage/${greenApiToken}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: `${normalizedDigitsOnly}@c.us`,
            message: messageText
          })
        }
      );
      const data = await res.json();
      if (data && data.idMessage) {
        console.log(`[WhatsApp GreenAPI] Message sent to ${normalizedWithPlus}, ID: ${data.idMessage}`);
        return {
          success: true,
          messageId: data.idMessage,
          provider: 'greenapi',
          raw: data
        };
      }
      return {
        success: false,
        error: data?.error || 'Green-API delivery failed',
        provider: 'greenapi',
        raw: data
      };
    } catch (err: any) {
      console.error('[WhatsApp GreenAPI Error]:', err);
    }
  }

  // 3. Meta WhatsApp Business Cloud API (Official Graph API)
  const metaPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const metaToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if (metaPhoneId && metaToken) {
    try {
      const res = await fetch(`https://graph.facebook.com/v21.0/${metaPhoneId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${metaToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: normalizedDigitsOnly,
          type: 'text',
          text: {
            preview_url: false,
            body: messageText
          }
        })
      });
      const data = await res.json();
      if (data && data.messages && data.messages[0]?.id) {
        console.log(`[Meta WhatsApp Cloud API] Dispatched to ${normalizedWithPlus}, ID: ${data.messages[0].id}`);
        return {
          success: true,
          messageId: data.messages[0].id,
          provider: 'meta_cloud',
          raw: data
        };
      }
      return {
        success: false,
        error: data?.error?.message || 'Meta WhatsApp API delivery failed',
        provider: 'meta_cloud',
        raw: data
      };
    } catch (err: any) {
      console.error('[Meta WhatsApp Cloud API Error]:', err);
    }
  }

  // 4. Twilio WhatsApp
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioWhatsappFrom = process.env.TWILIO_WHATSAPP_NUMBER;
  if (twilioSid && twilioToken && twilioWhatsappFrom) {
    try {
      const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
      const fromFormatted = twilioWhatsappFrom.startsWith('whatsapp:')
        ? twilioWhatsappFrom
        : `whatsapp:${twilioWhatsappFrom}`;
      const toFormatted = `whatsapp:${normalizedWithPlus}`;

      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            To: toFormatted,
            From: fromFormatted,
            Body: messageText
          })
        }
      );
      const data = await res.json();
      if (data && data.sid && !data.error_code) {
        console.log(`[Twilio WhatsApp] Dispatched to ${toFormatted}, SID: ${data.sid}`);
        return {
          success: true,
          messageId: data.sid,
          provider: 'twilio',
          raw: data
        };
      }
      return {
        success: false,
        error: data?.message || 'Twilio WhatsApp delivery failed',
        provider: 'twilio',
        raw: data
      };
    } catch (err: any) {
      console.error('[Twilio WhatsApp Error]:', err);
    }
  }

  // 5. Fallback Sandbox Simulator Mode
  console.log(`\n============================================================`);
  console.log(`💬 [WHATSAPP OTP SIMULATOR / DEMO MODE]`);
  console.log(`📱 Recipient: ${normalizedWithPlus}`);
  console.log(`📝 Message: ${messageText}`);
  console.log(`ℹ️ Notice: To dispatch live WhatsApp messages from your own number,`);
  console.log(`   configure ULTRAMSG_INSTANCE_ID + ULTRAMSG_TOKEN (QR scan your SIM number)`);
  console.log(`   or WHATSAPP_ACCESS_TOKEN + WHATSAPP_PHONE_NUMBER_ID in .env.local`);
  console.log(`============================================================\n`);

  return {
    success: true,
    provider: 'sandbox',
    messageId: 'sandbox-' + Date.now()
  };
}
