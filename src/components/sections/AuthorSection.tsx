import { BookOpen, ExternalLink, FileText, Sparkles, Star } from 'lucide-react';
import ScrollReveal from '@/components/ui/ScrollReveal';

export default function AuthorSection() {
  const chapters = [
    { title: 'প্রথম খণ্ড: অগ্নির বিজ্ঞান ও গাট মাইক্রোবায়োম', desc: 'কীভাবে পেটের হজমশক্তি আমাদের মস্তিষ্কের কার্যকারিতা ও রোগ প্রতিরোধ ক্ষমতা নিয়ন্ত্রণ করে।' },
    { title: 'দ্বিতীয় খণ্ড: এপিজেনেটিক্স ও প্রাচীন সার্কাডিয়ান ছন্দ', desc: 'সূর্যোদয়ের সাথে শরীরের মেটাবলিজমের ওঠানামা এবং রাত জাগার ক্ষতিকর প্রভাব থেকে সুরক্ষার বিজ্ঞান।' },
    { title: 'তৃতীয় খণ্ড: ত্রিদোষ বিশ্লেষণ ও আত্ম-উপলব্ধি', desc: 'নিজের দৈহিক গঠন চিনে প্রতিদিনের ডায়েট ও ভেষজ নির্বাচনের সম্পূর্ণ নিয়মাবলী।' },
    { title: 'চতুর্থ খণ্ড: আধুনিক জটিল রোগের বৈদিক নিরাময় প্রোটোকল', desc: 'ডায়াবেটিস, ফ্যাটি লিভার, উচ্চ রক্তচাপ ও জয়েন্ট পেইন নিয়ন্ত্রণের ব্যবহারিক দিকনির্দেশনা।' }
  ];

  return (
    <section id="research" className="py-20 bg-white dark:bg-[#0c1511] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Book Details (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <ScrollReveal direction="up">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                গ্রন্থাকার ও গবেষক
              </span>

              <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-emerald-950 dark:text-emerald-50 leading-tight mt-3">
                জননন্দিত স্বাস্থ্যগ্রন্থ <span className="text-amber-600 dark:text-amber-400">"স্বাস্থ্য দর্পণ"</span>
              </h2>

              <p className="text-sm sm:text-base text-emerald-900/80 dark:text-emerald-200/80 leading-relaxed mt-2">
                দেবজ্যোতি দত্ত রচিত <em>"স্বাস্থ্য দর্পণ"</em> আধুনিক পাঠক ও সচেতন রোগীদের জন্য এক অনন্য স্বাস্থ্যগাইড। বইটিতে বৈজ্ঞানিক রেফারেন্স ও বৈদিক ক্লাসিক্যাল সূত্রের সমন্বয়ে বুঝিয়ে দেওয়া হয়েছে কীভাবে মানুষ নিজের জীবনযাপন ও খাদ্য পরিবর্তনের মাধ্যমে দীর্ঘস্থায়ী রোগ থেকে মুক্ত থাকতে পারে।
              </p>
            </ScrollReveal>

            {/* Chapters Accordion / Highlights */}
            <div className="space-y-3 pt-2">
              {chapters.map((ch, idx) => (
                <ScrollReveal key={idx} delay={idx * 100} direction="up">
                  <div
                    className="card-butter p-4 rounded-2xl bg-emerald-50/50 dark:bg-[#13201a] border border-emerald-900/10 dark:border-emerald-800/40 space-y-1 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md"
                  >
                    <h4 className="font-serif font-bold text-sm text-emerald-950 dark:text-emerald-100">
                      {ch.title}
                    </h4>
                    <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80">
                      {ch.desc}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            <ScrollReveal delay={400} direction="up">
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <a
                  href="#booking"
                  className="btn-butter inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md hover:shadow-lg cursor-pointer"
                >
                  <span>অ্যাপয়েন্টমেন্ট বুক করুন</span>
                </a>

                <a
                  href="https://www.facebook.com/devojyoti.dutta"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-butter inline-flex items-center gap-2 px-5 py-3.5 rounded-xl border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 text-sm font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/30 cursor-pointer"
                >
                  <span>বইটি সম্পর্কে আরও জানতে ফেসবুক পেজে যুক্ত হন</span>
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </a>
              </div>
            </ScrollReveal>
          </div>

          {/* Right Column: Book Visual Card (5 cols) */}
          <div className="lg:col-span-5 flex justify-center">
            <ScrollReveal direction="left" delay={200}>
              <div className="card-butter relative w-full max-w-sm rounded-3xl p-8 bg-gradient-to-br from-amber-100/80 via-emerald-50 to-emerald-100/60 dark:from-[#172922] dark:via-[#13201a] dark:to-emerald-950/80 border border-amber-300/50 dark:border-emerald-700/50 shadow-2xl hover:shadow-emerald-950/20 space-y-6 text-center group">
                <div className="w-24 h-32 mx-auto rounded-xl bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 text-white p-3 shadow-xl flex flex-col justify-between transform -rotate-3 group-hover:rotate-0 group-hover:scale-105 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                  <span className="text-[9px] font-bold tracking-widest uppercase opacity-80">Health Book</span>
                  <span className="font-serif font-black text-sm leading-tight">স্বাস্থ্য দর্পণ</span>
                  <span className="text-[8px] opacity-90">দেবজ্যোতি দত্ত</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <h3 className="font-serif text-xl font-bold text-emerald-950 dark:text-emerald-100">
                    "স্বাস্থ্য দর্পণ"
                  </h3>
                  <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80">
                    দেহ, মন ও জীবনের আয়ুর্বেদিক নির্দেশিকা
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/80 dark:bg-emerald-950/60 border border-emerald-900/10 dark:border-emerald-800/40 text-xs text-emerald-900 dark:text-emerald-200 space-y-2 text-left">
                  <div className="flex justify-between border-b border-emerald-200 dark:border-emerald-800/40 pb-1.5">
                    <span className="text-emerald-600 dark:text-emerald-400">লেখক:</span>
                    <span className="font-bold">দেবজ্যোতি দত্ত</span>
                  </div>
                  <div className="flex justify-between border-b border-emerald-200 dark:border-emerald-800/40 pb-1.5">
                    <span className="text-emerald-600 dark:text-emerald-400">বিষয়বস্তু:</span>
                    <span className="font-bold">আয়ুর্বেদ ও আধুনিক এপিজেনেটিক্স</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-600 dark:text-emerald-400">প্রচ্ছদ:</span>
                    <span className="font-bold">হার্ডকভার ও ডিজিটাল সংকলন</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
