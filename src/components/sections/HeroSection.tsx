'use client';

import Image from 'next/image';
import { Award, BookOpen, Calendar, CheckCircle2, ChevronRight, Dna, HeartPulse, Sparkles } from 'lucide-react';

export default function HeroSection() {
  const stats = [
    { number: '১০+', label: 'বছর গবেষণা ও চিকিৎসা' },
    { number: '৫,০০০+', label: 'রোগীর সুস্থতা লাভ' },
    { number: '১০০%', label: 'রুট-কজ নিরাময় দর্শন' },
    { number: '৫০+', label: 'স্বাস্থ্য সেমিনার ও ওয়ার্কশপ' }
  ];

  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:pt-16 lg:pb-24">
      {/* Background ambient orbs */}
      <div className="ambient-glow-1" />
      <div className="ambient-glow-2" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Copy & CTAs (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40 dark:border-emerald-700/50 shadow-sm">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                NIA জয়পুর প্রাক্তনী • Apex AYUSH Institute
              </span>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-100/70 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border border-amber-300/40 dark:border-amber-700/50 shadow-sm">
                <Dna className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                বায়োটেকনোলজি ও এপিজেনেটিক্স গবেষক
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-emerald-950 dark:text-emerald-50 leading-tight">
              প্রাচীন <span className="text-emerald-700 dark:text-emerald-400 decoration-amber-400 decoration-2">আয়ুর্বেদ বিজ্ঞান</span> ও আধুনিক <span className="text-amber-600 dark:text-amber-400">এপিজেনেটিক্স</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-emerald-900/80 dark:text-emerald-200/80 leading-relaxed max-w-2xl">
              লক্ষণ চেপে রাখা নয়, রোগের গভীর শিকড় থেকে স্থায়ী আরোগ্য। <strong>আয়ুর্বেদাচার্য ডা. দেবজ্যোতি দত্ত</strong> ৫,০০০ বছরের বৈদিক চিকিৎসা দর্শনের সাথে একুশ শতকের মলিকিউলার বায়োলজি, গাট মাইক্রোবায়োম ও সার্কাডিয়ান জীবনচর্যার সমন্বয়ে দীর্ঘস্থায়ী জটিল রোগ নিরাময় করেন।
            </p>

            {/* Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/70 dark:bg-emerald-950/40 border border-emerald-900/10 dark:border-emerald-700/20 shadow-sm backdrop-blur-sm">
                <span className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold shrink-0">🏛️</span>
                <span className="text-xs sm:text-sm text-emerald-950 dark:text-emerald-100">
                  <strong>B.A.M.S.</strong> — ন্যাশনাল ইনস্টিটিউট অব আয়ুর্বেদ (NIA), জয়পুর
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/70 dark:bg-emerald-950/40 border border-emerald-900/10 dark:border-emerald-700/20 shadow-sm backdrop-blur-sm">
                <span className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-700 dark:text-amber-300 font-bold shrink-0">🔬</span>
                <span className="text-xs sm:text-sm text-emerald-950 dark:text-emerald-100">
                  <strong>B.Sc.</strong> — বায়োটেকনোলজি ও জেনেটিক্স (খুলনা বিশ্ববিদ্যালয়)
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/70 dark:bg-emerald-950/40 border border-emerald-900/10 dark:border-emerald-700/20 shadow-sm backdrop-blur-sm">
                <span className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold shrink-0">🩺</span>
                <span className="text-xs sm:text-sm text-emerald-950 dark:text-emerald-100">
                  <strong>নাড়ি পরীক্ষা</strong> — ক্লাসিক্যাল নির্ভুল আয়ুর্বেদিক ডায়াগনস্টিক
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/70 dark:bg-emerald-950/40 border border-emerald-900/10 dark:border-emerald-700/20 shadow-sm backdrop-blur-sm">
                <span className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-700 dark:text-amber-300 font-bold shrink-0">📖</span>
                <span className="text-xs sm:text-sm text-emerald-950 dark:text-emerald-100">
                  <strong>লেখক</strong> — জননন্দিত স্বাস্থ্যগ্রন্থ <em>"স্বাস্থ্য দর্পণ"</em>
                </span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <a
                href="#booking"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 text-white font-semibold text-base shadow-lg shadow-emerald-900/20 hover:shadow-xl hover:shadow-emerald-900/30 transition-all transform active:scale-95"
              >
                <Calendar className="w-5 h-5 text-amber-300" />
                <span>সিরিয়াল বুক করুন</span>
              </a>

              <a
                href="#prakriti"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 border border-emerald-200/80 dark:border-emerald-800/80 font-semibold text-base transition-all"
              >
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>আপনার প্রকৃতি (দোষ) জানুন</span>
              </a>

              <a
                href="https://www.facebook.com/devojyoti.dutta"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#1877F2] dark:text-blue-400 border border-[#1877F2]/20 font-medium text-sm transition-all"
                title="অফিসিয়াল ফেসবুক পেজ"
              >
                <span className="font-bold text-base">f</span>
                <span>ফেসবুক</span>
              </a>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-emerald-900/10 dark:border-emerald-800/40">
              {stats.map((s, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="font-serif font-black text-2xl sm:text-3xl text-emerald-800 dark:text-emerald-300">
                    {s.number}
                  </div>
                  <div className="text-xs text-emerald-700/80 dark:text-emerald-400 font-medium leading-tight">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Doctor Portrait Card (5 cols) */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="relative w-full max-w-md">
              {/* Doctor Frame */}
              <div className="relative rounded-3xl p-3 bg-gradient-to-b from-emerald-100 via-white to-amber-50 dark:from-emerald-900/50 dark:via-[#13201a] dark:to-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 shadow-2xl overflow-hidden group">
                <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-emerald-950">
                  <Image
                    src="/assets/dr-devojyoti-dutta.png"
                    alt="আয়ুর্বেদাচার্য ডা. দেবজ্যোতি দত্ত"
                    fill
                    sizes="(max-width: 768px) 100vw, 450px"
                    priority
                    className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                  {/* Card bottom details */}
                  <div className="absolute bottom-0 inset-x-0 p-5 text-white space-y-1">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-600/90 text-white backdrop-blur-sm mb-1">
                      শীর্ষ আয়ুর্বেদ চিকিৎসক ও গবেষক
                    </span>
                    <h2 className="font-serif text-2xl font-bold text-white leading-tight">
                      ডা. দেবজ্যোতি দত্ত
                    </h2>
                    <p className="text-xs text-emerald-200">
                      B.A.M.S. (NIA Jaipur) • B.Sc. (Biotech, KU)
                    </p>
                    <div className="text-[11px] text-emerald-300/90 flex items-center gap-1 pt-1">
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      <span>ন্যাশনাল ইনস্টিটিউট অব আয়ুর্বেদ, জয়পুর, ভারত</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Badge Top Left */}
              <div className="absolute -top-4 -left-4 sm:-left-6 p-3 rounded-2xl bg-white/95 dark:bg-[#13201a]/95 backdrop-blur-md border border-emerald-200 dark:border-emerald-800 shadow-xl flex items-center gap-3 animate-bounce-subtle z-10">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-800 dark:text-emerald-300 font-bold text-lg">
                  🏛️
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-950 dark:text-emerald-100 leading-tight">
                    NIA Jaipur প্রাক্তনী
                  </div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400">
                    আয়ুষ মন্ত্রণালয়, ভারত সরকার
                  </div>
                </div>
              </div>

              {/* Floating Badge Bottom Right */}
              <div className="absolute -bottom-4 -right-4 sm:-right-6 p-3 rounded-2xl bg-white/95 dark:bg-[#13201a]/95 backdrop-blur-md border border-amber-200 dark:border-amber-900/60 shadow-xl flex items-center gap-3 z-10">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-700 dark:text-amber-300 font-bold text-lg">
                  🧬
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-950 dark:text-amber-100 leading-tight">
                    এপিজেনেটিক্স ও জেনেটিক্স
                  </div>
                  <div className="text-[10px] text-amber-700 dark:text-amber-400">
                    খুলনা বিশ্ববিদ্যালয় গ্র্যাজুয়েট
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
