'use client';

import { useState, useEffect, useTransition } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Video,
  CheckCircle2,
  AlertCircle,
  Copy,
  Printer,
  Download,
  Share2,
  Sparkles,
  Phone,
  User,
  Mail,
  FileText,
  X,
  MessageCircle,
  ShieldCheck,
  RotateCw,
  ExternalLink
} from 'lucide-react';
import {
  ChamberMode,
  ChamberSchedule,
  Slot,
  CalendarDay,
  Appointment
} from '@/types/booking';
import {
  defaultSchedules,
  getUpcomingDates,
  generateSlotsFromTiming,
  getEffectiveTimingForDay,
  getEffectiveTimingForDate,
  toBengaliNumber,
  isSlotPastTime,
  getDhakaCurrentTime
} from '@/lib/booking/utils';
import { printSinglePageSerialSlip } from '@/lib/booking/print-slip';

export default function BookingHub() {
  const [chamberMode, setChamberMode] = useState<ChamberMode>('offline');
  const [schedules, setSchedules] = useState<Record<ChamberMode, ChamberSchedule>>(defaultSchedules);
  const [calendarDates, setCalendarDates] = useState<CalendarDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [bookedSlotIds, setBookedSlotIds] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  // Live Bangladesh time state (refreshes every 30 seconds)
  const [nowDhaka, setNowDhaka] = useState(() => getDhakaCurrentTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowDhaka(getDhakaCurrentTime());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Form inputs
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [complaints, setComplaints] = useState('');

  // Submission & Dialog state
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);
  const [copiedSerial, setCopiedSerial] = useState(false);

  // OTP Verification state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpPending, setOtpPending] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpToken, setOtpToken] = useState<string | null>(null);
  const [otpChallengeToken, setOtpChallengeToken] = useState<string | null>(null);
  const [otpDebugCode, setOtpDebugCode] = useState<string | null>(null);
  const [otpGatewayNotice, setOtpGatewayNotice] = useState<string | null>(null);

  // Countdown timer for OTP
  useEffect(() => {
    let interval: any;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // 1. Fetch live schedules from API on mount
  useEffect(() => {
    async function loadSchedules() {
      try {
        const res = await fetch('/api/schedules');
        const json = await res.json();
        if (json.success && json.schedules) {
          setSchedules(json.schedules);
        }
      } catch (err) {
        console.warn('Could not fetch remote schedules, using default', err);
      }
    }
    loadSchedules();
  }, []);

  // 2. Compute calendar dates whenever chamberMode or schedules update
  useEffect(() => {
    const currentSchedule = schedules[chamberMode] || defaultSchedules[chamberMode];
    const dates = getUpcomingDates(currentSchedule, 10);
    setCalendarDates(dates);

    // Default select first available open date
    const firstOpen = dates.find((d) => d.isBookingOpen) || dates[0];
    if (firstOpen) {
      setSelectedDate(firstOpen.dateStr);
    } else {
      setSelectedDate('');
      setAvailableSlots([]);
    }
    setSelectedSlot(null);
  }, [chamberMode, schedules]);

  // 3. Compute slots & fetch booked slots for selectedDate
  useEffect(() => {
    if (!selectedDate) {
      setAvailableSlots([]);
      return;
    }

    const currentSchedule = schedules[chamberMode] || defaultSchedules[chamberMode];
    const timing = getEffectiveTimingForDate(currentSchedule, selectedDate);
    const slots = generateSlotsFromTiming(timing);
    setAvailableSlots(slots);
    setSelectedSlot(null);

    // Fetch booked slots from API
    async function fetchBooked() {
      try {
        const res = await fetch(`/api/appointments?date=${selectedDate}&mode=${chamberMode}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.bookedSlotIds)) {
          setBookedSlotIds(data.bookedSlotIds);
        } else {
          setBookedSlotIds([]);
        }
      } catch (e) {
        setBookedSlotIds([]);
      }
    }
    fetchBooked();
  }, [selectedDate, chamberMode, schedules]);

  const activeSchedule = schedules[chamberMode] || defaultSchedules[chamberMode];
  const activeDateObj = calendarDates.find((d) => d.dateStr === selectedDate);

  // Dynamic session grouping: automatically groups by morning, noon, afternoon, evening, and night
  const PERIOD_METADATA: Record<string, { title: string; icon: string }> = {
    morning: { title: 'সকাল সেশন', icon: '🌅' },
    noon: { title: 'দুপুর সেশন', icon: '☀️' },
    afternoon: { title: 'বিকাল সেশন', icon: '🌤️' },
    evening: { title: 'সান্ধ্যকালীন সেশন', icon: '🌆' },
    night: { title: 'নৈশ সেশন', icon: '🌙' }
  };

  const groupedSlots = (['morning', 'noon', 'afternoon', 'evening', 'night'] as const)
    .map((p) => ({
      period: p,
      title: PERIOD_METADATA[p].title,
      icon: PERIOD_METADATA[p].icon,
      slots: availableSlots.filter((s) => s.period === p)
    }))
    .filter((g) => g.slots.length > 0);

  // Step 1: User clicks booking -> Trigger OTP dispatch
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedDate) {
      setErrorMsg('অনুগ্রহ করে অ্যাপয়েন্টমেন্টের একটি উন্মুক্ত তারিখ নির্বাচন করুন।');
      return;
    }

    if (!selectedSlot) {
      setErrorMsg('অনুগ্রহ করে একটি স্লট পছন্দ করুন।');
      return;
    }

    if (isSlotPastTime(selectedDate, selectedSlot.startMinutes)) {
      setErrorMsg('দুঃখিত, এই সময় স্লটটির সময় ইতোমধ্যে শেষ (টাইম ওভার) হয়ে গেছে। অনুগ্রহ করে পরবর্তী কোনো উন্মুক্ত স্লট পছন্দ করুন।');
      setSelectedSlot(null);
      return;
    }

    if (!patientName.trim()) {
      setErrorMsg('রোগীর পূর্ণ নাম প্রদান করা আবশ্যক।');
      return;
    }

    const cleanPhone = phone.trim().replace(/[\s\-()]/g, '');
    if (!cleanPhone) {
      setErrorMsg('সচল মোবাইল/হোয়াটসঅ্যাপ নম্বর প্রদান করা আবশ্যক।');
      return;
    }

    // Trigger OTP sending
    setOtpPending(true);
    setOtpError(null);
    try {
      const res = await fetch('/api/appointments/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, patientName: patientName.trim() })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'ওটিপি পাঠাতে সমস্যা হয়েছে।');
        setOtpPending(false);
        return;
      }
      setOtpChallengeToken(data.challengeToken || null);
      setOtpTimer(60);
      setOtpDebugCode(data.debugCode || null);
      setOtpGatewayNotice(data.gatewayError || null);
      if (data.debugCode) {
        setOtpCode(data.debugCode);
      }
      setShowOtpModal(true);
      setOtpPending(false);
    } catch (err) {
      setErrorMsg('সার্ভারে যোগাযোগ করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
      setOtpPending(false);
    }
  };

  // Step 2: User verifies OTP and finalizes booking
  const handleVerifyOtpAndProceed = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);

    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setOtpError('অনুগ্রহ করে সঠিক ৬-সংখ্যার ওটিপি কোডটি লিখুন।');
      return;
    }

    const cleanPhone = phone.trim().replace(/[\s\-()]/g, '');
    setOtpPending(true);
    try {
      const res = await fetch('/api/appointments/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          code: otpCode.trim(),
          challengeToken: otpChallengeToken
        })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setOtpError(data.error || 'ভুল ওটিপি কোড! সঠিক কোডটি লিখুন।');
        setOtpPending(false);
        return;
      }

      const verifiedToken = data.token;
      setOtpToken(verifiedToken);
      setShowOtpModal(false);
      setOtpPending(false);

      // Execute appointment creation
      executeFinalBooking(verifiedToken);
    } catch (err) {
      setOtpError('যাচাই প্রক্রিয়ায় ত্রুটি ঘটেছে।');
      setOtpPending(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (otpTimer > 0) return;
    setOtpError(null);
    setOtpPending(true);
    const cleanPhone = phone.trim().replace(/[\s\-()]/g, '');
    try {
      const res = await fetch('/api/appointments/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, patientName: patientName.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOtpChallengeToken(data.challengeToken || null);
        setOtpTimer(60);
        setOtpDebugCode(data.debugCode || null);
        setOtpGatewayNotice(data.gatewayError || null);
        if (data.debugCode) {
          setOtpCode(data.debugCode);
        }
      } else {
        setOtpError(data.error || 'পুনরায় ওটিপি পাঠাতে ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      setOtpError('সার্ভারে যোগাযোগ করতে সমস্যা হয়েছে।');
    } finally {
      setOtpPending(false);
    }
  };

  // Final execution
  const executeFinalBooking = (token: string) => {
    startTransition(async () => {
      try {
        const cleanPhone = phone.trim().replace(/[\s\-()]/g, '');
        const payload = {
          patientName: patientName.trim(),
          phone: cleanPhone,
          email: email.trim() ? email.trim().toLowerCase() : undefined,
          chamberMode,
          appointmentDate: selectedDate,
          slotId: selectedSlot!.id,
          slotTimeBn: selectedSlot!.timeBn,
          complaints: complaints.trim() || undefined,
          otpToken: token
        };

        const res = await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const result = await res.json();

        if (!res.ok || !result.success) {
          setErrorMsg(result.error || 'বুকিং সম্পন্ন করা যায়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
          return;
        }

        // Success! Set confirmed appointment to display digital slip modal
        setConfirmedAppointment(result.appointment);
        setBookedSlotIds((prev) => [...prev, selectedSlot!.id]);
        setPatientName('');
        setPhone('');
        setEmail('');
        setComplaints('');
        setSelectedSlot(null);
        setOtpCode('');
        setOtpDebugCode(null);
        setOtpToken(null);
        setOtpChallengeToken(null);
      } catch (err: any) {
        setErrorMsg('সার্ভারে যোগাযোগ করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
      }
    });
  };

  const handleCopySerial = () => {
    if (confirmedAppointment?.serialNo) {
      navigator.clipboard.writeText(confirmedAppointment.serialNo);
      setCopiedSerial(true);
      setTimeout(() => setCopiedSerial(false), 2000);
    }
  };

  const handlePrintSlip = () => {
    if (confirmedAppointment) {
      printSinglePageSerialSlip(confirmedAppointment);
    }
  };

  const handleCloseModal = () => {
    setConfirmedAppointment(null);
    setSelectedSlot(null);
    setPatientName('');
    setPhone('');
    setEmail('');
    setComplaints('');

    // Smooth scroll animation to home / top of page
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    }, 120);
  };

  const handleDateSelect = (dateStr: string) => {
    setSelectedDate(dateStr);
    // Smooth scroll animation to Step 2 (Slots)
    setTimeout(() => {
      const step2 = document.getElementById('step-2-slots');
      if (step2) {
        step2.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 120);
  };

  const handleSlotSelect = (slot: Slot) => {
    setSelectedSlot(slot);
    // Smooth scroll animation to Step 3 (Patient Info Form)
    setTimeout(() => {
      const step3 = document.getElementById('step-3-form');
      if (step3) {
        step3.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 120);
  };

  return (
    <section id="booking" className="py-20 bg-emerald-950/[0.03] dark:bg-emerald-950/20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            স্মার্ট স্লট শিডিউলিং ইঞ্জিন
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-emerald-950 dark:text-emerald-50">
            তাৎক্ষণিক সিরিয়াল বুকিং
          </h2>
          <p className="text-sm sm:text-base text-emerald-800/80 dark:text-emerald-300/80">
            রোগীর অপ্রয়োজনীয় দীর্ঘ অপেক্ষা পরিহার করতে প্রতিটি অ্যাপয়েন্টমেন্টের জন্য স্লট বরাদ্দ করা হয়। পছন্দসই তারিখ ও সময় বেছে নিন।
          </p>
        </div>

        {/* Chamber Mode Switcher Tabs */}
        <div className="max-w-xl mx-auto mb-10">
          <div className="p-1.5 rounded-2xl bg-emerald-100/70 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 grid grid-cols-2 gap-2 shadow-inner">
            <button
              type="button"
              onClick={() => setChamberMode('offline')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm sm:text-base font-semibold transition-all ${
                chamberMode === 'offline'
                  ? 'bg-emerald-800 text-white shadow-md'
                  : 'text-emerald-900 dark:text-emerald-200 hover:bg-emerald-200/50 dark:hover:bg-emerald-900/40'
              }`}
            >
              <MapPin className="w-4 h-4 text-amber-300" />
              <span>ঢাকা চেম্বার (সরাসরি)</span>
            </button>

            <button
              type="button"
              onClick={() => setChamberMode('online')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm sm:text-base font-semibold transition-all ${
                chamberMode === 'online'
                  ? 'bg-emerald-800 text-white shadow-md'
                  : 'text-emerald-900 dark:text-emerald-200 hover:bg-emerald-200/50 dark:hover:bg-emerald-900/40'
              }`}
            >
              <Video className="w-4 h-4 text-amber-300" />
              <span>অনলাইন ভিডিও কল</span>
            </button>
          </div>

          {/* Chamber Summary Meta Card */}
          <div className="mt-3 p-3 rounded-xl bg-white/80 dark:bg-emerald-950/40 border border-emerald-900/10 dark:border-emerald-800/40 text-center text-xs text-emerald-800 dark:text-emerald-300 flex flex-wrap items-center justify-center gap-4">
            <span>
              <strong>স্থান/মাধ্যম:</strong> {activeSchedule.addressBn}
            </span>
            <span>•</span>
            <span>
              <strong>পরামর্শ ফি:</strong> {activeSchedule.feeBn}
            </span>
            <span>•</span>
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              হোয়াটসঅ্যাপে তাৎক্ষণিক সিরিয়াল স্লিপ পাঠানো হয়
            </span>
          </div>
        </div>

        {/* Step-by-Step Interactive Booking Card */}
        <div className="max-w-4xl mx-auto rounded-3xl bg-white dark:bg-[#13201a] border border-emerald-900/10 dark:border-emerald-700/30 shadow-xl overflow-hidden p-6 sm:p-8 space-y-8">
          {/* STEP 1: Choose Date */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg text-emerald-950 dark:text-emerald-100 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-800 text-amber-300 text-xs flex items-center justify-center font-bold">
                  ১
                </span>
                অ্যাপয়েন্টমেন্টের তারিখ নির্বাচন করুন
              </h3>
              <span className="text-xs text-emerald-600 dark:text-emerald-400">
                (চলতি সপ্তাহের জন্য বুকিং উন্মুক্ত)
              </span>
            </div>

            {/* Date Chips Carousel */}
            {calendarDates.length === 0 ? (
              <div className="p-6 text-center text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl">
                এই চেম্বারে বর্তমানে কোনো সক্রিয় দিন নির্ধারিত নেই। অনুগ্রহ করে অন্য চেম্বার নির্বাচন করুন।
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {calendarDates.map((item) => {
                  const isSelected = selectedDate === item.dateStr;
                  return (
                    <button
                      key={item.dateStr}
                      type="button"
                      disabled={!item.isBookingOpen}
                      onClick={() => handleDateSelect(item.dateStr)}
                      className={`relative p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-800 text-white shadow-lg ring-2 ring-emerald-500/50'
                          : item.isBookingOpen
                          ? 'border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 hover:border-emerald-400 hover:bg-emerald-100/50'
                          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-100/60 dark:bg-zinc-900/40 text-zinc-400 dark:text-zinc-500 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        {item.dayNameBn}
                      </span>
                      <span className="text-2xl font-black font-serif my-0.5">
                        {item.dayNumBn}
                      </span>
                      <span className="text-[11px] opacity-80">{item.monthBn}</span>

                      {/* Status indicator pill */}
                      <span
                        className={`mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.isBookingOpen
                            ? isSelected
                              ? 'bg-amber-400 text-emerald-950'
                              : 'bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                            : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                        }`}
                      >
                        {item.statusLabelBn}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* STEP 2: Choose 15-Min Slot */}
          {selectedDate && (
            <div id="step-2-slots" className="space-y-4 pt-4 border-t border-emerald-900/10 dark:border-emerald-800/40 scroll-mt-24 sm:scroll-mt-28">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-serif font-bold text-lg text-emerald-950 dark:text-emerald-100 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-800 text-amber-300 text-xs flex items-center justify-center font-bold">
                    ২
                  </span>
                  স্লট পছন্দ করুন
                </h3>
                {activeDateObj && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-medium">
                    📅 {activeDateObj.fullBn}
                  </span>
                )}
              </div>

              {/* Notice banner when today is selected */}
              {selectedDate === nowDhaka.dateStr && (
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 text-xs">
                  <span className="text-sm">⏱️</span>
                  <span>
                    <strong>আজকের সময়সূচী:</strong> বর্তমান সময়ের পূর্বে শেষ হওয়া স্লটগুলোতে স্বয়ংক্রিয়ভাবে <em>&apos;টাইম ওভার&apos;</em> কার্যকর করা হয়েছে। শুধুমাত্র পরবর্তী উন্মুক্ত স্লটগুলোতে বুকিং করা যাবে।
                  </span>
                </div>
              )}

              {availableSlots.length === 0 ? (
                <div className="p-6 text-center text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl">
                  এই তারিখে কোনো সক্রিয় অ্যাপয়েন্টমেন্ট স্লট খালি নেই।
                </div>
              ) : (
                <div className="space-y-6">
                  {groupedSlots.map((group) => (
                    <div key={group.period} className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5 bg-emerald-100/70 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
                          <span>{group.icon}</span>
                          <span>{group.title}</span>
                          <span className="text-amber-700 dark:text-amber-400 font-mono text-[11px]">
                            ({toBengaliNumber(group.slots.length)}টি স্লট)
                          </span>
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                        {group.slots.map((slot) => {
                          const isBooked = bookedSlotIds.includes(slot.id);
                          const isPast = isSlotPastTime(selectedDate, slot.startMinutes);
                          const isSelected = selectedSlot?.id === slot.id;
                          const isDisabled = isBooked || isPast;

                          return (
                            <button
                              key={slot.id}
                              type="button"
                              disabled={isDisabled}
                              onClick={() => {
                                if (!isDisabled) handleSlotSelect(slot);
                              }}
                              className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                                isSelected
                                  ? 'border-emerald-600 bg-emerald-800 text-white shadow-md ring-2 ring-emerald-500 cursor-pointer active:scale-95'
                                  : isBooked
                                  ? 'border-red-200 dark:border-red-950/60 bg-red-50/50 dark:bg-red-950/20 text-red-400 dark:text-red-500 line-through cursor-not-allowed opacity-60'
                                  : isPast
                                  ? 'border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-900/40 text-zinc-400 dark:text-zinc-500 cursor-not-allowed opacity-60'
                                  : 'border-emerald-200 dark:border-emerald-800/80 bg-white dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 cursor-pointer active:scale-95'
                              }`}
                            >
                              <span className={`text-xs font-semibold ${isPast && !isBooked ? 'line-through decoration-zinc-400' : ''}`}>
                                {slot.shortBn}
                              </span>
                              <span className="text-[10px] opacity-75 font-mono">{slot.shortEn}</span>
                              {isBooked ? (
                                <span className="text-[10px] font-bold text-red-500">বুকড</span>
                              ) : isPast ? (
                                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-0.5">
                                  <span>⏱️</span> টাইম ওভার
                                </span>
                              ) : isSelected ? (
                                <span className="text-[10px] font-bold text-amber-300">নির্বাচিত</span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Patient Information Form */}
          {selectedSlot && (
            <form id="step-3-form" onSubmit={handleBookingSubmit} className="space-y-5 pt-4 border-t border-emerald-900/10 dark:border-emerald-800/40 scroll-mt-24 sm:scroll-mt-28">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-serif font-bold text-lg text-emerald-950 dark:text-emerald-100 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-800 text-amber-300 text-xs flex items-center justify-center font-bold">
                    ৩
                  </span>
                  রোগীর তথ্য ও বুকিং নিশ্চিতকরণ
                </h3>
                <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 font-semibold">
                  বরাদ্দকৃত স্লট: {selectedSlot.shortBn}
                </span>
              </div>

              {/* Selected Booking Summary Card (যা যা সিলেক্ট করেছে সেগুলো প্রদর্শন) */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 via-emerald-100/30 to-amber-50/50 dark:from-emerald-950/70 dark:via-emerald-900/40 dark:to-emerald-950/60 border border-emerald-300/80 dark:border-emerald-700/60 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-200/80 dark:border-emerald-800/60 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                    <span>📋</span> আপনার নির্বাচিত বুকিং তথ্য:
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-0.5 rounded-full">
                    ধাপ ১ ও ২ সম্পন্ন
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
                  {/* Chamber */}
                  <div className="p-2.5 rounded-xl bg-white/90 dark:bg-[#152720] border border-emerald-200/60 dark:border-emerald-800/50 flex flex-col gap-0.5 shadow-xs">
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">চেম্বার / মোড</span>
                    <span className="font-bold text-emerald-950 dark:text-emerald-100 text-xs">
                      {chamberMode === 'offline' ? '📍 ঢাকা চেম্বার (সরাসরি)' : '📹 অনলাইন ভিডিও কনসালটেশন'}
                    </span>
                  </div>

                  {/* Date */}
                  <div className="p-2.5 rounded-xl bg-white/90 dark:bg-[#152720] border border-emerald-200/60 dark:border-emerald-800/50 flex flex-col gap-0.5 shadow-xs">
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">নির্বাচিত তারিখ</span>
                    <span className="font-bold text-emerald-950 dark:text-emerald-100 text-xs">
                      📅 {activeDateObj?.fullBn || selectedDate}
                    </span>
                  </div>

                  {/* Slot Time */}
                  <div className="p-2.5 rounded-xl bg-white/90 dark:bg-[#152720] border border-amber-300/70 dark:border-amber-700/60 flex flex-col gap-0.5 shadow-xs">
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">বরাদ্দকৃত সময় স্লট</span>
                    <span className="font-bold text-amber-900 dark:text-amber-300 text-xs flex items-center gap-1">
                      ⏰ {selectedSlot.timeBn}
                    </span>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">({selectedSlot.timeEn})</span>
                  </div>

                  {/* Fee */}
                  <div className="p-2.5 rounded-xl bg-white/90 dark:bg-[#152720] border border-emerald-200/60 dark:border-emerald-800/50 flex flex-col gap-0.5 shadow-xs">
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">পরামর্শ ফি</span>
                    <span className="font-bold text-emerald-850 dark:text-emerald-200 text-xs">
                      💳 {activeSchedule.feeBn || (chamberMode === 'offline' ? '১,০০০ টাকা' : '৮০০ টাকা')}
                    </span>
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Patient Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                    রোগীর পূর্ণ নাম <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="আপনার নাম লিখুন এখানে"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/30 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* WhatsApp Phone */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                    হোয়াটসঅ্যাপ / মোবাইল নম্বর <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="যেমন: 017XXXXXXXX"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/30 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block">
                    সিরিয়াল নম্বর ও কনফার্মেশন স্লিপ এই নম্বরে পাঠানো হবে
                  </span>
                </div>
              </div>

              {/* Email (Optional) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                  ইমেইল ঠিকানা <span className="text-emerald-500 font-normal">(ঐচ্ছিক)</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="যেমন: example@gmail.com (যদি থাকে)"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/30 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block">
                  কনফার্মেশন স্লিপ ইমেইলে পেতে চাইলে দিতে পারেন (বাধ্যতামূলক নয়)
                </span>
              </div>

              {/* Chief Complaints */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                  প্রধান শারীরিক সমস্যা বা রোগের বিবরণ <span className="text-emerald-500 font-normal">(ঐচ্ছিক)</span>
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400 absolute left-3.5 top-3" />
                  <textarea
                    rows={3}
                    value={complaints}
                    onChange={(e) => setComplaints(e.target.value)}
                    placeholder="যেমন: দীর্ঘদিনের আইবিএস, গ্যাস, ফ্যাটি লিভার বা অনিদ্রা..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/30 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Submit CTA Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={otpPending || isPending}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-900 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-base shadow-xl shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 transform active:scale-98 disabled:opacity-60 cursor-pointer"
                >
                  {otpPending || isPending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>যাচাইকরণ কোড পাঠানো হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5 text-amber-300" />
                      <span>ওটিপি যাচাই ও ডিজিটাল সিরিয়াল গ্রহণ করুন</span>
                    </>
                  )}
                </button>
                <p className="text-center text-[11px] text-emerald-700 dark:text-emerald-400 mt-2">
                  🔒 ফলস বুকিং রোধে প্রদত্ত মোবাইল নম্বরে ৬-সংখ্যার ওটিপি (OTP) পাঠানো হবে।
                </p>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* OTP VERIFICATION MODAL */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl sm:rounded-3xl bg-white dark:bg-[#13201a] border border-emerald-500/40 shadow-2xl p-4 sm:p-7 space-y-4 sm:space-y-5 animate-scale-up max-h-[94vh] overflow-y-auto my-auto">
            {/* Close Button */}
            <button
              onClick={() => setShowOtpModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 mx-auto flex items-center justify-center shadow-inner">
                <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="font-serif text-xl font-bold text-emerald-950 dark:text-emerald-50">
                মোবাইল নম্বর যাচাইকরণ (OTP)
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                ফলস বুকিং রোধে আপনার নম্বরে একটি ৬-সংখ্যার নিরাপত্তা কোড পাঠানো হয়েছে:
              </p>
              <div className="inline-block px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 font-mono font-bold text-emerald-900 dark:text-emerald-200 text-sm">
                {phone}
              </div>
            </div>

            {/* Demo / Sandbox Helper Badge if real SMS gateway is not configured */}
            {otpDebugCode && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700/60 text-center space-y-1.5">
                <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 block">
                  🧪 টেস্ট মোড ওটিপি (Sandbox Demo):
                </span>
                <button
                  type="button"
                  onClick={() => setOtpCode(otpDebugCode)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-200 dark:bg-amber-900 text-amber-950 dark:text-amber-100 font-mono font-bold text-sm hover:bg-amber-300 cursor-pointer transition-colors"
                  title="ক্লিক করে কোড বসান"
                >
                  <span>{otpDebugCode}</span>
                  <span className="text-[10px] font-normal underline">(ক্লিক করে বসান)</span>
                </button>
                {otpGatewayNotice && (
                  <p className="text-[10px] text-amber-800/80 dark:text-amber-300/80 leading-relaxed px-1">
                    {otpGatewayNotice}
                  </p>
                )}
              </div>
            )}

            {/* OTP Error message */}
            {otpError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleVerifyOtpAndProceed} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-center text-emerald-900 dark:text-emerald-200 mb-2">
                  ৬-সংখ্যার কোডটি লিখুন
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  autoFocus
                  value={otpCode}
                  onChange={(e) => {
                    const val = e.target.value;
                    const bnMap: Record<string, string> = {
                      '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
                      '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
                    };
                    const converted = val.replace(/[০-৯]/g, (d) => bnMap[d] || d).replace(/[^0-9]/g, '');
                    setOtpCode(converted);
                  }}
                  placeholder="• • • • • •"
                  className="w-full text-center tracking-[0.5em] font-mono text-2xl font-bold py-3 px-4 rounded-xl border-2 border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-50 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              {/* Countdown and Resend */}
              <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 px-1">
                {otpTimer > 0 ? (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    পুনরায় কোড পাঠানোর সময়: <strong>{otpTimer}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={otpPending}
                    className="text-emerald-800 dark:text-emerald-300 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>কোড পুনরায় পাঠান</span>
                  </button>
                )}

                <a
                  href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '8801712854941'}?text=${encodeURIComponent(
                    `নমস্কার ডা. দেবজ্যোতি দত্ত চেম্বার, আমি ${patientName} (${phone}) সিরিয়াল বুকিংয়ের জন্য ওটিপি পেতে সহায়তা চাইছি।`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#25D366] hover:underline flex items-center gap-1"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>হোয়াটসঅ্যাপ সহায়তা</span>
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={otpPending || otpCode.length !== 6}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {otpPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>যাচাই করা হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-amber-300" />
                    <span>যাচাই সম্পন্ন করুন ও সিরিয়াল কনফার্ম করুন</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: Instant Digital Serial Slip */}
      {confirmedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl sm:rounded-3xl bg-white dark:bg-[#13201a] border border-emerald-500/30 shadow-2xl p-4 sm:p-7 space-y-4 sm:space-y-5 max-h-[94vh] overflow-y-auto my-auto">
            {/* Close Button */}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header / Verification Notice */}
            <div className="text-center space-y-1.5 sm:space-y-2 pr-6 sm:pr-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 mx-auto flex items-center justify-center text-xl sm:text-2xl shadow-inner">
                ✅
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-emerald-950 dark:text-emerald-50 leading-snug">
                অ্যাপয়েন্টমেন্ট সফলভাবে সম্পন্ন হয়েছে!
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                মোবাইল নম্বর সফলভাবে যাচাই করা হয়েছে। আপনার ডিজিটাল সিরিয়াল স্লিপ প্রস্তুত।
              </p>
            </div>

            {/* Digital Serial Slip Card */}
            <div id="printable-serial-slip" className="p-3.5 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-amber-50/50 dark:from-emerald-950/60 dark:to-emerald-900/30 border-2 border-dashed border-emerald-300 dark:border-emerald-700/60 space-y-3.5 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-emerald-200 dark:border-emerald-800/60 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block">
                    অফিশিয়াল ডিজিটাল সিরিয়াল
                  </span>
                  <div className="font-mono text-xl sm:text-2xl font-black text-emerald-950 dark:text-emerald-50 flex items-center gap-2 flex-wrap">
                    <span className="tracking-tight select-all">{confirmedAppointment.serialNo}</span>
                    <button
                      onClick={handleCopySerial}
                      title="সিরিয়াল নম্বর কপি করুন"
                      className="p-1.5 rounded-lg text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200/50 bg-emerald-100/60 dark:bg-emerald-900/40 cursor-pointer"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    {copiedSerial && (
                      <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-100 dark:bg-emerald-900 px-1.5 py-0.5 rounded">কপি হয়েছে!</span>
                    )}
                  </div>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1.5 flex-wrap">
                  <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-700 text-white">
                    {confirmedAppointment.chamberTitleBn}
                  </span>
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-emerald-950">
                    যাচাইকৃত (Verified)
                  </span>
                </div>
              </div>

              {/* Patient and Slot Details */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 text-xs">
                <div>
                  <span className="text-emerald-700/80 dark:text-emerald-400 block font-medium">রোগীর নাম:</span>
                  <span className="font-bold text-emerald-950 dark:text-emerald-100">{confirmedAppointment.patientName}</span>
                </div>
                <div>
                  <span className="text-emerald-700/80 dark:text-emerald-400 block font-medium">মোবাইল:</span>
                  <span className="font-bold text-emerald-950 dark:text-emerald-100 font-mono">{confirmedAppointment.phone}</span>
                </div>
                <div>
                  <span className="text-emerald-700/80 dark:text-emerald-400 block font-medium">তারিখ:</span>
                  <span className="font-bold text-emerald-950 dark:text-emerald-100">{confirmedAppointment.dateFormattedBn}</span>
                </div>
                <div>
                  <span className="text-emerald-700/80 dark:text-emerald-400 block font-medium">বরাদ্দকৃত সময়:</span>
                  <span className="font-bold text-amber-700 dark:text-amber-400 font-semibold">{confirmedAppointment.slotTimeBn}</span>
                </div>
                {confirmedAppointment.email && (
                  <div className="col-span-2">
                    <span className="text-emerald-700/80 dark:text-emerald-400 block font-medium">কনফার্মেশন ইমেইল:</span>
                    <span className="font-bold text-emerald-950 dark:text-emerald-100 font-mono text-[11px] break-all">{confirmedAppointment.email}</span>
                  </div>
                )}
              </div>

              {/* Patient Intake Google Form */}
              <div className="p-3 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
                <div className="font-bold flex items-center gap-1 text-[11px] sm:text-xs">
                  <span>👉 অনুগ্রহ করে এই ফর্মটি পূরণ করুন: (অবশ্যই পূরণ করতে হবে)</span>
                </div>
                <a
                  href="https://forms.gle/L6YfWn7Z12nV3aK66"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-800 dark:text-emerald-300 font-bold underline hover:text-emerald-950 text-xs break-all"
                >
                  <span>https://forms.gle/L6YfWn7Z12nV3aK66</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
                <p className="text-[10px] sm:text-[11px] text-amber-800/80 dark:text-amber-300/80">
                  (পূর্বে একবার পূরণ করে থাকলে পুনরায় পূরণ করার প্রয়োজন নেই।)
                </p>
              </div>

              {/* Chamber Address & Google Maps Link */}
              {confirmedAppointment.chamberMode === 'offline' && (
                <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                  <div className="text-[11px] font-semibold text-emerald-950 dark:text-emerald-100">
                    📍 <strong>চেম্বারের ঠিকানা:</strong> ২/১, জাহেদা ভিলা, শ্যামলী কল্যাণ সমিতি, শ্যামলী, ঢাকা-১২০৭।
                  </div>
                  <a
                    href="https://maps.app.goo.gl/NgPzAZamW3Ucy8799"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-300 font-bold hover:underline"
                  >
                    <span>গুগল ম্যাপে লোকেশন দেখুন</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Instructions */}
              <div className="p-2.5 rounded-xl bg-white/70 dark:bg-emerald-950/60 text-[11px] text-emerald-800 dark:text-emerald-300 space-y-1">
                <p>
                  📌 <strong>নির্দেশনা:</strong> স্লিপটি ডাউনলোড করে বা ডিজিটাল কপি সংরক্ষণ করুন। ডাক্তার চেম্বার থেকে সিরিয়াল কনফার্ম করলে আপনার ইমেইলে কনফার্মেশন স্লিপ পৌঁছে যাবে।
                </p>
              </div>
            </div>

            {/* Action Buttons: Strictly Slip Download & OK */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={handlePrintSlip}
                type="button"
                className="py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all cursor-pointer shadow-sm text-center"
              >
                <Download className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <span>স্লিপ ডাউনলোড করুন</span>
              </button>

              <button
                onClick={handleCloseModal}
                type="button"
                className="py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-md text-center"
              >
                <span>ঠিক আছে (ওকে)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
