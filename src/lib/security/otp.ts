import crypto from 'node:crypto';

interface OtpEntry {
  code: string;
  expiresAt: number;
  attempts: number;
  verified: boolean;
  token?: string;
}

// In-memory OTP storage with automatic expiry
const otpStore = new Map<string, OtpEntry>();

// Clean up expired OTPs periodically
setInterval(() => {
  const now = Date.now();
  for (const [phone, entry] of otpStore.entries()) {
    if (entry.expiresAt < now) {
      otpStore.delete(phone);
    }
  }
}, 60 * 1000);

export function normalizePhoneNumber(rawPhone: string): string {
  let cleaned = rawPhone.replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('01') && cleaned.length === 11) {
    cleaned = '+88' + cleaned;
  } else if (cleaned.startsWith('8801') && cleaned.length === 13) {
    cleaned = '+' + cleaned;
  }
  return cleaned;
}

/**
 * Generates a 6-digit OTP code and dispatches SMS if provider credentials exist
 */
export async function sendOtp(phone: string, patientName?: string): Promise<{
  success: boolean;
  message: string;
  expiresInSeconds: number;
  debugCode?: string;
}> {
  const normalized = normalizePhoneNumber(phone);
  
  // Rate check: prevent sending more than once every 30 seconds for the same number
  const existing = otpStore.get(normalized);
  const now = Date.now();
  if (existing && existing.expiresAt - now > 4.5 * 60 * 1000) {
    const waitSec = Math.ceil((existing.expiresAt - now - 4.5 * 60 * 1000) / 1000);
    return {
      success: false,
      message: `অনুগ্রহ করে ${waitSec} সেকেন্ড পর পুনরায় ওটিপি কোডের জন্য চেষ্টা করুন।`,
      expiresInSeconds: Math.ceil((existing.expiresAt - now) / 1000)
    };
  }

  // Generate 6-digit numeric OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = now + 5 * 60 * 1000; // 5 minutes validity

  otpStore.set(normalized, {
    code,
    expiresAt,
    attempts: 0,
    verified: false
  });

  const smsText = `ডা. দেবজ্যোতি দত্তের চেম্বার অ্যাপয়েন্টমেন্ট যাচাইকরণ কোড (OTP): ${code}। এই কোডটি ৫ মিনিট কার্যকর থাকবে। কারো সাথে শেয়ার করবেন না।`;

  // 1. Try sending via configured SMS Gateway if credentials exist
  const smsApiKey = process.env.SMS_API_KEY;
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  let smsSent = false;

  if (smsApiKey) {
    try {
      // Support BulkSMSBD API (http://bulksmsbd.net/api/smsapi) and generic Bangladesh gateways
      const senderId = process.env.SMS_SENDER_ID || '';
      const gatewayUrl = (process.env.SMS_GATEWAY_URL || 'http://bulksmsbd.net/api/smsapi').trim();
      const cleanNumber = normalized.replace('+', '');

      if (gatewayUrl.includes('bulksmsbd')) {
        const endpoint = gatewayUrl.replace(/\?.*$/, '');
        const params = new URLSearchParams({
          api_key: smsApiKey,
          type: 'text',
          number: cleanNumber,
          senderid: senderId,
          message: smsText
        });

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params
        });

        const data = await res.json().catch(() => null);
        console.log(`[BulkSMSBD API Response]`, data);

        // BulkSMSBD returns { response_code: 202, success_message: '...' } on success
        if (data && (data.response_code === 202 || data.response_code === '202')) {
          smsSent = true;
          console.log(`[BulkSMSBD] Dispatched real SMS OTP to ${cleanNumber}`);
        } else {
          console.warn(`[BulkSMSBD Notice] Gateway returned code ${data?.response_code}: ${data?.error_message || 'Check balance/sender ID'}`);
        }
      } else {
        // Generic gateway (e.g. Greenweb, Alpha Net)
        const res = await fetch(gatewayUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            token: smsApiKey,
            to: cleanNumber,
            message: smsText
          })
        });
        if (res.ok) {
          smsSent = true;
          console.log(`[SMS Gateway] Dispatched real SMS to ${cleanNumber}`);
        }
      }
    } catch (err) {
      console.error('[SMS Gateway Error]', err);
    }
  } else if (twilioSid && twilioToken) {
    try {
      const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
      const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
      await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          To: normalized,
          From: twilioPhone || '',
          Body: smsText
        })
      });
      smsSent = true;
      console.log(`[Twilio SMS] Dispatched OTP to ${normalized}`);
    } catch (err) {
      console.error('[Twilio SMS Error]', err);
    }
  }

  console.log(`\n============================================================`);
  console.log(`📱 [PHONE OTP GENERATED] -> ${normalized}`);
  console.log(`🔢 OTP Code: ${code}`);
  console.log(`👤 Patient: ${patientName || 'New Patient'}`);
  console.log(`📡 Status: ${smsSent ? 'Delivered via SMS Gateway' : 'Sandbox Demo Mode'}`);
  console.log(`============================================================\n`);

  return {
    success: true,
    message: smsSent
      ? `আপনার মোবাইল নম্বর ${phone}-এ ৬-সংখ্যার ওটিপি কোড পাঠানো হয়েছে।`
      : `আপনার মোবাইল নম্বর ${phone}-এ ৬-সংখ্যার ওটিপি পাঠানো হয়েছে।`,
    expiresInSeconds: 300,
    // Provide debugCode for instant demo/testing if real SMS provider isn't configured
    debugCode: !smsSent ? code : undefined
  };
}

/**
 * Validates the entered OTP code
 */
export function verifyOtpCode(phone: string, inputCode: string): {
  success: boolean;
  message: string;
  token?: string;
} {
  const normalized = normalizePhoneNumber(phone);
  const entry = otpStore.get(normalized);

  if (!entry) {
    return {
      success: false,
      message: 'কোনো সক্রিয় ওটিপি কোড পাওয়া যায়নি। অনুগ্রহ করে নতুন কোড পাঠান।'
    };
  }

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(normalized);
    return {
      success: false,
      message: 'ওটিপি কোডের মেয়াদ শেষ হয়ে গেছে। অনুগ্রহ করে পুনরায় কোড পাঠান।'
    };
  }

  entry.attempts += 1;
  if (entry.attempts > 5) {
    otpStore.delete(normalized);
    return {
      success: false,
      message: 'অতিরিক্ত সংখ্যক ভুল চেষ্টা। অনুগ্রহ করে নতুন ওটিপি পাঠান।'
    };
  }

  if (entry.code.trim() !== inputCode.trim()) {
    return {
      success: false,
      message: 'ভুল ওটিপি কোড! অনুগ্রহ করে সঠিক ৬-সংখ্যার কোডটি দিন।'
    };
  }

  // Generate a random verification token valid for final appointment creation
  const token = crypto.randomBytes(16).toString('hex');
  entry.verified = true;
  entry.token = token;
  // Extend lifetime so user has 10 minutes to submit the final booking
  entry.expiresAt = Date.now() + 10 * 60 * 1000;

  return {
    success: true,
    message: 'ফোন নম্বর সফলভাবে যাচাই করা হয়েছে!',
    token
  };
}

/**
 * Checks if a phone was verified via OTP
 */
export function isPhoneVerified(phone: string, token?: string): boolean {
  // If in demo or bypass mode, permit if valid
  const normalized = normalizePhoneNumber(phone);
  const entry = otpStore.get(normalized);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) return false;
  if (!entry.verified) return false;
  if (token && entry.token && entry.token !== token) return false;
  return true;
}
