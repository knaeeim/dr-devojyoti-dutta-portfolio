import { CheckCircle2, ChevronRight, Stethoscope } from 'lucide-react';
import ScrollReveal from '@/components/ui/ScrollReveal';

export default function TreatmentsSection() {
  const treatments = [
    {
      category: 'মেটাবলিজম ও সুগার নিয়ন্ত্রণ',
      title: 'টাইপ-২ ডায়াবেটিস ও ফ্যাটি লিভার রিভার্সাল',
      desc: 'ইনসুলিন রেজিস্ট্যান্সের মূল কারণ দূর করে কোষের গ্লুকোজ গ্রহণযোগ্যতা বাড়ানো, লিভার এনজাইম স্বাভাবিকীকরণ ও ওষুধের ওপর নির্ভরশীলতা কমানো।',
      features: ['ইনসুলিন সেন্সিটিভিটি বৃদ্ধি', 'ফ্যাটি লিভার ডিটক্সিফিকেশন', 'অ্যান্টি-ইনফ্ল্যামেটরি ডায়েট চার্ট']
    },
    {
      category: 'গাট ও পরিপাকতন্ত্র',
      title: 'আইবিএস (IBS), দীর্ঘস্থায়ী গ্যাস্ট্রিক ও কোষ্ঠকাঠিন্য',
      desc: 'অন্ত্রের মাইক্রোবায়োম ও পাচক অগ্নির ভারসাম্য ফিরিয়ে এনে পেট ফাঁপা, টক ঢেকুর, আমাশয় ও মলত্যাগের অনিয়ম চিরতরে নির্মূল।',
      features: ['গ্রহণী দোষ নিরাময়', 'গাট লিকি সিন্ড্রোম হিলিং', 'মাইক্রোবায়োম পুনর্গঠন']
    },
    {
      category: 'ত্বক ও সৌন্দর্য চিকিৎসা',
      title: 'সোরিয়াসিস, একজিমা ও ক্রনিক অ্যালার্জি',
      desc: 'ক্রিম মেখে শুধু চামড়ার ওপরের ক্ষত ঢাকলে রোগ সারে না; রক্তের অশুদ্ধি ও পিত্ত দোষের মূল বিষাক্ততা অপসারণ করে স্থায়ী সুস্থতা।',
      features: ['রক্তপ্রসাধন চিকিৎসা', 'ইমিউন মড্যুলেশন', 'প্রাকৃতিক ভেষজ প্রলেপ']
    },
    {
      category: 'হাড় ও স্নায়ুতন্ত্র',
      title: 'বাতব্যধি, ব্যাকপেইন, সায়াটিকা ও স্পন্ডিলাইটিস',
      desc: 'জয়েন্টের কার্টিলেজ ক্ষয় রোধ, ইউরিক অ্যাসিড নিয়ন্ত্রণ ও স্নায়বিক প্রদাহ কমিয়ে ব্যথামুক্ত স্বাভাবিক চলনক্ষমতা ফিরিয়ে আনা।',
      features: ['সন্ধিবাত নিরাময় প্রোটোকল', 'স্নায়ু পুষ্টি ও রসায়ন', 'জয়েন্ট লুব্রিকেশন']
    },
    {
      category: 'হরমোন ও এন্ডোক্রাইন',
      title: 'পিসিওএস (PCOS), থাইরয়েড ও বন্ধ্যাত্ব',
      desc: 'ওভারিয়ান সিস্ট ও হরমোনের তারতম্যের সুনির্দিষ্ট আয়ুর্বেদিক চিকিৎসা, যা প্রাকৃতিক উপায়ে মাসিক নিয়মিত করে ও প্রজনন স্বাস্থ্য উন্নত করে।',
      features: ['হরমোনাল ইকোসিস্টেম ব্যালেন্স', 'ওজন নিয়ন্ত্রণ', 'প্রাকৃতিক ওভুলেশন সহায়তা']
    },
    {
      category: 'মন ও স্নায়ুবিক ভারসাম্য',
      title: 'দীর্ঘস্থায়ী অনিদ্রা, অবসাদ ও মাইগ্রেন',
      desc: 'অতিরিক্ত কর্টিসল হরমোন কমিয়ে গভীর ও শান্তিময় ঘুমের সার্কাডিয়ান প্যাটার্ন ফিরিয়ে আনা এবং স্নায়ু শান্তকারী চিকিৎসা।',
      features: ['শিরোধারা ও নস্য কনসালটেশন', 'মেধা রসায়ন প্রয়োগ', 'স্ট্রেস ম্যানেজমেন্ট']
    }
  ];

  return (
    <section id="treatments" className="py-20 bg-emerald-950/[0.02] dark:bg-emerald-950/20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal direction="up">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
              <Stethoscope className="w-3.5 h-3.5 text-amber-500" />
              চিকিৎসা সেবা ও নিরাময় ক্ষেত্রসমূহ
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-emerald-950 dark:text-emerald-50">
              দীর্ঘস্থায়ী ও জটিল রোগের স্থায়ী সমাধান
            </h2>
            <p className="text-sm sm:text-base text-emerald-800/80 dark:text-emerald-300/80">
              শুধু লক্ষণ দমানো নয়, রোগের অন্তর্নিহিত উৎস চিহ্নিত করে কোষীয় স্তর থেকে সুস্থতা অর্জন।
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {treatments.map((item, idx) => (
            <ScrollReveal key={idx} delay={idx * 110} direction="up" className="h-full">
              <div className="card-butter p-8 rounded-3xl bg-white dark:bg-[#13201a] border border-emerald-900/10 dark:border-emerald-700/30 shadow-md hover:shadow-2xl hover:border-emerald-400/50 dark:hover:border-emerald-600/50 flex flex-col justify-between space-y-5 group h-full">
                <div className="space-y-3">
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                    {item.category}
                  </span>
                  <h3 className="font-serif text-xl font-bold text-emerald-950 dark:text-emerald-50 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-emerald-900/70 dark:text-emerald-300/70 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-emerald-900/10 dark:border-emerald-800/40 space-y-2">
                  {item.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
