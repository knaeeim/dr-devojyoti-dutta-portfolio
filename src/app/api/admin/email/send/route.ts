import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth/session';
import { sendCustomAdminEmail } from '@/lib/email/service';
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
    const { email, message, appointmentId, patientName, serialNo, subject } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'সঠিক ইমেইল ঠিকানা প্রদান করা আবশ্যক।' },
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'ইমেইল বার্তা খালি রাখা যাবে না।' },
        { status: 400 }
      );
    }

    // 3. Dispatch Email directly via verified SMTP / Resend
    const result = await sendCustomAdminEmail({
      to: email.trim(),
      message: message.trim(),
      patientName: patientName ? String(patientName) : undefined,
      serialNo: serialNo ? String(serialNo) : undefined,
      subject: subject ? String(subject) : undefined
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'ইমেইল পাঠাতে ব্যর্থ হয়েছে।'
        },
        { status: 400 }
      );
    }

    // 4. Mark appointment as messaged if appointmentId is supplied
    if (appointmentId) {
      await markAppointmentMessageSent(appointmentId, 'email');
    }

    return NextResponse.json({
      success: true,
      message: 'রোগীর ইমেইলে সফলভাবে বার্তা পাঠানো হয়েছে!',
      messageId: result.messageId,
      provider: result.provider,
      messageSent: true
    });
  } catch (err: unknown) {
    console.error('[Admin Send Email API Error]:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'সার্ভার ত্রুটি ঘটেছে।' },
      { status: 500 }
    );
  }
}
