import { NextRequest, NextResponse } from 'next/server';
import { adminLoginSchema } from '@/lib/validations/booking';
import { checkRateLimit } from '@/lib/security/rate-limit';
import {
  verifyAdminPassword,
  createSessionToken,
  setSessionCookie
} from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
    
    // Max 5 login attempts per 15 mins per IP
    const rateCheck = checkRateLimit(`login_${ip}`, 5, 15 * 60 * 1000);
    if (!rateCheck.success) {
      return NextResponse.json(
        {
          error:
            'অতিরিক্ত সংখ্যক ভুল লগইন চেষ্টা। অনুগ্রহ করে ১৫ মিনিট পর পুনরায় চেষ্টা করুন।'
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = adminLoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'পাসওয়ার্ড প্রদান করা আবশ্যক।' },
        { status: 400 }
      );
    }

    const { password } = parsed.data;
    const isValid = verifyAdminPassword(password);

    if (!isValid) {
      return NextResponse.json(
        { error: 'ভুল পাসওয়ার্ড! সঠিক পাসওয়ার্ড প্রদান করুন।' },
        { status: 401 }
      );
    }

    // Issue JWT token
    const token = await createSessionToken({
      sub: 'dr-devojyoti-dutta',
      role: 'doctor',
      name: 'আয়ুর্বেদাচার্য ডা. দেবজ্যোতি দত্ত'
    });

    const response = NextResponse.json({
      success: true,
      message: 'সফলভাবে লগইন সম্পন্ন হয়েছে!',
      doctor: {
        name: 'ডা. দেবজ্যোতি দত্ত',
        degrees: 'B.A.M.S. (NIA Jaipur) • B.Sc. (Biotech, KU)',
        role: 'doctor'
      }
    });

    setSessionCookie(response, token);
    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: 'লগইন প্রক্রিয়া ব্যর্থ হয়েছে।' },
      { status: 500 }
    );
  }
}
