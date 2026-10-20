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
    const { phone, patientName, channel, patientOrigin } = body;

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        { error: 'মোবাইল বা হোয়াটসঅ্যাপ নম্বর প্রদান করা আবশ্যক।' },
        { status: 400 }
      );
    }

    const isInternational = channel === 'whatsapp' || patientOrigin === 'abroad' || patientOrigin === 'international';
    const cleanPhone = phone.trim().replace(/[\s\-()]/g, '');

    if (!isInternational) {
      if (!phoneRegex.test(cleanPhone)) {
        return NextResponse.json(
          { error: 'সঠিক বাংলাদেশী মোবাইল নম্বর (যেমন: 017XXXXXXXX) প্রদান করুন।' },
          { status: 400 }
        );
      }
    } else {
      if (!/^\+?[1-9]\d{6,14}$/.test(cleanPhone)) {
        return NextResponse.json(
          { error: 'সঠিক আন্তর্জাতিক হোয়াটসঅ্যাপ নম্বর (কান্ট্রি কোড সহ, যেমন: +44 7911 123456) প্রদান করুন।' },
          { status: 400 }
        );
      }
    }

    const selectedChannel = isInternational ? 'whatsapp' : 'sms';
    const result = await sendOtp(cleanPhone, patientName, selectedChannel);
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      channel: result.channel,
      expiresInSeconds: result.expiresInSeconds,
      challengeToken: result.challengeToken,
      debugCode: result.debugCode,
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
