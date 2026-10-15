import { Award, Dna, Flame, HeartPulse, Sparkles } from 'lucide-react';
import ScrollReveal from '@/components/ui/ScrollReveal';

export default function AboutSection() {
  const pillars = [
    {
      icon: '🏛️',
      title: 'শাস্ত্রীয় আয়ুর্বেদ চিকিৎসা (B.A.M.S.)',
      sub: 'ন্যাশনাল ইনস্টিটিউট অব আয়ুর্বেদ (NIA), জয়পুর, রাজস্থান',
      desc: 'ভারত সরকারের আয়ুষ মন্ত্রণালয়াধীন শীর্ষ স্বায়ত্তশাসিত জাতীয় প্রতিষ্ঠান থেকে অর্জিত ডিগ্রি। চরক সংহিতা, সুশ্রুত সংহিতা ও অষ্টাঙ্গ হৃদয়ের গভীর অনুধাবন। রোগীর কব্জির ধমনী স্পর্শ করে প্রাচীন বৈদিক নাড়ি পরীক্ষা (Pulse Diagnosis), পঞ্চকর্ম বিষমুক্তকরণ ও ক্লাসিক্যাল দ্রব্যগুণ ভেষজ বিশেষজ্ঞ।'
    },
    {
      icon: '🔬',
      title: 'বায়োটেকনোলজি ও জেনেটিক্স (B.Sc.)',
      sub: 'খুলনা বিশ্ববিদ্যালয়, বাংলাদেশ',
      desc: 'মলিকিউলার বায়োলজি, জিনের অভিব্যক্তি (Gene Expression), কোষীয় সংকেত ও বায়োকেমিস্ট্রির গভীর ভিত্তি। তিনি বৈজ্ঞানিকভাবে ব্যাখ্যা করেন কীভাবে আয়ুর্বেদিক রসায়ন ও সঠিক খাদ্যাভ্যাস আমাদের জিনের প্রদাহজনিত সুইচ বন্ধ করে এবং মেটাবলিক কোষকে নবজীবন দান করে।'
    },
    {
      icon: '⚡',
      title: 'অগ্নি, গাট মাইক্রোবায়োম ও সার্কাডিয়ান ছন্দ',
      sub: 'প্রাচীন বৈদিক মেটাবলিজম ও আধুনিক মাইক্রোবায়োলজি',
      desc: 'আয়ুর্বেদের "কায়াগ্নি" দর্শনকে তিনি আধুনিক অন্ত্রের মাইক্রোবায়োম (Gut Microbiome) ও সার্কাডিয়ান ঘড়ির সাথে সমন্বয় করেন। এর ফলে গ্যাস্ট্রিক, আইবিএস, ফ্যাটি লিভার, হরমোনের ভারসাম্যহীনতা ও অটোইমিউন রোগের মূল কারণ নির্ণয় করে দীর্ঘস্থায়ী নিরাময় নিশ্চিত হয়।'
    }
  ];

  return (
    <section id="about" className="py-20 bg-emerald-950/[0.02] dark:bg-emerald-950/20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <ScrollReveal direction="up">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
              <HeartPulse className="w-3.5 h-3.5 text-amber-500" />
              চিকিৎসা দর্শন ও মূল নীতি
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-emerald-950 dark:text-emerald-50">
              কেন এই দ্বৈত-বিজ্ঞানের সমন্বয় অতুলনীয়?
            </h2>
            <p className="text-sm sm:text-base text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
              আধুনিক চিকিৎসাব্যবস্থা অনেক ক্ষেত্রে শুধু উপসর্গ চেপে রাখার জন্য আজীবন ওষুধ দেয়, অন্যদিকে সনাতন পদ্ধতি অনেক সময় আধুনিক জৈব রাসায়নিক যুক্তির বাইরে থাকে। ডা. দেবজ্যোতি দত্ত এই দুই বিশ্বের এক দুর্লভ মিলনস্থল।
            </p>
          </div>
        </ScrollReveal>

        {/* 3 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((pillar, idx) => (
            <ScrollReveal key={idx} delay={idx * 140} direction="up">
              <div className="card-butter p-8 rounded-3xl bg-white dark:bg-[#13201a] border border-emerald-900/10 dark:border-emerald-700/30 shadow-lg hover:shadow-2xl hover:border-emerald-400/50 dark:hover:border-emerald-600/50 space-y-4 group h-full">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
                  {pillar.icon}
                </div>

                <div className="space-y-1">
                  <h3 className="font-serif text-xl font-bold text-emerald-950 dark:text-emerald-50 leading-snug">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold tracking-wide">
                    {pillar.sub}
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-emerald-900/70 dark:text-emerald-200/70 leading-relaxed">
                  {pillar.desc}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
