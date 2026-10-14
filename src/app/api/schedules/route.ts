import { NextRequest, NextResponse } from 'next/server';
import { getChamberSchedules, saveChamberSchedules } from '@/lib/db/schedules';
import { getSessionFromCookies } from '@/lib/auth/session';

export async function GET() {
  try {
    const schedules = await getChamberSchedules();
    return NextResponse.json({ success: true, schedules });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'শিডিউল লোড করতে ব্যর্থ হয়েছে।' },
      { status: 500 }
    );
  }
}

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
    if (!body || !body.offline || !body.online) {
      return NextResponse.json(
        { error: 'ভুল শিডিউল ফরম্যাট।' },
        { status: 400 }
      );
    }

    await saveChamberSchedules(body);
    return NextResponse.json({
      success: true,
      message: 'চেম্বার শিডিউল সফলভাবে সংরক্ষণ করা হয়েছে।'
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'শিডিউল সংরক্ষণ করতে সমস্যা হয়েছে।' },
      { status: 500 }
    );
  }
}
