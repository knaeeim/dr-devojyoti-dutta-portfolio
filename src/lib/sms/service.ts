export interface SendSmsResult {
  success: boolean;
  message?: string;
  error?: string;
  responseCode?: number | string;
  raw?: unknown;
}

/**
 * Normalizes phone numbers to standard Bangladesh format: 8801XXXXXXXXX
 */
export function formatBdPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  if (cleaned.startsWith('01')) {
    cleaned = '88' + cleaned;
  }
  if (!cleaned.startsWith('880') && cleaned.startsWith('1')) {
    cleaned = '880' + cleaned;
  }
  return cleaned;
}

/**
 * Checks current SMS credit balance from BulkSMSBD API
 */
export async function getSmsBalance(): Promise<{ success: boolean; balance?: number; error?: string }> {
  const apiKey = (process.env.SMS_API_KEY || 'BYlhH7cFVn46tY8lvlcY').trim();
  try {
    const res = await fetch(`https://bulksmsbd.net/api/getBalanceApi?api_key=${encodeURIComponent(apiKey)}`, {
      method: 'GET',
      cache: 'no-store'
    });
    const data = await res.json().catch(() => null);
    if (data && (data.response_code === 202 || data.response_code === '202')) {
      return { success: true, balance: Number(data.balance ?? 0) };
    }
    return { success: false, error: data?.error_message || 'ব্যালেন্স জানতে ব্যর্থ' };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'ব্যালেন্স এপিআই সংযোগ ত্রুটি' };
  }
}

/**
 * Dispatches an SMS directly to the recipient via BulkSMSBD Gateway API
 */
export async function sendDirectSms(
  recipientPhone: string,
  messageText: string
): Promise<SendSmsResult> {
  const apiKey = (process.env.SMS_API_KEY || 'BYlhH7cFVn46tY8lvlcY').trim();
  const senderId = (process.env.SMS_SENDER_ID || '8809617643375').trim();
  const gatewayUrl = (process.env.SMS_GATEWAY_URL || 'https://bulksmsbd.net/api/smsapi').trim();

  const formattedNumber = formatBdPhoneNumber(recipientPhone);

  if (!formattedNumber || formattedNumber.length < 11) {
    return {
      success: false,
      error: `অকার্যকর মোবাইল নম্বর: ${recipientPhone}`
    };
  }

  if (!messageText || messageText.trim().length === 0) {
    return {
      success: false,
      error: 'এসএমএস বার্তা খালি রাখা যাবে না।'
    };
  }

  try {
    const endpoint = gatewayUrl.replace(/\?.*$/, '');
    const params = new URLSearchParams({
      api_key: apiKey,
      type: 'text',
      number: formattedNumber,
      senderid: senderId,
      message: messageText
    });

    console.log(`[BulkSMSBD] Dispatching SMS to ${formattedNumber} with senderid ${senderId}...`);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
      cache: 'no-store'
    });

    const data = await res.json().catch(() => null);
    console.log(`[BulkSMSBD API Response]`, data);

    // BulkSMSBD success response code: 202
    if (data && (data.response_code === 202 || data.response_code === '202')) {
      return {
        success: true,
        message: data.success_message || 'এসএমএস সফলভাবে রোগীর নম্বরে পাঠানো হয়েছে!',
        responseCode: data.response_code,
        raw: data
      };
    }

    // IP Whitelist error code: 1032
    if (data && (data.response_code === 1032 || data.response_code === '1032')) {
      const detailMsg = data.error_message
        ? `${data.error_message}। অনুগ্রহ করে BulkSMSBD প্যানেলে (Phone Book ➔ IP White List) আইপি যুক্ত করুন অথবা সাপোর্টকে আইপি রেস্ট্রিকশন বন্ধ করতে বলুন।`
        : 'BulkSMSBD ড্যাশবোর্ডে Source IP Whitelist নিষ্ক্রিয় (disable) করুন। (Error: 1032 IP Not Whitelisted)';
      return {
        success: false,
        error: detailMsg,
        responseCode: data.response_code,
        raw: data
      };
    }

    // Sender ID error code: 1002 / 1013
    if (data && (data.response_code === 1002 || data.response_code === 1013)) {
      return {
        success: false,
        error: `Sender ID (${senderId}) অনুমোদন বা একাউন্টের সাথে সংযুক্ত পাওয়া যায়নি (Error: ${data.response_code})।`,
        responseCode: data.response_code,
        raw: data
      };
    }

    return {
      success: false,
      error: data?.error_message || `এসএমএস গেটওয়ে ত্রুটি (রেসপন্স কোড: ${data?.response_code || res.status})`,
      responseCode: data?.response_code,
      raw: data
    };
  } catch (err: unknown) {
    console.error('[BulkSMSBD Dispatch Exception]', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'এসএমএস গেটওয়েতে সংযোগ করা সম্ভব হয়নি।'
    };
  }
}
