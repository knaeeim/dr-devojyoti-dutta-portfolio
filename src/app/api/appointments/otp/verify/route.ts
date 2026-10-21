import { NextRequest, NextResponse } from 'next/server';
import { verifyOtpCode } from '@/lib/security/otp';
import { checkRateLimit } from '@/lib/security/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

    // Rate limit: Max 10 verification attempts per 10 mins per IP
    const rateCheck = checkRateLimit(`otp_verify_${ip}`, 10, 10 * 60 * 1000);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: 'অতিরিক্ত সংখ্যক ভুল চেষ্টা। ১০ মিনিট পর আবার চেষ্টা করুন।' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { phone, email, target, code, challengeToken } = body;
    const verifyTarget = (target || phone || email || '').trim();
    const fallbackTarget = (phone || target || email || '').trim();

    if (!verifyTarget || !code) {
      return NextResponse.json(
        { error: 'যাচাইকরণ নম্বর বা ইমেইল এবং ওটিপি কোড উভয়ই আবশ্যক।' },
        { status: 400 }
      );
    }

    const result = verifyOtpCode(verifyTarget, code, challengeToken, fallbackTarget);
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      token: result.token,
      verifiedToken: result.token
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'ওটিপি যাচাই প্রক্রিয়ায় সমস্যা হয়েছে।' },
      { status: 500 }
    );
  }
}
