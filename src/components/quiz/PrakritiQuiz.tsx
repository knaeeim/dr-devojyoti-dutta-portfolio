'use client';

import { useState } from 'react';
import { Sparkles, CheckCircle2, RotateCcw, Calendar, ArrowRight, ArrowLeft } from 'lucide-react';
import { prakritiQuestions, calculatePrakriti } from '@/lib/quiz/data';
import { PrakritiResult } from '@/types/booking';
import { toBengaliNumber } from '@/lib/booking/utils';
import ScrollReveal from '@/components/ui/ScrollReveal';

export default function PrakritiQuiz() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, 'vata' | 'pitta' | 'kapha'>>({});
  const [result, setResult] = useState<PrakritiResult | null>(null);

  const totalQuestions = prakritiQuestions.length;
  const currentQ = prakritiQuestions[currentStep];

  const handleSelectOption = (dosha: 'vata' | 'pitta' | 'kapha') => {
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: dosha
    }));
  };

  const handleNext = () => {
    if (currentStep < totalQuestions - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Calculate
      const res = calculatePrakriti(answers);
      setResult(res);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentStep(0);
    setResult(null);
  };

  const currentAnswer = currentQ ? answers[currentQ.id] : undefined;
  const progressPercent = Math.round(((currentStep + 1) / totalQuestions) * 100);

  return (
    <section id="prakriti" className="py-20 bg-white dark:bg-[#0c1511] relative overflow-hidden">
      {/* Background ambient orbs */}
      <div className="ambient-glow-2 pointer-events-none" />
      <div className="ambient-glow-1 pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <ScrollReveal direction="up">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <span className="glass-pill inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold text-amber-800 dark:text-amber-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              আয়ুর্বেদিক সেলফ-অ্যাসেসমেন্ট
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-emerald-950 dark:text-emerald-50">
              আপনার দৈহিক প্রকৃতি ও ত্রিদোষ (বাত, পিত্ত, কফ) জানুন
            </h2>
            <p className="text-sm sm:text-base text-emerald-800/80 dark:text-emerald-300/80">
              আয়ুর্বেদ অনুসারে প্রতিটি মানুষের জন্মগত একটি নিজস্ব শারীরিক ও মানসিক ভারসাম্য (Prakriti) থাকে। ৭টি সহজ প্রশ্নের উত্তরের মাধ্যমে জেনে নিন আপনার দেহের প্রধান প্রকৃতি ও সঠিক খাদ্য পরিকল্পনা।
            </p>
          </div>
        </ScrollReveal>

        {/* Quiz Container Card */}
        <div className="glass-card rounded-3xl p-6 sm:p-10 relative z-10">
          {!result ? (
            /* ACTIVE QUESTION VIEW */
            <div className="space-y-8">
              {/* Progress Header */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  <span>
                    প্রশ্ন {toBengaliNumber(currentStep + 1)} / {toBengaliNumber(totalQuestions)}
                  </span>
                  <span>{toBengaliNumber(progressPercent)}% সম্পন্ন</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-emerald-200/60 dark:bg-emerald-950 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-600 to-amber-500 rounded-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Question Content (Keyed for smooth slide animation on change) */}
              <div key={currentStep} className="space-y-6 animate-slide-up">
                {/* Question Title */}
                <div className="space-y-1">
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-emerald-950 dark:text-emerald-50">
                    {currentQ.titleBn}
                  </h3>
                  <p className="text-xs sm:text-sm text-emerald-700/80 dark:text-emerald-400">
                    {currentQ.subtitleBn}
                  </p>
                </div>

                {/* Options */}
                <div className="space-y-3">
                  {currentQ.options.map((opt, idx) => {
                    const isSelected = currentAnswer === opt.dosha;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectOption(opt.dosha)}
                        className={`w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-start gap-4 cursor-pointer active:scale-[0.99] ${
                          isSelected
                            ? 'btn-butter border-emerald-500 bg-gradient-to-r from-emerald-800 to-emerald-700 text-white shadow-xl ring-2 ring-emerald-400/50 scale-[1.01]'
                            : 'glass-pill hover-glow-emerald btn-butter border-emerald-200/80 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-100 hover:border-emerald-400'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center transition-colors duration-200 ${
                            isSelected
                              ? 'border-white bg-white text-emerald-800'
                              : 'border-emerald-300 dark:border-emerald-700'
                          }`}
                        >
                          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-emerald-800" />}
                        </div>

                        <div className="space-y-1 flex-1">
                          <div className="text-sm sm:text-base font-semibold leading-relaxed">
                            {opt.textBn}
                          </div>
                          <div
                            className={`text-xs ${
                              isSelected ? 'text-emerald-200' : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {opt.descBn}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation controls */}
              <div className="flex justify-between items-center pt-4 border-t border-emerald-900/10 dark:border-emerald-800/40">
                <button
                  type="button"
                  disabled={currentStep === 0}
                  onClick={handlePrev}
                  className="btn-butter glass-pill inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-emerald-800 dark:text-emerald-200 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>পূর্ববর্তী</span>
                </button>

                <button
                  type="button"
                  disabled={!currentAnswer}
                  onClick={handleNext}
                  className="btn-butter hover-glow-emerald inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 text-white text-sm font-bold shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>{currentStep === totalQuestions - 1 ? 'ফলাফল দেখুন' : 'পরবর্তী'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* RESULTS VIEW */
            <div className="space-y-8 animate-fade-in">
              {/* Results Banner */}
              <div className="text-center space-y-2 border-b border-emerald-900/10 dark:border-emerald-800/40 pb-6">
                <span className="glass-pill inline-block px-3 py-1 rounded-full text-xs font-bold text-amber-900 dark:text-amber-300">
                  আপনার ক্লাসিক্যাল দোষ রিপোর্ট
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-extrabold text-emerald-950 dark:text-emerald-50">
                  {result.titleBn}
                </h3>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  {result.subtitleBn}
                </p>
              </div>

              {/* Dosha Progress Bars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Vata */}
                <div className="glass-card hover-glow-emerald p-4 rounded-2xl space-y-2 text-center">
                  <span className="text-xs font-bold text-sky-700 dark:text-sky-400 block">
                    💨 বাত (Vata)
                  </span>
                  <div className="text-2xl font-black font-serif text-emerald-950 dark:text-emerald-100">
                    {toBengaliNumber(result.doshaScores.vata)}%
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full"
                      style={{ width: `${result.doshaScores.vata}%` }}
                    />
                  </div>
                </div>

                {/* Pitta */}
                <div className="glass-card hover-glow-amber p-4 rounded-2xl space-y-2 text-center">
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400 block">
                    🔥 পিত্ত (Pitta)
                  </span>
                  <div className="text-2xl font-black font-serif text-emerald-950 dark:text-emerald-100">
                    {toBengaliNumber(result.doshaScores.pitta)}%
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${result.doshaScores.pitta}%` }}
                    />
                  </div>
                </div>

                {/* Kapha */}
                <div className="glass-card hover-glow-emerald p-4 rounded-2xl space-y-2 text-center">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block">
                    🌿 কফ (Kapha)
                  </span>
                  <div className="text-2xl font-black font-serif text-emerald-950 dark:text-emerald-100">
                    {toBengaliNumber(result.doshaScores.kapha)}%
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full"
                      style={{ width: `${result.doshaScores.kapha}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Characteristics and Advice Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Characteristics */}
                <div className="glass-card p-5 sm:p-6 rounded-2xl space-y-3">
                  <h4 className="font-serif font-bold text-base text-emerald-950 dark:text-emerald-100">
                    🌿 শারীরিক ও মানসিক বৈশিষ্ট্য
                  </h4>
                  <ul className="space-y-2 text-xs sm:text-sm text-emerald-900/80 dark:text-emerald-300">
                    {result.characteristicsBn.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Dietary Guidance */}
                <div className="glass-card p-5 sm:p-6 rounded-2xl space-y-3">
                  <h4 className="font-serif font-bold text-base text-emerald-950 dark:text-emerald-100">
                    🥗 সুপারিশকৃত খাদ্যতালিকা
                  </h4>
                  <ul className="space-y-2 text-xs sm:text-sm text-emerald-900/80 dark:text-emerald-300">
                    {result.dietaryRecommendationsBn.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-emerald-900/10 dark:border-emerald-800/40">
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn-butter glass-pill inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-emerald-800 dark:text-emerald-200 text-sm font-medium cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>পুনরায় টেস্ট দিন</span>
                </button>

                <a
                  href="#booking"
                  className="btn-butter hover-glow-emerald w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 text-white text-sm font-bold shadow-lg transition-all cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-amber-300" />
                  <span>শাস্ত্রীয় রোগনিদান ও পূর্ণাঙ্গ চিকিৎসার জন্য সিরিয়াল নিন</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
