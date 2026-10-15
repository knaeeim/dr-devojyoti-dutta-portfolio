'use client';

import Image from 'next/image';
import { Award, Calendar, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';

export default function HeroSection() {
  const stats = [
    { number: '১০+', label: 'বছর গবেষণা ও চিকিৎসা' },
    { number: '৫,০০০+', label: 'রোগীর সুস্থতা লাভ' },
    { number: '১০০%', label: 'রুট-কজ নিরাময় দর্শন' },
    { number: '৪.৯ ★', label: 'রোগীদের আস্থা ও রিভিউ' }
  ];

  return (
    <section className="relative overflow-hidden pt-6 pb-12 sm:pt-8 sm:pb-16 lg:pt-14 lg:pb-20">
      {/* Background ambient orbs */}
      <div className="ambient-glow-1" />
      <div className="ambient-glow-2" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
          {/* Left Column: Focused Copy & Prominent Booking CTA (7 cols) */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6">
            {/* Trust Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-100/90 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border border-emerald-300/50 dark:border-emerald-700/50 shadow-xs">
              <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>ন্যাশনাল ইনস্টিটিউট অব আয়ুর্বেদ (NIA) জয়পুর প্রাক্তনী</span>
              <span className="w-1 h-1 rounded-full bg-emerald-500" />
              <span className="text-amber-700 dark:text-amber-300 font-bold">BAMS • B.Sc</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-emerald-950 dark:text-emerald-50 leading-[1.2]">
              প্রাচীন <span className="text-emerald-700 dark:text-emerald-400">আয়ুর্বেদ বিজ্ঞান</span> ও আধুনিক <span className="text-amber-600 dark:text-amber-400">এপিজেনেটিক্স</span>
            </h1>

            {/* Subtitle: Short, clean & punchy */}
            <p className="text-sm sm:text-base lg:text-lg text-emerald-900/80 dark:text-emerald-200/80 leading-relaxed max-w-xl">
              লক্ষণ চেপে রাখা নয়, রোগের গভীর শিকড় থেকে স্থায়ী আরোগ্য। <strong>আয়ুর্বেদাচার্য ডা. দেবজ্যোতি দত্তের</strong> বৈজ্ঞানিক চিকিৎসা দর্শনে ফিরে পান প্রাকৃতিক সুস্থতা ও দীর্ঘস্থায়ী নিরাময়।
            </p>

            {/* Quick Trust Highlights (Minimal, Sleek Pills) */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm text-emerald-900/90 dark:text-emerald-200/90 font-medium">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ক্লাসিক্যাল নাড়ি পরীক্ষা
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ঢাকা চেম্বার ও ভিডিও কনসালটেশন
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                "স্বাস্থ্য দর্পণ" গ্রন্থের প্রণেতা
              </span>
            </div>

            {/* PRIMARY CTAs - Prominent, Full-Width on Mobile & Unmissable */}
            <div className="space-y-3 pt-1">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Big Eye-catching Booking Button */}
                <a
                  href="#booking"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-750 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold text-base sm:text-lg shadow-xl shadow-emerald-900/25 hover:shadow-2xl hover:shadow-emerald-900/35 transition-all transform active:scale-95 ring-2 ring-emerald-500/30 group text-center cursor-pointer"
                >
                  <Calendar className="w-5 h-5 text-amber-300 group-hover:scale-110 transition-transform shrink-0" />
                  <span>সিরিয়াল বুক করুন</span>
                  <ChevronRight className="w-4 h-4 text-emerald-200 group-hover:translate-x-1 transition-transform shrink-0" />
                </a>

                {/* Secondary Prakriti Quiz CTA */}
                <a
                  href="#prakriti"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 sm:py-4 rounded-2xl bg-white dark:bg-[#13201a] hover:bg-emerald-50 dark:hover:bg-[#192a23] text-emerald-900 dark:text-emerald-100 border border-emerald-300/80 dark:border-emerald-700/60 font-semibold text-sm sm:text-base shadow-sm hover:shadow transition-all text-center cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>আপনার প্রকৃতি (দোষ) জানুন</span>
                </a>
              </div>

              {/* Booking reassurance sub-caption */}
              <p className="text-[11px] sm:text-xs text-emerald-700/90 dark:text-emerald-400/90 flex items-center justify-center sm:justify-start gap-1.5 font-medium pt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>সহজ ৩ ধাপে দ্রুত সিরিয়াল • এসএমএস ও হোয়াটসঅ্যাপ কনফার্মেশন স্লিপ</span>
              </p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-emerald-900/10 dark:border-emerald-800/40">
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
