import { Appointment } from '@/types/booking';

export interface EmailDispatchLog {
  id: string;
  recipientEmail: string;
  recipientName: string;
  type: 'confirmation' | 'reschedule';
  serialNo: string;
  subject: string;
  timestamp: string;
  status: 'sent' | 'simulated';
}

// In-memory log of sent emails so admin can track communications
const emailDispatchHistory: EmailDispatchLog[] = [];

export function getEmailDispatchHistory(): EmailDispatchLog[] {
  return [...emailDispatchHistory];
}

/**
 * Sends official appointment confirmation email to the patient
 */
export async function sendAppointmentConfirmationEmail(appointment: Appointment): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  if (!appointment.email) {
    console.warn(`[Email Service] No email provided for appointment ${appointment.serialNo}`);
    return { success: false, error: 'রোগীর কোনো ইমেইল ঠিকানা নেই।' };
  }

  const subject = `আপনার অ্যাপয়েন্টমেন্ট নিশ্চিত করা হয়েছে — দেবজ্যোতি দত্ত (সিরিয়াল: ${appointment.serialNo})`;
  const fee = appointment.chamberMode === 'offline' ? '১,০০০ টাকা' : '৮০০ টাকা';

  const htmlContent = `
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4fbf7; margin: 0; padding: 24px; color: #15291e; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #d1fae5; overflow: hidden; box-shadow: 0 10px 25px rgba(6, 78, 59, 0.08); }
    .header { background: linear-gradient(135deg, #064e3b 0%, #047857 100%); color: #ffffff; padding: 32px 24px; text-align: center; }
    .doctor-name { font-size: 24px; font-weight: bold; margin-bottom: 4px; }
    .doctor-creds { font-size: 13px; color: #a7f3d0; margin-bottom: 8px; }
    .badge { display: inline-block; background: #fef08a; color: #713f12; padding: 4px 14px; border-radius: 20px; font-weight: bold; font-size: 12px; }
    .body-content { padding: 32px 24px; }
    .greeting { font-size: 16px; font-weight: 600; color: #064e3b; margin-bottom: 12px; }
    .success-alert { background: #ecfdf5; border: 1.5px solid #10b981; border-radius: 12px; padding: 16px; margin-bottom: 24px; color: #065f46; font-size: 14px; }
    .serial-box { background: #f0fdf4; border: 2px dashed #059669; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
    .serial-title { font-size: 12px; font-weight: bold; color: #047857; text-transform: uppercase; }
    .serial-val { font-size: 26px; font-weight: 900; color: #064e3b; font-family: monospace; letter-spacing: 1px; }
    .details-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px; }
    .details-table td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; }
    .details-table td.label { color: #6b7280; font-weight: 600; width: 40%; }
    .details-table td.value { color: #111827; font-weight: bold; }
    .instructions { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px; border-radius: 8px; font-size: 13px; color: #92400e; margin-bottom: 24px; line-height: 1.6; }
    .footer { background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 20px 24px; text-align: center; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="doctor-name">দেবজ্যোতি দত্ত</div>
      <div class="doctor-creds">B.A.M.S. (NIA, Jaipur) • B.Sc in BGE • লেখক "স্বাস্থ্য দর্পণ"</div>
      <span class="badge">অফিশিয়াল অ্যাপয়েন্টমেন্ট কনফার্মেশন</span>
    </div>

    <div class="body-content">
      <div class="greeting">নমস্কার ${appointment.patientName},</div>
      
      <div class="success-alert">
        🎉 <strong>অভিনন্দন!</strong> চেম্বার থেকে আপনার অ্যাপয়েন্টমেন্ট সফলভাবে যাচাই করে <strong>নিশ্চিত (Confirmed)</strong> করা হয়েছে।
      </div>

      <div class="serial-box">
        <div>
          <div class="serial-title">আপনার ডিজিটাল সিরিয়াল নম্বর</div>
          <div class="serial-val">${appointment.serialNo}</div>
        </div>
      </div>

      <table class="details-table">
        <tr>
          <td class="label">রোগীর নাম:</td>
          <td class="value">${appointment.patientName}</td>
        </tr>
        <tr>
          <td class="label">মোবাইল নম্বর:</td>
          <td class="value">${appointment.phone}</td>
        </tr>
        <tr>
          <td class="label">চেম্বার / মোড:</td>
          <td class="value">${appointment.chamberTitleBn}</td>
        </tr>
        <tr>
          <td class="label">তারিখ:</td>
          <td class="value">${appointment.dateFormattedBn}</td>
        </tr>
        <tr>
          <td class="label">বরাদ্দকৃত সময়:</td>
          <td class="value" style="color: #047857; font-size: 16px;">${appointment.slotTimeBn}</td>
        </tr>
        <tr>
          <td class="label">পরামর্শ ফি:</td>
          <td class="value">${fee}</td>
        </tr>
        <tr>
          <td class="label">ফলোআপ ভিজিট:</td>
          <td class="value" style="color: #047857; font-weight: bold;">${appointment.chamberMode === 'offline' ? '৬০০ টাকা' : '৪০০ টাকা'} (৩ মাসের মধ্যে)</td>
        </tr>
      </table>

      <div style="background: #fffbeb; border: 1.5px solid #f59e0b; border-radius: 12px; padding: 14px 16px; margin-bottom: 20px; font-size: 13px; color: #92400e;">
        <strong>👉 জরুরি স্বাস্থ্য তথ্য ফর্ম (অবশ্যই পূরণ করতে হবে):</strong>
        <p style="margin: 6px 0 0 0;">
          অনুগ্রহ করে এই ফর্মটি পূরণ করুন: <a href="https://forms.gle/L6YfWn7Z12nV3aK66" style="color: #047857; font-weight: bold; text-decoration: underline;">https://forms.gle/L6YfWn7Z12nV3aK66</a>
        </p>
        <p style="margin: 4px 0 0 0; font-size: 11px; color: #b45309;">(পূর্বে একবার পূরণ করে থাকলে পুনরায় পূরণ করার প্রয়োজন নেই।)</p>
      </div>

      ${appointment.chamberMode === 'offline' ? `
      <div style="background: #f0fdf4; border: 1px solid #10b981; border-radius: 12px; padding: 12px 16px; margin-bottom: 20px; font-size: 13px; color: #064e3b;">
        <strong>📍 চেম্বারের ঠিকানা:</strong> ২/১, জাহেদা ভিলা, শ্যামলী কল্যাণ সমিতি, শ্যামলী, ঢাকা-১২০৭।<br/>
        <strong>🗺️ গুগল ম্যাপ:</strong> <a href="https://maps.app.goo.gl/NgPzAZamW3Ucy8799" style="color: #047857; font-weight: bold; text-decoration: underline;">https://maps.app.goo.gl/NgPzAZamW3Ucy8799</a>
      </div>` : `
      <div style="background: #f0fdf4; border: 1px solid #10b981; border-radius: 12px; padding: 12px 16px; margin-bottom: 20px; font-size: 13px; color: #064e3b;">
        <strong>📱 কনসালটেশন মোড:</strong> অনলাইন ভিডিও কনসালটেশন (হোয়াটসঅ্যাপ ভিডিও কল)<br/>
        নির্ধারিত সময়ে আপনার মোবাইল নম্বরে হোয়াটসঅ্যাপ ভিডিও কল করা হবে।
      </div>`}

      <div class="instructions">
        <strong>জরুরি নির্দেশনা:</strong>
        <ul style="margin: 6px 0 0 18px; padding: 0;">
          <li>অনুগ্রহ করে আপনার নির্ধারিত সময়ের অন্তত ১০ মিনিট পূর্বে উপস্থিত থাকবেন।</li>
          <li>অনলাইন ভিডিও কলের ক্ষেত্রে নির্ধারিত সময়ের ৫ মিনিট আগে হোয়াটসঅ্যাপে যুক্ত থাকুন।</li>
          <li>পূর্বে নেওয়া কোনো প্রেসক্রিপশন বা সাম্প্রতিক প্যাথলজিক্যাল রিপোর্ট থাকলে অবশ্যই সাথে রাখবেন।</li>
        </ul>
      </div>
    </div>

    <div class="footer">
      <div>দেবজ্যোতি দত্ত ক্লিনিক্যাল সার্ভিসেস • ঢাকা চেম্বার ও গ্লোবাল টেলিহেলথ</div>
      <div style="margin-top: 4px;">নতুন অ্যাপয়েন্টমেন্ট নির্ধারণ বা পরিবর্তনের জন্য হোয়াটসঅ্যাপ: <strong>01712854941</strong></div>
      <div style="margin-top: 6px; font-size: 11px; color: #9ca3af;">[!] বিঃদ্রঃ এখানে উল্লেখিত সময়টি আনুমানিক মাত্র। প্রয়োজন অনুযায়ী সময় ও অ্যাপয়েন্টমেন্ট পরিবর্তনের সম্পূর্ণ অধিকার কর্তৃপক্ষ সংরক্ষণ করে।</div>
    </div>
  </div>
</body>
</html>
  `;

  return await dispatchEmail({
    to: appointment.email,
    subject,
    html: htmlContent,
    appointment,
    type: 'confirmation'
  });
}

