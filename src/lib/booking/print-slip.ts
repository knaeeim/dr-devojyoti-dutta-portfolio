import { Appointment } from '@/types/booking';
import { getDhakaCurrentTime } from '@/lib/booking/utils';

export function printSinglePageSerialSlip(apt: Appointment) {
  if (typeof window === 'undefined') return;

  // Remove any previous print container
  const existing = document.getElementById('dr-dutta-print-slip-container');
  if (existing) {
    existing.remove();
  }

  const container = document.createElement('div');
  container.id = 'dr-dutta-print-slip-container';

  const statusLabel =
    apt.status === 'confirmed'
      ? 'নিশ্চিতকৃত (Confirmed)'
      : apt.status === 'rescheduled'
      ? 'পুনঃনির্ধারিত (Rescheduled)'
      : apt.status === 'completed'
      ? 'সম্পন্ন (Completed)'
      : 'যাচাইকৃত (Verified)';

  const fee = apt.chamberMode === 'offline' ? '১,০০০ টাকা' : '৮০০ টাকা';

  container.innerHTML = `
    <div style="font-family: 'Anek Bangla', 'Noto Sans Bengali', 'Kohinoor Bangla', 'Segoe UI', Arial, sans-serif; color: #064e3b; background: #ffffff; padding: 12px; line-height: 1.45; font-size: 12px; max-width: 540px; margin: 0 auto;">
      <div style="border: 2px solid #047857; border-radius: 12px; padding: 16px; background: #ffffff;">
        <div style="text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 10px; margin-bottom: 12px;">
          <div style="font-size: 20px; font-weight: 800; color: #064e3b; letter-spacing: -0.3px;">দেবজ্যোতি দত্ত</div>
          <div style="font-size: 11px; color: #047857; font-weight: 600; margin-top: 2px;">B.A.M.S. (NIA, Jaipur) • B.Sc in BGE</div>
          <div style="font-size: 11px; color: #047857; font-weight: 600;">চিকিৎসা বিশেষজ্ঞ ও লেখক — "স্বাস্থ্য দর্পণ"</div>
          <div style="display: inline-block; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; padding: 2px 10px; border-radius: 20px; font-size: 10px; font-weight: bold; margin-top: 5px;">ডিজিটাল সিরিয়াল ও বুকিং স্লিপ</div>
        </div>

        <div style="background: #f0fdf4; border: 1.5px dashed #059669; border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #047857;">অফিশিয়াল সিরিয়াল নম্বর</div>
            <div style="font-family: monospace; font-size: 22px; font-weight: 900; color: #064e3b; letter-spacing: 1px;">${apt.serialNo}</div>
          </div>
          <div style="text-align: right;">
            <div style="display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: bold; background: #047857; color: #ffffff;">${statusLabel}</div>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px;">
          <tr>
            <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11.5px; color: #4b5563; font-weight: 600; width: 38%;">রোগীর নাম:</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11.5px; color: #111827; font-weight: bold;">${apt.patientName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11.5px; color: #4b5563; font-weight: 600;">মোবাইল নম্বর:</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11.5px; color: #111827; font-weight: bold; font-family: monospace;">${apt.phone}</td>
          </tr>
          ${
            apt.email
              ? `<tr>
            <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11.5px; color: #4b5563; font-weight: 600;">ইমেইল:</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11.5px; color: #111827; font-weight: bold; font-family: monospace;">${apt.email}</td>
          </tr>`
              : ''
          }
          <tr>
            <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11.5px; color: #4b5563; font-weight: 600;">চেম্বার / মোড:</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11.5px; color: #064e3b; font-weight: bold;">${apt.chamberTitleBn}</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11.5px; color: #4b5563; font-weight: 600;">তারিখ:</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11.5px; color: #111827; font-weight: bold;">${apt.dateFormattedBn}</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11.5px; color: #4b5563; font-weight: 600;">নির্ধারিত সময় স্লট:</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11.5px; color: #b45309; font-weight: 800;">${apt.slotTimeBn}</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11.5px; color: #4b5563; font-weight: 600;">পরামর্শ ফি:</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11.5px; color: #111827; font-weight: bold;">${fee}</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11.5px; color: #4b5563; font-weight: 600;">ফলোআপ ভিজিট:</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11.5px; color: #047857; font-weight: bold;">৬০০ টাকা (৩ মাসের মধ্যে)</td>
          </tr>
          ${
            apt.chamberMode === 'offline'
              ? `<tr>
            <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11.5px; color: #4b5563; font-weight: 600;">চেম্বারের ঠিকানা:</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11.5px; color: #111827; font-weight: 600;">২/১, জাহেদা ভিলা, শ্যামলী কল্যাণ সমিতি, শ্যামলী, ঢাকা-১২০৭</td>
          </tr>`
              : `<tr>
            <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11.5px; color: #4b5563; font-weight: 600;">কনসালটেশন মাধ্যম:</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11.5px; color: #111827; font-weight: 600;">অনলাইন ভিডিও কনসালটেশন (জুমে/হোয়াটসঅ্যাপ ভিডিও কল)</td>
          </tr>`
          }
        </table>

        <div style="background: #fefce8; border-left: 3px solid #eab308; padding: 10px 12px; border-radius: 6px; font-size: 11px; color: #713f12; margin-bottom: 14px;">
          <strong>জরুরি নির্দেশনা:</strong>
          <ul style="margin-left: 16px; margin-top: 4px; line-height: 1.5;">
            <li>অনলাইন ফর্ম পূরণ করুন: <strong>https://forms.gle/L6YfWn7Z12nV3aK66</strong> (পূর্বে পূরণ না করে থাকলে)</li>
            <li>আপনার নির্ধারিত সময়ের অন্তত ১০ মিনিট পূর্বে উপস্থিত থাকবেন।</li>
            <li>পূর্ববর্তী প্রেসক্রিপশন বা মেডিকেল টেস্ট রিপোর্ট থাকলে সাথে রাখুন।</li>
          </ul>
        </div>

        <div style="border-top: 1px solid #e5e7eb; padding-top: 8px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #6b7280;">
          <div>মুদ্রণের সময়: ${new Date().toLocaleString('bn-BD')}</div>
          <div>হেল্পলাইন: 01712854941</div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  // Short timeout to ensure browser paints container before print dialog opens
  setTimeout(() => {
    window.print();
    const cleanup = () => {
      container.remove();
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    setTimeout(cleanup, 6000);
  }, 100);
}

/**
 * Dedicated Receptionist Patient Roster Print & PDF Export
 * Automatically filters out any cancelled appointments so only active patients appear.
 */
export function printReceptionSheet(appointments: Appointment[], isPdfMode = false, sortLabel?: string) {
  if (typeof window === 'undefined') return;

  // Strict filter: Exclude all cancelled appointments (preserves incoming sorted order)
  const activeApts = appointments.filter((apt) => apt.status !== 'cancelled');

  const existingFrame = document.getElementById('print-reception-iframe');
  if (existingFrame) {
    existingFrame.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'print-reception-iframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  const todayStr = getDhakaCurrentTime().dateStr;
  const title = `ডা-দেবজ্যোতি-দত্ত-রিসিপশন-সিরিয়াল-তালিকা-${todayStr}`;

  const rowsHtml =
    activeApts.length === 0
      ? `<tr><td colspan="9" style="text-align: center; padding: 30px; color: #6b7280; font-size: 13px;">বর্তমানে কোনো সক্রিয় সিরিয়াল নেই। সকল সিরিয়াল বাতিল বা স্লট উন্মুক্ত রয়েছে।</td></tr>`
      : activeApts
          .map((apt, idx) => {
            const indexBn = (idx + 1).toLocaleString('bn-BD');
            const statusLabel =
              apt.status === 'confirmed'
                ? '<span style="display:inline-block; padding: 2px 8px; border-radius: 9999px; background: #ecfdf5; color: #047857; font-weight: 700; border: 1px solid #a7f3d0;">নিশ্চিত</span>'
                : apt.status === 'rescheduled'
                ? '<span style="display:inline-block; padding: 2px 8px; border-radius: 9999px; background: #eef2ff; color: #4338ca; font-weight: 700; border: 1px solid #c7d2fe;">রিশিডিউল</span>'
                : apt.status === 'completed'
                ? '<span style="display:inline-block; padding: 2px 8px; border-radius: 9999px; background: #eff6ff; color: #1d4ed8; font-weight: 700; border: 1px solid #bfdbfe;">সম্পন্ন</span>'
                : '<span style="display:inline-block; padding: 2px 8px; border-radius: 9999px; background: #fffbeb; color: #b45309; font-weight: 700; border: 1px solid #fde68a;">অপেক্ষমাণ</span>';

            const fee = apt.chamberMode === 'offline' ? '১,০০০ টাকা' : '৮০০ টাকা';

            return `
              <tr>
                <td style="text-align: center; font-weight: 700; font-size: 11px;">${indexBn}</td>
                <td style="font-family: monospace; font-weight: 800; color: #064e3b; font-size: 12px; white-space: nowrap;">${apt.serialNo}</td>
                <td>
                  <div style="font-weight: 700; color: #111827; font-size: 12px;">${apt.patientName}</div>
                  <div style="font-family: monospace; font-size: 11px; color: #4b5563; margin-top: 1px;">${apt.phone}</div>
                  ${apt.email ? `<div style="font-size: 10px; color: #6b7280;">${apt.email}</div>` : ''}
                </td>
                <td style="font-size: 11.5px; font-weight: 600; color: #064e3b;">${apt.chamberTitleBn}</td>
                <td>
                  <div style="font-weight: 600; color: #111827;">${apt.dateFormattedBn}</div>
                  <div style="color: #b45309; font-weight: 700; font-family: monospace; font-size: 11px;">${apt.slotTimeBn}</div>
                </td>
                <td style="max-width: 220px; font-size: 10.5px; color: #374151;">
                  ${apt.complaints ? `<div>${apt.complaints}</div>` : '<span style="color: #9ca3af;">—</span>'}
                  ${apt.rescheduledReason ? `<div style="color: #4338ca; font-size: 9.5px; margin-top: 2px;">রিশিডিউল নোট: ${apt.rescheduledReason}</div>` : ''}
                </td>
                <td style="text-align: center;">${statusLabel}</td>
                <td style="text-align: right; font-weight: 700; font-size: 11px; color: #111827; white-space: nowrap;">${fee}</td>
                <td style="width: 110px; border-right: none;"></td>
              </tr>
            `;
          })
          .join('');

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="bn">
    <head>
      <meta charset="utf-8" />
      <title>${title}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Anek+Bangla:wght@400;500;600;700;800&family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        @page {
          size: A4 landscape;
          margin: 10mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: 'Anek Bangla', 'Noto Sans Bengali', 'Kohinoor Bangla', 'Segoe UI', Arial, sans-serif;
          color: #111827;
          background: #ffffff;
          padding: 10px;
          line-height: 1.4;
          font-size: 11px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2.5px solid #047857;
          padding-bottom: 10px;
          margin-bottom: 10px;
        }
        .doctor-name {
          font-size: 21px;
          font-weight: 800;
          color: #064e3b;
          letter-spacing: -0.3px;
        }
        .doctor-sub {
          font-size: 11.5px;
          color: #047857;
          font-weight: 600;
          margin-top: 2px;
        }
        .doc-badge {
          display: inline-block;
          background: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
          padding: 2.5px 10px;
          border-radius: 9999px;
          font-size: 10.5px;
          font-weight: 700;
          margin-top: 5px;
        }
        .meta-box {
          text-align: right;
          font-size: 11px;
          color: #374151;
        }
        .meta-box strong {
          color: #111827;
        }
        .active-pill {
          display: inline-block;
          margin-top: 4px;
          padding: 2px 8px;
          border-radius: 6px;
          background: #f0fdf4;
          border: 1px solid #86efac;
          color: #15803d;
          font-weight: 700;
          font-size: 10.5px;
        }
        .sheet-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
        }
        .sheet-table th {
          background: #f0fdf4;
          color: #064e3b;
          font-weight: 800;
          font-size: 11px;
          border: 1px solid #cbd5e1;
          padding: 7px 8px;
          text-align: left;
        }
        .sheet-table td {
          border: 1px solid #e2e8f0;
          padding: 7px 8px;
          vertical-align: middle;
        }
        .sheet-table tr:nth-child(even) {
          background: #fafafa;
        }
        .footer {
          margin-top: 14px;
          padding-top: 10px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          font-size: 10px;
          color: #6b7280;
        }
        .sig-container {
          display: flex;
          gap: 40px;
        }
        .sig-box {
          border-top: 1px dashed #9ca3af;
          width: 160px;
          text-align: center;
          padding-top: 5px;
          font-weight: 700;
          color: #374151;
          font-size: 10.5px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="doctor-name">দেবজ্যোতি দত্ত</div>
          <div class="doctor-sub">B.A.M.S. (NIA, Jaipur) • B.Sc in BGE • লেখক — "স্বাস্থ্য দর্পণ"</div>
          <div class="doc-badge">চেম্বার রিসিপশন সিরিয়াল ও রোগী তালিকা (Daily Reception Roster)</div>
        </div>
        <div class="meta-box">
          <div><strong>তারিখ:</strong> ${new Date().toLocaleDateString('bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
          <div><strong>মোট সক্রিয় রোগী:</strong> ${activeApts.length.toLocaleString('bn-BD')} জন</div>
          ${sortLabel ? `<div style="font-size: 10px; color: #064e3b; font-weight: 700; margin-top: 1px;">সর্ট ক্রম: ${sortLabel}</div>` : ''}
          <div class="active-pill">✓ বাতিলকৃত সিরিয়ালগুলো বাদ দিয়ে হালনাগাদকৃত</div>
        </div>
      </div>

      <table class="sheet-table">
        <thead>
          <tr>
            <th style="width: 32px; text-align: center;">নং</th>
            <th style="width: 95px;">সিরিয়াল নং</th>
            <th>রোগীর নাম ও ফোন নম্বর</th>
            <th>চেম্বার</th>
            <th style="width: 140px;">তারিখ ও স্লট সময়</th>
            <th>সমস্যার বিবরণ / রিমার্কস</th>
            <th style="width: 80px; text-align: center;">স্ট্যাটাস</th>
            <th style="width: 75px; text-align: right;">ফি</th>
            <th style="width: 110px; text-align: center;">রোগীর স্বাক্ষর</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="footer">
        <div>
          <div>* সিস্টেম দ্বারা স্বয়ংক্রিয়ভাবে আপডেটকৃত রিসিপশন শিট। কোনো সিরিয়াল বাতিল হলে তা বাদ দিয়ে তাৎক্ষণিক রিয়েলটাইমে আপডেট হয়।</div>
          <div>মুদ্রণের সময়: ${new Date().toLocaleString('bn-BD')}</div>
        </div>
        <div class="sig-container">
          <div class="sig-box">রিসিপশনিস্ট স্বাক্ষর</div>
          <div class="sig-box">ডাক্তার স্বাক্ষর</div>
        </div>
      </div>

      <script>
        window.onload = function() {
          window.focus();
          window.print();
        };
      </script>
    </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    iframe.remove();
  }, 4000);
}

/**
 * Direct file download of the active Reception Roster as an HTML/Report document
 */
export function downloadReceptionReport(appointments: Appointment[]) {
  if (typeof window === 'undefined') return;
  const activeApts = appointments.filter((apt) => apt.status !== 'cancelled');
  const todayStr = getDhakaCurrentTime().dateStr;
  const title = `ডা-দেবজ্যোতি-দত্ত-রিসিপশন-সিরিয়াল-তালিকা-${todayStr}`;

  let content = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 24px; color: #111827; }
    h1 { color: #064e3b; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
    th { background: #f0fdf4; color: #064e3b; border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
    td { border: 1px solid #e2e8f0; padding: 8px; }
    tr:nth-child(even) { background: #f9fafb; }
  </style>
</head>
<body>
  <h1>দেবজ্যোতি দত্ত — চেম্বার রিসিপশন সিরিয়াল তালিকা</h1>
  <p>তারিখ: ${new Date().toLocaleDateString('bn-BD')} | মোট সক্রিয় রোগী: ${activeApts.length} জন (বাতিলকৃত স্লট বাদ দেওয়া হয়েছে)</p>
  <table>
    <thead>
      <tr>
        <th>নং</th><th>সিরিয়াল নং</th><th>রোগীর নাম</th><th>মোবাইল নম্বর</th><th>চেম্বার</th><th>তারিখ ও স্লট সময়</th><th>স্ট্যাটাস</th><th>স্বাক্ষর</th>
      </tr>
    </thead>
    <tbody>
      ${activeApts.map((a, i) => `<tr>
        <td>${i + 1}</td>
        <td><strong>${a.serialNo}</strong></td>
        <td>${a.patientName}</td>
        <td>${a.phone}</td>
        <td>${a.chamberTitleBn}</td>
        <td>${a.dateFormattedBn} (${a.slotTimeBn})</td>
        <td>${a.status}</td>
        <td></td>
      </tr>`).join('')}
    </tbody>
  </table>
</body>
</html>`;

  const blob = new Blob([content], { type: 'text/html;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `${title}.html`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

