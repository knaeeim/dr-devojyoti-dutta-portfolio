import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies, updateAdminPassword } from '@/lib/auth/session';
import { checkRateLimit } from '@/lib/security/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // 1. Verify authenticated session
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json(
        { error: 'অননুমোদিত প্রবেশ। অনুগ্রহ করে পুনরায় লগইন করুন।' },
        { status: 401 }
      );
    }

    // 2. Rate limit password change attempts (max 5 per 15 minutes)
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
    const rateCheck = checkRateLimit(`change_pwd_${ip}`, 5, 15 * 60 * 1000);

    if (!rateCheck.success) {
      return NextResponse.json(
        {
          error:
            'অতিরিক্ত সংখ্যক চেষ্টা করা হয়েছে। ১৫ মিনিট পর পুনরায় চেষ্টা করুন।'
        },
        { status: 429 }
      );
    }

    // 3. Parse and validate payload
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'বর্তমান এবং নতুন পাসওয়ার্ড উভয়ই প্রদান করা আবশ্যক।' },
        { status: 400 }
      );
    }

    if (typeof newPassword !== 'string' || newPassword.trim().length < 6) {
      return NextResponse.json(
        { error: 'নতুন পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে।' },
        { status: 400 }
      );
    }

    const result = updateAdminPassword(currentPassword, newPassword);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে! পরবর্তী লগইনে নতুন পাসওয়ার্ড ব্যবহার করুন।'
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'পাসওয়ার্ড প্রক্রিয়াকরণে অপ্রত্যাশিত ত্রুটি ঘটেছে।' },
      { status: 500 }
    );
  }
}
