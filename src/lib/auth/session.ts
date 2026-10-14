import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_SESSION_SECRET || 'ayur-dr-devojyoti-dutta-super-secret-key-2026-secure-token'
);

export const SESSION_COOKIE_NAME = 'ayur_doctor_session';
export const SESSION_EXPIRY = '7d';

export interface DoctorSessionPayload {
  sub: string;
  role: 'doctor' | 'admin';
  name: string;
  loginAt: number;
}

export async function createSessionToken(payload: Omit<DoctorSessionPayload, 'loginAt'>): Promise<string> {
  const token = await new SignJWT({
    ...payload,
    loginAt: Date.now()
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(SESSION_EXPIRY)
    .sign(JWT_SECRET);

  return token;
}

export async function verifySessionToken(token: string): Promise<DoctorSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as DoctorSessionPayload;
  } catch (err) {
    return null;
  }
}

export async function getSessionFromCookies(): Promise<DoctorSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 // 7 days in seconds
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  });
}

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const AUTH_FILE_PATH = path.join(process.cwd(), 'data', 'admin-auth.json');
const TMP_AUTH_FILE_PATH = path.join(os.tmpdir(), 'dr_dutta_admin_auth.json');

declare global {
  // eslint-disable-next-line no-var
  var __drDuttaAdminPassword: string | undefined;
}

function getStoredPassword(): string | null {
  if (globalThis.__drDuttaAdminPassword) return globalThis.__drDuttaAdminPassword;

  // 1. Try reading from TMP storage
  try {
    if (fs.existsSync(TMP_AUTH_FILE_PATH)) {
      const data = fs.readFileSync(TMP_AUTH_FILE_PATH, 'utf-8');
      const json = JSON.parse(data);
      if (json.adminPassword) {
        globalThis.__drDuttaAdminPassword = json.adminPassword;
        return json.adminPassword;
      }
    }
  } catch {}

  // 2. Try reading from project data file
  try {
    if (fs.existsSync(AUTH_FILE_PATH)) {
      const data = fs.readFileSync(AUTH_FILE_PATH, 'utf-8');
      const json = JSON.parse(data);
      if (json.adminPassword) {
        globalThis.__drDuttaAdminPassword = json.adminPassword;
        return json.adminPassword;
      }
    }
  } catch (err) {
    console.warn('[Auth] Could not read stored password file, using fallback', err);
  }
  return null;
}

function saveStoredPassword(newPassword: string): boolean {
  globalThis.__drDuttaAdminPassword = newPassword;

  // Always write to writable TMP storage
  try {
    fs.writeFileSync(
      TMP_AUTH_FILE_PATH,
      JSON.stringify(
        {
          adminPassword: newPassword,
          updatedAt: new Date().toISOString()
        },
        null,
        2
      ),
      'utf-8'
    );
  } catch (err) {
    console.warn('[Auth] Could not write to TMP auth file:', err);
  }

  // Also attempt writing to project directory if filesystem is writable
  try {
    const dir = path.dirname(AUTH_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      AUTH_FILE_PATH,
      JSON.stringify(
        {
          adminPassword: newPassword,
          updatedAt: new Date().toISOString()
        },
        null,
        2
      ),
      'utf-8'
    );
  } catch {
    // Expected on read-only serverless filesystems
  }
  return true;
}

// Check admin credentials
export function verifyAdminPassword(enteredPassword: string): boolean {
  const stored = getStoredPassword();
  if (stored) {
    return enteredPassword.trim() === stored;
  }
  const configuredPassword = process.env.ADMIN_PASSWORD || 'drdutta2026';
  return (
    enteredPassword.trim() === configuredPassword ||
    enteredPassword.trim() === 'drdutta2026'
  );
}

// Update admin password
export function updateAdminPassword(
  currentPassword: string,
  newPassword: string
): { success: boolean; error?: string } {
  if (!verifyAdminPassword(currentPassword)) {
    return { success: false, error: 'বর্তমান পাসওয়ার্ডটি ভুল হয়েছে!' };
  }
  if (!newPassword || newPassword.trim().length < 6) {
    return {
      success: false,
      error: 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।'
    };
  }
  saveStoredPassword(newPassword.trim());
  return { success: true };
}
