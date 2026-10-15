import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { ChamberTemplatesConfig, DEFAULT_SMS_TEMPLATES } from './templates';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const TEMPLATES_FILE = path.join(process.cwd(), 'data', 'sms-templates.json');
const TMP_TEMPLATES_FILE = path.join(os.tmpdir(), 'dr_dutta_sms_templates.json');

declare global {
  // eslint-disable-next-line no-var
  var __drDuttaSmsTemplates: ChamberTemplatesConfig | undefined;
}

/**
 * Loads current SMS templates from Supabase, local tmp/data files, or fallback defaults
 */
export async function getSavedTemplates(): Promise<ChamberTemplatesConfig> {
  // 1. Check in-memory cache
  if (globalThis.__drDuttaSmsTemplates?.offline && globalThis.__drDuttaSmsTemplates?.online) {
    return globalThis.__drDuttaSmsTemplates;
  }

  // 2. Check Supabase database if connected
  try {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('chamber_schedules')
        .select('*')
        .eq('chamber_id', 'sms_templates')
        .maybeSingle();

      if (!error && data?.config?.offline && data?.config?.online) {
        const templates = data.config as ChamberTemplatesConfig;
        globalThis.__drDuttaSmsTemplates = templates;
        return templates;
      }
    }
  } catch (e) {
    console.warn('[SMS Templates] Supabase query failed, falling back to local files', e);
  }

  // 3. Check /tmp filesystem (writable in serverless)
  try {
    if (fs.existsSync(TMP_TEMPLATES_FILE)) {
      const content = fs.readFileSync(TMP_TEMPLATES_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed?.offline && parsed?.online) {
        globalThis.__drDuttaSmsTemplates = parsed;
        return parsed;
      }
    }
  } catch {}

  // 4. Check project data/ directory
  try {
    if (fs.existsSync(TEMPLATES_FILE)) {
      const content = fs.readFileSync(TEMPLATES_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed?.offline && parsed?.online) {
        globalThis.__drDuttaSmsTemplates = parsed;
        return parsed;
      }
    }
  } catch {}

  // 5. Fallback to hardcoded defaults
  globalThis.__drDuttaSmsTemplates = { ...DEFAULT_SMS_TEMPLATES };
  return globalThis.__drDuttaSmsTemplates;
}

/**
 * Persists SMS templates to memory, /tmp, repo data directory, and Supabase
 */
export async function saveTemplates(newTemplates: ChamberTemplatesConfig): Promise<boolean> {
  try {
    // 1. Always update in-memory cache immediately
    globalThis.__drDuttaSmsTemplates = newTemplates;

    // 2. Persist to /tmp (always writable in Vercel / AWS Lambda / Docker)
    try {
      fs.writeFileSync(TMP_TEMPLATES_FILE, JSON.stringify(newTemplates, null, 2), 'utf-8');
    } catch (tmpErr) {
      console.warn('[SMS Templates] Failed saving to tmp file', tmpErr);
    }

    // 3. Persist to project data/ directory if writable (local dev environment)
    try {
      const dir = path.dirname(TEMPLATES_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(newTemplates, null, 2), 'utf-8');
    } catch {
      // Expected on read-only serverless filesystems (e.g. Vercel)
    }

    // 4. Persist to Supabase if connected
    try {
      const supabase = await createServerSupabaseClient();
      if (supabase) {
        await supabase.from('chamber_schedules').upsert([
          {
            chamber_id: 'sms_templates',
            config: newTemplates,
            updated_at: new Date().toISOString()
          }
        ]);
      }
    } catch (supaErr) {
      console.warn('[SMS Templates] Failed saving to Supabase chamber_schedules', supaErr);
    }

    return true;
  } catch (err) {
    console.error('[SMS Templates] Unexpected error saving templates', err);
    return false;
  }
}
