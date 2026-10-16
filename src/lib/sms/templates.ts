export type TemplateType = 'confirm' | 'reminder' | 'reports' | 'reschedule' | 'cancel' | 'compact';
export type ChamberMode = 'offline' | 'online';

export interface SmsTemplateSet {
  confirm: string;
  reminder: string;
  reports: string;
  reschedule: string;
  cancel: string;
  compact: string;
}

export interface ChamberTemplatesConfig {
  offline: SmsTemplateSet;
  online: SmsTemplateSet;
}

export const DEFAULT_SMS_TEMPLATES: ChamberTemplatesConfig = {
  offline: {
    confirm: `*Mr./Mrs. {patientName},*

• তারিখ: {date}
• সময়: {time}
• দেবজ্যোতি দত্তের সাথে আপনার অ্যাপয়েন্টমেন্টটি সফলভাবে তৈরি হয়েছে।

• সিরিয়াল নম্বর: {serialNo}

>> অনুগ্রহ করে এই ফর্মটি পূরণ করুন: (অবশ্যই পূরণ করতে হবে)
{formUrl}
(পূর্বে একবার পূরণ করে থাকলে পুনরায় পূরণ করার প্রয়োজন নেই।)

• চেম্বারের ঠিকানা: {chamberAddress}
• গুগল ম্যাপ লিঙ্ক: {mapsUrl}`,

    reminder: `*Mr./Mrs. {patientName},*

দেবজ্যোতি দত্তের চেম্বারে আপনার অ্যাপয়েন্টমেন্টটি স্মরণ করিয়ে দেওয়া হচ্ছে:

• তারিখ: {date}
• সময়: {time}
• সিরিয়াল নম্বর: {serialNo}

>> অনুগ্রহ করে এই ফর্মটি পূরণ করুন: (যদি এখনও পূরণ না করে থাকেন)
{formUrl}

• চেম্বারের ঠিকানা: {chamberAddress}
• গুগল ম্যাপ লিঙ্ক: {mapsUrl}

• নির্ধারিত সময়ের ১০ মিনিট পূর্বে উপস্থিত থাকবেন। সাথে পূর্ববর্তী প্রেসক্রিপশন বা টেস্ট রিপোর্ট রাখবেন।`,

    reports: `*Mr./Mrs. {patientName},*

দেবজ্যোতি দত্তের চেম্বার থেকে যোগাযোগ করা হচ্ছে:

• সিরিয়াল নম্বর: {serialNo}
• তারিখ: {date}
• সময়: {time}

>> চিকিৎসা ও রোগ পর্যালোচনার সুবিধার্থে অনুগ্রহ করে:
১. এই ফর্মটি পূরণ করুন (অবশ্যই পূরণ করতে হবে):
{formUrl}
(পূর্বে পূরণ করে থাকলে পুনরায় প্রয়োজন নেই)

২. আপনার পূর্ববর্তী প্রেসক্রিপশন, সাম্প্রতিক রক্ত পরীক্ষা বা আল্ট্রাসনোগ্রাম রিপোর্টের স্পষ্ট ছবি এই হোয়াটসঅ্যাপ নম্বরে পাঠিয়ে রাখুন।

• হেল্পলাইন ও পরামর্শ: {helpline}

ধন্যবাদ,
— দেবজ্যোতি দত্ত চেম্বার।`,

    reschedule: `*Mr./Mrs. {patientName},*

দেবজ্যোতি দত্তের চেম্বারে আপনার অ্যাপয়েন্টমেন্টের সময়সূচী সমন্বয় করা হয়েছে:

• নতুন তারিখ: {date}
• নতুন সময়: {time}
• সিরিয়াল নম্বর: {serialNo}

>> অনুগ্রহ করে এই ফর্মটি পূরণ করুন:
{formUrl}
(পূর্বে একবার পূরণ করে থাকলে পুনরায় পূরণ করার প্রয়োজন নেই।)

• চেম্বারের ঠিকানা: {chamberAddress}
• গুগল ম্যাপ লিঙ্ক: {mapsUrl}
• হেল্পলাইন: {helpline}`,

    cancel: `*Mr./Mrs. {patientName},*

দেবজ্যোতি দত্তের চেম্বারে আপনার নিম্নলিখিত সিরিয়ালটি বাতিল করা হয়েছে:

• সিরিয়াল নম্বর: {serialNo}
• তারিখ: {date}
• সময়: {time}

স্লটটি উন্মুক্ত করা হয়েছে। আপনি চাইলে পরবর্তীতে ওয়েবসাইট থেকে সুবিধাজনক সময়ে নতুন সিরিয়াল বুক করতে পারেন:
🌐 https://drdevojyotidutta.com

সাময়িক অসুবিধার জন্য আমরা আন্তরিকভাবে দুঃখিত।
— দেবজ্যোতি দত্ত চেম্বার।`,

    compact: `দেবজ্যোতি দত্ত চেম্বার: সিরিয়াল {serialNo} নিশ্চিত। তারিখ: {date}, সময়: {time}। চেম্বার: শ্যামলী, ঢাকা। হেল্পলাইন: {helpline}`
  },

  online: {
    confirm: `*Mr./Mrs. {patientName},*

• তারিখ: {date}
• সময়: {time}
• দেবজ্যোতি দত্তের সাথে আপনার অনলাইন ভিডিও কনসালটেশন অ্যাপয়েন্টমেন্টটি সফলভাবে তৈরি হয়েছে।

• সিরিয়াল নম্বর: {serialNo}
• কনসালটেশন মোড: অনলাইন ভিডিও কনসালটেশন (হোয়াটসঅ্যাপ ভিডিও কল)

>> অনুগ্রহ করে পরামর্শের পূর্বে এই ফর্মটি পূরণ করুন: (অবশ্যই পূরণ করতে হবে)
{formUrl}
(পূর্বে একবার পূরণ করে থাকলে পুনরায় পূরণ করার প্রয়োজন নেই।)

• নির্ধারিত সময়ে এই নম্বরে হোয়াটসঅ্যাপে ভিডিও কল করা হবে। অনুগ্রহ করে ইন্টারনেট সংযোগ সচল রাখবেন।
• হেল্পলাইন: {helpline}`,

    reminder: `*Mr./Mrs. {patientName},*

দেবজ্যোতি দত্তের সাথে আপনার অনলাইন ভিডিও কনসালটেশনটি স্মরণ করিয়ে দেওয়া হচ্ছে:

• তারিখ: {date}
• সময়: {time}
• সিরিয়াল নম্বর: {serialNo}
• কনসালটেশন মোড: অনলাইন ভিডিও কল (হোয়াটসঅ্যাপ)

>> অনুগ্রহ করে ফর্মটি পূরণ করে রাখুন:
{formUrl}

• নির্ধারিত সময়ের ৫ মিনিট পূর্বে হোয়াটসঅ্যাপে প্রস্তুত থাকুন। পূর্ববর্তী প্রেসক্রিপশন বা টেস্ট রিপোর্ট থাকলে ছবি তুলে হোয়াটসঅ্যাপে পাঠিয়ে রাখুন।
• হেল্পলাইন: {helpline}`,

    reports: `*Mr./Mrs. {patientName},*

দেবজ্যোতি দত্তের অনলাইন কনসালটেশন ডেস্ক থেকে যোগাযোগ করা হচ্ছে:

• সিরিয়াল নম্বর: {serialNo}
• তারিখ: {date}
• সময়: {time}
• কনসালটেশন মোড: অনলাইন ভিডিও কল (হোয়াটসঅ্যাপ)

>> অনলাইন ভিডিও কনসালটেশনের সুবিধার্থে অনুগ্রহ করে:
১. এই ফর্মটি পূরণ করুন:
{formUrl}

২. আপনার পূর্ববর্তী প্রেসক্রিপশন, সাম্প্রতিক রক্ত পরীক্ষা বা আল্ট্রাসনোগ্রাম রিপোর্টের স্পষ্ট ছবি এই হোয়াটসঅ্যাপ নম্বরে আগেই পাঠিয়ে রাখুন।

• হোয়াটসঅ্যাপ হেল্পলাইন: {helpline}

ধন্যবাদ,
— দেবজ্যোতি দত্ত পোর্টাল।`,

    reschedule: `*Mr./Mrs. {patientName},*

দেবজ্যোতি দত্তের সাথে আপনার অনলাইন ভিডিও কনসালটেশনের সময়সূচী পরিবর্তন করা হয়েছে:

• নতুন তারিখ: {date}
• নতুন সময়: {time}
• সিরিয়াল নম্বর: {serialNo}
• কনসালটেশন মোড: অনলাইন ভিডিও কল (হোয়াটসঅ্যাপ)

• নতুন নির্ধারিত সময়ে আপনার এই নম্বরে হোয়াটসঅ্যাপে কল করা হবে।
• হেল্পলাইন: {helpline}`,

    cancel: `*Mr./Mrs. {patientName},*

দেবজ্যোতি দত্তের সাথে আপনার নিম্নলিখিত অনলাইন ভিডিও কনসালটেশন সিরিয়ালটি বাতিল করা হয়েছে:

• সিরিয়াল নম্বর: {serialNo}
• তারিখ: {date}
• সময়: {time}

স্লটটি উন্মুক্ত করা হয়েছে। আপনি চাইলে ওয়েবসাইট থেকে সুবিধাজনক সময়ে নতুন সিরিয়াল বুক করতে পারেন:
🌐 https://drdevojyotidutta.com

সাময়িক অসুবিধার জন্য আমরা আন্তরিকভাবে দুঃখিত।
— দেবজ্যোতি দত্ত পোর্টাল।`,

    compact: `দেবজ্যোতি দত্ত: অনলাইন সিরিয়াল {serialNo} নিশ্চিত। তারিখ: {date}, সময়: {time}। মোড: হোয়াটসঅ্যাপ ভিডিও কল। হেল্পলাইন: {helpline}`
  }
};

