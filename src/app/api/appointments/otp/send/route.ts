import { NextRequest, NextResponse } from 'next/server';
import { sendOtp } from '@/lib/security/otp';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { phoneRegex } from '@/lib/validations/booking';

export async function POST(request: NextRequest) {
  try {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

    // Rate limit: Max 6 OTP requests per 10 minutes per IP
    const rateCheck = checkRateLimit(`otp_send_${ip}`, 6, 10 * 60 * 1000);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: 'অতিরিক্ত সংখ্যক অনুরোধ। অনুগ্রহ করে ১০ মিনিট পর আবার চেষ্টা করুন।' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { phone, email, patientName, channel, patientOrigin } = body;

    const isAbroad =
      channel === 'email' ||
      patientOrigin === 'abroad' ||
      patientOrigin === 'international';

    let target = '';
    let selectedChannel: 'sms' | 'email' | 'whatsapp' = 'sms';

    if (isAbroad) {
      const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
      if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return NextResponse.json(
          { error: 'বিদেশে অবস্থানরত রোগীদের জন্য সঠিক ইমেইল ঠিকানা প্রদান করা আবশ্যক (ওটিপি পাঠানোর জন্য)।' },
          { status: 400 }
        );
      }
      target = cleanEmail;
      selectedChannel = 'email';
    } else {
      if (!phone || typeof phone !== 'string') {
        return NextResponse.json(
          { error: 'সচল মোবাইল নম্বর প্রদান করা আবশ্যক।' },
          { status: 400 }
        );
      }

      const cleanPhone = phone.trim().replace(/[\s\-()]/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        return NextResponse.json(
          { error: 'সঠিক বাংলাদেশী মোবাইল নম্বর (যেমন: 017XXXXXXXX) প্রদান করুন।' },
          { status: 400 }
        );
      }
      target = cleanPhone;
      selectedChannel = 'sms';
    }

    const result = await sendOtp(target, patientName, selectedChannel);
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      channel: result.channel,
      target,
      expiresInSeconds: result.expiresInSeconds,
      challengeToken: result.challengeToken,
      emailSent: result.emailSent,
      smsSent: result.smsSent,
      whatsappSent: result.whatsappSent,
      gatewayError: result.gatewayError
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'ওটিপি প্রেরণে সমস্যা দেখা দিয়েছে।' },
      { status: 500 }
    );
  }
}
