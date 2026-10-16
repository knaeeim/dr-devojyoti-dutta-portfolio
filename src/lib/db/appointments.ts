import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { Appointment, AppointmentStatus, ChamberMode } from '@/types/booking';
import { generateSerialNo, formatDateToBn, defaultSchedules, isSlotPastTime } from '@/lib/booking/utils';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const DATA_FILE = path.join(process.cwd(), 'data', 'appointments.json');
const TMP_DATA_FILE = path.join(os.tmpdir(), 'dr_dutta_appointments.json');
const TMP_DELETED_FILE = path.join(os.tmpdir(), 'dr_dutta_deleted_ids.json');

// Global in-memory sets to survive hot-reloads and ephemeral executions
declare global {
  // eslint-disable-next-line no-var
  var __drDuttaAppointments: Appointment[] | undefined;
  // eslint-disable-next-line no-var
  var __drDuttaDeletedIds: Set<string> | undefined;
}

if (!globalThis.__drDuttaDeletedIds) {
  globalThis.__drDuttaDeletedIds = new Set<string>();
  try {
    if (fs.existsSync(TMP_DELETED_FILE)) {
      const data = JSON.parse(fs.readFileSync(TMP_DELETED_FILE, 'utf-8'));
      if (Array.isArray(data)) {
        data.forEach((id: string) => globalThis.__drDuttaDeletedIds!.add(id));
      }
    }
  } catch {}
}

function persistDeletedIds() {
  try {
    const list = Array.from(globalThis.__drDuttaDeletedIds || []);
    fs.writeFileSync(TMP_DELETED_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Storage] Could not persist deleted IDs to tmp', err);
  }
}

export function registerDeletedIds(ids: string[]) {
  if (!globalThis.__drDuttaDeletedIds) {
    globalThis.__drDuttaDeletedIds = new Set<string>();
  }
  let changed = false;
  for (const id of ids) {
    if (id && !globalThis.__drDuttaDeletedIds.has(id)) {
      globalThis.__drDuttaDeletedIds.add(id);
      changed = true;
    }
  }
  if (changed) {
    persistDeletedIds();
    if (globalThis.__drDuttaAppointments) {
      globalThis.__drDuttaAppointments = globalThis.__drDuttaAppointments.filter(
        (a) => !globalThis.__drDuttaDeletedIds!.has(a.id)
      );
    }
  }
}

// Initial seed data if file does not exist yet
const INITIAL_SEED: Appointment[] = [
  {
    id: 'APT-1001',
    serialNo: 'DD-DH-261016-01',
    patientName: 'তানভীর আহমেদ',
    phone: '+880 1711-223344',
    email: 'tanvir.ahmed@gmail.com',
    chamberMode: 'offline',
    chamberTitleBn: 'ঢাকা চেম্বার (সরাসরি)',
    appointmentDate: '2026-10-16',
    dateFormattedBn: '১৬ অক্টোবর, ২০২৬ (শুক্রবার)',
    slotId: 'slot_960_975',
    slotTimeBn: '০৪:০০ অপরাহ্ন - ০৪:১৫ অপরাহ্ন',
    slotTimeEn: '04:00 PM - 04:15 PM',
    complaints: 'টাইপ-২ ডায়াবেটিস ও পেটের দীর্ঘদিনের গ্যাস/আইবিএস সমস্যা।',
    status: 'confirmed',
    createdAt: new Date().toISOString()
  },
  {
    id: 'APT-1002',
    serialNo: 'DD-ON-261018-01',
    patientName: 'নাজমা বেগম',
    phone: '+880 1819-887766',
    email: '',
    chamberMode: 'online',
    chamberTitleBn: 'অনলাইন ভিডিও কনসালটেশন',
    appointmentDate: '2026-10-18',
    dateFormattedBn: '১৮ অক্টোবর, ২০২৬ (রবিবার)',
    slotId: 'slot_1140_1155',
    slotTimeBn: '০৭:০০ অপরাহ্ন - ০৭:১৫ অপরাহ্ন',
    slotTimeEn: '07:00 PM - 07:15 PM',
    complaints: 'হরমোনের ভারসাম্যহীনতা ও ফ্যাটি লিভার।',
    status: 'confirmed',
    createdAt: new Date().toISOString()
  }
];

