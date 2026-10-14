import { ChamberMode, ChamberSchedule } from '@/types/booking';
import { defaultSchedules } from '@/lib/booking/utils';
import { createServerSupabaseClient } from '@/lib/supabase/server';

let localSchedules: Record<ChamberMode, ChamberSchedule> = { ...defaultSchedules };

export async function getChamberSchedules(): Promise<Record<ChamberMode, ChamberSchedule>> {
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('chamber_schedules')
        .select('*');

      if (!error && data && data.length > 0) {
        const result = { ...localSchedules };
        for (const row of data) {
          if (row.chamber_id === 'dhaka_chamber') {
            result.offline = row.config;
          } else if (row.chamber_id === 'online_chamber') {
            result.online = row.config;
          }
        }
        return result;
      }
    } catch (e) {
      console.warn('Supabase schedule query failed, using local store', e);
    }
  }

  return localSchedules;
}

export async function saveChamberSchedules(
  schedules: Record<ChamberMode, ChamberSchedule>
): Promise<boolean> {
  localSchedules = schedules;

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
