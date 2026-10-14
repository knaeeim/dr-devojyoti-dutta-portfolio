import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth/session';
import {
  getAllAppointments,
  updateAppointmentStatus,
  deleteAppointment
} from '@/lib/db/appointments';
import { AppointmentStatus } from '@/types/booking';
import { sendAppointmentConfirmationEmail } from '@/lib/email/service';

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

    let list = await getAllAppointments();

    if (mode && mode !== 'all') {
      list = list.filter((a) => a.chamberMode === mode);
    }

    if (date) {
      list = list.filter((a) => a.appointmentDate === date);
    }

    if (status && status !== 'all') {
      list = list.filter((a) => a.status === status);
    }

    if (query) {
      list = list.filter(
        (a) =>
          a.patientName.toLowerCase().includes(query) ||
          a.phone.toLowerCase().includes(query) ||
          a.serialNo.toLowerCase().includes(query) ||
          (a.email && a.email.toLowerCase().includes(query))
      );
    }

    return NextResponse.json({ success: true, appointments: list });
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

    const allowedStatuses: AppointmentStatus[] = [
      'pending',
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
    if (status === 'confirmed' && updatedApt.email) {
      const emailResult = await sendAppointmentConfirmationEmail(updatedApt);
      emailSent = emailResult.success;
    }

    let successMsg = 'স্ট্যাটাস সফলভাবে পরিবর্তিত হয়েছে।';
    if (status === 'confirmed') {
      successMsg = emailSent
        ? `অ্যাপয়েন্টমেন্ট নিশ্চিত করা হয়েছে এবং ${updatedApt.email} ঠিকানায় ইমেইল পাঠানো হয়েছে।`
        : 'অ্যাপয়েন্টমেন্ট সফলভাবে নিশ্চিত করা হয়েছে।';
    } else if (status === 'cancelled') {
      successMsg = `সিরিয়ালটি (${updatedApt.serialNo}) সফলভাবে বাতিল করা হয়েছে এবং এই ১৫ মিনিটের স্লটটি (${updatedApt.slotTimeBn}) নতুন রোগীর জন্য উন্মুক্ত করা হয়েছে।`;
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
