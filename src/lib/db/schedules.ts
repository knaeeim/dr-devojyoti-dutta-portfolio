import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { ChamberMode, ChamberSchedule } from '@/types/booking';
import { defaultSchedules } from '@/lib/booking/utils';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const TMP_SCHEDULES_FILE = path.join(os.tmpdir(), 'dr_dutta_schedules.json');
const DATA_SCHEDULES_FILE = path.join(process.cwd(), 'data', 'schedules.json');

declare global {
  // eslint-disable-next-line no-var
  var __drDuttaChamberSchedules: Record<ChamberMode, ChamberSchedule> | undefined;
}

function loadLocalSchedules(): Record<ChamberMode, ChamberSchedule> {
  if (globalThis.__drDuttaChamberSchedules) {
    return globalThis.__drDuttaChamberSchedules;
  }
  try {
    if (fs.existsSync(DATA_SCHEDULES_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DATA_SCHEDULES_FILE, 'utf-8'));
      if (parsed && parsed.offline && parsed.online) {
        globalThis.__drDuttaChamberSchedules = parsed;
        return parsed;
      }
    }
  } catch {}
  try {
    if (fs.existsSync(TMP_SCHEDULES_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(TMP_SCHEDULES_FILE, 'utf-8'));
      if (parsed && parsed.offline && parsed.online) {
        globalThis.__drDuttaChamberSchedules = parsed;
        return parsed;
      }
    }
  } catch {}

  globalThis.__drDuttaChamberSchedules = { ...defaultSchedules };
  return globalThis.__drDuttaChamberSchedules;
}

export async function getChamberSchedules(): Promise<Record<ChamberMode, ChamberSchedule>> {
  const local = loadLocalSchedules();
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('chamber_schedules')
        .select('*');

      if (!error && data && data.length > 0) {
        const result = { ...local };
        for (const row of data) {
          if (row.chamber_id === 'dhaka_chamber') {
            result.offline = row.config;
          } else if (row.chamber_id === 'online_chamber') {
            result.online = row.config;
          }
        }
        globalThis.__drDuttaChamberSchedules = result;
        return result;
      }
    } catch (e) {
      console.warn('Supabase schedule query failed, using local store', e);
    }
  }

  return local;
}

export async function saveChamberSchedules(
  schedules: Record<ChamberMode, ChamberSchedule>
): Promise<boolean> {
  globalThis.__drDuttaChamberSchedules = schedules;
  try {
    fs.writeFileSync(DATA_SCHEDULES_FILE, JSON.stringify(schedules, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not save schedules to data/schedules.json', err);
  }
  try {
    fs.writeFileSync(TMP_SCHEDULES_FILE, JSON.stringify(schedules, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not save schedules to tmp file', err);
  }

  const supabase = await createServerSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('chamber_schedules').upsert([
        {
          chamber_id: 'dhaka_chamber',
          config: schedules.offline,
          updated_at: new Date().toISOString()
        },
        {
          chamber_id: 'online_chamber',
          config: schedules.online,
          updated_at: new Date().toISOString()
        }
      ]);
      return true;
    } catch (e) {
      console.warn('Supabase schedule save failed', e);
    }
  }

  return true;
}

