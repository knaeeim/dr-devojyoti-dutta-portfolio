import Link from 'next/link';
import { Award, BookOpen, Clock, Heart, Mail, MapPin, Phone, Shield } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-emerald-950 text-emerald-100 border-t border-emerald-900/60 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Col 1: Bio */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-900 flex items-center justify-center text-amber-300 font-bold text-lg shadow-md">
                DD
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-white">দেবজ্যোতি দত্ত</h3>
                <p className="text-xs text-emerald-400">Ayurvedacharya & Biotechnologist</p>
              </div>
            </div>
            <p className="text-sm text-emerald-200/80 leading-relaxed">
              শাস্ত্রীয় আয়ুর্বেদ চিকিৎসা ও আধুনিক এপিজেনেটিক্সের সমন্বয়ে জটিল ও দীর্ঘস্থায়ী রোগের মূল শিকড় (Root-cause) নিরাময়ে নিবেদিতপ্রাণ।
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-300/90 font-medium">
              <Award className="w-4 h-4 text-amber-400 shrink-0" />
              <span>B.A.M.S. (NIA Jaipur) • B.Sc in BGE</span>
            </div>
          </div>

          {/* Col 2: Chambers & Hours */}
          <div className="space-y-4">
            <h4 className="font-serif font-bold text-base text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              চেম্বার ও শিডিউল
            </h4>
            <ul className="space-y-3 text-sm text-emerald-200/80">
              <li className="p-2.5 rounded-lg bg-emerald-900/40 border border-emerald-800/40 space-y-1">
                <strong className="text-white block font-medium">🏛️ ঢাকা চেম্বার (সরাসরি):</strong>
                <span>প্রতি শুক্রবার ও শনিবার</span>
                <p className="text-xs text-amber-300 font-semibold">
                  পরামর্শ ফি: ১,০০০ টাকা • ফলোআপ: ৬০০ টাকা (৩ মাসের মধ্যে)
                </p>
                <p className="text-xs text-emerald-400">২/১ জাহেদা ভিলা, ১ নং রোড, শ্যামলী কল্যাণ সমিতি, শ্যামলী, ঢাকা-১২০৭</p>
              </li>
              <li className="p-2.5 rounded-lg bg-emerald-900/40 border border-emerald-800/40 space-y-1">
                <strong className="text-white block font-medium">🌐 অনলাইন ভিডিও কনসালটেশন (দেশ ও বিদেশ):</strong>
                <span>রবি, মঙ্গল ও বৃহস্পতিবার (সন্ধ্যা ৭:০০ - ১০:৩০)</span>
                <p className="text-xs text-amber-300 font-semibold">
                  ফি: ৮০০ টাকা (বাংলাদেশ) • $১০ ডলার (প্রবাসী যেকোনো দেশ)
                </p>
                <p className="text-xs text-emerald-400">জুম বা হোয়াটসঅ্যাপ কল • প্রবাসীদের জন্য সরাসরি হোয়াটসঅ্যাপ বুকিং</p>
              </li>
            </ul>
          </div>

          {/* Col 3: Quick Navigation */}
          <div className="space-y-4">
            <h4 className="font-serif font-bold text-base text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              গুরুত্বপূর্ণ বিভাগসমূহ
            </h4>
            <ul className="space-y-2 text-sm text-emerald-200/80">
              <li>
                <a href="#about" className="hover:text-amber-300 transition-colors">চিকিৎসা দর্শন ও গবেষণা</a>
              </li>
              <li>
                <a href="#skills" className="hover:text-amber-300 transition-colors">ক্লিনিক্যাল দক্ষতা ও পঞ্চকর্ম</a>
              </li>
              <li>
                <a href="#treatments" className="hover:text-amber-300 transition-colors">মেটাবলিক ও ক্রনিক রোগ নিরাময়</a>
              </li>
              <li>
                <a href="#booking" className="hover:text-amber-300 transition-colors">সিরিয়াল বুকিং</a>
              </li>
              <li>
                <a href="#prakriti" className="hover:text-amber-300 transition-colors">আয়ুর্বেদিক দোষ ও প্রকৃতি টেস্ট</a>
              </li>
              <li>
                <a href="#research" className="hover:text-amber-300 transition-colors">"স্বাস্থ্য দর্পণ" স্বাস্থ্যগ্রন্থ</a>
              </li>
            </ul>
          </div>

          {/* Col 4: Connect & Admin */}
          <div className="space-y-4">
            <h4 className="font-serif font-bold text-base text-white flex items-center gap-2">
              <Phone className="w-4 h-4 text-amber-400" />
              যোগাযোগ ও সোশ্যাল
            </h4>
            <p className="text-xs text-emerald-200/70">
              অ্যাপয়েন্টমেন্ট বা যেকোনো তথ্যের জন্য সরাসরি হোয়াটসঅ্যাপ বা ফেসবুক পেজে যোগাযোগ করুন।
            </p>
            <div className="space-y-2">
              <a
                href="https://www.facebook.com/devojyoti.dutta"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-amber-300 hover:text-amber-200"
              >
                <span>📘 অফিশিয়াল ফেসবুক পেজ</span>
              </a>
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '8801712854941'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-emerald-300 hover:text-emerald-200"
              >
                <span>💬 হোয়াটসঅ্যাপ হেল্পডেস্ক</span>
              </a>
            </div>

            <div className="pt-2">
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/50 transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>অ্যাডমিন ও স্টাফ লগইন</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Disclaimer & Copyright */}
        <div className="pt-8 border-t border-emerald-900/60 text-xs text-emerald-400/80 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <div className="space-y-1.5">
            <p className="text-emerald-200/90 font-medium">
              © {new Date().getFullYear()} সর্বস্বত্ব <span className="text-white font-bold tracking-wide">WebZen Bangladesh</span> কর্তৃক সংরক্ষিত।
            </p>
            <p className="text-[11px] text-emerald-400/70 flex items-center justify-center md:justify-start gap-1.5 flex-wrap">
              <span>Developed & Maintained by</span>
              <span className="font-bold text-amber-400 tracking-wider inline-flex items-center gap-1.5 bg-emerald-900/70 px-2 py-0.5 rounded-md border border-emerald-800/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                WebZen Bangladesh
              </span>
            </p>
          </div>
          <p className="text-emerald-400/60 text-[11px] max-w-xl">
            সতর্কতা: ওয়েবসাইটের তথ্য ও প্রকৃতি পরীক্ষা শুধুমাত্র সচেতনতামূলক উদ্দেশ্যে প্রদত্ত। কোনো দীর্ঘস্থায়ী স্বাস্থ্য সমস্যার জন্য চিকিৎসকের সরাসরি পরামর্শ গ্রহণ করুন।
          </p>
        </div>
      </div>
    </footer>
  );
}
