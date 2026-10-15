import crypto from 'node:crypto';
import { sendDirectSms } from '@/lib/sms/service';

const OTP_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  process.env.ADMIN_PASSWORD ||
  'dr-dutta-otp-secret-token-key-2026';

interface OtpEntry {
  code: string;
  expiresAt: number;
  attempts: number;
  verified: boolean;
  token?: string;
}

// In-memory OTP storage with automatic expiry (used as local fallback)
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
 * Creates a stateless HMAC challenge token for serverless multi-container verification
 */
export function createOtpChallenge(phone: string, code: string, expiresAt: number): string {
  const normalized = normalizePhoneNumber(phone);
  const payload = `${normalized}:${expiresAt}`;
  const hmac = crypto
    .createHmac('sha256', OTP_SECRET)
    .update(`${normalized}:${code}:${expiresAt}`)
    .digest('hex');
  return `${Buffer.from(payload).toString('base64url')}.${hmac}`;
}

/**
 * Creates a stateless signed token proving the phone was verified via OTP
 */
export function createVerifiedPhoneToken(phone: string): string {
  const normalized = normalizePhoneNumber(phone);
  const validUntil = Date.now() + 25 * 60 * 1000; // 25 mins validity for booking completion
  const payload = `verified:${normalized}:${validUntil}`;
  const hmac = crypto.createHmac('sha256', OTP_SECRET).update(payload).digest('hex');
  return `${Buffer.from(payload).toString('base64url')}.${hmac}`;
}

/**
 * Generates a 6-digit OTP code and dispatches SMS if provider credentials exist
 */
export async function sendOtp(phone: string, patientName?: string): Promise<{
  success: boolean;
  message: string;
  expiresInSeconds: number;
  challengeToken?: string;
  debugCode?: string;
  smsSent?: boolean;
  gatewayError?: string;
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

  const smsText = `Your OTP for Dr. Devojyoti Dutta chamber appointment is ${code}. Valid for 5 minutes. Do not share with anyone.`;

  // 1. Try sending via configured SMS Gateway (BulkSMSBD)
  let smsSent = false;
  let gatewayError: string | undefined;

  const smsResult = await sendDirectSms(normalized, smsText);
  if (smsResult.success) {
    smsSent = true;
    console.log(`[BulkSMSBD] Dispatched real SMS OTP to ${normalized}`);
  } else {
    gatewayError = smsResult.error;
    console.warn(`[BulkSMSBD OTP Warning]:`, gatewayError);

    // Optional Twilio fallback if Twilio is configured
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    if (twilioSid && twilioToken) {
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
  }

  console.log(`\n============================================================`);
  console.log(`📱 [PHONE OTP GENERATED] -> ${normalized}`);
  console.log(`🔢 OTP Code: ${code}`);
  console.log(`👤 Patient: ${patientName || 'New Patient'}`);
  console.log(`📡 Status: ${smsSent ? 'Delivered via SMS Gateway' : 'Sandbox Demo Mode'}`);
  console.log(`============================================================\n`);

  const challengeToken = createOtpChallenge(normalized, code, expiresAt);

  return {
    success: true,
    message: smsSent
      ? `আপনার মোবাইল নম্বর ${phone}-এ ৬-সংখ্যার ওটিপি কোড পাঠানো হয়েছে।`
      : `আপনার মোবাইল নম্বর ${phone}-এ ৬-সংখ্যার ওটিপি পাঠানো হয়েছে।`,
    expiresInSeconds: 300,
    challengeToken,
    // Provide debugCode for instant demo/testing if real SMS provider isn't configured
    debugCode: !smsSent ? code : undefined,
    smsSent,
    gatewayError: !smsSent ? gatewayError : undefined
  };
}

/**
 * Validates the entered OTP code with stateless HMAC token support
 */
export function verifyOtpCode(
  phone: string,
  inputCode: string,
  challengeToken?: string
): {
  success: boolean;
  message: string;
  token?: string;
} {
  const normalized = normalizePhoneNumber(phone);
  const trimmedCode = inputCode.trim();

  // 1. Try stateless cryptographic challenge token verification (100% serverless safe)
  if (challengeToken && challengeToken.includes('.')) {
    try {
      const [b64Data, hmac] = challengeToken.split('.');
      const payload = Buffer.from(b64Data, 'base64url').toString('utf-8');
      const [tokenPhone, expStr] = payload.split(':');
      const expTime = Number(expStr);

      if (tokenPhone === normalized && expTime > Date.now()) {
        const expectedHmac = crypto
          .createHmac('sha256', OTP_SECRET)
          .update(`${normalized}:${trimmedCode}:${expStr}`)
          .digest('hex');

        if (crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac))) {
          const token = createVerifiedPhoneToken(normalized);
          // Also set in local map for warm container fallback
          otpStore.set(normalized, {
            code: trimmedCode,
            expiresAt: Date.now() + 25 * 60 * 1000,
            attempts: 0,
            verified: true,
            token
          });

          return {
            success: true,
            message: 'ফোন নম্বর সফলভাবে যাচাই করা হয়েছে!',
            token
          };
        }
      }
    } catch (err) {
      console.warn('[OTP] Challenge token verification error:', err);
    }
  }

  // 2. Fallback to in-memory store
  const entry = otpStore.get(normalized);
  if (!entry) {
    return {
      success: false,
      message: 'কোনো সক্রিয় ওটিপি কোড পাওয়া যায়নি। অনুগ্রহ করে পুনরায় কোড পাঠান।'
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

  if (entry.code.trim() !== trimmedCode) {
    return {
      success: false,
      message: 'ভুল ওটিপি কোড! অনুগ্রহ করে সঠিক ৬-সংখ্যার কোডটি দিন।'
    };
  }

  const token = createVerifiedPhoneToken(normalized);
  entry.verified = true;
  entry.token = token;
  entry.expiresAt = Date.now() + 25 * 60 * 1000;

  return {
    success: true,
    message: 'ফোন নম্বর সফলভাবে যাচাই করা হয়েছে!',
    token
  };
}

/**
 * Checks if a phone was verified via OTP (supports stateless HMAC token)
 */
export function isPhoneVerified(phone: string, token?: string): boolean {
  if (!token) return false;
  const normalized = normalizePhoneNumber(phone);

  // 1. Verify stateless HMAC cryptographic token (survives any serverless cold-start)
  if (token.includes('.')) {
    try {
      const [b64Data, signature] = token.split('.');
      const payload = Buffer.from(b64Data, 'base64url').toString('utf-8');
      const [prefix, tokenPhone, validUntilStr] = payload.split(':');

      if (prefix === 'verified' && tokenPhone === normalized) {
        const validUntil = Number(validUntilStr);
        if (validUntil > Date.now()) {
          const expected = crypto
            .createHmac('sha256', OTP_SECRET)
            .update(`verified:${tokenPhone}:${validUntilStr}`)
            .digest('hex');

          if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
            return true;
          }
        }
      }
    } catch {}
  }

  // 2. In-memory fallback
  const entry = otpStore.get(normalized);
  if (entry && entry.verified && Date.now() <= entry.expiresAt) {
    if (!token || !entry.token || entry.token === token) return true;
  }

  return false;
}
