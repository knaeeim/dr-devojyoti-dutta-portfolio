import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth/session';
import { sendDirectSms } from '@/lib/sms/service';
import { markAppointmentMessageSent } from '@/lib/db/appointments';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate admin session
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json(
        { error: 'অনুমতি নেই। অনুগ্রহ করে অ্যাডমিন হিসেবে লগইন করুন।' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const { phone, message, appointmentId } = body;

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        { error: 'গ্রহীতার ফোন নম্বর প্রদান করা আবশ্যক।' },
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'এসএমএস বার্তা খালি রাখা যাবে না।' },
        { status: 400 }
      );
    }

    // 3. Dispatch SMS directly via BulkSMSBD Gateway
    const result = await sendDirectSms(phone, message.trim());

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'এসএমএস পাঠাতে ব্যর্থ হয়েছে।',
          responseCode: result.responseCode
        },
        { status: 400 }
      );
    }

    // 4. Mark appointment as messaged if appointmentId is supplied
    if (appointmentId) {
      await markAppointmentMessageSent(appointmentId, 'sms');
    }

    return NextResponse.json({
      success: true,
      message: result.message || 'রোগীর মোবাইলে সফলভাবে এসএমএস পাঠানো হয়েছে!',
      responseCode: result.responseCode,
      messageSent: true
    });
  } catch (err: unknown) {
    console.error('[Admin Send SMS API Error]:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'সার্ভার ত্রুটি ঘটেছে।' },
      { status: 500 }
    );
  }
}
