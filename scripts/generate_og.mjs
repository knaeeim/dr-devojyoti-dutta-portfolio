import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const projectDir = '/Users/khairul/Developer/dr-devojyoti-dutta-portfolio';
const doctorImgPath = path.join(projectDir, 'public/assets/dr-devojyoti-dutta.png');
const doctorImgBase64 = fs.readFileSync(doctorImgPath).toString('base64');
const doctorImgDataUri = `data:image/png;base64,${doctorImgBase64}`;

const htmlContent = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Anek+Bangla:wght@400;500;600;700;800&family=Noto+Serif+Bengali:wght@600;700;800&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      width: 1200px;
      height: 630px;
      overflow: hidden;
      font-family: 'Anek Bangla', 'Outfit', system-ui, sans-serif;
      background: #0c1a13;
      color: #f1f8f4;
      display: flex;
      position: relative;
    }

    /* Ambient background gradient & orbs */
    .bg-mesh {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 18% 25%, rgba(45, 102, 78, 0.45) 0%, transparent 50%),
                  radial-gradient(circle at 85% 75%, rgba(200, 122, 62, 0.3) 0%, transparent 45%),
                  radial-gradient(circle at 50% 105%, rgba(91, 170, 136, 0.25) 0%, transparent 55%),
                  linear-gradient(135deg, #09150f 0%, #0e2219 50%, #08140e 100%);
      z-index: 1;
    }

    /* Decorative framing line */
    .frame-border {
      position: absolute;
      inset: 18px;
      border: 1px solid rgba(164, 215, 192, 0.18);
      border-radius: 28px;
      pointer-events: none;
      z-index: 3;
    }

    .corner-decor {
      position: absolute;
      width: 24px;
      height: 24px;
      border-color: rgba(234, 165, 108, 0.6);
      border-style: solid;
      z-index: 4;
    }
    .corner-tl { top: 28px; left: 28px; border-width: 2px 0 0 2px; border-top-left-radius: 8px; }
    .corner-tr { top: 28px; right: 28px; border-width: 2px 2px 0 0; border-top-right-radius: 8px; }
    .corner-bl { bottom: 28px; left: 28px; border-width: 0 0 2px 2px; border-bottom-left-radius: 8px; }
    .corner-br { bottom: 28px; right: 28px; border-width: 0 2px 2px 0; border-bottom-right-radius: 8px; }

    /* Content Layout */
    .container {
      position: relative;
      z-index: 5;
      width: 100%;
      height: 100%;
      padding: 48px 56px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 40px;
    }

    /* Left Info Column */
    .left-col {
      flex: 1;
      max-width: 650px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .pill-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 7px 18px;
      border-radius: 9999px;
      background: rgba(22, 54, 40, 0.7);
      border: 1px solid rgba(123, 193, 162, 0.35);
      color: #bbf0d8;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.3px;
      width: fit-content;
      margin-bottom: 20px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
    }
    .pill-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #4ade80;
      box-shadow: 0 0 10px #4ade80;
    }

    .doctor-title-row {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 10px;
      flex-wrap: nowrap;
    }
    .doctor-name {
      font-family: 'Noto Serif Bengali', serif;
      font-size: 54px;
      font-weight: 800;
      color: #ffffff;
      line-height: 1.15;
      text-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      white-space: nowrap;
    }
    .bams-tag {
      background: linear-gradient(135deg, rgba(200, 122, 62, 0.35) 0%, rgba(167, 88, 37, 0.25) 100%);
      border: 1px solid rgba(234, 165, 108, 0.6);
      color: #fed7aa;
      font-size: 19px;
      font-weight: 800;
      padding: 4px 14px;
      border-radius: 10px;
      letter-spacing: 1px;
      box-shadow: 0 4px 12px rgba(200, 122, 62, 0.25);
    }

    .degrees {
      font-size: 19px;
      color: #9cd4ba;
      font-weight: 600;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .degree-dot {
      color: #ea9e60;
    }

    .headline {
      font-size: 27px;
      font-weight: 700;
      color: #ecfdf5;
      line-height: 1.35;
      margin-bottom: 22px;
    }
    .headline-gold {
      color: #f7b47b;
      font-weight: 800;
    }

    .tags-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 28px;
    }
    .tag-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 17px;
      color: #d1fae5;
      font-weight: 500;
    }
    .tag-icon {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: rgba(74, 222, 128, 0.18);
      border: 1px solid rgba(74, 222, 128, 0.45);
      color: #4ade80;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 800;
      shrink: 0;
    }

    /* Bottom Trust Strip */
    .bottom-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 20px;
      background: rgba(18, 43, 32, 0.85);
      border: 1px solid rgba(123, 193, 162, 0.3);
      border-radius: 16px;
      backdrop-filter: blur(12px);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.35);
    }
    .status-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #bbf7d0;
      font-size: 15px;
      font-weight: 600;
    }
    .site-domain {
      font-family: 'Outfit', sans-serif;
      font-size: 16px;
      font-weight: 700;
      color: #fed7aa;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* Right Photo Column */
    .right-col {
      width: 410px;
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
    }

    .photo-card {
      width: 380px;
      height: 480px;
      border-radius: 36px;
      position: relative;
      overflow: hidden;
      border: 3px solid rgba(164, 215, 192, 0.45);
      box-shadow: 0 25px 60px -10px rgba(0, 0, 0, 0.7),
                  0 0 35px rgba(45, 102, 78, 0.45);
    }

    .photo-card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center 20%;
    }

    .photo-overlay-top {
      position: absolute;
      top: 16px;
      left: 16px;
      padding: 7px 14px;
      border-radius: 9999px;
      background: rgba(14, 34, 25, 0.85);
      border: 1px solid rgba(234, 165, 108, 0.5);
      color: #fde68a;
      font-size: 13px;
      font-weight: 700;
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
    }

    .photo-overlay-bottom {
      position: absolute;
      bottom: 0;
      inset-x: 0;
      padding: 24px 20px 18px;
      background: linear-gradient(to top, rgba(9, 21, 15, 0.95) 0%, rgba(9, 21, 15, 0.7) 60%, transparent 100%);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .photo-overlay-bottom span {
      font-size: 14px;
      color: #ecfdf5;
      font-weight: 600;
    }
    .rating-pill {
      background: rgba(245, 158, 11, 0.25);
      border: 1px solid rgba(245, 158, 11, 0.6);
      color: #fef08a;
      padding: 3px 10px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 800;
    }
  </style>
</head>
<body>
  <div class="bg-mesh"></div>
  <div class="frame-border"></div>
  <div class="corner-decor corner-tl"></div>
  <div class="corner-decor corner-tr"></div>
  <div class="corner-decor corner-bl"></div>
  <div class="corner-decor corner-br"></div>

  <div class="container">
    <!-- Left Column: Information & Brand Authority -->
    <div class="left-col">
      <div class="pill-badge">
        <span class="pill-dot"></span>
        <span>ন্যাশনাল ইনস্টিটিউট অব আয়ুর্বেদ (NIA) জয়পুর প্রাক্তনী</span>
      </div>

      <div class="doctor-title-row">
        <h1 class="doctor-name">দেবজ্যোতি দত্ত</h1>
        <span class="bams-tag">BAMS</span>
      </div>

      <div class="degrees">
        <span>B.A.M.S. (NIA Jaipur)</span>
        <span class="degree-dot">•</span>
        <span>B.Sc in BGE (খুলনা বিশ্ববিদ্যালয়)</span>
      </div>

      <h2 class="headline">
        প্রাচীন <span class="headline-gold">আয়ুর্বেদ বিজ্ঞান</span> ও আধুনিক এপিজেনেটিক্স
      </h2>

      <div class="tags-list">
        <div class="tag-item">
          <span class="tag-icon">✓</span>
          <span>লক্ষণ চেপে রাখা নয়, রোগের রুট-কজ থেকে স্থায়ী নিরাময়</span>
        </div>
        <div class="tag-item">
          <span class="tag-icon">✓</span>
          <span>ক্লাসিক্যাল পঞ্চকর্ম ও বৈজ্ঞানিক ভেষজ চিকিৎসা</span>
        </div>
        <div class="tag-item">
          <span class="tag-icon">✓</span>
          <span>জননন্দিত গ্রন্থ "স্বাস্থ্য দর্পণ"-এর প্রণেতা ও গবেষক</span>
        </div>
      </div>

      <div class="bottom-bar">
        <div class="status-badge">
          <span>📅 স্মার্ট চেম্বার ও ভিডিও সিরিয়াল বুকিং</span>
        </div>
        <div class="site-domain">
          <span>🌿 drdevojyotidutta.com</span>
        </div>
      </div>
    </div>

    <!-- Right Column: Doctor Portrait Photo Card -->
    <div class="right-col">
      <div class="photo-card">
        <img src="${doctorImgDataUri}" alt="দেবজ্যোতি দত্ত" />
        <div class="photo-overlay-top">
          <span>🏛️ আয়ুর্বেদাচার্য ও গবেষক</span>
        </div>
        <div class="photo-overlay-bottom">
          <span>৫,০০০+ সুস্থ রোগী</span>
          <span class="rating-pill">★ ৪.৯ / ৫.০</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

const tempHtmlPath = '/tmp/og-preview.html';
fs.writeFileSync(tempHtmlPath, htmlContent);

const outPublicPath = path.join(projectDir, 'public/og-image.png');
const outAppPath = path.join(projectDir, 'src/app/opengraph-image.png');
const outTwitterPath = path.join(projectDir, 'src/app/twitter-image.png');

console.log('Rendering 1200x630 OG image using Edge...');

const edgeCmd = `"/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" --headless=new --window-size=1200,630 --virtual-time-budget=2000 --screenshot="${outPublicPath}" --default-background-color=00000000 "file://${tempHtmlPath}"`;
execSync(edgeCmd);

fs.copyFileSync(outPublicPath, outAppPath);
fs.copyFileSync(outPublicPath, outTwitterPath);

console.log('Generated successfully at:');
console.log('1.', outPublicPath);
console.log('2.', outAppPath);
console.log('3.', outTwitterPath);
