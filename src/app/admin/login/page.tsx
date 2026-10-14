'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, ShieldCheck, ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!password.trim()) {
      setErrorMsg('অনুগ্রহ করে অ্যাডমিন পাসওয়ার্ড প্রদান করুন।');
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: password.trim() })
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          setErrorMsg(data.error || 'ভুল পাসওয়ার্ড! সঠিক পাসওয়ার্ড দিন।');
          return;
        }

        // Successfully logged in! Redirect to dashboard
        router.push('/admin');
        router.refresh();
      } catch (err) {
        setErrorMsg('সার্ভারে যোগাযোগ করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-[#0c1a13] to-[#08120d] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient orbs */}
      <div className="ambient-glow-1" />
      <div className="ambient-glow-2" />

      {/* Login Card */}
      <div className="w-full max-w-md rounded-3xl bg-white/95 dark:bg-[#101e17]/95 backdrop-blur-xl border border-emerald-500/30 shadow-2xl p-8 space-y-6 relative z-10">
        {/* Top return link */}
        <div className="flex justify-between items-center text-xs">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>মূল ওয়েবসাইটে ফিরে যান</span>
          </Link>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
            SSL 256-Bit Secure
          </span>
        </div>

        {/* Doctor Avatar with lock */}
        <div className="text-center space-y-3">
          <div className="relative w-20 h-20 mx-auto rounded-2xl overflow-hidden border-2 border-amber-400/80 shadow-lg">
            <Image
              src="/assets/dr-devojyoti-dutta.png"
              alt="ডা. দেবজ্যোতি দত্ত"
              fill
              className="object-cover object-top"
            />
            <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-emerald-700 text-amber-300 flex items-center justify-center text-xs shadow">
              <Lock className="w-3 h-3" />
            </div>
          </div>

          <div>
            <h1 className="font-serif text-2xl font-bold text-emerald-950 dark:text-emerald-50">
              ডাক্তার ও অ্যাডমিন পোর্টাল
            </h1>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
              রোগীদের সিরিয়াল ও চেম্বার শিডিউল সুরক্ষিত রাখতে পাসওয়ার্ড প্রদান করুন
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-start gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-emerald-900 dark:text-emerald-200">
              অ্যাডমিন পাসওয়ার্ড
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="পাসওয়ার্ড প্রদান করুন..."
                className="w-full pl-4 pr-11 py-3 rounded-xl border border-emerald-300 dark:border-emerald-700/80 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-800"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {isPending ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-amber-300" />
                <span>ড্যাশবোর্ডে প্রবেশ করুন</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-[11px] text-emerald-600/70 dark:text-emerald-400/60 pt-2 border-t border-emerald-900/10 dark:border-emerald-800/40">
          ডা. দেবজ্যোতি দত্ত (B.A.M.S., NIA Jaipur & B.Sc. Biotech) • সিকিউর অ্যাডমিন গেটওয়ে
        </div>
      </div>
    </div>
  );
}
