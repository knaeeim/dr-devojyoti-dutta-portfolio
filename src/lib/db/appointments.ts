import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { Appointment, AppointmentStatus, ChamberMode } from '@/types/booking';
import { generateSerialNo, formatDateToBn, defaultSchedules, isSlotPastTime } from '@/lib/booking/utils';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const DATA_FILE = path.join(process.cwd(), 'data', 'appointments.json');
const TMP_DATA_FILE = path.join(os.tmpdir(), 'dr_dutta_appointments.json');
const TMP_DELETED_FILE = path.join(os.tmpdir(), 'dr_dutta_deleted_ids.json');
const SENT_MESSAGES_FILE = path.join(process.cwd(), 'data', 'sent-messages.json');
const TMP_SENT_MESSAGES_FILE = path.join(os.tmpdir(), 'dr_dutta_sent_messages.json');

export interface SentMessageInfo {
  sent: boolean;
  sentAt: string;
  channel?: 'sms' | 'whatsapp' | 'manual';
}

// Global in-memory sets to survive hot-reloads and ephemeral executions
declare global {
  // eslint-disable-next-line no-var
  var __drDuttaAppointments: Appointment[] | undefined;
  // eslint-disable-next-line no-var
  var __drDuttaDeletedIds: Set<string> | undefined;
  // eslint-disable-next-line no-var
  var __drDuttaSentMessages: Record<string, SentMessageInfo> | undefined;
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

export async function getDeletedIdsFromDb(): Promise<Set<string>> {
  if (!globalThis.__drDuttaDeletedIds) {
    globalThis.__drDuttaDeletedIds = new Set<string>();
  }

  // 1. Check local tmp file
  try {
    if (fs.existsSync(TMP_DELETED_FILE)) {
      const data = JSON.parse(fs.readFileSync(TMP_DELETED_FILE, 'utf-8'));
      if (Array.isArray(data)) {
        data.forEach((id: string) => globalThis.__drDuttaDeletedIds!.add(id));
      }
    }
  } catch {}

  // 2. Check Supabase chamber_schedules for persistent deleted_ids
  try {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('chamber_schedules')
        .select('*')
        .eq('chamber_id', 'deleted_ids')
        .maybeSingle();

      if (!error && data?.config && Array.isArray(data.config)) {
        data.config.forEach((id: string) => globalThis.__drDuttaDeletedIds!.add(id));
      }
    }
  } catch {}

  return globalThis.__drDuttaDeletedIds;
}

export async function saveDeletedIdsToDb(ids: string[]) {
  if (!globalThis.__drDuttaDeletedIds) {
    globalThis.__drDuttaDeletedIds = new Set<string>();
  }
  ids.forEach((id) => {
    if (id) globalThis.__drDuttaDeletedIds!.add(id);
  });
  persistDeletedIds();

  // Sync to Supabase so it permanently survives across all devices and serverless cold starts
  try {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const list = Array.from(globalThis.__drDuttaDeletedIds);
      await supabase.from('chamber_schedules').upsert([
        {
          chamber_id: 'deleted_ids',
          config: list,
          updated_at: new Date().toISOString()
        }
      ]);
    }
  } catch (err) {
    console.warn('[DB] Supabase deleted_ids upsert failed', err);
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
    saveDeletedIdsToDb(ids).catch(() => {});
    if (globalThis.__drDuttaAppointments) {
      globalThis.__drDuttaAppointments = globalThis.__drDuttaAppointments.filter(
        (a) => !globalThis.__drDuttaDeletedIds!.has(a.id)
      );
    }
  }
}

