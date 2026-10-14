import { MessageSquare, Quote, Star } from 'lucide-react';

export default function TestimonialsSection() {
  const reviews = [
    {
      name: 'তানভীর আহমেদ',
      age: '৪৮ বছর',
      location: 'ধানমন্ডি, ঢাকা',
      condition: 'টাইপ-২ ডায়াবেটিস ও দীর্ঘদিনের ফ্যাটি লিভার',
      comment: '১০ বছর ধরে ডায়াবেটিসের একাধিক ওষুধ খাচ্ছিলাম, কিন্তু সুগার ও ফ্যাটি লিভার নিয়ন্ত্রণে আসছিল না। ডা. দেবজ্যোতি দত্তের নাড়ি পরীক্ষা এবং খাদ্য ও ভেষজ প্রোটোকল শুরুর মাত্র ৪ মাসে আমার HbA1c ৮.৮ থেকে ৬.২ এ নেমে এসেছে এবং ওষুধ প্রায় বন্ধ হয়ে গেছে!',
      rating: 5,
      chamber: 'ঢাকা চেম্বার'
    },
    {
      name: 'ফারহানা ইয়াসমিন',
      age: '৩৬ বছর',
      location: 'লন্ডন, যুক্তরাজ্য (অনলাইন রোগী)',
      condition: 'ক্রনিক আইবিএস (IBS) ও হরমোনের সমস্যা',
      comment: 'যুক্তরাজ্যের চিকিৎসকরা আইবিএসকে আজীবন সমস্যা বলেছিলেন। ডা. দত্তের সাথে জুম ভিডিও কলে পরামর্শ নিই। উনি আমার পাচক অগ্নির ভারসাম্য ও গাট মাইক্রোবায়োম সংশোধনে যে পরামর্শ দিয়েছেন, তাতেই আমার ৫ বছরের যন্ত্রণা দূর হয়েছে।',
      rating: 5,
      chamber: 'অনলাইন ভিডিও কনসালটেশন'
    },
    {
      name: 'মাহমুদুল হাসান',
      age: '৪২ বছর',
      location: 'উত্তরা, ঢাকা',
      condition: 'ক্রনিক একজিমা ও ত্বকের প্রদাহ',
      comment: 'স্টেরয়েড মলম মেখে ত্বক পাতলা হয়ে গিয়েছিল কিন্তু চুলকানি ও ঘা সারেনি। ডা. দেবজ্যোতি দত্তের রক্তশোধক ভেষজ ও পিত্ত শান্তকারী খাদ্যাভ্যাস মেনে চলার পর এখন আমার হাত-পায়ের চামড়া সম্পূর্ণ স্বাভাবিক ও মসৃণ।',
      rating: 5,
      chamber: 'ঢাকা চেম্বার'
    }
  ];

  return (
    <section id="testimonials" className="py-20 bg-emerald-950/[0.02] dark:bg-emerald-950/20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
            <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
            রোগী অভিমত ও কেস হিস্ট্রি
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-emerald-950 dark:text-emerald-50">
            আরোগ্যের বাস্তব অভিজ্ঞতা
          </h2>
          <p className="text-sm sm:text-base text-emerald-800/80 dark:text-emerald-300/80">
            দেশ ও বিদেশের সহস্রাধিক রোগী যারা বৈদিক জীবনচর্যা ও এপিজেনেটিক চিকিৎসায় স্থায়ী আরোগ্য লাভ করেছেন।
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((item, idx) => (
            <div
              key={idx}
              className="p-8 rounded-3xl bg-white dark:bg-[#101e17] border border-emerald-900/10 dark:border-emerald-700/30 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-6 relative"
            >
              <Quote className="w-10 h-10 text-emerald-200 dark:text-emerald-900 absolute top-6 right-6 -z-0 opacity-60" />

              <div className="space-y-4 relative z-10">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>

                <div className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  {item.condition}
                </div>

                <p className="text-xs sm:text-sm text-emerald-950/80 dark:text-emerald-200/80 leading-relaxed italic">
                  "{item.comment}"
                </p>
              </div>

              <div className="pt-4 border-t border-emerald-900/10 dark:border-emerald-800/40 flex justify-between items-center text-xs">
                <div>
                  <h4 className="font-bold text-emerald-950 dark:text-emerald-50">{item.name}</h4>
                  <span className="text-emerald-600 dark:text-emerald-400">{item.location}</span>
                </div>
                <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
                  {item.chamber}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
