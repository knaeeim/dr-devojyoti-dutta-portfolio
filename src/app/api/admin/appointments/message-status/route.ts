import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth/session';
import { markAppointmentMessageSent } from '@/lib/db/appointments';

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
    const { appointmentId, channel = 'manual', sent = true } = body;

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'অ্যাপয়েন্টমেন্ট আইডি প্রদান করা আবশ্যক।' },
        { status: 400 }
      );
    }

    await markAppointmentMessageSent(appointmentId, channel, sent);

    return NextResponse.json({
      success: true,
      appointmentId,
      messageSent: sent,
      channel,
      sentAt: sent ? new Date().toISOString() : null
    });
  } catch (err: unknown) {
    console.error('[Admin Message Status API Error]:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'সার্ভার ত্রুটি ঘটেছে।' },
      { status: 500 }
    );
  }
}
