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
    const { phone, patientName } = body;

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        { error: 'মোবাইল নম্বর প্রদান করা আবশ্যক।' },
        { status: 400 }
      );
    }

    if (!phoneRegex.test(phone.trim())) {
      return NextResponse.json(
        { error: 'সঠিক বাংলাদেশী মোবাইল নম্বর (যেমন: 017XXXXXXXX) প্রদান করুন।' },
        { status: 400 }
      );
    }

    const result = await sendOtp(phone, patientName);
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      expiresInSeconds: result.expiresInSeconds,
      challengeToken: result.challengeToken,
      debugCode: result.debugCode,
      smsSent: result.smsSent,
      gatewayError: result.gatewayError
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'ওটিপি প্রেরণে সমস্যা দেখা দিয়েছে।' },
      { status: 500 }
    );
  }
}
