import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth/session';
import {
  getAllAppointments,
  createAppointment,
  updateAppointmentStatus,
  deleteAppointment,
  registerDeletedIds
} from '@/lib/db/appointments';
import { AppointmentStatus, ChamberMode } from '@/types/booking';
import { sendAppointmentConfirmationEmail } from '@/lib/email/service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    const {
      patientName,
      phone,
      email,
      chamberMode,
      appointmentDate,
      slotId,
      slotTimeBn,
      slotTimeEn,
      complaints,
      status = 'confirmed',
      bypassPastCheck = true
    } = body;

    if (!patientName?.trim() || !phone?.trim()) {
      return NextResponse.json(
        { error: 'রোগীর নাম এবং মোবাইল নম্বর প্রদান করা আবশ্যক।' },
        { status: 400 }
      );
    }

    if (!chamberMode || !['offline', 'online'].includes(chamberMode)) {
      return NextResponse.json(
        { error: 'সঠিক চেম্বার মাধ্যম (offline বা online) নির্বাচন করুন।' },
        { status: 400 }
      );
    }

    if (!appointmentDate || !slotId) {
      return NextResponse.json(
        { error: 'তারিখ এবং সময় স্লট নির্বাচন করা আবশ্যক।' },
        { status: 400 }
      );
    }

    const newAppointment = await createAppointment({
      patientName: patientName.trim(),
      phone: phone.trim(),
      email: email?.trim() || '',
      chamberMode: chamberMode as ChamberMode,
      appointmentDate,
      slotId,
      slotTimeBn: slotTimeBn || 'নির্ধারিত সময়',
      slotTimeEn: slotTimeEn || 'Scheduled Time',
      complaints: complaints?.trim() || '',
      status: (status as AppointmentStatus) || 'confirmed',
      bypassPastCheck: Boolean(bypassPastCheck)
    });

    let emailSent = false;

    return NextResponse.json({
      success: true,
      appointment: newAppointment,
      emailSent,
      message: `সিরিয়াল (${newAppointment.serialNo}) সফলভাবে নিশ্চিত ও বুকিং সম্পন্ন হয়েছে!`
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'অ্যাপয়েন্টমেন্ট বুকিং তৈরি করতে ব্যর্থ হয়েছে।' },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json(
        { error: 'অনুমতি নেই। অনুগ্রহ করে লগইন করুন।' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');
    const date = searchParams.get('date');
    const status = searchParams.get('status');
    const query = (searchParams.get('query') || '').toLowerCase().trim();
    const deletedQuery = searchParams.get('deleted_ids');

    if (deletedQuery) {
      try {
        const parsed = JSON.parse(deletedQuery);
        if (Array.isArray(parsed) && parsed.length > 0) {
          registerDeletedIds(parsed);
        }
      } catch {}
    }

    let list = await getAllAppointments({
      mode: mode && mode !== 'all' ? mode : undefined,
      date: date || undefined,
      status: status && status !== 'all' ? status : undefined
    });

    if (query) {
      list = list.filter(
        (a) =>
          a.patientName.toLowerCase().includes(query) ||
          a.phone.toLowerCase().includes(query) ||
          a.serialNo.toLowerCase().includes(query) ||
          (a.email && a.email.toLowerCase().includes(query))
      );
    }

    return NextResponse.json(
      { success: true, appointments: list },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store'
        }
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: 'অ্যাপয়েন্টমেন্ট লোড করতে ব্যর্থ হয়েছে।' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json(
        { error: 'অনুমতি নেই। অনুগ্রহ করে লগইন করুন।' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, status, reason } = body;

    if (status === 'pending') {
      return NextResponse.json(
        {
          error:
            'অপেক্ষমাণ (Pending) স্ট্যাটাস শুধুমাত্র নতুন রোগীর প্রথম আবেদনের জন্য প্রযোজ্য। প্যানেল থেকে কোনো সিরিয়াল পুনরায় অপেক্ষমাণ করা যাবে না।'
        },
        { status: 400 }
      );
    }

    const allowedStatuses: AppointmentStatus[] = [
      'confirmed',
      'rescheduled',
      'completed',
      'cancelled'
    ];

    if (!id || !status || !allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'সঠিক আইডি ও স্ট্যাটাস প্রদান করুন।' },
        { status: 400 }
      );
    }

    const updatedApt = await updateAppointmentStatus(id, status as AppointmentStatus, reason);
    if (!updatedApt) {
      return NextResponse.json(
        { error: 'অ্যাপয়েন্টমেন্ট পাওয়া যায়নি।' },
        { status: 404 }
      );
    }

    let emailSent = false;
    let successMsg = 'স্ট্যাটাস সফলভাবে পরিবর্তিত হয়েছে।';
    if (status === 'confirmed') {
      successMsg = 'অ্যাপয়েন্টমেন্ট সফলভাবে নিশ্চিত করা হয়েছে।';
    } else if (status === 'cancelled') {
      successMsg = `সিরিয়ালটি (${updatedApt.serialNo}) সফলভাবে বাতিল করা হয়েছে এবং এই সময় স্লটটি (${updatedApt.slotTimeBn}) নতুন রোগীর জন্য উন্মুক্ত করা হয়েছে।`;
    }

    return NextResponse.json({
      success: true,
      appointment: updatedApt,
      emailSent,
      message: successMsg
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json(
        { error: 'অনুমতি নেই। অনুগ্রহ করে লগইন করুন।' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'অ্যাপয়েন্টমেন্ট আইডি প্রদান করুন।' },
        { status: 400 }
      );
    }

    await deleteAppointment(id);

    return NextResponse.json({
      success: true,
      message: 'সিরিয়ালটি সফলভাবে স্থায়ীভাবে মুছে ফেলা হয়েছে।'
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'সিরিয়াল মুছতে ব্যর্থ হয়েছে।' },
      { status: 500 }
    );
  }
}
