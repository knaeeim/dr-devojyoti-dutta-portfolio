import { NextRequest, NextResponse } from 'next/server';
import { appointmentBookingSchema } from '@/lib/validations/booking';
import { checkRateLimit } from '@/lib/security/rate-limit';
import {
  createAppointment,
  getBookedSlotsForDate
} from '@/lib/db/appointments';
import { isPhoneVerified } from '@/lib/security/otp';
import { ChamberMode } from '@/types/booking';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const mode = (searchParams.get('mode') || 'offline') as ChamberMode;

    if (!date) {
      return NextResponse.json(
        { error: 'তারিখ প্রদান করা আবশ্যক' },
        { status: 400 }
      );
    }

    const bookedSlotIds = await getBookedSlotsForDate(date, mode);
    return NextResponse.json({ success: true, bookedSlotIds });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'স্লট তথ্য লোড করতে ব্যর্থ হয়েছে।' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. IP-based rate limiting (5 bookings per 5 mins per IP)
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
    const rateCheck = checkRateLimit(`booking_${ip}`, 5, 5 * 60 * 1000);

    if (!rateCheck.success) {
      return NextResponse.json(
        {
          error:
            'অতিরিক্ত সংখ্যক অনুরোধ পাওয়া গেছে। অনুগ্রহ করে ৫ মিনিট পর আবার চেষ্টা করুন।'
        },
        { status: 429 }
      );
    }

    // 2. Validate input
    const body = await request.json();
    const parsed = appointmentBookingSchema.safeParse(body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        { error: issue ? issue.message : 'প্রদত্ত তথ্য সঠিক নয়।' },
        { status: 400 }
      );
    }

    const { patientName, phone, email, chamberMode, appointmentDate, slotId, complaints } =
      parsed.data;

    // Validate OTP verification to prevent fake bookings
    const otpToken = body.otpToken;
    const isVerified = isPhoneVerified(phone, otpToken);
    if (!isVerified) {
      return NextResponse.json(
        {
          error:
            'ফলস বুকিং রোধে মোবাইল নম্বরে প্রেরিত ওটিপি (OTP) যাচাই করা বাধ্যতামূলক। অনুগ্রহ করে ওটিপি ভেরিফাই করে পুনরায় চেষ্টা করুন।'
        },
        { status: 403 }
      );
    }

    // Slot time parsing
    const slotParts = slotId.replace('slot_', '').split('_').map(Number);
    const startMin = slotParts[0] || 960;
    const endMin = slotParts[1] || 975;

    // Helper formatting for slot
    const formatH = (min: number) => {
      let h = Math.floor(min / 60);
      const m = min % 60;
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      const padM = m < 10 ? '0' + m : m;
      const padH = h < 10 ? '0' + h : h;
      return `${padH}:${padM} ${ampm}`;
    };

    const slotTimeEn = `${formatH(startMin)} - ${formatH(endMin)}`;
    const slotTimeBn = body.slotTimeBn || slotTimeEn;

    // 3. Create appointment in DB
    const appointment = await createAppointment({
      patientName,
      phone,
      email: email || undefined,
      chamberMode,
      appointmentDate,
      slotId,
      slotTimeBn,
      slotTimeEn,
      complaints
    });

    return NextResponse.json({
      success: true,
      message: 'অ্যাপয়েন্টমেন্ট সফলভাবে নিবন্ধিত হয়েছে!',
      appointment
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'বুকিং সম্পন্ন করা সম্ভব হয়নি।' },
      { status: 400 }
    );
  }
}