/**
 * Sends reschedule / time modification email to the patient
 */
export async function sendAppointmentRescheduleEmail(
  appointment: Appointment,
  previousDetails: { date: string; time: string },
  reason?: string
): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  if (!appointment.email) {
    console.warn(`[Email Service] No email provided for appointment ${appointment.serialNo}`);
    return { success: false, error: 'রোগীর কোনো ইমেইল ঠিকানা নেই।' };
  }

  const subject = `গুরুত্বপূর্ণ: অ্যাপয়েন্টমেন্টের সময়সূচী পরিবর্তন — দেবজ্যোতি দত্ত (সিরিয়াল: ${appointment.serialNo})`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4fbf7; margin: 0; padding: 24px; color: #15291e; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #fed7aa; overflow: hidden; box-shadow: 0 10px 25px rgba(180, 83, 9, 0.08); }
    .header { background: linear-gradient(135deg, #9a3412 0%, #c2410c 100%); color: #ffffff; padding: 32px 24px; text-align: center; }
    .doctor-name { font-size: 24px; font-weight: bold; margin-bottom: 4px; }
    .badge { display: inline-block; background: #ffedd5; color: #9a3412; padding: 4px 14px; border-radius: 20px; font-weight: bold; font-size: 12px; }
    .body-content { padding: 32px 24px; }
    .greeting { font-size: 16px; font-weight: 600; color: #9a3412; margin-bottom: 12px; }
    .alert-box { background: #fff7ed; border: 1.5px solid #f97316; border-radius: 12px; padding: 16px; margin-bottom: 24px; color: #9a3412; font-size: 14px; }
    .comparison-grid { display: flex; gap: 12px; margin-bottom: 24px; }
    .card-prev { flex: 1; background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 12px; text-decoration: line-through; color: #991b1b; }
    .card-new { flex: 1; background: #ecfdf5; border: 2px solid #059669; border-radius: 10px; padding: 12px; color: #064e3b; font-weight: bold; }
    .details-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px; }
    .details-table td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; }
    .details-table td.label { color: #6b7280; font-weight: 600; width: 40%; }
    .details-table td.value { color: #111827; font-weight: bold; }
    .reason-box { background: #f8fafc; border-left: 4px solid #64748b; padding: 12px; border-radius: 6px; font-size: 13px; color: #334155; margin-bottom: 24px; }
    .footer { background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 20px 24px; text-align: center; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="doctor-name">দেবজ্যোতি দত্ত</div>
      <div style="font-size: 13px; color: #fed7aa; margin-bottom: 8px;">B.A.M.S. (NIA, Jaipur) • B.Sc in BGE</div>
      <span class="badge">সময়সূচী পরিবর্তন নোটিফিকেশন</span>
    </div>

    <div class="body-content">
      <div class="greeting">নমস্কার ${appointment.patientName},</div>
      
      <div class="alert-box">
        ⚠️ <strong>সময়সূচী পরিবর্তনের বিজ্ঞপ্তি:</strong> অনিবার্য প্রশাসনিক/চেম্বারের সময় সমন্বয়ের কারণে আপনার সিরিয়াল নম্বর <strong>${appointment.serialNo}</strong>-এর সময়সূচী পুনঃনির্ধারণ করা হয়েছে।
      </div>

      <div style="margin-bottom: 8px; font-size: 12px; font-weight: bold; color: #475569;">সময়সূচী পরিবর্তন তুলনা:</div>
      <table style="width: 100%; margin-bottom: 24px; border-collapse: separate; border-spacing: 8px 0;">
        <tr>
          <td style="width: 50%; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px;">
            <div style="font-size: 11px; color: #991b1b; text-transform: uppercase; font-weight: bold;">পূর্ববর্তী সময়সূচী:</div>
            <div style="font-size: 13px; color: #b91c1c; text-decoration: line-through; margin-top: 4px;">
              ${previousDetails.date}<br>${previousDetails.time}
            </div>
          </td>
          <td style="width: 50%; background: #ecfdf5; border: 2px solid #059669; border-radius: 8px; padding: 12px;">
            <div style="font-size: 11px; color: #047857; text-transform: uppercase; font-weight: bold;">নতুন নির্ধারিত সময়:</div>
            <div style="font-size: 14px; color: #064e3b; font-weight: 800; margin-top: 4px;">
              ${appointment.dateFormattedBn}<br>${appointment.slotTimeBn}
            </div>
          </td>
        </tr>
      </table>

      ${
        reason
          ? `<div class="reason-box">
        <strong>পরিবর্তনের কারণ / ডাক্তারের বার্তা:</strong><br>
        "${reason}"
      </div>`
          : ''
      }

      <table class="details-table">
        <tr>
          <td class="label">সিরিয়াল নম্বর:</td>
          <td class="value" style="font-family: monospace; font-size: 16px; color: #064e3b;">${appointment.serialNo}</td>
        </tr>
        <tr>
          <td class="label">রোগীর নাম:</td>
          <td class="value">${appointment.patientName}</td>
        </tr>
        <tr>
          <td class="label">চেম্বার / মোড:</td>
          <td class="value">${appointment.chamberTitleBn}</td>
        </tr>
      </table>

      <div style="background: #f0fdf4; border: 1px solid #a7f3d0; border-radius: 8px; padding: 12px; font-size: 12px; color: #065f46;">
        ℹ️ <em>আপনার সিরিয়াল নম্বর ও বুকিং বহাল রয়েছে। অনুগ্রহ করে নতুন নির্ধারিত সময়ে উপস্থিত থাকুন। কোনো জিজ্ঞাসা থাকলে সরাসরি আমাদের ফোন করুন।</em>
      </div>
    </div>

    <div class="footer">
      <div>দেবজ্যোতি দত্ত ক্লিনিক্যাল সার্ভিসেস • ঢাকা চেম্বার ও গ্লোবাল টেলিহেলথ</div>
      <div style="margin-top: 4px;">হেল্পলাইন: +880 1711-223344</div>
    </div>
  </div>
</body>
</html>
  `;

  return await dispatchEmail({
    to: appointment.email,
    subject,
    html: htmlContent,
    appointment,
    type: 'reschedule'
  });
}

import nodemailer from 'nodemailer';

/**
 * Underlying email delivery dispatcher (Supports Nodemailer SMTP, Resend API, and clean fallback)
 */
async function dispatchEmail(params: {
  to: string;
  subject: string;
  html: string;
  appointment: Appointment;
  type: 'confirmation' | 'reschedule';
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // 1. Check for SMTP configuration (e.g., Gmail App Password or custom Webmail)
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const emailFrom =
    process.env.EMAIL_FROM ||
    process.env.RESEND_FROM_EMAIL ||
    (smtpUser ? `দেবজ্যোতি দত্ত চেম্বার <${smtpUser}>` : 'দেবজ্যোতি দত্ত চেম্বার <onboarding@resend.dev>');

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      const info = await transporter.sendMail({
        from: emailFrom,
        to: params.to,
        subject: params.subject,
        html: params.html
      });

      console.log(`[Email Service - SMTP] Sent email to ${params.to}, messageId: ${info.messageId}`);
      logEmail(params.appointment, params.type, params.subject, 'sent');
      return { success: true, messageId: info.messageId };
    } catch (smtpErr: any) {
      console.error('[Email Service] SMTP delivery failed:', smtpErr?.message || smtpErr);
    }
  }

  // 2. Check for Resend API configuration
  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`
        },
        body: JSON.stringify({
          from: emailFrom,
          to: [params.to],
          subject: params.subject,
          html: params.html
        })
      });

      const resData = await response.json();
      if (response.ok && resData.id) {
        logEmail(params.appointment, params.type, params.subject, 'sent');
        return { success: true, messageId: resData.id };
      } else {
        console.warn('[Email Service] Resend API error response:', resData);
      }
    } catch (e: any) {
      console.error('[Email Service] Failed to deliver email via Resend API:', e);
    }
  }

  // Graceful local & fallback logger: logs clean delivery confirmation and records dispatch
  console.log(`\n============================================================`);
  console.log(`✉️ [EMAIL SIMULATED / LOGGED] -> ${params.to}`);
  console.log(`📌 Subject: ${params.subject}`);
  console.log(`👤 Patient: ${params.appointment.patientName} (${params.appointment.serialNo})`);
  console.log(`⏰ Time: ${params.appointment.dateFormattedBn} - ${params.appointment.slotTimeBn}`);
  console.log(`💡 Note: Set SMTP_HOST & SMTP_USER & SMTP_PASS or RESEND_API_KEY in .env.local to send real emails.`);
  console.log(`============================================================\n`);

  logEmail(params.appointment, params.type, params.subject, 'simulated');
  return {
    success: true,
    messageId: `msg_${Date.now()}`
  };
}

function logEmail(
  apt: Appointment,
  type: 'confirmation' | 'reschedule',
  subject: string,
  status: 'sent' | 'simulated'
) {
  emailDispatchHistory.unshift({
    id: `email_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    recipientEmail: apt.email || '',
    recipientName: apt.patientName,
    type,
    serialNo: apt.serialNo,
    subject,
    timestamp: new Date().toISOString(),
    status
  });

  if (emailDispatchHistory.length > 100) {
    emailDispatchHistory.pop();
  }
}

/**
 * Sends a 6-digit OTP verification email for international patients
 */
export async function sendOtpEmail(params: {
  to: string;
  code: string;
  patientName?: string;
}): Promise<{
  success: boolean;
  messageId?: string;
  provider: 'smtp' | 'resend' | 'sandbox';
  error?: string;
}> {
  const subject = `আপনার ওটিপি (OTP) যাচাইকরণ কোড: ${params.code} — দেবজ্যোতি দত্ত চেম্বার`;
  const patientDisplayName = params.patientName ? params.patientName : 'সুধী';

  const htmlContent = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="utf-8">
  <title>আপনার ওটিপি কোড</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4fbf7; margin: 0; padding: 24px; color: #15291e;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #d1fae5; overflow: hidden; box-shadow: 0 8px 20px rgba(6,78,59,0.08);">
    <div style="background: linear-gradient(135deg, #064e3b 0%, #047857 100%); color: #ffffff; padding: 28px 24px; text-align: center;">
      <h2 style="margin: 0 0 6px 0; font-size: 22px;">আয়ুর্বেদাচার্য দেবজ্যোতি দত্ত</h2>
      <p style="margin: 0; font-size: 13px; color: #a7f3d0;">অনলাইন ভিডিও কনসালটেশন অ্যাপয়েন্টমেন্ট যাচাইকরণ</p>
    </div>
    <div style="padding: 28px 24px; text-align: center;">
      <p style="font-size: 15px; margin-bottom: 16px; color: #064e3b; font-weight: 600;">
        নমস্কার ${patientDisplayName},
      </p>
      <p style="font-size: 13px; color: #374151; line-height: 1.6; margin-bottom: 24px;">
        আয়ুর্বেদাচার্য দেবজ্যোতি দত্তের চেম্বার অনলাইন অ্যাপয়েন্টমেন্টের ডিজিটাল সিরিয়াল নিশ্চিত করতে নিচের ৬-সংখ্যার ওটিপি (OTP) কোডটি ব্যবহার করুন:
      </p>
      <div style="background: #f0fdf4; border: 2px dashed #059669; border-radius: 12px; padding: 18px 28px; margin: 0 auto 24px auto; display: inline-block;">
        <span style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #064e3b; font-family: monospace;">${params.code}</span>
      </div>
      <p style="font-size: 12px; color: #6b7280; margin: 0;">
        ⚠️ এই কোডটির মেয়াদ আগামী <strong>৫ মিনিট</strong> পর্যন্ত কার্যকর থাকবে। কারো সাথে কোডটি শেয়ার করবেন না।
      </p>
    </div>
    <div style="background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 16px; text-align: center; font-size: 11px; color: #9ca3af;">
      © ${new Date().getFullYear()} আয়ুর্বেদাচার্য দেবজ্যোতি দত্ত চেম্বার। সর্বস্বত্ব সংরক্ষিত।
    </div>
  </div>
</body>
</html>`;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const emailFrom =
    process.env.EMAIL_FROM ||
    process.env.RESEND_FROM_EMAIL ||
    (smtpUser ? `দেবজ্যোতি দত্ত চেম্বার <${smtpUser}>` : 'দেবজ্যোতি দত্ত চেম্বার <onboarding@resend.dev>');

  // 1. Try SMTP if configured
  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      const info = await transporter.sendMail({
        from: emailFrom,
        to: params.to,
        subject,
        html: htmlContent
      });

      console.log(`[Email OTP - SMTP] Dispatched OTP email to ${params.to}, messageId: ${info.messageId}`);
      return {
        success: true,
        messageId: info.messageId,
        provider: 'smtp'
      };
    } catch (err: any) {
      console.error('[Email OTP] SMTP dispatch failed:', err?.message || err);
    }
  }

  // 2. Try Resend API if configured
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`
        },
        body: JSON.stringify({
          from: emailFrom,
          to: [params.to],
          subject,
          html: htmlContent
        })
      });

      const resData = await response.json();
      if (response.ok && resData.id) {
        console.log(`[Email OTP - Resend] Dispatched OTP email to ${params.to}, id: ${resData.id}`);
        return {
          success: true,
          messageId: resData.id,
          provider: 'resend'
        };
      }
    } catch (err: any) {
      console.error('[Email OTP] Resend API dispatch failed:', err?.message || err);
    }
  }

  // 3. Fallback Sandbox Simulator
  console.log(`\n============================================================`);
  console.log(`📧 [EMAIL OTP SIMULATOR / DEMO MODE]`);
  console.log(`✉️ Recipient: ${params.to}`);
  console.log(`🔢 OTP Code: ${params.code}`);
  console.log(`👤 Patient: ${patientDisplayName}`);
  console.log(`ℹ️ Notice: To dispatch live emails, configure SMTP_HOST, SMTP_USER, SMTP_PASS or RESEND_API_KEY in .env.local`);
  console.log(`============================================================\n`);

  return {
    success: true,
    messageId: `otp_sim_${Date.now()}`,
    provider: 'sandbox'
  };
}
