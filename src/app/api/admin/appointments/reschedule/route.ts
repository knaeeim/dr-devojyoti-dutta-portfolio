import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth/session';
import { rescheduleAppointment } from '@/lib/db/appointments';
import { sendAppointmentRescheduleEmail } from '@/lib/email/service';

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json(
        { error: 'অনুমতি নেই। অনুগ্রহ করে লগইন করুন।' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, newDate, newSlotId, newSlotTimeBn, newSlotTimeEn, reason } = body;

    if (!id || !newDate || !newSlotId || !newSlotTimeBn) {
      return NextResponse.json(
        { error: 'নতুন তারিখ, স্লট আইডি ও সময় প্রদান করা আবশ্যক।' },
        { status: 400 }
      );
    }

    const { appointment: updatedApt, previous } = await rescheduleAppointment({
      id,
      newDate,
      newSlotId,
      newSlotTimeBn,
      newSlotTimeEn: newSlotTimeEn || newSlotTimeBn,
      reason
    });

    let emailSent = false;
    if (updatedApt.email) {
      const emailResult = await sendAppointmentRescheduleEmail(
        updatedApt,
        previous,
        reason
      );
      emailSent = emailResult.success;
    }

    const successMsg = 'সিরিয়াল সফলভাবে রিশিডিউল করা হয়েছে।';

    return NextResponse.json({
      success: true,
      appointment: updatedApt,
      previous,
      emailSent,
      message: successMsg
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'সময়সূচী পরিবর্তন ব্যর্থ হয়েছে।' },
      { status: 400 }
    );
  }
}
