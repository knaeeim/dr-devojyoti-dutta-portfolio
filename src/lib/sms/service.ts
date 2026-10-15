export interface SendSmsResult {
  success: boolean;
  message?: string;
  error?: string;
  responseCode?: number | string;
  raw?: unknown;
}

const bnDigitsMap: Record<string, string> = {
  '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
  '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
};

function numToBn(num: number | string): string {
  return String(num).replace(/\d/g, (d) => bnDigitsMap[d] || d);
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
 * Splits long messages cleanly along paragraph/line/sentence boundaries
 * so BulkSMSBD's 10-part limit (error 1004) is never exceeded and full text is preserved.
 */
export function splitMessageForSms(text: string, maxLen: number = 460): string[] {
  const trimmed = text.trim();
  if (trimmed.length <= maxLen) {
    return [trimmed];
  }

  const paras = trimmed.split(/\n\s*\n/);
  const chunks: string[] = [];
  let current = '';

  for (const para of paras) {
    const candidate = current ? `${current}\n\n${para}` : para;
    if (candidate.length <= maxLen) {
      current = candidate;
    } else {
      if (current) {
        chunks.push(current.trim());
        current = '';
      }
      if (para.length > maxLen) {
        // If a single paragraph is too long, split by lines
        const lines = para.split('\n');
        for (const line of lines) {
          const lineCandidate = current ? `${current}\n${line}` : line;
          if (lineCandidate.length <= maxLen) {
            current = lineCandidate;
          } else {
            if (current) {
              chunks.push(current.trim());
              current = '';
            }
            if (line.length > maxLen) {
              // Fallback split by sentences
              const sents = line.split(/(?<=[।?!])\s+/);
              for (const s of sents) {
                const sCandidate = current ? `${current} ${s}` : s;
                if (sCandidate.length <= maxLen) {
                  current = sCandidate;
                } else {
                  if (current) chunks.push(current.trim());
                  current = s;
                }
              }
            } else {
              current = line;
            }
          }
        }
      } else {
        current = para;
      }
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  if (chunks.length > 1) {
    return chunks.map((c, i) => `(পর্ব ${numToBn(i + 1)}/${numToBn(chunks.length)})\n${c}`);
  }

  return chunks;
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
 * Sends a single SMS chunk to BulkSMSBD API
 */
async function dispatchSingleSms(
  formattedNumber: string,
  senderId: string,
  apiKey: string,
  gatewayUrl: string,
  messageText: string
): Promise<SendSmsResult> {
  const endpoint = gatewayUrl.replace(/\?.*$/, '');
  const params = new URLSearchParams({
    api_key: apiKey,
    type: 'text',
    number: formattedNumber,
    senderid: senderId,
    message: messageText
  });

  console.log(`[BulkSMSBD] Dispatching chunk (${messageText.length} chars) to ${formattedNumber}...`);

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

  // Sender ID error code: 1002 / 1005 / 1013
  if (data && (data.response_code === 1002 || data.response_code === 1005 || data.response_code === 1013 || data?.error_message?.includes('is_masking'))) {
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
}

/**
 * Dispatches an SMS directly to the recipient via BulkSMSBD Gateway API.
 * Automatically splits long messages into clean, sequential parts if needed
 * so that full, unabridged text is delivered without triggering telco limit errors.
 */
export async function sendDirectSms(
  recipientPhone: string,
  messageText: string
): Promise<SendSmsResult> {
  let apiKey = (process.env.SMS_API_KEY || '').trim();
  if (!apiKey || apiKey === 'YOUR_SMS_API_KEY') {
    apiKey = 'BYlhH7cFVn46tY8lvlcY';
  }

  // Ensure the verified BulkSMSBD Sender ID 8809617643375 is always used.
  // Overrides old unapproved text masking (like DrDevojyotiDutta) configured in Vercel,
  // which causes BulkSMSBD error 1005: "Attempt to read property 'is_masking' on null".
  let senderId = (process.env.SMS_SENDER_ID || '').trim();
  if (
    !senderId ||
    !/^\d+$/.test(senderId) ||
    senderId.toLowerCase().includes('dutta') ||
    senderId.toLowerCase().includes('devojyoti')
  ) {
    senderId = '8809617643375';
  }

  let gatewayUrl = (process.env.SMS_GATEWAY_URL || 'https://bulksmsbd.net/api/smsapi').trim();
  if (!gatewayUrl.includes('bulksmsbd.net')) {
    gatewayUrl = 'https://bulksmsbd.net/api/smsapi';
  }

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
    // Automatically split messages longer than 460 characters so BulkSMSBD's 10-part ceiling
    // ("Maximum and Minimum Limit exceeded for SMS Part Counting") is never triggered,
    // while ensuring 100% of the text, links, and details are delivered!
    const parts = splitMessageForSms(messageText, 460);

    let lastResult: SendSmsResult = { success: false, error: 'এসএমএস পাঠানো যায়নি।' };

    for (let i = 0; i < parts.length; i++) {
      const partText = parts[i];
      const res = await dispatchSingleSms(formattedNumber, senderId, apiKey, gatewayUrl, partText);
      lastResult = res;

      if (!res.success) {
        return {
          success: false,
          error: parts.length > 1
            ? `পর্ব ${numToBn(i + 1)} প্রেরণে সমস্যা: ${res.error}`
            : res.error,
          responseCode: res.responseCode,
          raw: res.raw
        };
      }

      // Small delay between multiple parts to maintain telecom delivery order
      if (i < parts.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    }

    const successMessage = parts.length > 1
      ? `সম্পূর্ণ বার্তাটি সফলভাবে ${numToBn(parts.length)}টি পর্বে রোগীর নম্বরে পাঠানো হয়েছে!`
      : (lastResult.message || 'এসএমএস সফলভাবে রোগীর নম্বরে পাঠানো হয়েছে!');

    return {
      success: true,
      message: successMessage,
      responseCode: 202,
      raw: lastResult.raw
    };
  } catch (err: unknown) {
    console.error('[BulkSMSBD Dispatch Exception]', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'এসএমএস গেটওয়েতে সংযোগ করা সম্ভব হয়নি।'
    };
  }
}
