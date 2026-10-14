import { Activity, Award, Brain, Check, Dna, Leaf, Sparkles, ShieldCheck } from 'lucide-react';

export default function ExpertiseSection() {
  const skills = [
    {
      icon: '🩺',
      title: 'নাড়ি পরীক্ষা (Pulse Diagnosis)',
      desc: 'রোগীর ডান বা বাম কব্জির ধমনী স্পর্শ করে বাতের সর্পগতি, পিত্তের মণ্ডূকগতি ও কফের হংসগতি অনুধাবনের মাধ্যমে সুপ্ত রোগ নির্ণয়।'
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
    <section id="skills" className="py-20 bg-white dark:bg-[#0a130f] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
            <Activity className="w-3.5 h-3.5 text-amber-500" />
            ক্লিনিক্যাল দক্ষতা
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-emerald-950 dark:text-emerald-50">
            বিশেষজ্ঞ ডায়াগনস্টিক ও নিরাময় পদ্ধতি
          </h2>
          <p className="text-sm sm:text-base text-emerald-800/80 dark:text-emerald-300/80">
            আন্তর্জাতিক মানের শীর্ষ আয়ুর্বেদ শিক্ষাপ্রতিষ্ঠানের শাস্ত্রীয় জ্ঞান এবং আধুনিক ল্যাব টেস্টের বিজ্ঞানসম্মত মূল্যায়ন।
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {skills.map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-emerald-50/40 dark:bg-[#101e17] border border-emerald-900/10 dark:border-emerald-700/30 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all duration-300 space-y-3 group hover:shadow-lg"
            >
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-emerald-950/80 flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <h3 className="font-serif text-lg font-bold text-emerald-950 dark:text-emerald-50">
                {item.title}
              </h3>
              <p className="text-xs sm:text-sm text-emerald-900/70 dark:text-emerald-300/70 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
