import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: 'লগআউট সম্পন্ন হয়েছে।'
  });
  clearSessionCookie(response);
  return response;
}
