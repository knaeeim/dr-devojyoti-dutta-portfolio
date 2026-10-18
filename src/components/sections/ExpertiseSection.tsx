import { Activity, Award, Brain, Check, Dna, Leaf, Sparkles, ShieldCheck } from 'lucide-react';
import ScrollReveal from '@/components/ui/ScrollReveal';

export default function ExpertiseSection() {
  const skills = [
    {
      icon: '🩺',
      title: 'শাস্ত্রীয় রোগনিদান ও প্রকৃতি বিশ্লেষণ',
      desc: 'চরক ও সুশ্রুত সংহিতা অনুযায়ী অষ্টবিধ ও দশবিধ পরীক্ষার মাধ্যমে রোগীর ত্রিদোষ, ধাতু ভারসাম্য ও রোগের মূল কারণ বৈজ্ঞানিকভাবে নির্ণয়।'
    },
    {
      icon: '🌿',
      title: 'পঞ্চকর্ম ও শরীর বিষমুক্তকরণ',
      desc: 'দেহের গভীর কোষে জমে থাকা ক্ষতিকর টক্সিন বা "আম" দূরীকরণে শাস্ত্রীয় বিরেচন, বস্তি ও নস্য চিকিৎসার ব্যক্তিগত প্রোটোকল।'
    },
    {
      icon: '🧬',
      title: 'মলিকিউলার এপিজেনেটিক্স ও ডায়েট',
      desc: 'আধুনিক পুষ্টিবিজ্ঞানের সাথে বৈদিক রন্ধনশিল্পের মেলবন্ধন, যা জিনের ক্ষতিকর প্রদাহজনিত সংকেত বন্ধ করে দীর্ঘায়ু নিশ্চিত করে।'
    },
    {
      icon: '🧪',
      title: 'শাস্ত্রীয় দ্রব্যগুণ ও বিশুদ্ধ ভেষজ',
      desc: 'চরক ও সুশ্রুত সংহিতা অনুযায়ী নির্ধারিত খাঁটি ভেষজ, ভস্ম ও রসায়নের বৈজ্ঞানিক ও নিরাপদ প্রয়োগ।'
    },
    {
      icon: '⚖️',
      title: 'মেটাবলিক ডিসঅর্ডার রিভার্সাল',
      desc: 'টাইপ-২ ডায়াবেটিস, ফ্যাটি লিভার, ওবেসিটি ও ডিসলিপিডেমিয়ার মূল বিপাকীয় গোলযোগ সারিয়ে সুস্থ জীবন ফিরিয়ে আনা।'
    },
    {
      icon: '🧠',
      title: 'সত্ত্বাবজয় চিকিৎসা ও মনস্তত্ত্ব',
      desc: 'অনিদ্রা, অতিরিক্ত দুশ্চিন্তা ও মানসিক চাপের কারণে শারীরিক রোগগুলোর মনস্তাত্ত্বিক মূল শিকড় নিরাময়।'
    }
  ];

  return (
    <section id="skills" className="py-20 bg-white/50 dark:bg-[#0c1511]/50 relative overflow-hidden">
      <div className="ambient-glow-2" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal direction="up">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold glass-pill text-emerald-800 dark:text-emerald-300 shadow-2xs hover-glow-emerald">
              <Activity className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              ক্লিনিক্যাল দক্ষতা
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-emerald-950 dark:text-emerald-50 tracking-tight">
              বিশেষজ্ঞ ডায়াগনস্টিক ও নিরাময় পদ্ধতি
            </h2>
            <p className="text-sm sm:text-base text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
              আন্তর্জাতিক মানের শীর্ষ আয়ুর্বেদ শিক্ষাপ্রতিষ্ঠানের শাস্ত্রীয় জ্ঞান এবং আধুনিক ল্যাব টেস্টের বিজ্ঞানসম্মত মূল্যায়ন।
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {skills.map((item, idx) => (
            <ScrollReveal key={idx} delay={idx * 80} direction="up" className="h-full">
              <div className="glass-card hover-glow-emerald p-6 rounded-3xl space-y-3 group h-full cursor-default">
                <div className="w-12 h-12 rounded-2xl bg-white/90 dark:bg-emerald-950/80 border border-white/60 dark:border-emerald-700/40 flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-350 ease-[cubic-bezier(0.16,1,0.3,1)]">
                  {item.icon}
                </div>
                <h3 className="font-serif text-lg font-bold text-emerald-950 dark:text-emerald-50 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors duration-250">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-emerald-900/70 dark:text-emerald-300/70 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