export function readSentMessages(): Record<string, SentMessageInfo> {
  if (globalThis.__drDuttaSentMessages) return globalThis.__drDuttaSentMessages;
  try {
    if (fs.existsSync(TMP_SENT_MESSAGES_FILE)) {
      const content = fs.readFileSync(TMP_SENT_MESSAGES_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (typeof parsed === 'object' && parsed !== null) {
        globalThis.__drDuttaSentMessages = parsed;
        return parsed;
      }
    }
  } catch {}
  try {
    if (fs.existsSync(SENT_MESSAGES_FILE)) {
      const content = fs.readFileSync(SENT_MESSAGES_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (typeof parsed === 'object' && parsed !== null) {
        globalThis.__drDuttaSentMessages = parsed;
        return parsed;
      }
    }
  } catch {}
  globalThis.__drDuttaSentMessages = {};
  return {};
}

export function writeSentMessages(map: Record<string, SentMessageInfo>) {
  globalThis.__drDuttaSentMessages = map;
  try {
    fs.writeFileSync(TMP_SENT_MESSAGES_FILE, JSON.stringify(map, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Storage] Could not write sent messages to tmp', err);
  }
  try {
    fs.mkdirSync(path.dirname(SENT_MESSAGES_FILE), { recursive: true });
    fs.writeFileSync(SENT_MESSAGES_FILE, JSON.stringify(map, null, 2), 'utf-8');
  } catch {
    // Ignored on read-only serverless filesystems
  }
}

export async function getSentMessagesFromDb(): Promise<Record<string, SentMessageInfo>> {
  // 1. Check in-memory cache
  if (globalThis.__drDuttaSentMessages && Object.keys(globalThis.__drDuttaSentMessages).length > 0) {
    return globalThis.__drDuttaSentMessages;
  }

  // 2. Query Supabase database
  try {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('chamber_schedules')
        .select('*')
        .eq('chamber_id', 'sent_messages')
        .maybeSingle();

      if (!error && data?.config && typeof data.config === 'object') {
        const dbMap = data.config as Record<string, SentMessageInfo>;
        const local = readSentMessages();
        const merged = { ...local, ...dbMap };
        globalThis.__drDuttaSentMessages = merged;
        return merged;
      }
    }
  } catch (err) {
    console.warn('[DB] Supabase sent_messages query failed, using local fallback', err);
  }

  // 3. Fallback to local files
  return readSentMessages();
}

export async function saveSentMessagesToDb(map: Record<string, SentMessageInfo>) {
  writeSentMessages(map);

  // Sync to Supabase database so it permanently survives reloads across all devices
  try {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      await supabase.from('chamber_schedules').upsert([
        {
          chamber_id: 'sent_messages',
          config: map,
          updated_at: new Date().toISOString()
        }
      ]);
    }
  } catch (err) {
    console.warn('[DB] Supabase sent_messages upsert failed', err);
  }
}

export async function markAppointmentMessageSent(
  id: string,
  channel: 'sms' | 'whatsapp' | 'manual' = 'sms',
  sent = true
): Promise<boolean> {
  const map = await getSentMessagesFromDb();
  if (sent) {
    map[id] = {
      sent: true,
      sentAt: new Date().toISOString(),
      channel
    };
  } else {
    delete map[id];
  }
  await saveSentMessagesToDb(map);

  // Update in-memory appointments if loaded
  if (globalThis.__drDuttaAppointments) {
    const idx = globalThis.__drDuttaAppointments.findIndex((a) => a.id === id);
    if (idx !== -1) {
      globalThis.__drDuttaAppointments[idx].messageSent = sent;
      globalThis.__drDuttaAppointments[idx].messageSentAt = sent ? map[id]?.sentAt : undefined;
      globalThis.__drDuttaAppointments[idx].messageChannel = sent ? channel : undefined;
    }
  }

  // Update local file store if present
  try {
    const stored = readStoredAppointments();
    const idx = stored.findIndex((a) => a.id === id);
    if (idx !== -1) {
      stored[idx].messageSent = sent;
      stored[idx].messageSentAt = sent ? map[id]?.sentAt : undefined;
      stored[idx].messageChannel = sent ? channel : undefined;
      writeStoredAppointments(stored);
    }
  } catch {}

  return true;
}

// Initial seed data (empty - real appointments are stored in Supabase and data/appointments.json)
const INITIAL_SEED: Appointment[] = [];

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
  const deleted = await getDeletedIdsFromDb();
  const sentMap = await getSentMessagesFromDb();
  const apptMap = new Map<string, Appointment>();

  // 1. Primary Source of Truth: Supabase PostgreSQL database
  const supabase = await createServerSupabaseClient();
  let supabaseSuccess = false;
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        supabaseSuccess = true;
        data
          .filter((row) => !deleted.has(row.id))
          .forEach((row) => {
            const sentInfo = sentMap[row.id];
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
              messageSent: sentInfo?.sent ?? undefined,
              messageSentAt: sentInfo?.sentAt ?? undefined,
              messageChannel: sentInfo?.channel ?? undefined,
              rescheduledReason: row.rescheduled_reason || undefined,
              rescheduledAt: row.rescheduled_at || undefined,
              cancellationReason: row.cancellation_reason || undefined,
              cancelledAt: row.cancelled_at || undefined,
              createdAt: row.created_at
            });
          });
      }
    } catch (e) {
      console.warn('Supabase query failed, using local file store fallback', e);
    }
  }

  // 2. Fallback: ONLY if Supabase is not active or query returned an error, use local file store
  if (!supabaseSuccess) {
    const stored = readStoredAppointments();
    stored.filter((a) => !deleted.has(a.id)).forEach((a) => {
      const sentInfo = sentMap[a.id];
      apptMap.set(a.id, {
        ...a,
        messageSent: sentInfo?.sent ?? a.messageSent,
        messageSentAt: sentInfo?.sentAt ?? a.messageSentAt,
        messageChannel: sentInfo?.channel ?? a.messageChannel
      });
    });
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
 * Evaluates active non-cancelled appointments.
 * Highly optimized targeted query using index on (appointment_date, chamber_mode).
 */
export async function getBookedSlotsForDate(dateStr: string, mode: ChamberMode): Promise<string[]> {
  const bookedSet = new Set<string>();
  const deleted = await getDeletedIdsFromDb();

  // 1. Direct high-performance query on Supabase (uses index, zero heavy memory allocation)
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('id, slot_id')
        .eq('appointment_date', dateStr)
        .eq('chamber_mode', mode)
        .neq('status', 'cancelled');

      if (!error && Array.isArray(data)) {
        data
          .filter((row) => !deleted.has(row.id))
          .forEach((row) => {
            if (row.slot_id) bookedSet.add(row.slot_id);
          });
        return Array.from(bookedSet);
      }
    } catch (e) {
      console.warn('Supabase getBookedSlotsForDate query failed, using fallback', e);
    }
  }

  // 2. Fallback to local stored appointments only if Supabase is unavailable
  const stored = readStoredAppointments();
  stored
    .filter((a) => a.appointmentDate === dateStr && a.chamberMode === mode && a.status !== 'cancelled' && !deleted.has(a.id))
    .forEach((a) => bookedSet.add(a.slotId));

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
  // 1. Mark ID in deleted set & persist across DB, memory & disk
  await saveDeletedIdsToDb([id]);

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
    previousDate: existingApt.appointmentDate,
    previousSlotId: existingApt.slotId,
    previousSlotTimeBn: existingApt.slotTimeBn,
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