/**
 * Live SMS evaluator calculates character count, encoding, SMS parts, and cost
 */
export interface SmsEvaluation {
  charCount: number;
  isUnicode: boolean;
  encoding: 'GSM-7' | 'UCS-2 (Unicode)';
  smsCount: number;
  singleSmsLimit: number;
  multiSmsLimit: number;
  estimatedCost: number;
  remainingInCurrentPart: number;
}

export function evaluateSms(text: string, rate: number = 0.35): SmsEvaluation {
  const len = text.length;
  // Checks if text contains any non-ASCII characters (e.g., Bengali, emojis, etc.)
  const isUnicode = /[^\x00-\x7F]/.test(text);

  let singleLimit = 160;
  let multiLimit = 153;
  let smsCount = 1;
  let remaining = 0;

  if (isUnicode) {
    singleLimit = 70;
    multiLimit = 67;
    if (len === 0) {
      smsCount = 0;
      remaining = singleLimit;
    } else if (len <= singleLimit) {
      smsCount = 1;
      remaining = singleLimit - len;
    } else {
      smsCount = Math.ceil(len / multiLimit);
      remaining = smsCount * multiLimit - len;
    }
  } else {
    singleLimit = 160;
    multiLimit = 153;
    if (len === 0) {
      smsCount = 0;
      remaining = singleLimit;
    } else if (len <= singleLimit) {
      smsCount = 1;
      remaining = singleLimit - len;
    } else {
      smsCount = Math.ceil(len / multiLimit);
      remaining = smsCount * multiLimit - len;
    }
  }

  return {
    charCount: len,
    isUnicode,
    encoding: isUnicode ? 'UCS-2 (Unicode)' : 'GSM-7',
    smsCount,
    singleSmsLimit: singleLimit,
    multiSmsLimit: multiLimit,
    estimatedCost: Number((smsCount * rate).toFixed(2)),
    remainingInCurrentPart: remaining
  };
}

