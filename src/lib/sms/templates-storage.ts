import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { ChamberTemplatesConfig, DEFAULT_SMS_TEMPLATES } from './templates';

const TEMPLATES_FILE = path.join(process.cwd(), 'data', 'sms-templates.json');
const TMP_TEMPLATES_FILE = path.join(os.tmpdir(), 'dr_dutta_sms_templates.json');

declare global {
  // eslint-disable-next-line no-var
  var __drDuttaSmsTemplates: ChamberTemplatesConfig | undefined;
}

/**
 * Loads current SMS templates from persistent file or fallback default
 */
export function getSavedTemplates(): ChamberTemplatesConfig {
  if (globalThis.__drDuttaSmsTemplates) {
    return globalThis.__drDuttaSmsTemplates;
  }

  try {
    if (fs.existsSync(TEMPLATES_FILE)) {
      const content = fs.readFileSync(TEMPLATES_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed?.offline && parsed?.online) {
        globalThis.__drDuttaSmsTemplates = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[SMS Templates] Failed reading data/sms-templates.json, checking tmp fallback', err);
  }

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

  globalThis.__drDuttaSmsTemplates = { ...DEFAULT_SMS_TEMPLATES };
  return globalThis.__drDuttaSmsTemplates;
}

/**
 * Persists SMS templates to disk and cache
 */
export function saveTemplates(newTemplates: ChamberTemplatesConfig): boolean {
  try {
    const dir = path.dirname(TEMPLATES_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(newTemplates, null, 2), 'utf-8');
    try {
      fs.writeFileSync(TMP_TEMPLATES_FILE, JSON.stringify(newTemplates, null, 2), 'utf-8');
    } catch {}

    globalThis.__drDuttaSmsTemplates = newTemplates;
    return true;
  } catch (err) {
    console.error('[SMS Templates] Failed saving templates', err);
    return false;
  }
}