// Helper to safely read appointments with multi-layer fallback
function readStoredAppointments(): Appointment[] {
  const deleted = globalThis.__drDuttaDeletedIds || new Set<string>();

  // 1. Check in-memory cache
  if (globalThis.__drDuttaAppointments && Array.isArray(globalThis.__drDuttaAppointments)) {
    return globalThis.__drDuttaAppointments.filter((a) => !deleted.has(a.id));
  }

  // 2. Check writable tmp directory (survives inside lambda/serverless across warm invocations)
  try {
    if (fs.existsSync(TMP_DATA_FILE)) {
      const content = fs.readFileSync(TMP_DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter((a) => !deleted.has(a.id));
        globalThis.__drDuttaAppointments = filtered;
        return filtered;
      }
    }
  } catch (err) {
    console.warn('Error reading TMP_DATA_FILE', err);
  }

  // 3. Check read-only project static seed file
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter((a) => !deleted.has(a.id));
        globalThis.__drDuttaAppointments = filtered;
        return filtered;
      }
    } else {
      try {
        fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
        fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_SEED, null, 2), 'utf-8');
      } catch {
        // Ignored on read-only serverless filesystems
      }
    }
  } catch (err) {
    console.warn('Error reading data/appointments.json, using fallback seed', err);
  }

  const filtered = INITIAL_SEED.filter((a) => !deleted.has(a.id));
  globalThis.__drDuttaAppointments = filtered;
  return filtered;
}

// Helper to safely write to JSON file with serverless fallback
function writeStoredAppointments(list: Appointment[]) {
  const deleted = globalThis.__drDuttaDeletedIds || new Set<string>();
  const sanitized = list.filter((a) => !deleted.has(a.id));
  globalThis.__drDuttaAppointments = sanitized;

  // Always write to TMP_DATA_FILE (writable in Vercel/AWS Lambda/Render/Node)
  try {
    fs.writeFileSync(TMP_DATA_FILE, JSON.stringify(sanitized, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Error writing TMP_DATA_FILE', err);
  }

  // Also attempt writing to DATA_FILE if local environment allows
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(sanitized, null, 2), 'utf-8');
  } catch {
    // Expected on read-only serverless filesystems
  }
}

export async function getAllAppointments(): Promise<Appointment[]> {
  const deleted = globalThis.__drDuttaDeletedIds || new Set<string>();
  const apptMap = new Map<string, Appointment>();

  // 1. Seed from local store
  const stored = readStoredAppointments();
  stored.filter((a) => !deleted.has(a.id)).forEach((a) => apptMap.set(a.id, a));

  // 2. Merge from Supabase
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        data
          .filter((row) => !deleted.has(row.id))
          .forEach((row) => {
            apptMap.set(row.id, {
              id: row.id,
              serialNo: row.serial_no,
              patientName: row.patient_name,
              phone: row.phone,
              email: row.email || undefined,
              chamberMode: row.chamber_mode as ChamberMode,
              chamberTitleBn: row.chamber_title_bn,
              appointmentDate: row.appointment_date,
              dateFormattedBn: row.date_formatted_bn,
              slotId: row.slot_id,
              slotTimeBn: row.slot_time_bn,
              slotTimeEn: row.slot_time_en,
              complaints: row.complaints,
              status: row.status as AppointmentStatus,
              rescheduledReason: row.rescheduled_reason || undefined,
              rescheduledAt: row.rescheduled_at || undefined,
              cancellationReason: row.cancellation_reason || undefined,
              cancelledAt: row.cancelled_at || undefined,
              createdAt: row.created_at
            });
          });
      }
    } catch (e) {
      console.warn('Supabase query failed, using local file store', e);
    }
  }

  const result = Array.from(apptMap.values()).sort((a, b) => {
    const dDiff = (b.appointmentDate || '').localeCompare(a.appointmentDate || '');
    if (dDiff !== 0) return dDiff;
    const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tB - tA;
  });

  return result;
}

