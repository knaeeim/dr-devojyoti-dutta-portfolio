import { Appointment } from '@/types/booking';

export function printSinglePageSerialSlip(apt: Appointment) {
  if (typeof window === 'undefined') return;

  // Remove any previous print iframe
  const existingFrame = document.getElementById('print-slip-iframe');
  if (existingFrame) {
    existingFrame.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'print-slip-iframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  const statusLabel =
    apt.status === 'confirmed'
      ? 'নিশ্চিতকৃত (Confirmed)'
      : apt.status === 'rescheduled'
      ? 'পুনঃনির্ধারিত (Rescheduled)'
      : apt.status === 'completed'
      ? 'সম্পন্ন (Completed)'
      : 'যাচাই চলছে (Pending Verification)';

  const fee = apt.chamberMode === 'offline' ? '১,০০০ টাকা' : '৮০০ টাকা';

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="bn">
    <head>
      <meta charset="utf-8" />
      <title>সিরিয়াল স্লিপ - ${apt.serialNo}</title>
      <style>
        @page {
          size: A5 portrait;
          margin: 8mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: 'Kohinoor Bangla', 'kohinoor-bangla', 'Hind Siliguri', 'Segoe UI', Arial, sans-serif;
          color: #064e3b;
          background: #ffffff;
          padding: 10px;
          line-height: 1.4;
          font-size: 12px;
        }
        .slip-box {
          border: 2px solid #047857;
          border-radius: 12px;
          padding: 16px;
          background: #ffffff;
          max-width: 520px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #10b981;
          padding-bottom: 10px;
          margin-bottom: 12px;
        }
        .doctor-name {
          font-size: 20px;
          font-weight: 800;
          color: #064e3b;
          letter-spacing: -0.3px;
        }
        .doctor-degree {
          font-size: 11px;
          color: #047857;
          font-weight: 600;
          margin-top: 2px;
        }
        .clinic-tag {
          display: inline-block;
          background: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
          padding: 2px 10px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: bold;
          margin-top: 5px;
        }
        .serial-banner {
          background: #f0fdf4;
          border: 1.5px dashed #059669;
          border-radius: 8px;
          padding: 10px 14px;
          margin-bottom: 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .serial-label {
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
          color: #047857;
        }
        .serial-no {
          font-family: monospace;
          font-size: 22px;
          font-weight: 900;
          color: #064e3b;
          letter-spacing: 1px;
        }
        .status-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: bold;
          background: ${apt.status === 'confirmed' ? '#047857' : '#f59e0b'};
          color: ${apt.status === 'confirmed' ? '#ffffff' : '#78350f'};
        }
        .grid-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
        }
        .grid-table td {
          padding: 6px 8px;
          border-bottom: 1px solid #e5e7eb;
          font-size: 11.5px;
        }
        .grid-table td.label {
          color: #4b5563;
          font-weight: 600;
          width: 38%;
        }
        .grid-table td.value {
          color: #111827;
          font-weight: bold;
        }
        .instructions {
          background: #fefce8;
          border-left: 3px solid #eab308;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 10.5px;
          color: #713f12;
          margin-bottom: 12px;
        }
        .footer {
          border-top: 1px solid #e5e7eb;
          padding-top: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 9.5px;
          color: #6b7280;
        }
      </style>
    </head>
    <body>
      <div class="slip-box">
        <div class="header">
          <div class="doctor-name">ডা. দেবজ্যোতি দত্ত</div>
          <div class="doctor-degree">B.A.M.S. (NIA, Jaipur) • B.Sc. (KU)</div>
          <div class="doctor-degree">চিকিৎসা বিশেষজ্ঞ ও লেখক — "স্বাস্থ্য দর্পণ"</div>
          <div class="clinic-tag">ডিজিটাল সিরিয়াল ও বুকিং স্লিপ</div>
        </div>

        <div class="serial-banner">
          <div>
            <div class="serial-label">অফিশিয়াল সিরিয়াল নম্বর</div>
            <div class="serial-no">${apt.serialNo}</div>
          </div>
          <div style="text-align: right;">
            <div class="status-badge">${statusLabel}</div>
          </div>
        </div>

        <table class="grid-table">
          <tr>
            <td class="label">রোগীর নাম:</td>
            <td class="value">${apt.patientName}</td>
          </tr>
          <tr>
            <td class="label">মোবাইল নম্বর:</td>
            <td class="value">${apt.phone}</td>
          </tr>
          ${
            apt.email
              ? `<tr>
            <td class="label">ইমেইল:</td>
            <td class="value">${apt.email}</td>
          </tr>`
              : ''
          }
          <tr>
            <td class="label">চেম্বার / মোড:</td>
            <td class="value">${apt.chamberTitleBn}</td>
          </tr>
          <tr>
            <td class="label">তারিখ:</td>
            <td class="value">${apt.dateFormattedBn}</td>
          </tr>
          <tr>
            <td class="label">নির্ধারিত সময় স্লট:</td>
            <td class="value" style="color: #b45309; font-weight: 800;">${apt.slotTimeBn}</td>
          </tr>
          <tr>
            <td class="label">পরামর্শ ফি:</td>
            <td class="value">${fee}</td>
          </tr>
        </table>

        <div class="instructions">
          <strong>জরুরি নির্দেশনা:</strong>
          <ul style="margin-left: 16px; margin-top: 4px;">
            <li>আপনার নির্ধারিত সময়ের অন্তত ১০ মিনিট পূর্বে চেম্বারে উপস্থিত থাকুন।</li>
            <li>অনলাইন ভিডিও কনসালটেশনের ক্ষেত্রে সময়ের পূর্বে জুমে সক্রিয় থাকুন।</li>
            <li>পূর্ববর্তী প্রেসক্রিপশন বা কোনো মেডিকেল রিপোর্ট থাকলে সাথে রাখুন।</li>
          </ul>
        </div>

        <div class="footer">
          <div>মুদ্রণের সময়: ${new Date().toLocaleString('bn-BD')}</div>
          <div>সহায়তায়: +880 1711-223344</div>
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

  // Clean up iframe after printing
  setTimeout(() => {
    iframe.remove();
  }, 4000);
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

  const todayStr = new Date().toISOString().slice(0, 10);
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

            const fee = apt.chamberMode === 'offline' ? '১,০০০ টাকা' : '১,২০০ টাকা';

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
          font-family: 'Kohinoor Bangla', 'kohinoor-bangla', 'Hind Siliguri', 'Segoe UI', Arial, sans-serif;
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
          <div class="doctor-name">ডা. দেবজ্যোতি দত্ত</div>
          <div class="doctor-sub">B.A.M.S. (NIA, Jaipur) • B.Sc. (KU) • লেখক — "স্বাস্থ্য দর্পণ"</div>
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
  const todayStr = new Date().toISOString().slice(0, 10);
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
  <h1>ডা. দেবজ্যোতি দত্ত — চেম্বার রিসিপশন সিরিয়াল তালিকা</h1>
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

