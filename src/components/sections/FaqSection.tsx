'use client';

import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export default function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'স্মার্ট স্লট বুকিং সিস্টেম কীভাবে কাজ করে?',
      a: 'রোগীদের চেম্বারে ঘণ্টার পর ঘণ্টা বসে থাকার ভোগান্তি দূর করতে আমাদের সিস্টেমে প্রতিটি রোগীর জন্য নির্দিষ্ট সময় স্লট বরাদ্দ থাকে। আপনি বুকিং করার পর সাথে সাথেই একটি অফিসিয়াল সিরিয়াল নম্বর ও ডিজিটাল স্লিপ পাবেন। নির্ধারিত সময়ের ১০ মিনিট পূর্বে উপস্থিত থাকলেই চলবে।'
    },
    {
      q: 'নাড়ি পরীক্ষার জন্য কি কোনো পূর্বপ্রস্তুতি প্রয়োজন?',
      a: 'হ্যাঁ। ক্লাসিক্যাল নাড়ি পরীক্ষার জন্য সকালে খালি পেটে অথবা ভারী খাবার খাওয়ার অন্তত ২.৫ থেকে ৩ ঘণ্টা পর আসা সর্বোত্তম। নাড়ি পরীক্ষার অন্তত ১ ঘণ্টা পূর্বে চা, কফি বা ধূমপান পরিহার করা আবশ্যক, যেন রক্তচাপ ও পালস স্বাভাবিক থাকে।'
    },
    {
      q: 'অনলাইন ভিডিও কনসালটেশনে কীভাবে ওষুধ ও পরামর্শ দেওয়া হয়?',
      a: 'ভিডিও কলে ডা. দেবজ্যোতি দত্ত রোগীর বিস্তারিত লক্ষণ ও জিহ্বা/চোখের চিত্র দেখে প্রেসক্রিপশন প্রস্তুত করেন। প্রেসক্রিপশনটি ডিজিটাল পিডিএফ আকারে রোগীর হোয়াটসঅ্যাপ ও ইমেইলে পাঠিয়ে দেওয়া হয়। এছাড়া কোরিয়ার সার্ভিসের মাধ্যমে খাঁটি ভেষজ ওষুধ পৌঁছে দেওয়ার ব্যবস্থাও রয়েছে।'
    },
    {
      q: 'আয়ুর্বেদিক চিকিৎসার সাথে কি বর্তমান অ্যালোপ্যাথিক ওষুধ চালিয়ে যাওয়া যাবে?',
      a: 'অবশ্যই। কোনো জরুরি অ্যালোপ্যাথিক ওষুধ হুট করে বন্ধ করা অনুচিত। ডা. দেবজ্যোতি দত্ত বায়োটেকনোলজির দৃষ্টিকোণ থেকে ওষুধের সম্ভাব্য ড্রাগ-হার্ব মিথস্ক্রিয়া (Drug-Herb Interaction) পর্যালোচনা করে নিরাপদ সমন্বয় নির্ধারণ করেন এবং রোগ নিয়ন্ত্রণে এলে ধীরে ধীরে পূর্বের ওষুধ কমানোর পরামর্শ দেন।'
    },
    {
      q: 'দীর্ঘস্থায়ী রোগ নিরাময়ে সাধারণত কতদিন সময় লাগতে পারে?',
      a: 'যেহেতু আয়ুর্বেদ লক্ষণ চেপে না রেখে রোগের গভীর শিকড় থেকে নিরাময় করে, তাই অধিকাংশ দীর্ঘস্থায়ী রোগে লক্ষণীয় উন্নতি দেখতে ২ থেকে ৪ সপ্তাহ এবং স্থায়ী ভারসাম্যের জন্য ২ থেকে ৬ মাস সময় লাগতে পারে। এটি রোগীর রোগ প্রতিরোধ ক্ষমতা ও জীবনচর্যার ওপর নির্ভর করে।'
    }
  ];

  return (
    <section id="faq" className="py-20 bg-white dark:bg-[#0c1511] relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
            <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
            সাধারণ জিজ্ঞাসা ও উত্তর
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-emerald-950 dark:text-emerald-50">
            রোগীদের সাধারণ প্রশ্নাবলী
          </h2>
          <p className="text-sm sm:text-base text-emerald-800/80 dark:text-emerald-300/80">
            অ্যাপয়েন্টমেন্ট, চিকিৎসা পদ্ধতি ও ওষুধ গ্রহণ সংক্রান্ত দরকারি তথ্যাবলী।
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-emerald-900/10 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-[#13201a] overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex justify-between items-center gap-4 hover:bg-emerald-100/40 dark:hover:bg-emerald-900/20 transition-colors"
                >
                  <span className="font-serif font-bold text-base sm:text-lg text-emerald-950 dark:text-emerald-50 leading-snug">
                    {item.q}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-800 dark:text-emerald-200 shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 bg-emerald-800 text-white' : ''
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-emerald-900/80 dark:text-emerald-200/80 leading-relaxed border-t border-emerald-900/5 dark:border-emerald-800/30 animate-fade-in">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