/**
 * Returns booked slots for a given date and chamber mode.
 * CRITICAL: Combines local store and Supabase, so a booked slot is NEVER missed!
 * Cancelled appointments NEVER count as booked.
 */
export async function getBookedSlotsForDate(dateStr: string, mode: ChamberMode): Promise<string[]> {
  const bookedSet = new Set<string>();

  // 1. Check local file store
  try {
    const local = readStoredAppointments();
    local
      .filter((a) => a.appointmentDate === dateStr && a.chamberMode === mode && a.status !== 'cancelled')
      .forEach((a) => bookedSet.add(a.slotId));
  } catch (err) {
    console.warn('Local read in getBookedSlotsForDate error:', err);
  }

  // 2. Check Supabase and merge
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('slot_id, status')
        .eq('appointment_date', dateStr)
        .eq('chamber_mode', mode)
        .neq('status', 'cancelled');

      if (!error && Array.isArray(data)) {
        data.forEach((d) => bookedSet.add(d.slot_id));
      }
    } catch (e) {
      console.warn('Supabase slot query failed, using local store', e);
    }
  }

  return Array.from(bookedSet);
}

export async function createAppointment(params: {
  patientName: string;
  phone: string;
  email?: string;
  chamberMode: ChamberMode;
  appointmentDate: string;
  slotId: string;
  slotTimeBn: string;
  slotTimeEn: string;
  complaints?: string;
  status?: AppointmentStatus;
  bypassPastCheck?: boolean;
}): Promise<Appointment> {
  const allAppointments = await getAllAppointments();

  // Check if slot time has passed (Time Over check)
  const slotParts = params.slotId.replace('slot_', '').split('_').map(Number);
  const startMin = slotParts[0] || 0;
  if (!params.bypassPastCheck && isSlotPastTime(params.appointmentDate, startMin)) {
    throw new Error('এই সময় স্লটটির সময় ইতোমধ্যে শেষ (টাইম ওভার) হয়ে গেছে। অনুগ্রহ করে পরবর্তী কোনো উন্মুক্ত সময় বেছে নিন।');
  }

  // Check if slot already booked by an active (non-cancelled) appointment
  const alreadyBooked = allAppointments.some(
    (a) =>
      a.appointmentDate === params.appointmentDate &&
      a.chamberMode === params.chamberMode &&
      a.slotId === params.slotId &&
      a.status !== 'cancelled'
  );

  if (alreadyBooked) {
    throw new Error('দুঃখিত, এই সময় স্লটটি ইতোমধ্যে অন্য রোগী বুক করে ফেলেছেন। অনুগ্রহ করে অন্য সময় বেছে নিন।');
  }

  // Count active bookings on same day for serial number calculation
  const countSameDay = allAppointments.filter(
    (a) => a.appointmentDate === params.appointmentDate && a.chamberMode === params.chamberMode && a.status !== 'cancelled'
  ).length;

  const serialNo = generateSerialNo(params.chamberMode, params.appointmentDate, countSameDay);
  const chamberTitleBn = defaultSchedules[params.chamberMode].titleBn;
  const dateFormattedBn = formatDateToBn(params.appointmentDate);

  const newAppointment: Appointment = {
    id: `APT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    serialNo,
    patientName: params.patientName,
    phone: params.phone,
    email: params.email || '',
    chamberMode: params.chamberMode,
    chamberTitleBn,
    appointmentDate: params.appointmentDate,
    dateFormattedBn,
    slotId: params.slotId,
    slotTimeBn: params.slotTimeBn,
    slotTimeEn: params.slotTimeEn,
    complaints: params.complaints || '',
    status: params.status || 'pending',
    createdAt: new Date().toISOString()
  };

  const supabase = await createServerSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          id: newAppointment.id,
          serial_no: newAppointment.serialNo,
          patient_name: newAppointment.patientName,
          phone: newAppointment.phone,
          email: newAppointment.email,
          chamber_mode: newAppointment.chamberMode,
          chamber_title_bn: newAppointment.chamberTitleBn,
          appointment_date: newAppointment.appointmentDate,
          date_formatted_bn: newAppointment.dateFormattedBn,
          slot_id: newAppointment.slotId,
          slot_time_bn: newAppointment.slotTimeBn,
          slot_time_en: newAppointment.slotTimeEn,
          complaints: newAppointment.complaints,
          status: newAppointment.status
        })
        .select()
        .single();

      if (!error && data) {
        const stored = readStoredAppointments();
        stored.unshift(newAppointment);
        writeStoredAppointments(stored);
        return newAppointment;
      }
    } catch (e) {
      console.warn('Supabase insert failed, storing in file fallback', e);
    }
  }

  const stored = readStoredAppointments();
  stored.unshift(newAppointment);
  writeStoredAppointments(stored);
  return newAppointment;
}

export async function getAppointmentById(id: string): Promise<Appointment | null> {
  const deleted = globalThis.__drDuttaDeletedIds || new Set<string>();
  if (deleted.has(id)) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        return {
          id: data.id,
          serialNo: data.serial_no,
          patientName: data.patient_name,
          phone: data.phone,
          email: data.email || undefined,
          chamberMode: data.chamber_mode as ChamberMode,
          chamberTitleBn: data.chamber_title_bn,
          appointmentDate: data.appointment_date,
          dateFormattedBn: data.date_formatted_bn,
          slotId: data.slot_id,
          slotTimeBn: data.slot_time_bn,
          slotTimeEn: data.slot_time_en,
          complaints: data.complaints,
          status: data.status as AppointmentStatus,
          rescheduledReason: data.rescheduled_reason || undefined,
          rescheduledAt: data.rescheduled_at || undefined,
          cancellationReason: data.cancellation_reason || undefined,
          cancelledAt: data.cancelled_at || undefined,
          createdAt: data.created_at
        };
      }
    } catch (e) {
      console.warn('Supabase query by ID failed, using file fallback', e);
    }
  }

  const stored = readStoredAppointments();
  const found = stored.find((a) => a.id === id);
  return found ? { ...found } : null;
}

export async function updateAppointmentStatus(
  id: string,
  newStatus: AppointmentStatus,
  reason?: string
): Promise<Appointment | null> {
  const deleted = globalThis.__drDuttaDeletedIds || new Set<string>();
  if (deleted.has(id)) {
    return null;
  }

  const nowIso = new Date().toISOString();

  // 1. Fetch current appointment either from Supabase or local store
  const existing = await getAppointmentById(id);
  if (!existing) {
    return null;
  }

  // 2. If restoring/un-cancelling a previously cancelled appointment, verify the slot hasn't been taken
  if (existing.status === 'cancelled' && newStatus !== 'cancelled') {
    const booked = await getBookedSlotsForDate(existing.appointmentDate, existing.chamberMode);
    if (booked.includes(existing.slotId)) {
      throw new Error(
        'এই স্লটটি বাতিল থাকার সময় অন্য একজন রোগী বুক করে ফেলেছেন। অনুগ্রহ করে অন্য তারিখে বা সময়ে রিশিডিউল করুন।'
      );
    }
  }

  const finalCancellationReason =
    newStatus === 'cancelled' ? reason || 'অ্যাডমিন কর্তৃক বাতিল করা হয়েছে' : undefined;
  const finalCancelledAt = newStatus === 'cancelled' ? nowIso : undefined;

  const updatedItem: Appointment = {
    ...existing,
    status: newStatus,
    cancellationReason: finalCancellationReason,
    cancelledAt: finalCancelledAt
  };

  // 3. Update Supabase if active
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          status: newStatus,
          cancellation_reason: finalCancellationReason || null,
          cancelled_at: finalCancelledAt || null,
          updated_at: nowIso
        })
        .eq('id', id);

      if (error) {
        console.warn('Supabase update returned error:', error);
      }
    } catch (e) {
      console.warn('Supabase update failed', e);
    }
  }

  // 4. Also update local in-memory & file store to stay consistent
  try {
    const stored = readStoredAppointments();
    const existingIdx = stored.findIndex((a) => a.id === id);
    if (existingIdx !== -1) {
      stored[existingIdx] = { ...updatedItem };
    } else {
      stored.unshift({ ...updatedItem });
    }
    writeStoredAppointments(stored);
  } catch {}

  return updatedItem;
}

export async function deleteAppointment(id: string): Promise<boolean> {
  // 1. Mark ID in deleted set & persist
  if (!globalThis.__drDuttaDeletedIds) {
    globalThis.__drDuttaDeletedIds = new Set<string>();
  }
  globalThis.__drDuttaDeletedIds.add(id);
  persistDeletedIds();

  // 2. Remove from active memory list & write to file stores
  const stored = readStoredAppointments();
  const nextList = stored.filter((a) => a.id !== id);
  writeStoredAppointments(nextList);

  // 3. Remove from Supabase if active
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('appointments').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase delete failed', e);
    }
  }
  return true;
}

export async function rescheduleAppointment(params: {
  id: string;
  newDate: string;
  newSlotId: string;
  newSlotTimeBn: string;
  newSlotTimeEn: string;
  reason?: string;
}): Promise<{ appointment: Appointment; previous: { date: string; time: string } }> {
  // 1. Fetch existing appointment from Supabase or local store
  const existingApt = await getAppointmentById(params.id);
  if (!existingApt) {
    throw new Error('অ্যাপয়েন্টমেন্ট পাওয়া যায়নি।');
  }

  // 2. Check if new slot time has passed
  const slotParts = params.newSlotId.replace('slot_', '').split('_').map(Number);
  const startMin = slotParts[0] || 0;
  if (isSlotPastTime(params.newDate, startMin)) {
    throw new Error('এই সময় স্লটটির সময় ইতোমধ্যে শেষ (টাইম ওভার) হয়ে গেছে। অনুগ্রহ করে পরবর্তী কোনো উন্মুক্ত সময় নির্বাচন করুন।');
  }

  // Check if slot already booked on new date by another active appointment
  const booked = await getBookedSlotsForDate(params.newDate, existingApt.chamberMode);
  if (booked.includes(params.newSlotId)) {
    throw new Error('দুঃখিত, নির্বাচিত নতুন স্লটটি ইতোমধ্যে অন্য রোগী বুক করে রেখেছেন। অন্য স্লট নির্বাচন করুন।');
  }

  const previous = {
    date: existingApt.dateFormattedBn,
    time: existingApt.slotTimeBn
  };

  const newDateFormattedBn = formatDateToBn(params.newDate);
  const nowIso = new Date().toISOString();

  const updatedApt: Appointment = {
    ...existingApt,
    appointmentDate: params.newDate,
    dateFormattedBn: newDateFormattedBn,
    slotId: params.newSlotId,
    slotTimeBn: params.newSlotTimeBn,
    slotTimeEn: params.newSlotTimeEn,
    status: 'rescheduled',
    rescheduledReason: params.reason,
    rescheduledAt: nowIso
  };

  // 3. Update Supabase if active
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          appointment_date: params.newDate,
          date_formatted_bn: newDateFormattedBn,
          slot_id: params.newSlotId,
          slot_time_bn: params.newSlotTimeBn,
          slot_time_en: params.newSlotTimeEn,
          status: 'rescheduled',
          rescheduled_reason: params.reason || null,
          rescheduled_at: nowIso,
          updated_at: nowIso
        })
        .eq('id', params.id);

      if (error) {
        console.warn('Supabase reschedule update error:', error);
      }
    } catch (e) {
      console.warn('Supabase reschedule update failed', e);
    }
  }

  // 4. Also update local in-memory & file store
  try {
    const stored = readStoredAppointments();
    const existingIdx = stored.findIndex((a) => a.id === params.id);
    if (existingIdx !== -1) {
      stored[existingIdx] = { ...updatedApt };
    } else {
      stored.unshift({ ...updatedApt });
    }
    writeStoredAppointments(stored);
  } catch {}

  return { appointment: updatedApt, previous };
}
