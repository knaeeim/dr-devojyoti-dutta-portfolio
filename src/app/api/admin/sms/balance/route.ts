import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth/session';
import { getSmsBalance } from '@/lib/sms/service';

export async function GET(_request: NextRequest) {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json(
        { error: 'অনুমতি নেই।' },
        { status: 401 }
      );
    }

    const res = await getSmsBalance();
    if (!res.success) {
      return NextResponse.json(
        { success: false, error: res.error, balance: 0 },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      balance: res.balance ?? 0
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'ব্যালেন্স তথ্য লোড করতে ব্যর্থ' },
      { status: 500 }
    );
  }
}