/**
 * Replaces placeholders in template with actual appointment values
 */
export function interpolateTemplate(
  template: string,
  vars: {
    patientName?: string;
    serialNo?: string;
    date?: string;
    time?: string;
    chamberMode?: ChamberMode | string;
    chamberAddress?: string;
    mapsUrl?: string;
    formUrl?: string;
    helpline?: string;
  }
): string {
  const defaults = {
    patientName: vars.patientName || 'রোগীর নাম',
    serialNo: vars.serialNo || 'DD-001',
    date: vars.date || '২০ অক্টোবর ২০২৬',
    time: vars.time || 'বিকাল ৫:৩০',
    chamberAddress: vars.chamberAddress || '২/১, জাহেদা ভিলা, শ্যামলী কল্যাণ সমিতি, শ্যামলী, ঢাকা-১২০৭।',
    mapsUrl: vars.mapsUrl || 'https://maps.app.goo.gl/NgPzAZamW3Ucy8799',
    formUrl: vars.formUrl || 'https://forms.gle/L6YfWn7Z12nV3aK66',
    helpline: vars.helpline || '01712854941'
  };

  return template
    .replace(/{patientName}/g, defaults.patientName)
    .replace(/{serialNo}/g, defaults.serialNo)
    .replace(/{date}/g, defaults.date)
    .replace(/{time}/g, defaults.time)
    .replace(/{chamberAddress}/g, defaults.chamberAddress)
    .replace(/{mapsUrl}/g, defaults.mapsUrl)
    .replace(/{formUrl}/g, defaults.formUrl)
    .replace(/{helpline}/g, defaults.helpline);
}
