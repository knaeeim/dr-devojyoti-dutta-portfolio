import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth/session';
import { DEFAULT_SMS_TEMPLATES, ChamberTemplatesConfig } from '@/lib/sms/templates';
import { getSavedTemplates, saveTemplates } from '@/lib/sms/templates-storage';

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json(
        { error: 'অনুমতি নেই। অনুগ্রহ করে অ্যাডমিন হিসেবে লগইন করুন।' },
        { status: 401 }
      );
    }

    const templates = await getSavedTemplates();
    return NextResponse.json({
      success: true,
      templates,
      defaults: DEFAULT_SMS_TEMPLATES
    });
  } catch (err: unknown) {
    console.error('[SMS Templates GET Error]:', err);
    return NextResponse.json(
      { error: 'টেমপ্লেট লোড করতে সমস্যা হয়েছে।' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json(
        { error: 'অনুমতি নেই। অনুগ্রহ করে অ্যাডমিন হিসেবে লগইন করুন।' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { templates, action } = body;

    // Reset to defaults if requested
    if (action === 'reset') {
      const resetSuccess = await saveTemplates(DEFAULT_SMS_TEMPLATES);
      if (!resetSuccess) {
        return NextResponse.json(
          { error: 'ডিফল্ট টেমপ্লেটে রিসেট করতে সমস্যা হয়েছে।' },
          { status: 500 }
        );
      }
      return NextResponse.json({
        success: true,
        message: 'ডিফল্ট টেমপ্লেট সফলভাবে সংরক্ষিত হয়েছে!',
        templates: DEFAULT_SMS_TEMPLATES
      });
    }

    if (!templates || typeof templates !== 'object') {
      return NextResponse.json(
        { error: 'সঠিক টেমপ্লেট ডাটা প্রদান করুন।' },
        { status: 400 }
      );
    }

    // Basic structure check
    if (!templates.offline || !templates.online) {
      return NextResponse.json(
        { error: 'উভয় চেম্বার মোডের (offline ও online) টেমপ্লেট থাকা আবশ্যক।' },
        { status: 400 }
      );
    }

    const saved = await saveTemplates(templates as ChamberTemplatesConfig);
    if (!saved) {
      return NextResponse.json(
        { error: 'টেমপ্লেট ফাইল সংরক্ষণে সমস্যা হয়েছে।' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'এসএমএস টেমপ্লেট সফলভাবে সংরক্ষিত হয়েছে!',
      templates
    });
  } catch (err: unknown) {
    console.error('[SMS Templates POST Error]:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'টেমপ্লেট সংরক্ষণে সমস্যা হয়েছে।' },
      { status: 500 }
    );
  }
}
