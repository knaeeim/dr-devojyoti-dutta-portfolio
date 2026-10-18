import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'দেবজ্যোতি দত্ত | আধুনিক আয়ুর্বেদিক পোর্টাল ও স্মার্ট সিরিয়াল বুকিং',
  description:
    'Ayurvedacharya Devojyoti Dutta (B.A.M.S., NIA Jaipur & B.Sc in BGE) — শাস্ত্রীয় আয়ুর্বেদিক চিকিৎসা, পঞ্চকর্ম ও আধুনিক এপিজেনেটিক্সের সমন্বয়ে জটিল ও দীর্ঘস্থায়ী রোগ নিরাময় এবং স্মার্ট স্লট বুকিং প্ল্যাটফর্ম।',
  keywords: [
    'Devojyoti Dutta',
    'দেবজ্যোতি দত্ত',
    'Ayurvedacharya',
    'BAMS NIA Jaipur',
    'B.Sc in BGE',
    'Ayurveda Dhaka',
    'পঞ্চকর্ম',
    'Prakriti Test',
    'Epigenetics',
    'স্বাস্থ্য দর্পণ',
    'ডায়াবেটিস রিভার্সাল',
    'IBS treatment'
  ],
  authors: [{ name: 'দেবজ্যোতি দত্ত' }],
  metadataBase: new URL('https://drdevojyotidutta.com'),
  openGraph: {
    title: 'দেবজ্যোতি দত্ত — আধুনিক আয়ুর্বেদিক পোর্টাল ও স্মার্ট স্লট বুকিং',
    description:
      'শাস্ত্রীয় আয়ুর্বেদ বিজ্ঞান (NIA Jaipur) ও আধুনিক এপিজেনেটিক্স (B.Sc in BGE)। স্মার্ট স্লট বুকিং ও ডিজিটাল সিরিয়াল সিস্টেম।',
    url: 'https://drdevojyotidutta.com',
    siteName: 'দেবজ্যোতি দত্ত পোর্টাল',
    locale: 'bn_BD',
    type: 'website',
    images: [
      {
        url: '/assets/dr-devojyoti-dutta.jpg',
        width: 800,
        height: 1000,
        alt: 'দেবজ্যোতি দত্ত (B.A.M.S., NIA Jaipur & B.Sc in BGE)'
      }
    ]
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }
    ]
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#edf6f1' },
    { media: '(prefers-color-scheme: dark)', color: '#162e22' }
  ]
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&family=Noto+Serif+Bengali:wght@500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('ayur_theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');document.documentElement.setAttribute('data-theme','dark');}else{document.documentElement.classList.remove('dark');document.documentElement.setAttribute('data-theme','light');}}catch(e){}})();`
          }}
        />
      </head>
      <body className="antialiased min-h-screen flex flex-col font-sans transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
