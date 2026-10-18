'use client';

import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import ScrollReveal from '@/components/ui/ScrollReveal';

export default function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'স্মার্ট স্লট বুকিং সিস্টেম কীভাবে কাজ করে?',
      a: 'রোগীদের চেম্বারে ঘণ্টার পর ঘণ্টা বসে থাকার ভোগান্তি দূর করতে আমাদের সিস্টেমে প্রতিটি রোগীর জন্য নির্দিষ্ট সময় স্লট বরাদ্দ থাকে। আপনি বুকিং করার পর সাথে সাথেই একটি অফিসিয়াল সিরিয়াল নম্বর ও ডিজিটাল স্লিপ পাবেন। নির্ধারিত সময়ের ১০ মিনিট পূর্বে উপস্থিত থাকলেই চলবে।'
    },
    {
      q: 'পরামর্শ ফি ও ফলোআপ ভিজিট চার্জ কত?',
      a: 'ঢাকা চেম্বারে সরাসরি সাক্ষাতের ক্ষেত্রে পরামর্শ ফি ১,০০০ টাকা এবং পরবর্তী ফলোআপ ভিজিট ৬০০ টাকা (৩ মাসের মধ্যে প্রযোজ্য)। অনলাইন ভিডিও কনসালটেশনের ক্ষেত্রে পরামর্শ ফি ৮০০ টাকা এবং পরবর্তী ফলোআপ ভিজিট ৪০০ টাকা (৩ মাসের মধ্যে প্রযোজ্য)।'
    },
    {
      q: 'প্রথমবার চেম্বারে আসার জন্য কী ধরনের প্রস্তুতি প্রয়োজন?',
      a: 'আপনার বিগত দিনের প্রেসক্রিপশন, সাম্প্রতিক রক্ত ও অন্যান্য ল্যাব টেস্টের রিপোর্ট সাথে নিয়ে আসা সহায়ক। এছাড়া আপনার প্রধান উপসর্গ, দৈনন্দিন খাদ্যাভ্যাস ও ঘুমের সময়সূচী বিস্তারিত জানাতে পারলে রোগনির্ণয় ও চিকিৎসা পরিকল্পনা আরও নির্ভুল হয়।'
    },
    {
      q: 'অনলাইন ভিডিও কনসালটেশনে কীভাবে ওষুধ ও পরামর্শ দেওয়া হয়?',
      a: 'ভিডিও কলে দেবজ্যোতি দত্ত রোগীর বিস্তারিত লক্ষণ ও শারীরিক পর্যবেক্ষণের মাধ্যমে প্রেসক্রিপশন প্রস্তুত করেন। প্রেসক্রিপশনটি ডিজিটাল পিডিএফ আকারে রোগীর হোয়াটসঅ্যাপ ও ইমেইলে পাঠিয়ে দেওয়া হয়। এছাড়া কোরিয়ার সার্ভিসের মাধ্যমে খাঁটি ভেষজ ওষুধ পৌঁছে দেওয়ার ব্যবস্থাও রয়েছে।'
    },
    {
      q: 'আয়ুর্বেদিক চিকিৎসার সাথে কি বর্তমান অ্যালোপ্যাথিক ওষুধ চালিয়ে যাওয়া যাবে?',
      a: 'অবশ্যই। কোনো জরুরি অ্যালোপ্যাথিক ওষুধ হুট করে বন্ধ করা অনুচিত। দেবজ্যোতি দত্ত বায়োটেকনোলজির দৃষ্টিকোণ থেকে ওষুধের সম্ভাব্য ড্রাগ-হার্ব মিথস্ক্রিয়া (Drug-Herb Interaction) পর্যালোচনা করে নিরাপদ সমন্বয় নির্ধারণ করেন এবং রোগ নিয়ন্ত্রণে এলে ধীরে ধীরে পূর্বের ওষুধ কমানোর পরামর্শ দেন।'
    },
    {
      q: 'দীর্ঘস্থায়ী রোগ নিরাময়ে সাধারণত কতদিন সময় লাগতে পারে?',
      a: 'যেহেতু আয়ুর্বেদ লক্ষণ চেপে না রেখে রোগের গভীর শিকড় থেকে নিরাময় করে, তাই অধিকাংশ দীর্ঘস্থায়ী রোগে লক্ষণীয় উন্নতি দেখতে ২ থেকে ৪ সপ্তাহ এবং স্থায়ী ভারসাম্যের জন্য ২ থেকে ৬ মাস সময় লাগতে পারে। এটি রোগীর রোগ প্রতিরোধ ক্ষমতা ও জীবনচর্যার ওপর নির্ভর করে।'
    }
  ];

  return (
    <section id="faq" className="py-20 bg-white/70 dark:bg-[#101e17]/80 relative overflow-hidden">
      {/* Background ambient orbs */}
      <div className="ambient-glow-2 pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <ScrollReveal direction="up">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="glass-pill inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold text-emerald-800 dark:text-emerald-300">
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
        </ScrollReveal>

        <div className="space-y-4">
          {faqs.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <ScrollReveal key={idx} delay={idx * 60} direction="up">
                <div
                  className="glass-card rounded-2xl overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-emerald-400/50 dark:hover:border-emerald-600/50 shadow-xs hover:shadow-md"
                >
                  <button
                    type="button"
                    onClick={() => setOpenIdx(isOpen ? null : idx)}
                    className="w-full p-5 sm:p-6 text-left flex justify-between items-center gap-4 hover:bg-emerald-100/30 dark:hover:bg-emerald-900/20 transition-colors duration-250 cursor-pointer"
                  >
                    <span className="font-serif font-bold text-base sm:text-lg text-emerald-950 dark:text-emerald-50 leading-snug">
                      {item.q}
                    </span>
                    <div
                      className={`w-8 h-8 rounded-full glass-pill flex items-center justify-center text-emerald-800 dark:text-emerald-200 shrink-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        isOpen ? 'rotate-180 bg-emerald-800 text-white shadow-sm' : ''
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-emerald-900/80 dark:text-emerald-200/80 leading-relaxed border-t border-emerald-900/5 dark:border-emerald-800/30 animate-slide-down">
                      {item.a}
                    </div>
                  )}
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
