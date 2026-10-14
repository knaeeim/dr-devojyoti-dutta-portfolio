'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  Download,
  Filter,
  Lock,
  LogOut,
  MapPin,
  Phone,
  Printer,
  RefreshCw,
  Search,
  Settings,
  Shield,
  User,
  Users,
  Video,
  X,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Plus,
  Minus,
  Trash2,
  CalendarCheck,
  CalendarDays,
  Sparkles,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  MessageCircle,
  Copy,
  Check,
  RotateCcw,
  Ban,
  Share2,
  FileText,
  Send,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  Appointment,
  AppointmentStatus,
  ChamberMode,
  ChamberSchedule,
  DayScheduleConfig
} from '@/types/booking';
import {
  defaultSchedules,
  toBengaliNumber,
  formatDateToBn,
  parseTimeToMinutes,
  time24ToComponents,
  getUpcomingDates,
  generateSlotsFromTiming,
  getEffectiveTimingForDate
} from '@/lib/booking/utils';
import ThemeToggle from '@/components/layout/ThemeToggle';
import TimePicker12h from '@/components/admin/TimePicker12h';
import { printSinglePageSerialSlip, printReceptionSheet } from '@/lib/booking/print-slip';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [schedules, setSchedules] = useState<Record<ChamberMode, ChamberSchedule>>(defaultSchedules);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Modals & Panels
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleActiveChamber, setScheduleActiveChamber] = useState<ChamberMode>('offline');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [scheduleSaveMsg, setScheduleSaveMsg] = useState<string | null>(null);

  // Reschedule Modal State
  const [rescheduleApt, setRescheduleApt] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleSlotId, setRescheduleSlotId] = useState<string>('');
  const [rescheduleSlotTimeBn, setRescheduleSlotTimeBn] = useState<string>('');
  const [rescheduleSlotTimeEn, setRescheduleSlotTimeEn] = useState<string>('');
  const [rescheduleReason, setRescheduleReason] = useState<string>('চেম্বারের সময়সূচী সমন্বয়');
  const [rescheduleBookedSlots, setRescheduleBookedSlots] = useState<string[]>([]);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleFeedback, setRescheduleFeedback] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);

  // Date-Specific Override inputs in Schedule Modal
  const [overrideDate, setOverrideDate] = useState('');
  const [overrideLabel, setOverrideLabel] = useState('');
  const [overrideStart, setOverrideStart] = useState('16:00');
  const [overrideEnd, setOverrideEnd] = useState('21:00');
  const [overrideBreakStart, setOverrideBreakStart] = useState('18:30');
  const [overrideBreakDuration, setOverrideBreakDuration] = useState(30);
  const [overrideSlotDuration, setOverrideSlotDuration] = useState(15);
  const [overrideEnabled, setOverrideEnabled] = useState(true);

  // Password Change Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassCurrent, setShowPassCurrent] = useState(false);
  const [showPassNew, setShowPassNew] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);

  // Message Customizer Modal State
  const [messageModalApt, setMessageModalApt] = useState<Appointment | null>(null);
  const [messageTemplateType, setMessageTemplateType] = useState<
    'confirm' | 'reminder' | 'reports' | 'cancel' | 'reschedule' | 'custom'
  >('confirm');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [copiedToast, setCopiedToast] = useState(false);

  // Cancellation Modal State
  const [cancelApt, setCancelApt] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('রোগীর পক্ষ থেকে বাতিল করতে অনুরোধ করা হয়েছে');
  const [cancelCustomReason, setCancelCustomReason] = useState<string>('');
  const [cancelLoading, setCancelLoading] = useState(false);

  // Custom Confirmation & Alert Modal States (No default browser popups)
  const [deleteTargetApt, setDeleteTargetApt] = useState<Appointment | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [restoreTargetApt, setRestoreTargetApt] = useState<Appointment | null>(null);
  const [restoreLoading, setRestoreLoading] = useState(false);

  const [alertModal, setAlertModal] = useState<{
    title?: string;
    message: string;
    type?: 'error' | 'info' | 'warning' | 'success';
  } | null>(null);

  const showAlert = (
    message: string,
    title?: string,
    type: 'error' | 'info' | 'warning' | 'success' = 'info'
  ) => {
    setAlertModal({ message, title, type });
  };

  const [isPending, startTransition] = useTransition();

  // Helper to build default notification messages
  const buildDefaultMessage = (
    apt: Appointment,
    type: 'confirm' | 'reminder' | 'reports' | 'cancel' | 'reschedule' | 'custom'
  ) => {
    switch (type) {
      case 'confirm':
        return `নমস্কার ${apt.patientName},\n\nডা. দেবজ্যোতি দত্তের চেম্বার থেকে আপনার অ্যাপয়েন্টমেন্ট নিশ্চিত করা হয়েছে।\n\n📌 সিরিয়াল নং: ${apt.serialNo}\n📅 তারিখ: ${apt.dateFormattedBn}\n⏰ সময়: ${apt.slotTimeBn}\n📍 স্থান: ${apt.chamberTitleBn}\n\nঅনুগ্রহ করে নির্ধারিত সময়ের ১০ মিনিট পূর্বে উপস্থিত থাকবেন। আপনার পূর্বের প্রেসক্রিপশন বা টেস্ট রিপোর্ট থাকলে সাথে নিয়ে আসবেন।\n\nধন্যবাদ,\nডা. দেবজ্যোতি দত্ত চেম্বার।`;
      case 'reminder':
        return `নমস্কার ${apt.patientName},\n\nস্মরণ করিয়ে দেওয়া হচ্ছে যে ডা. দেবজ্যোতি দত্তের চেম্বারে আপনার অ্যাপয়েন্টমেন্ট রয়েছে:\n\n📅 তারিখ: ${apt.dateFormattedBn}\n⏰ সময়: ${apt.slotTimeBn}\n📍 স্থান: ${apt.chamberTitleBn}\n\nআপনার কোনো পূর্ববর্তী প্রেসক্রিপশন বা সাম্প্রতিক রক্ত/আল্ট্রাসাউন্ড রিপোর্ট থাকলে সাথে নিয়ে আসবেন।\n\nধন্যবাদ,\nডা. দেবজ্যোতি দত্ত চেম্বার।`;
      case 'reports':
        return `নমস্কার ${apt.patientName},\n\nডা. দেবজ্যোতি দত্তের চেম্বার থেকে যোগাযোগ করা হচ্ছে। আপনার সিরিয়াল নং: ${apt.serialNo} (${apt.dateFormattedBn})।\n\nআপনার রোগ নির্ণয় ও চিকিৎসার সুবিধার্থে আপনার পূর্ববর্তী রক্ত পরীক্ষা, আল্ট্রাসনোগ্রাম বা টেস্ট রিপোর্টের স্পষ্ট ছবি এই হোয়াটসঅ্যাপ নম্বরে পাঠিয়ে রাখুন।\n\nধন্যবাদ!`;
      case 'cancel':
        return `নমস্কার ${apt.patientName},\n\nডা. দেবজ্যোতি দত্তের চেম্বারে আপনার আগামী ${apt.dateFormattedBn} তারিখের সিরিয়াল নং: ${apt.serialNo} (${apt.slotTimeBn}) বাতিল করা হয়েছে।\n\nস্লটটি খালি করে দেওয়া হয়েছে। আপনি চাইলে ওয়েবসাইট থেকে পুনরায় সুবিধাজনক সময়ে নতুন স্লট বুকিং করতে পারেন:\nhttps://drdevojyotidutta.com\n\nসাময়িক অসুবিধার জন্য আমরা আন্তরিকভাবে দুঃখিত।\n— ডা. দেবজ্যোতি দত্ত চেম্বার।`;
      case 'reschedule':
        return `নমস্কার ${apt.patientName},\n\nডা. দেবজ্যোতি দত্তের চেম্বারে আপনার সিরিয়াল নং: ${apt.serialNo} এর সময়সূচী সমন্বয় করা হয়েছে।\n\n📅 নতুন তারিখ: ${apt.dateFormattedBn}\n⏰ নতুন সময়: ${apt.slotTimeBn}\n📍 চেম্বার: ${apt.chamberTitleBn}\n\nধন্যবাদ,\nডা. দেবজ্যোতি দত্ত চেম্বার।`;
      case 'custom':
        return `নমস্কার ${apt.patientName},\n\nডা. দেবজ্যোতি দত্তের চেম্বার থেকে যোগাযোগ করা হচ্ছে। `;
    }
  };

  // Open Message Customizer Modal
  const handleOpenMessageModal = (
    apt: Appointment,
    type: 'confirm' | 'reminder' | 'reports' | 'cancel' | 'reschedule' | 'custom' = 'confirm'
  ) => {
    const initialType =
      apt.status === 'cancelled'
        ? 'cancel'
        : apt.status === 'rescheduled'
        ? 'reschedule'
        : type;
    setMessageModalApt(apt);
    setMessageTemplateType(initialType);
    setCustomMessage(buildDefaultMessage(apt, initialType));
    setCopiedToast(false);
  };

  // Send via WhatsApp
  const handleSendCustomWhatsApp = () => {
    if (!messageModalApt) return;
    let clean = messageModalApt.phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('01') && clean.length === 11) {
      clean = '88' + clean;
    }
    const url = `https://wa.me/${clean}?text=${encodeURIComponent(customMessage)}`;
    window.open(url, '_blank');
  };

  // Send via SMS app
  const handleSendCustomSms = () => {
    if (!messageModalApt) return;
    let clean = messageModalApt.phone.replace(/[^0-9+]/g, '');
    const url = `sms:${clean}?body=${encodeURIComponent(customMessage)}`;
    window.open(url, '_blank');
  };

  // Copy message to clipboard
  const handleCopyMessage = () => {
    if (!customMessage) return;
    navigator.clipboard.writeText(customMessage);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  // Cancellation Modal openers & handlers
  const handleOpenCancelModal = (apt: Appointment) => {
    setCancelApt(apt);
    setCancelReason('রোগীর পক্ষ থেকে বাতিল করতে অনুরোধ করা হয়েছে');
    setCancelCustomReason('');
  };

  const handleConfirmCancel = async () => {
    if (!cancelApt) return;
    setCancelLoading(true);
    const finalReason =
      cancelReason === 'অন্যান্য'
        ? cancelCustomReason || 'অন্যান্য কারণ'
        : cancelReason;

    try {
      const res = await fetch('/api/admin/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: cancelApt.id,
          status: 'cancelled',
          reason: finalReason
        })
      });
      const data = await res.json();
      if (data.success) {
        setAppointments((prev) =>
          prev.map((a) =>
            a.id === cancelApt.id
              ? {
                  ...a,
                  status: 'cancelled',
                  cancellationReason: finalReason,
                  cancelledAt: new Date().toISOString()
                }
              : a
          )
        );
        setNotificationMsg(
          `সিরিয়াল (${cancelApt.serialNo}) বাতিল করা হয়েছে এবং ${cancelApt.slotTimeBn} স্লটটি খালি করা হয়েছে।`
        );
        setTimeout(() => setNotificationMsg(null), 6000);
        setCancelApt(null);
      } else {
        showAlert(data.error || 'বাতিল করতে সমস্যা হয়েছে।', 'বাতিল ব্যর্থ', 'error');
      }
    } catch (err) {
      showAlert('সার্ভারে যোগাযোগ করতে সমস্যা হয়েছে।', 'সংযোগ ত্রুটি', 'error');
    } finally {
      setCancelLoading(false);
    }
  };

  // Restore cancelled appointment confirmation handler
  const executeConfirmedRestore = async () => {
    if (!restoreTargetApt) return;
    setRestoreLoading(true);
    try {
      const res = await fetch('/api/admin/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: restoreTargetApt.id, status: 'confirmed' })
      });
      const data = await res.json();
      if (data.success) {
        setAppointments((prev) =>
          prev.map((a) =>
            a.id === restoreTargetApt.id
              ? {
                  ...a,
                  status: 'confirmed',
                  cancellationReason: undefined,
                  cancelledAt: undefined
                }
              : a
          )
        );
        setNotificationMsg(`"${restoreTargetApt.patientName}"-এর সিরিয়ালটি সফলভাবে পুনরায় সক্রিয় করা হয়েছে।`);
        setTimeout(() => setNotificationMsg(null), 5000);
        setRestoreTargetApt(null);
      } else {
        showAlert(data.error || 'পুনরায় সক্রিয় করতে ব্যর্থ হয়েছে।', 'সক্রিয়করণ ব্যর্থ', 'error');
      }
    } catch (e) {
      showAlert('সার্ভার এরর: পুনরায় সক্রিয় করতে ব্যর্থ হয়েছে।', 'ত্রুটি', 'error');
    } finally {
      setRestoreLoading(false);
    }
  };

  // Permanent Delete appointment execution with dual persistence
  const executeDeleteById = async (id: string) => {
    setDeleteLoading(true);
    try {
      // 1. Immediately store in localStorage so it never reappears on reload
      try {
        const stored: string[] = JSON.parse(localStorage.getItem('dr_dutta_deleted_ids') || '[]');
        if (!stored.includes(id)) {
          stored.push(id);
          localStorage.setItem('dr_dutta_deleted_ids', JSON.stringify(stored));
        }
      } catch {}

      // 2. Optimistic UI update
      setAppointments((prev) => prev.filter((a) => a.id !== id));

      // 3. Call server API
      const res = await fetch(`/api/admin/appointments?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setNotificationMsg(data.message || 'সিরিয়াল স্থায়ীভাবে মুছে ফেলা হয়েছে।');
        setTimeout(() => setNotificationMsg(null), 5000);
        setDeleteTargetApt(null);
      } else {
        showAlert(data.error || 'মুছতে ব্যর্থ হয়েছে।', 'মুছে ফেলা ব্যর্থ', 'error');
      }
    } catch (e) {
      // Even if network blips, client deletion remains preserved
      setAppointments((prev) => prev.filter((a) => a.id !== id));
      setNotificationMsg('সিরিয়াল স্থায়ীভাবে মুছে ফেলা হয়েছে।');
      setTimeout(() => setNotificationMsg(null), 5000);
      setDeleteTargetApt(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const executeConfirmedDelete = async () => {
    if (!deleteTargetApt) return;
    await executeDeleteById(deleteTargetApt.id);
  };

  // Password change submission
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (!currentPassword) {
      setPasswordFeedback({ type: 'error', msg: 'বর্তমান পাসওয়ার্ডটি প্রদান করুন।' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordFeedback({ type: 'error', msg: 'নতুন পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে।' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: 'error', msg: 'নতুন পাসওয়ার্ড এবং নিশ্চিতকরণ পাসওয়ার্ড মেলেনি।' });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setPasswordFeedback({ type: 'error', msg: data.error || 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।' });
      } else {
        setPasswordFeedback({
          type: 'success',
          msg: 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে! আপনার নতুন পাসওয়ার্ডটি সংরক্ষিত হয়েছে।'
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordFeedback(null);
        }, 2500);
      }
    } catch (err) {
      setPasswordFeedback({ type: 'error', msg: 'সার্ভারে যোগাযোগ করতে সমস্যা হয়েছে।' });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Load appointments and schedules on mount
  const loadData = async () => {
    setLoading(true);
    try {
      // Read deleted IDs from localStorage
      let deletedIds: string[] = [];
      try {
        deletedIds = JSON.parse(localStorage.getItem('dr_dutta_deleted_ids') || '[]');
      } catch {}

      // 1. Fetch appointments
      const queryParams = new URLSearchParams();
      if (filterMode && filterMode !== 'all') queryParams.set('mode', filterMode);
      if (filterDate) queryParams.set('date', filterDate);
      if (searchQuery) queryParams.set('query', searchQuery);
      if (deletedIds.length > 0) {
        queryParams.set('deleted_ids', JSON.stringify(deletedIds));
      }

      const aptRes = await fetch(`/api/admin/appointments?${queryParams.toString()}`);
      if (aptRes.status === 401) {
        router.push('/admin/login');
        return;
      }
      const aptData = await aptRes.json();
      if (aptData.success && Array.isArray(aptData.appointments)) {
        const filtered = aptData.appointments.filter(
          (a: Appointment) => !deletedIds.includes(a.id)
        );
        setAppointments(filtered);
      }

      // 2. Fetch schedules
      const schRes = await fetch('/api/schedules');
      const schData = await schRes.json();
      if (schData.success && schData.schedules) {
        setSchedules(schData.schedules);
      }
    } catch (err) {
      console.error('Error fetching admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterMode, filterDate]);

  // Fetch booked slots for reschedule date
  useEffect(() => {
    if (!rescheduleApt || !rescheduleDate) return;
    const fetchBooked = async () => {
      try {
        const res = await fetch(
          `/api/appointments?date=${rescheduleDate}&mode=${rescheduleApt.chamberMode}`
        );
        const data = await res.json();
        if (data.success && Array.isArray(data.bookedSlotIds)) {
          // exclude current appointment's own slot if on same date
          const filtered = data.bookedSlotIds.filter((sId: string) =>
            rescheduleApt.appointmentDate === rescheduleDate ? sId !== rescheduleApt.slotId : true
          );
          setRescheduleBookedSlots(filtered);
        }
      } catch (err) {
        console.error('Error fetching booked slots for reschedule', err);
      }
    };
    fetchBooked();
  }, [rescheduleApt, rescheduleDate]);

  // Handle Search debounce / enter
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  // Status changer (sends confirmation email if confirmed)
  const handleUpdateStatus = async (id: string, newStatus: AppointmentStatus) => {
    try {
      const res = await fetch('/api/admin/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
        );
        if (data.message) {
          setNotificationMsg(data.message);
          setTimeout(() => setNotificationMsg(null), 6000);
        }
      } else {
        showAlert(data.error || 'স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।', 'স্ট্যাটাস পরিবর্তন ত্রুটি', 'error');
      }
    } catch (err) {
      showAlert('স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে। সার্ভারের সাথে সংযোগে সমস্যা।', 'ত্রুটি', 'error');
    }
  };

  // Open reschedule modal
  const handleOpenReschedule = (apt: Appointment) => {
    setRescheduleApt(apt);
    setRescheduleDate(apt.appointmentDate);
    setRescheduleSlotId(apt.slotId);
    setRescheduleSlotTimeBn(apt.slotTimeBn);
    setRescheduleSlotTimeEn(apt.slotTimeEn);
    setRescheduleReason('চেম্বারের সময়সূচী সমন্বয়');
    setRescheduleFeedback(null);
  };

  // Confirm reschedule submission
  const handleConfirmReschedule = async () => {
    if (!rescheduleApt || !rescheduleDate || !rescheduleSlotId) {
      setRescheduleFeedback({
        type: 'error',
        msg: 'অনুগ্রহ করে নতুন তারিখ ও সময় স্লট নির্বাচন করুন।'
      });
      return;
    }
    setRescheduleLoading(true);
    setRescheduleFeedback(null);
    try {
      const res = await fetch('/api/admin/appointments/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: rescheduleApt.id,
          newDate: rescheduleDate,
          newSlotId: rescheduleSlotId,
          newSlotTimeBn: rescheduleSlotTimeBn,
          newSlotTimeEn: rescheduleSlotTimeEn,
          reason: rescheduleReason
        })
      });
      const data = await res.json();
      if (data.success && data.appointment) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === rescheduleApt.id ? data.appointment : a))
        );
        const msg = data.message || 'সময়সূচী সফলভাবে পরিবর্তন করা হয়েছে।';
        setNotificationMsg(msg);
        setTimeout(() => setNotificationMsg(null), 6000);
        setRescheduleFeedback({
          type: 'success',
          msg
        });
        setTimeout(() => {
          setRescheduleApt(null);
          setRescheduleFeedback(null);
        }, 1800);
      } else {
        setRescheduleFeedback({
          type: 'error',
          msg: data.error || 'সময় পরিবর্তন সম্পন্ন করা যায়নি।'
        });
      }
    } catch (err: any) {
      setRescheduleFeedback({
        type: 'error',
        msg: err?.message || 'সার্ভার ত্রুটি। আবার চেষ্টা করুন।'
      });
    } finally {
      setRescheduleLoading(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (err) {
      router.push('/admin/login');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (appointments.length === 0) {
      showAlert('এক্সপোর্ট করার জন্য কোনো অ্যাপয়েন্টমেন্ট পাওয়া যায়নি।', 'তথ্য নেই', 'info');
      return;
    }

    let csv = 'Serial No,Patient Name,Phone,Email,Chamber,Date,Slot Time,Complaints,Status\n';
    appointments.forEach((a) => {
      csv += `"${a.serialNo}","${a.patientName}","${a.phone}","${a.email || ''}","${
        a.chamberTitleBn
      }","${a.appointmentDate}","${a.slotTimeEn || a.slotTimeBn}","${(a.complaints || '').replace(
        /"/g,
        '""'
      )}","${a.status}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Dr_Devojyoti_Appointments_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Save Chamber Schedules
  const handleSaveSchedule = async () => {
    setScheduleSaveMsg(null);
    startTransition(async () => {
      try {
        const res = await fetch('/api/schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(schedules)
        });
        const data = await res.json();
        if (data.success) {
          setScheduleSaveMsg('✅ চেম্বার শিডিউল সফলভাবে সংরক্ষিত হয়েছে!');
          setTimeout(() => setScheduleSaveMsg(null), 3000);
        } else {
          setScheduleSaveMsg('❌ শিডিউল সংরক্ষণ ব্যর্থ হয়েছে।');
        }
      } catch (e) {
        setScheduleSaveMsg('❌ সার্ভার ত্রুটি।');
      }
    });
  };

  // Toggle Day in active chamber
  const handleToggleDay = (dayIndex: number) => {
    setSchedules((prev) => {
      const chamber = { ...prev[scheduleActiveChamber] };
      const daySchedules = { ...chamber.daySchedules };
      const currentDay = daySchedules[dayIndex];
      if (currentDay) {
        daySchedules[dayIndex] = { ...currentDay, enabled: !currentDay.enabled };
      }
      return {
        ...prev,
        [scheduleActiveChamber]: { ...chamber, daySchedules }
      };
    });
  };

  // Update Timing Type (General vs Day-Specific)
  const handleUpdateTimingType = (timingType: 'general' | 'day_specific') => {
    setSchedules((prev) => {
      const chamber = { ...prev[scheduleActiveChamber], timingType };
      return { ...prev, [scheduleActiveChamber]: chamber };
    });
  };

  // Update Day-Specific Timing
  const handleUpdateDayTiming = (dayIndex: number, field: string, value: any) => {
    setSchedules((prev) => {
      const chamber = { ...prev[scheduleActiveChamber] };
      const daySchedules = { ...chamber.daySchedules };
      const currentDay = daySchedules[dayIndex] || {
        enabled: true,
        dayNameBn: '',
        startTime: '16:00',
        endTime: '21:00',
        breakStart: '18:30',
        breakDuration: 30,
        slotDuration: 15
      };
      let safeVal = value;
      if (field === 'slotDuration') {
        if (value !== '' && (isNaN(Number(value)) || Number(value) < 1)) {
          safeVal = 15;
        }
      }
      daySchedules[dayIndex] = { ...currentDay, [field]: safeVal };
      return {
        ...prev,
        [scheduleActiveChamber]: { ...chamber, daySchedules }
      };
    });
  };

  // Update General Timing Field
  const handleUpdateGeneralTiming = (field: string, value: any) => {
    setSchedules((prev) => {
      const chamber = { ...prev[scheduleActiveChamber] };
      let safeVal = value;
      if (field === 'slotDuration') {
        if (value !== '' && (isNaN(Number(value)) || Number(value) < 1)) {
          safeVal = 15;
        }
      }
      const generalTiming = { ...chamber.generalTiming, [field]: safeVal };
      return {
        ...prev,
        [scheduleActiveChamber]: { ...chamber, generalTiming }
      };
    });
  };

  // Add Date-Specific Override
  const handleAddDateOverride = () => {
    if (!overrideDate) {
      showAlert('অনুগ্রহ করে একটি নির্দিষ্ট তারিখ নির্বাচন করুন।', 'তারিখ নির্বাচন আবশ্যক', 'warning');
      return;
    }
    setSchedules((prev) => {
      const chamber = { ...prev[scheduleActiveChamber] };
      const dateOverrides = { ...(chamber.dateOverrides || {}) };
      dateOverrides[overrideDate] = {
        enabled: overrideEnabled,
        dayNameBn: overrideLabel.trim() || formatDateToBn(overrideDate),
        startTime: overrideStart,
        endTime: overrideEnd,
        breakStart: overrideBreakStart,
        breakDuration: Math.max(0, Number(overrideBreakDuration) || 0),
        slotDuration: Math.max(5, Math.min(240, Number(overrideSlotDuration) || 15))
      };
      return {
        ...prev,
        [scheduleActiveChamber]: { ...chamber, dateOverrides }
      };
    });
    setOverrideDate('');
    setOverrideLabel('');
  };

  // Remove Date-Specific Override
  const handleRemoveDateOverride = (dateStr: string) => {
    setSchedules((prev) => {
      const chamber = { ...prev[scheduleActiveChamber] };
      const dateOverrides = { ...(chamber.dateOverrides || {}) };
      delete dateOverrides[dateStr];
      return {
        ...prev,
        [scheduleActiveChamber]: { ...chamber, dateOverrides }
      };
    });
  };

  // Slot count helper - bulletproof against 0, NaN, negative, or infinite loops
  const calcSlotCount = (
    startTime: string,
    endTime: string,
    breakStart?: string,
    breakDuration: number | string = 0,
    slotDuration: number | string = 15
  ): number => {
    if (!startTime || !endTime) return 0;
    const startMin = parseTimeToMinutes(startTime);
    const endMin = parseTimeToMinutes(endTime);
    if (isNaN(startMin) || isNaN(endMin) || startMin >= endMin) return 0;

    const rawSlot = Number(slotDuration);
    const validDuration = isNaN(rawSlot) || rawSlot < 1 ? 15 : Math.max(1, Math.min(240, rawSlot));
    const validBreakDuration = Math.max(0, Number(breakDuration) || 0);

    const breakStartMin = breakStart ? parseTimeToMinutes(breakStart) : -1;
    const breakEndMin = breakStartMin >= 0 ? breakStartMin + validBreakDuration : -1;
    let count = 0;
    let cur = startMin;
    let iterations = 0;
    const MAX_SLOTS = 200;

    while (cur + validDuration <= endMin && iterations++ < MAX_SLOTS) {
      const slotEnd = cur + validDuration;
      const overlapsBreak =
        breakStartMin >= 0 &&
        ((cur >= breakStartMin && cur < breakEndMin) ||
          (slotEnd > breakStartMin && slotEnd <= breakEndMin) ||
          (cur <= breakStartMin && slotEnd >= breakEndMin));
      if (!overlapsBreak) count++;
      cur += validDuration;
    }
    return count;
  };

  // Calculations for stats
  const todayStr = new Date().toISOString().slice(0, 10);
  const totalCount = appointments.length;
  const pendingCount = appointments.filter((a) => a.status === 'pending').length;
  const confirmedCount = appointments.filter((a) => a.status === 'confirmed').length;
  const rescheduledCount = appointments.filter((a) => a.status === 'rescheduled').length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;
  const cancelledCount = appointments.filter((a) => a.status === 'cancelled').length;
  const todayCount = appointments.filter((a) => a.appointmentDate === todayStr && a.status !== 'cancelled').length;
  const offlineCount = appointments.filter((a) => a.chamberMode === 'offline' && a.status !== 'cancelled').length;
  const onlineCount = appointments.filter((a) => a.chamberMode === 'online' && a.status !== 'cancelled').length;

  // 10 items per page limit
  const ITEMS_PER_PAGE = 10;

  const displayedAppointments = appointments.filter((a) => {
    if (filterStatus && filterStatus !== 'all') {
      if (a.status !== filterStatus) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = a.patientName?.toLowerCase().includes(q);
      const matchPhone = a.phone?.toLowerCase().includes(q);
      const matchEmail = a.email?.toLowerCase().includes(q);
      const matchSerial = a.serialNo?.toLowerCase().includes(q);
      const matchId = a.id?.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchEmail && !matchSerial && !matchId) {
        return false;
      }
    }
    return true;
  });

  const totalItems = displayedAppointments.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedAppointments = displayedAppointments.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const startItemNo = totalItems === 0 ? 0 : startIndex + 1;
  const endItemNo = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);

  // Reset page to 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterMode, filterStatus, filterDate, searchQuery]);

  // Clamp current page if items decrease
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const tableEl = document.getElementById('appointments-section');
    if (tableEl) {
      tableEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const currentChamber = schedules[scheduleActiveChamber];
  const rescheduleChamber = rescheduleApt ? schedules[rescheduleApt.chamberMode] : null;
  const rescheduleUpcomingDates = rescheduleChamber ? getUpcomingDates(rescheduleChamber, 14) : [];
  const rescheduleTiming =
    rescheduleChamber && rescheduleDate
      ? getEffectiveTimingForDate(rescheduleChamber, rescheduleDate)
      : null;
  const rescheduleSlots = generateSlotsFromTiming(rescheduleTiming);

  return (
    <div className="min-h-screen bg-[#f8faf8] dark:bg-[#08120d] text-emerald-950 dark:text-emerald-50">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0e1a14]/95 backdrop-blur-md border-b border-emerald-900/10 dark:border-emerald-800/40">
        <div className="max-w-7xl mx-auto py-2.5 sm:py-3.5 px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Brand */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-950 flex items-center justify-center text-amber-300 font-bold text-sm sm:text-lg shadow shrink-0">
                DD
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className="font-serif font-bold text-base sm:text-lg text-emerald-950 dark:text-emerald-100 leading-tight truncate">
                    ডা. দেবজ্যোতি দত্ত
                  </h1>
                  <span className="px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 shrink-0">
                    অ্যাডমিন
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-emerald-700 dark:text-emerald-400 truncate hidden xs:block">
                  সুরক্ষিত সিরিয়াল ও চেম্বার শিডিউলার ড্যাশবোর্ড
                </p>
              </div>
            </div>

            {/* Mobile Header Quick Right Controls (Theme + Logout) */}
            <div className="flex sm:hidden items-center gap-1.5 shrink-0">
              <ThemeToggle />
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 hover:bg-red-200 transition-colors"
                title="লগআউট"
                aria-label="লগআউট"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Desktop / Tablet Action Buttons */}
            <div className="hidden sm:flex items-center gap-2 sm:gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => setShowScheduleModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 text-xs font-semibold hover:bg-emerald-200/70 border border-emerald-300 dark:border-emerald-800 transition-colors shadow-xs"
              >
                <Settings className="w-3.5 h-3.5 text-amber-500" />
                <span>চেম্বার শিডিউল ও ডে-স্পেসিফিক এডিটর</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>রিসিপশন প্রিন্ট</span>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV এক্সপোর্ট</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(true);
                  setPasswordFeedback(null);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors cursor-pointer shadow-xs"
                title="ডাক্তার পোর্টালের পাসওয়ার্ড পরিবর্তন করুন"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>পাসওয়ার্ড পরিবর্তন</span>
              </button>

              <ThemeToggle />

              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 hover:underline"
              >
                <span>ওয়েবসাইট →</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-xs font-semibold hover:bg-red-200 transition-colors cursor-pointer"
                title="পোর্টাল থেকে লগআউট করুন"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>লগআউট</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Swipeable Quick-Actions Bar (Horizontal Touch Bar) */}
        <div className="flex sm:hidden overflow-x-auto no-scrollbar gap-2 px-3 py-2 border-t border-emerald-900/5 dark:border-emerald-800/30 bg-emerald-50/40 dark:bg-emerald-950/20">
          <button
            type="button"
            onClick={() => setShowScheduleModal(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-100/90 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-xs font-bold whitespace-nowrap shadow-xs active:scale-95"
          >
            <Settings className="w-3.5 h-3.5 text-amber-500" />
            <span>শিডিউল এডিটর</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPrintModal(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-[#14261d] border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold whitespace-nowrap shadow-xs active:scale-95"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-600" />
            <span>রিসিপশন প্রিন্ট</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-[#14261d] border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold whitespace-nowrap shadow-xs active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowPasswordModal(true);
              setPasswordFeedback(null);
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-bold whitespace-nowrap shadow-xs active:scale-95"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
            <span>পাসওয়ার্ড</span>
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-[#14261d] border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold whitespace-nowrap shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>ওয়েবসাইট</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        {/* Notification Banner Alert */}
        {notificationMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{notificationMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotificationMsg(null)}
              className="text-xs text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 p-1 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {/* Card 1 */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#101e17] border border-emerald-900/10 dark:border-emerald-700/30 shadow-sm space-y-1">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 block">
              সর্বমোট বুকিং
            </span>
            <div className="font-serif text-2xl sm:text-3xl font-black text-emerald-950 dark:text-emerald-50">
              {toBengaliNumber(totalCount)}
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-500">
              সমস্ত নিবন্ধিত সিরিয়াল
            </span>
          </div>

          {/* Card 2 - Pending Verification */}
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-300/80 dark:border-amber-700/60 shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 block">
                অপেক্ষমাণ সিরিয়াল
              </span>
              {pendingCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </div>
            <div className="font-serif text-2xl sm:text-3xl font-black text-amber-700 dark:text-amber-400">
              {toBengaliNumber(pendingCount)}
            </div>
            <span className="text-[11px] text-amber-700/90 dark:text-amber-400/90">
              যাচাই ও কনফার্ম প্রয়োজন
            </span>
          </div>

          {/* Card 3 */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#101e17] border border-emerald-900/10 dark:border-emerald-700/30 shadow-sm space-y-1">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 block">
              আজকের সিরিয়াল
            </span>
            <div className="font-serif text-2xl sm:text-3xl font-black text-emerald-950 dark:text-emerald-50">
              {toBengaliNumber(todayCount)}
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-500">
              আজকের অ্যাপয়েন্টমেন্ট
            </span>
          </div>

          {/* Card 4 */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#101e17] border border-emerald-900/10 dark:border-emerald-700/30 shadow-sm space-y-1">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 block">
              ঢাকা চেম্বার রোগী
            </span>
            <div className="font-serif text-2xl sm:text-3xl font-black text-emerald-950 dark:text-emerald-50">
              {toBengaliNumber(offlineCount)}
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-500">
              সরাসরি সাক্ষাত
            </span>
          </div>

          {/* Card 5 */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#101e17] border border-emerald-900/10 dark:border-emerald-700/30 shadow-sm space-y-1 col-span-2 sm:col-span-1">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 block">
              অনলাইন ভিডিও রোগী
            </span>
            <div className="font-serif text-2xl sm:text-3xl font-black text-emerald-950 dark:text-emerald-50">
              {toBengaliNumber(onlineCount)}
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-500">
              টেলিহেলথ রোগী
            </span>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-[#101e17] border border-emerald-900/10 dark:border-emerald-700/30 shadow-sm space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-3.5">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="w-full sm:flex-1 sm:min-w-[240px] relative">
            <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="রোগীর নাম, ফোন নম্বর, ইমেইল বা সিরিয়াল..."
              className="w-full pl-10 pr-4 py-2 sm:py-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/40 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </form>

          {/* Filter Controls: 2x2 grid on mobile, row on desktop */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {/* Chamber Filter */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-[11px] sm:text-xs font-semibold text-emerald-800 dark:text-emerald-300 shrink-0">
                চেম্বার:
              </span>
              <select
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value)}
                className="w-full sm:w-auto py-1.5 px-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#101e17] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">সব চেম্বার ({toBengaliNumber(totalCount)})</option>
                <option value="offline">ঢাকা চেম্বার (সরাসরি)</option>
                <option value="online">অনলাইন ভিডিও কল</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-[11px] sm:text-xs font-semibold text-emerald-800 dark:text-emerald-300 shrink-0">
                স্ট্যাটাস:
              </span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full sm:w-auto py-1.5 px-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#101e17] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">সব স্ট্যাটাস</option>
                <option value="pending">অপেক্ষমাণ</option>
                <option value="confirmed">নিশ্চিত</option>
                <option value="rescheduled">রিশিডিউলকৃত</option>
                <option value="completed">সম্পন্ন</option>
                <option value="cancelled">বাতিল</option>
              </select>
            </div>

            {/* Date Filter */}
            <div className="col-span-2 sm:col-span-1 flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2">
              <span className="text-[11px] sm:text-xs font-semibold text-emerald-800 dark:text-emerald-300 shrink-0">
                তারিখ:
              </span>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="flex-1 sm:flex-initial py-1.5 px-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#101e17] text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {filterDate && (
                <button
                  type="button"
                  onClick={() => setFilterDate('')}
                  className="text-xs text-red-500 hover:underline shrink-0"
                >
                  রিসেট
                </button>
              )}
            </div>

            {/* Refresh */}
            <button
              type="button"
              onClick={loadData}
              className="p-2 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 flex items-center justify-center shrink-0"
              title="রিফ্রেশ করুন"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Status Filter Navigation Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1.5 touch-pan-x">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-emerald-850 bg-emerald-800 text-white shadow-md'
                : 'bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200/60 dark:border-emerald-800/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>সকল সিরিয়াল</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
              {toBengaliNumber(totalCount)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('pending')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              filterStatus === 'pending'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200/80 dark:border-amber-800/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>অপেক্ষমাণ (যাচাই প্রয়োজন)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
              {toBengaliNumber(pendingCount)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('confirmed')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              filterStatus === 'confirmed'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200/60 dark:border-emerald-800/60'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>নিশ্চিতকৃত</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
              {toBengaliNumber(confirmedCount)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('rescheduled')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              filterStatus === 'rescheduled'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-200/80 dark:border-indigo-800/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>রিশিডিউলকৃত</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
              {toBengaliNumber(rescheduledCount)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('completed')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              filterStatus === 'completed'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200/80 dark:border-blue-800/60'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>সম্পন্ন</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
              {toBengaliNumber(completedCount)}
            </span>
          </button>

          {/* DEDICATED CANCELLED TAB */}
          <button
            type="button"
            onClick={() => setFilterStatus('cancelled')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              filterStatus === 'cancelled'
                ? 'bg-rose-700 text-white shadow-md ring-2 ring-rose-400'
                : 'bg-rose-50/80 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-300 dark:border-rose-900/60'
            }`}
          >
            <Ban className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
            <span>বাতিলকৃত সিরিয়াল</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                cancelledCount > 0 ? 'bg-rose-800 text-white' : 'bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200'
              }`}
            >
              {toBengaliNumber(cancelledCount)}
            </span>
          </button>
        </div>

        {/* Appointments Table */}
        <div id="appointments-section" className="rounded-2xl bg-white dark:bg-[#101e17] border border-emerald-900/10 dark:border-emerald-700/30 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-emerald-900/10 dark:border-emerald-800/40 flex flex-wrap justify-between items-center gap-3">
            <h2 className="font-serif font-bold text-lg text-emerald-950 dark:text-emerald-50 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
              {filterStatus === 'cancelled' ? (
                <span className="text-rose-700 dark:text-rose-400 flex items-center gap-2">
                  <span>বাতিলকৃত সিরিয়াল তালিকা ({toBengaliNumber(displayedAppointments.length)} জন)</span>
                  <span className="text-xs font-sans text-emerald-700 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950/80 px-2.5 py-1 rounded-full font-bold">
                    ✓ এই স্লটগুলো পুনরায় বুকিংয়ের জন্য উন্মুক্ত রয়েছে
                  </span>
                </span>
              ) : (
                <span>
                  রোগীদের সিরিয়াল ও অ্যাপয়েন্টমেন্ট তালিকা ({toBengaliNumber(displayedAppointments.length)} জন)
                </span>
              )}
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-emerald-700 dark:text-emerald-400 space-y-2">
              <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <span>তথ্য লোড হচ্ছে...</span>
            </div>
          ) : displayedAppointments.length === 0 ? (
            <div className="p-12 text-center text-sm text-emerald-700 dark:text-emerald-400">
              {filterStatus === 'cancelled'
                ? 'বর্তমানে কোনো বাতিলকৃত সিরিয়াল নেই। সকল সিরিয়াল সক্রিয় রয়েছে।'
                : 'কোনো অ্যাপয়েন্টমেন্ট পাওয়া যায়নি।'}
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE VIEW (Shown on Large screens: hidden lg:block) */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-emerald-50/70 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 font-bold border-b border-emerald-900/10 dark:border-emerald-800/40">
                    <tr>
                      <th className="py-3 px-3.5">সিরিয়াল নং</th>
                      <th className="py-3 px-3.5">রোগীর নাম ও যোগাযোগ</th>
                      <th className="py-3 px-3.5">চেম্বার</th>
                      <th className="py-3 px-3.5">তারিখ ও সময় স্লট</th>
                      <th className="py-3 px-3.5">সমস্যার বিবরণ</th>
                      <th className="py-3 px-3.5">স্ট্যাটাস</th>
                      <th className="py-3 px-3.5 text-right">অ্যাকশন ও যোগাযোগ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-900/5 dark:divide-emerald-800/30">
                    {paginatedAppointments.map((apt) => (
                      <tr
                        key={apt.id}
                        className={`transition-colors ${
                          apt.status === 'cancelled'
                            ? 'bg-rose-50/30 dark:bg-rose-950/15 hover:bg-rose-50/60 dark:hover:bg-rose-950/30'
                            : 'hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30'
                        }`}
                      >
                        {/* Serial */}
                        <td className="py-3.5 px-3.5 font-mono font-bold text-emerald-900 dark:text-emerald-200">
                          <div>{apt.serialNo}</div>
                          {apt.status === 'cancelled' && (
                            <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                              বাতিলকৃত
                            </span>
                          )}
                        </td>

                        {/* Patient */}
                        <td className="py-3.5 px-3.5 min-w-[180px]">
                          <div className="font-semibold text-emerald-950 dark:text-emerald-100">
                            {apt.patientName}
                          </div>
                          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">
                            {apt.phone}
                          </div>
                          {apt.email && (
                            <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 flex items-center gap-1 mt-0.5 font-sans">
                              <Mail className="w-3 h-3 shrink-0" />
                              <span className="truncate max-w-[160px]">{apt.email}</span>
                            </div>
                          )}
                        </td>

                        {/* Chamber */}
                        <td className="py-3.5 px-3.5">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                              apt.chamberMode === 'offline'
                                ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                                : 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300'
                            }`}
                          >
                            {apt.chamberTitleBn}
                          </span>
                        </td>

                        {/* Date & Slot */}
                        <td className="py-3.5 px-3.5">
                          <div className="font-medium text-emerald-950 dark:text-emerald-100">
                            {apt.dateFormattedBn}
                          </div>
                          <div className="text-xs text-amber-700 dark:text-amber-400 font-semibold font-mono">
                            {apt.slotTimeBn}
                          </div>
                          {apt.status === 'cancelled' && (
                            <div className="mt-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>স্লট খালি রয়েছে</span>
                            </div>
                          )}
                        </td>

                        {/* Complaints */}
                        <td className="py-3.5 px-3.5 max-w-xs text-xs text-emerald-800/90 dark:text-emerald-300/90">
                          <div className="truncate">{apt.complaints || '—'}</div>
                          {apt.rescheduledReason && (
                            <div className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-1 font-medium bg-indigo-50 dark:bg-indigo-950/60 p-1 rounded border border-indigo-200 dark:border-indigo-800">
                              রিশিডিউল: {apt.rescheduledReason}
                            </div>
                          )}
                          {apt.cancellationReason && (
                            <div className="text-[11px] text-rose-700 dark:text-rose-300 mt-1 font-medium bg-rose-50 dark:bg-rose-950/60 p-1 rounded border border-rose-200 dark:border-rose-900/60">
                              বাতিল: {apt.cancellationReason}
                            </div>
                          )}
                        </td>

                        {/* Status Badges & Quick Dropdown */}
                        <td className="py-3.5 px-3.5 space-y-1.5">
                          <div>
                            {apt.status === 'pending' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60">
                                <AlertTriangle className="w-3 h-3" />
                                অপেক্ষমাণ (Pending)
                              </span>
                            )}
                            {apt.status === 'confirmed' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60">
                                <CheckCircle2 className="w-3 h-3" />
                                নিশ্চিত (Confirmed)
                              </span>
                            )}
                            {apt.status === 'rescheduled' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700/60">
                                <Clock className="w-3 h-3" />
                                রিশিডিউলকৃত
                              </span>
                            )}
                            {apt.status === 'completed' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-700/60">
                                সম্পন্ন (Completed)
                              </span>
                            )}
                            {apt.status === 'cancelled' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-700/60">
                                <Ban className="w-3 h-3" />
                                বাতিল (Cancelled)
                              </span>
                            )}
                          </div>

                          {apt.status !== 'cancelled' ? (
                            <select
                              value={apt.status}
                              onChange={(e) =>
                                handleUpdateStatus(apt.id, e.target.value as AppointmentStatus)
                              }
                              className="py-1 px-2 rounded-lg text-xs font-semibold border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#14261d] text-emerald-950 dark:text-emerald-100 focus:outline-none"
                            >
                              <option value="pending">অপেক্ষমাণ (Pending)</option>
                              <option value="confirmed">নিশ্চিত করুন (Confirm & Mail)</option>
                              <option value="completed">সম্পন্ন (Completed)</option>
                              <option value="cancelled">বাতিল (Cancelled)</option>
                            </select>
                          ) : (
                            <span className="text-[11px] text-zinc-500 italic block">
                              স্লট উন্মুক্ত রয়েছে
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {apt.status === 'cancelled' ? (
                              <>
                                {/* 1. Print Slip */}
                                <button
                                  type="button"
                                  onClick={() => printSinglePageSerialSlip(apt)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 text-xs font-bold shadow-xs transition-all cursor-pointer"
                                  title="১ পৃষ্ঠার ডিজিটাল স্লিপ দেখুন বা প্রিন্ট করুন"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>স্লিপ প্রিন্ট</span>
                                </button>

                                {/* 2. Send Custom Message */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenMessageModal(apt, 'cancel')}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
                                  title="রোগীকে কাস্টমাইজড বাতিল বার্তা বা নোটিশ পাঠান"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 fill-white" />
                                  <span>মেসেজ পাঠান</span>
                                </button>

                                {/* 3. Restore Appointment */}
                                <button
                                  type="button"
                                  onClick={() => setRestoreTargetApt(apt)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                                  title="বাতিল সিরিয়ালটি পুনরায় সক্রিয় করুন (যদি স্লটটি ফাঁকা থাকে)"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>পুনরায় সক্রিয়</span>
                                </button>

                                {/* 4. Delete Permanently */}
                                <button
                                  type="button"
                                  onClick={() => setDeleteTargetApt(apt)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs font-bold shadow-xs transition-all cursor-pointer"
                                  title="ডাটাবেজ থেকে চিরতরে মুছে ফেলুন"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>মুছে ফেলুন</span>
                                </button>
                              </>
                            ) : (
                              <>
                                {/* Quick Confirm button for pending */}
                                {apt.status === 'pending' && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStatus(apt.id, 'confirmed')}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                                    title="সিরিয়াল নিশ্চিত করুন ও রোগীর ইমেইলে কনফার্মেশন পাঠান"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>কনফার্ম</span>
                                  </button>
                                )}

                                {/* 1. Reschedule Button */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenReschedule(apt)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                                  title="সিরিয়ালের তারিখ ও সময় পরিবর্তন এবং রোগীকে ইমেইল নোটিফিকেশন প্রদান"
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>রিশিডিউল</span>
                                </button>

                                {/* 2. Print Single-Page Slip */}
                                <button
                                  type="button"
                                  onClick={() => printSinglePageSerialSlip(apt)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 text-xs font-bold shadow-xs transition-all cursor-pointer"
                                  title="১ পৃষ্ঠার অফিসিয়াল ডিজিটাল স্লিপ প্রিন্ট করুন"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>স্লিপ প্রিন্ট</span>
                                </button>

                                {/* 3. Doctor Customizable Message / WhatsApp Communication */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenMessageModal(apt, 'confirm')}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
                                  title="বার্তাটি পছন্দমতো কাস্টমাইজ করে হোয়াটসঅ্যাপে বা এসএমএসে পাঠান"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 fill-white" />
                                  <span>মেসেজ পাঠান</span>
                                </button>

                                {/* 4. Cancel Appointment Button */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenCancelModal(apt)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs font-bold shadow-xs transition-all cursor-pointer"
                                  title="সিরিয়াল বাতিল করুন এবং স্লটটি তৎক্ষণাৎ নতুন রোগীর জন্য উন্মুক্ত করে দিন"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                  <span>বাতিল</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE & TABLET PATIENT CARDS VIEW (Shown on Mobile screens: block lg:hidden) */}
              <div className="block lg:hidden divide-y divide-emerald-900/10 dark:divide-emerald-800/20">
                {paginatedAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className={`p-3.5 sm:p-4 transition-colors ${
                      apt.status === 'cancelled'
                        ? 'bg-rose-50/20 dark:bg-rose-950/15'
                        : 'hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20'
                    }`}
                  >
                    {/* Card Top: Serial Badge, Chamber & Status Badge */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-black text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 bg-emerald-100/90 dark:bg-emerald-900/60 px-2.5 py-0.5 rounded-lg border border-emerald-300/40">
                          {apt.serialNo}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            apt.chamberMode === 'offline'
                              ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                              : 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300'
                          }`}
                        >
                          {apt.chamberTitleBn}
                        </span>
                        {apt.status === 'cancelled' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                            বাতিলকৃত
                          </span>
                        )}
                      </div>

                      {/* Status Badges & Quick Delete */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {apt.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            অপেক্ষমাণ
                          </span>
                        )}
                        {apt.status === 'confirmed' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            নিশ্চিত
                          </span>
                        )}
                        {apt.status === 'rescheduled' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700/60">
                            <Clock className="w-2.5 h-2.5" />
                            রিশিডিউল
                          </span>
                        )}
                        {apt.status === 'completed' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-700/60">
                            সম্পন্ন
                          </span>
                        )}
                        {apt.status === 'cancelled' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-700/60">
                            <Ban className="w-2.5 h-2.5" />
                            বাতিল
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => setDeleteTargetApt(apt)}
                          className="p-1 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-100 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
                          title="ডাটাবেজ থেকে চিরতরে মুছে ফেলুন"
                          aria-label="Delete appointment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Patient Name & Quick Dial/WhatsApp Direct Touch Buttons */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm sm:text-base text-emerald-950 dark:text-emerald-50 leading-tight">
                          {apt.patientName}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-emerald-700 dark:text-emerald-400 font-mono font-medium">
                          <a href={`tel:${apt.phone}`} className="hover:underline flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>{apt.phone}</span>
                          </a>
                        </div>
                        {apt.email && (
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[200px]">{apt.email}</span>
                          </div>
                        )}
                      </div>

                      {/* Direct One-Touch Call & WhatsApp Shortcuts */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={`tel:${apt.phone}`}
                          className="w-8 h-8 rounded-xl bg-emerald-100/90 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 flex items-center justify-center hover:bg-emerald-200 transition-colors shadow-xs active:scale-90"
                          title="সরাসরি ফোন কল করুন"
                          aria-label="Call Patient"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                        <a
                          href={`https://wa.me/${apt.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                            `নমস্কার ${apt.patientName}, ডা. দেবজ্যোতি দত্তের চেম্বার থেকে আপনার সিরিয়াল (${apt.serialNo}) সংক্রান্ত বার্তা:`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 rounded-xl bg-[#25D366] text-white flex items-center justify-center hover:bg-[#20bd5a] transition-colors shadow-xs active:scale-90"
                          title="হোয়াটসঅ্যাপে চ্যাট করুন"
                          aria-label="WhatsApp Patient"
                        >
                          <MessageCircle className="w-4 h-4 fill-white" />
                        </a>
                      </div>
                    </div>

                    {/* Date, Slot & Medical Notes Container */}
                    <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-900/5 dark:border-emerald-800/30 text-xs space-y-1 mb-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-600 dark:text-zinc-400 text-[11px]">তারিখ ও স্লট:</span>
                        <div className="text-right">
                          <span className="font-semibold text-emerald-950 dark:text-emerald-100">{apt.dateFormattedBn}</span>
                          <span className="ml-1.5 font-bold font-mono text-amber-700 dark:text-amber-400">{apt.slotTimeBn}</span>
                        </div>
                      </div>

                      {apt.complaints && (
                        <div className="pt-1 border-t border-emerald-900/5 dark:border-emerald-800/20 text-[11px] text-zinc-700 dark:text-zinc-300">
                          <span className="font-semibold text-zinc-500">সমস্যা: </span>
                          <span className="line-clamp-2">{apt.complaints}</span>
                        </div>
                      )}

                      {apt.rescheduledReason && (
                        <div className="text-[10.5px] text-indigo-700 dark:text-indigo-300 font-medium">
                          রিশিডিউল কারণ: {apt.rescheduledReason}
                        </div>
                      )}

                      {apt.cancellationReason && (
                        <div className="text-[10.5px] text-rose-700 dark:text-rose-300 font-medium">
                          বাতিলের কারণ: {apt.cancellationReason}
                        </div>
                      )}
                    </div>

                    {/* Mobile Quick Status Dropdown */}
                    {apt.status !== 'cancelled' ? (
                      <div className="flex items-center justify-between gap-2 mb-2.5 pt-1 border-t border-dashed border-emerald-900/5 dark:border-emerald-800/30">
                        <span className="text-[11px] font-semibold text-zinc-500">স্ট্যাটাস:</span>
                        <select
                          value={apt.status}
                          onChange={(e) => handleUpdateStatus(apt.id, e.target.value as AppointmentStatus)}
                          className="py-1 px-2.5 rounded-lg text-xs font-semibold border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#14261d] text-emerald-950 dark:text-emerald-100 focus:outline-none"
                        >
                          <option value="pending">অপেক্ষমাণ (Pending)</option>
                          <option value="confirmed">নিশ্চিত করুন</option>
                          <option value="completed">সম্পন্ন (Completed)</option>
                          <option value="cancelled">বাতিল (Cancelled)</option>
                        </select>
                      </div>
                    ) : (
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mb-2.5 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>স্লটটি পুনরায় বুকিংয়ের জন্য উন্মুক্ত রয়েছে</span>
                      </div>
                    )}

                    {/* THE 4 ACTION BUTTONS: 2x2 Clean Touch Grid for Mobile */}
                    <div className="space-y-1.5">
                      {apt.status === 'cancelled' ? (
                        <div className="grid grid-cols-2 gap-1.5">
                          {/* 1. Print Slip */}
                          <button
                            type="button"
                            onClick={() => printSinglePageSerialSlip(apt)}
                            className="inline-flex items-center justify-center gap-1 py-2 px-2 rounded-lg border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-bold shadow-xs active:scale-95"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>স্লিপ প্রিন্ট</span>
                          </button>

                          {/* 2. Send Custom Message */}
                          <button
                            type="button"
                            onClick={() => handleOpenMessageModal(apt, 'cancel')}
                            className="inline-flex items-center justify-center gap-1 py-2 px-2 rounded-lg bg-[#25D366] text-white text-xs font-bold shadow-xs active:scale-95"
                          >
                            <MessageCircle className="w-3.5 h-3.5 fill-white" />
                            <span>মেসেজ পাঠান</span>
                          </button>

                          {/* 3. Restore */}
                          <button
                            type="button"
                            onClick={() => setRestoreTargetApt(apt)}
                            className="inline-flex items-center justify-center gap-1 py-2 px-2 rounded-lg bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-95"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>পুনরায় সক্রিয়</span>
                          </button>

                          {/* 4. Delete */}
                          <button
                            type="button"
                            onClick={() => setDeleteTargetApt(apt)}
                            className="inline-flex items-center justify-center gap-1 py-2 px-2 rounded-lg border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold shadow-xs active:scale-95"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>মুছে ফেলুন</span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {apt.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(apt.id, 'confirmed')}
                              className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-95"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>সিরিয়াল নিশ্চিত করুন (Confirm)</span>
                            </button>
                          )}

                          <div className="grid grid-cols-2 gap-1.5">
                            {/* 1. Reschedule */}
                            <button
                              type="button"
                              onClick={() => handleOpenReschedule(apt)}
                              className="inline-flex items-center justify-center gap-1 py-2 px-2 rounded-lg bg-amber-500 text-white text-xs font-bold shadow-xs active:scale-95"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>রিশিডিউল</span>
                            </button>

                            {/* 2. Print Slip */}
                            <button
                              type="button"
                              onClick={() => printSinglePageSerialSlip(apt)}
                              className="inline-flex items-center justify-center gap-1 py-2 px-2 rounded-lg border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-bold shadow-xs active:scale-95"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>স্লিপ প্রিন্ট</span>
                            </button>

                            {/* 3. Send Message */}
                            <button
                              type="button"
                              onClick={() => handleOpenMessageModal(apt, 'confirm')}
                              className="inline-flex items-center justify-center gap-1 py-2 px-2 rounded-lg bg-[#25D366] text-white text-xs font-bold shadow-xs active:scale-95"
                            >
                              <MessageCircle className="w-3.5 h-3.5 fill-white" />
                              <span>মেসেজ পাঠান</span>
                            </button>

                            {/* 4. Cancel */}
                            <button
                              type="button"
                              onClick={() => handleOpenCancelModal(apt)}
                              className="inline-flex items-center justify-center gap-1 py-2 px-2 rounded-lg border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold shadow-xs active:scale-95"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>বাতিল</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* PAGINATION CONTROLS */}
              <div className="border-t border-emerald-900/10 dark:border-emerald-800/40 p-3.5 sm:p-4 bg-emerald-50/40 dark:bg-emerald-950/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Summary / Range indicator */}
                <div className="text-xs text-emerald-800 dark:text-emerald-300 font-medium text-center sm:text-left">
                  মোট <span className="font-bold text-emerald-950 dark:text-emerald-100">{toBengaliNumber(totalItems)}</span>টি সিরিয়ালের মধ্যে{' '}
                  <span className="font-bold text-emerald-950 dark:text-emerald-100">{toBengaliNumber(startItemNo)}</span>–
                  <span className="font-bold text-emerald-950 dark:text-emerald-100">{toBengaliNumber(endItemNo)}</span> নম্বর প্রদর্শিত হচ্ছে
                  {totalPages > 1 && (
                    <span className="ml-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                      (পৃষ্ঠা {toBengaliNumber(validCurrentPage)}/{toBengaliNumber(totalPages)})
                    </span>
                  )}
                </div>

                {/* Page Navigation Buttons */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5 flex-wrap justify-center">
                    {/* Previous Button */}
                    <button
                      type="button"
                      onClick={() => handlePageChange(validCurrentPage - 1)}
                      disabled={validCurrentPage <= 1}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        validCurrentPage <= 1
                          ? 'border-emerald-200/50 dark:border-emerald-900/40 text-emerald-400 dark:text-emerald-600 cursor-not-allowed opacity-40'
                          : 'border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 bg-white dark:bg-emerald-900/40 hover:bg-emerald-50 dark:hover:bg-emerald-800/50 active:scale-95 shadow-xs cursor-pointer'
                      }`}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>পূর্ববর্তী</span>
                    </button>

                    {/* Numbered Page Buttons */}
                    {(() => {
                      const pages: (number | string)[] = [];
                      if (totalPages <= 7) {
                        for (let i = 1; i <= totalPages; i++) pages.push(i);
                      } else {
                        if (validCurrentPage <= 4) {
                          pages.push(1, 2, 3, 4, 5, '...', totalPages);
                        } else if (validCurrentPage >= totalPages - 3) {
                          pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                        } else {
                          pages.push(1, '...', validCurrentPage - 1, validCurrentPage, validCurrentPage + 1, '...', totalPages);
                        }
                      }

                      return pages.map((p, idx) => {
                        if (p === '...') {
                          return (
                            <span
                              key={`ellipsis-${idx}`}
                              className="px-2 py-1 text-xs text-emerald-600 dark:text-emerald-400 select-none font-bold"
                            >
                              •••
                            </span>
                          );
                        }

                        const pageNum = p as number;
                        const isActive = pageNum === validCurrentPage;

                        return (
                          <button
                            key={`page-${pageNum}`}
                            type="button"
                            onClick={() => handlePageChange(pageNum)}
                            className={`min-w-[32px] h-8 px-2 rounded-xl text-xs font-bold transition-all ${
                              isActive
                                ? 'bg-gradient-to-r from-emerald-800 to-emerald-900 text-amber-300 shadow-md scale-105'
                                : 'bg-white dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100/70 dark:hover:bg-emerald-800/60 active:scale-95'
                            }`}
                          >
                            {toBengaliNumber(pageNum)}
                          </button>
                        );
                      });
                    })()}

                    {/* Next Button */}
                    <button
                      type="button"
                      onClick={() => handlePageChange(validCurrentPage + 1)}
                      disabled={validCurrentPage >= totalPages}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        validCurrentPage >= totalPages
                          ? 'border-emerald-200/50 dark:border-emerald-900/40 text-emerald-400 dark:text-emerald-600 cursor-not-allowed opacity-40'
                          : 'border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 bg-white dark:bg-emerald-900/40 hover:bg-emerald-50 dark:hover:bg-emerald-800/50 active:scale-95 shadow-xs cursor-pointer'
                      }`}
                    >
                      <span>পরবর্তী</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* RESCHEDULE APPOINTMENT MODAL */}
      {rescheduleApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-[#101e17] border border-amber-500/40 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-emerald-900/10 dark:border-emerald-800/40 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>সিরিয়াল শিডিউল পরিবর্তন ও পুনর্বণ্টন</span>
                </div>
                <h3 className="font-serif font-bold text-xl text-emerald-950 dark:text-emerald-50">
                  অ্যাপয়েন্টমেন্ট রিশিডিউল করুন
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                  নতুন তারিখ ও সময় নির্বাচন করলে রোগীর ইমেইলে স্বয়ংক্রিয়ভাবে পরিবর্তিত সময়ের নোটিফিকেশন পৌঁছে যাবে
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRescheduleApt(null)}
                className="p-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Patient Info Card */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block font-medium">রোগীর নাম ও সিরিয়াল</span>
                <span className="font-bold text-sm text-emerald-950 dark:text-emerald-100">{rescheduleApt.patientName}</span>
                <span className="ml-2 font-mono text-emerald-700 dark:text-emerald-400">({rescheduleApt.serialNo})</span>
              </div>
              <div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block font-medium">যোগাযোগ</span>
                <span className="font-mono text-emerald-900 dark:text-emerald-200">{rescheduleApt.phone}</span>
                {rescheduleApt.email && (
                  <span className="block text-[11px] text-emerald-700 dark:text-emerald-300 font-sans">{rescheduleApt.email}</span>
                )}
              </div>
              <div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block font-medium">বর্তমান নির্ধারিত সময়</span>
                <span className="font-bold text-amber-700 dark:text-amber-400">{rescheduleApt.dateFormattedBn}</span>
                <span className="block font-mono text-emerald-900 dark:text-emerald-200">{rescheduleApt.slotTimeBn}</span>
              </div>
            </div>

            {/* Step 1: Select New Date */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-emerald-950 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                ১. নতুন তারিখ নির্বাচন করুন:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1">
                {rescheduleUpcomingDates.map((day) => {
                  const isSelected = rescheduleDate === day.dateStr;
                  return (
                    <button
                      key={day.dateStr}
                      type="button"
                      onClick={() => {
                        setRescheduleDate(day.dateStr);
                        setRescheduleSlotId('');
                      }}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-800 text-white shadow-md'
                          : 'border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#14261d] hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-emerald-950 dark:text-emerald-100'
                      }`}
                    >
                      <div className="font-bold">{day.fullBn}</div>
                      <div className={`text-[11px] ${isSelected ? 'text-emerald-200' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {day.dayNameBn}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Select New 15-Minute Slot */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-emerald-950 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  ২. নতুন সময় স্লট নির্বাচন করুন:
                </label>
                {rescheduleSlotTimeBn && (
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 font-mono">
                    নির্বাচিত: {rescheduleSlotTimeBn}
                  </span>
                )}
              </div>

              {rescheduleSlots.length === 0 ? (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs">
                  এই তারিখে চেম্বার বন্ধ বা কোনো সময় স্লট উপলব্ধ নেই। অনুগ্রহ করে অন্য তারিখ নির্বাচন করুন।
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                  {rescheduleSlots.map((slot) => {
                    const isBooked = rescheduleBookedSlots.includes(slot.id);
                    const isSelected = rescheduleSlotId === slot.id;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={isBooked}
                        onClick={() => {
                          setRescheduleSlotId(slot.id);
                          setRescheduleSlotTimeBn(slot.timeBn);
                          setRescheduleSlotTimeEn(slot.timeEn);
                        }}
                        className={`p-2 rounded-xl border text-xs font-mono font-medium transition-all ${
                          isBooked
                            ? 'opacity-40 bg-gray-100 dark:bg-gray-800/40 border-gray-300 cursor-not-allowed text-gray-500 line-through'
                            : isSelected
                            ? 'bg-amber-500 text-white border-amber-600 shadow-md font-bold'
                            : 'bg-white dark:bg-[#14261d] border-emerald-200 dark:border-emerald-800 hover:border-emerald-500 text-emerald-950 dark:text-emerald-100'
                        }`}
                      >
                        <div>{slot.shortBn || slot.timeBn}</div>
                        <div className="text-[10px] opacity-80 font-sans">{slot.shortEn}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 3: Reschedule Reason */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-emerald-950 dark:text-emerald-200 uppercase tracking-wider">
                ৩. সময় পরিবর্তনের কারণ (রোগীর ইমেইলে উল্লেখ থাকবে):
              </label>
              <input
                type="text"
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                placeholder="যেমন: সার্জারির কারণে সময় সমন্বয় অথবা ডাক্তারের পরামর্শ"
                className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#14261d] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Feedback alert */}
            {rescheduleFeedback && (
              <div
                className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  rescheduleFeedback.type === 'success'
                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-300'
                    : 'bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-200 border border-red-300'
                }`}
              >
                {rescheduleFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{rescheduleFeedback.msg}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-emerald-900/10 dark:border-emerald-800/40">
              <button
                type="button"
                onClick={() => setRescheduleApt(null)}
                className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                বাতিল করুন
              </button>
              <button
                type="button"
                onClick={handleConfirmReschedule}
                disabled={rescheduleLoading || !rescheduleSlotId}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all"
              >
                {rescheduleLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>আপডেট ও ইমেইল পাঠানো হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>রিশিডিউল নিশ্চিত ও ইমেইল পাঠান</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPREHENSIVE SCHEDULE & DAY-SPECIFIC / DATE-SPECIFIC SETTINGS MODAL */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-5xl rounded-3xl bg-white dark:bg-[#101e17] border border-emerald-500/30 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto overflow-x-hidden">
            <div className="flex justify-between items-center border-b border-emerald-900/10 dark:border-emerald-800/40 pb-4">
              <div>
                <h3 className="font-serif font-bold text-xl text-emerald-950 dark:text-emerald-50 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-amber-500" />
                  চেম্বার শিডিউলার — সার্বজনীন ও ডে-স্পেসিফিক ইঞ্জিন
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  সার্বজনীন সময়ের পাশাপাশি প্রতিটি বারের জন্য আলাদা সময়সূচী বা নির্দিষ্ট তারিখের বিশেষ শিডিউল কনফিগার করুন
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="p-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chamber Tab Switch */}
            <div className="flex rounded-2xl bg-emerald-100/70 dark:bg-emerald-950 p-1.5 gap-2">
              <button
                type="button"
                onClick={() => setScheduleActiveChamber('offline')}
                className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  scheduleActiveChamber === 'offline'
                    ? 'bg-emerald-800 text-white shadow-md'
                    : 'text-emerald-900 dark:text-emerald-200 hover:bg-emerald-200/50'
                }`}
              >
                <MapPin className="w-4 h-4 text-amber-300" />
                <span>ঢাকা চেম্বার (সরাসরি)</span>
              </button>
              <button
                type="button"
                onClick={() => setScheduleActiveChamber('online')}
                className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  scheduleActiveChamber === 'online'
                    ? 'bg-emerald-800 text-white shadow-md'
                    : 'text-emerald-900 dark:text-emerald-200 hover:bg-emerald-200/50'
                }`}
              >
                <Video className="w-4 h-4 text-amber-300" />
                <span>অনলাইন ভিডিও কনসালটেশন</span>
              </button>
            </div>

            {/* TIMING TYPE SELECTOR (General vs Day-Specific) */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-amber-50/50 dark:from-emerald-950/50 dark:to-emerald-900/30 border border-emerald-200 dark:border-emerald-800/60 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-100 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    সময়সূচীর ধরন নির্ধারণ করুন
                  </h4>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    {currentChamber.timingType === 'day_specific'
                      ? 'দিনভিত্তিক মোড সক্রিয়: সপ্তাহের প্রতিটি বারের জন্য আলাদা শুরুর সময়, সমাপ্তি ও বিরতি প্রযোজ্য।'
                      : 'সার্বজনীন মোড সক্রিয়: সপ্তাহের সকল সক্রিয় দিনের জন্য একই সময় প্রযোজ্য।'}
                  </p>
                </div>

                <div className="flex rounded-xl bg-white dark:bg-[#101e17] p-1 border border-emerald-300 dark:border-emerald-700 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleUpdateTimingType('general')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      currentChamber.timingType === 'general'
                        ? 'bg-emerald-800 text-white shadow'
                        : 'text-emerald-900 dark:text-emerald-200'
                    }`}
                  >
                    সার্বজনীন সময়সূচী
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateTimingType('day_specific')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      currentChamber.timingType === 'day_specific'
                        ? 'bg-emerald-800 text-white shadow'
                        : 'text-emerald-900 dark:text-emerald-200'
                    }`}
                  >
                    ডে-স্পেসিফিক শিডিউল
                  </button>
                </div>
              </div>
            </div>

            {/* VIEW A: UNIVERSAL GENERAL TIMING */}
            {currentChamber.timingType === 'general' ? (
              <div className="space-y-5">
                <div className="p-5 rounded-2xl bg-white dark:bg-[#101e17] border border-emerald-900/10 dark:border-emerald-700/30 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-100 uppercase tracking-wider">
                      সার্বজনীন চেম্বার সময়সূচী (সকল সক্রিয় বারের জন্য)
                    </h4>
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-0.5 rounded-full">
                      স্লট সংখ্যা:{' '}
                      {toBengaliNumber(
                        calcSlotCount(
                          currentChamber.generalTiming.startTime,
                          currentChamber.generalTiming.endTime,
                          currentChamber.generalTiming.breakStart,
                          currentChamber.generalTiming.breakDuration,
                          currentChamber.generalTiming.slotDuration
                        )
                      )}
                      টি
                    </span>
                  </div>

                  <div className="space-y-4 text-xs">
                    {/* Time Inputs: 3 Columns with generous space */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <TimePicker12h
                        label="শুরুর সময়"
                        value={currentChamber.generalTiming.startTime}
                        onChange={(val) => handleUpdateGeneralTiming('startTime', val)}
                      />
                      <TimePicker12h
                        label="সমাপ্তির সময়"
                        value={currentChamber.generalTiming.endTime}
                        onChange={(val) => handleUpdateGeneralTiming('endTime', val)}
                      />
                      <TimePicker12h
                        label="বিরতির শুরু"
                        value={currentChamber.generalTiming.breakStart}
                        onChange={(val) => handleUpdateGeneralTiming('breakStart', val)}
                      />
                    </div>

                    {/* Duration Inputs: 2 Columns */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-3 border-t border-emerald-900/10 dark:border-emerald-800/30">
                      <div>
                        <label className="block text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
                          বিরতির সময়কাল (মিনিট)
                        </label>
                        <div className="p-1 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#101e17] shadow-sm">
                          <input
                            type="number"
                            min="0"
                            step="5"
                            value={currentChamber.generalTiming.breakDuration}
                            onChange={(e) =>
                              handleUpdateGeneralTiming('breakDuration', Number(e.target.value))
                            }
                            className="w-full py-1.5 px-3 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/80 font-mono text-xs text-emerald-950 dark:text-emerald-100 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                            প্রতি রোগীর স্লট সময়কাল
                          </label>
                          <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            {toBengaliNumber(currentChamber.generalTiming.slotDuration || 15)} মিনিট
                          </span>
                        </div>
                        <div className="p-1 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#101e17] shadow-sm flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const cur = Number(currentChamber.generalTiming.slotDuration) || 15;
                              handleUpdateGeneralTiming('slotDuration', Math.max(5, cur - 5));
                            }}
                            className="w-7 h-7 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/60 dark:hover:bg-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center justify-center font-bold text-xs transition-colors shrink-0 cursor-pointer"
                            title="৫ মিনিট কমান"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="number"
                            min="5"
                            max="120"
                            step="5"
                            value={currentChamber.generalTiming.slotDuration ?? 15}
                            onChange={(e) => {
                              const v = e.target.value === '' ? '' : Math.max(1, Math.min(180, parseInt(e.target.value) || 15));
                              handleUpdateGeneralTiming('slotDuration', v);
                            }}
                            onBlur={(e) => {
                              if (!e.target.value || Number(e.target.value) < 5) {
                                handleUpdateGeneralTiming('slotDuration', 15);
                              }
                            }}
                            className="w-full py-1 px-2 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/80 font-mono text-xs text-center text-emerald-950 dark:text-emerald-100 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const cur = Number(currentChamber.generalTiming.slotDuration) || 15;
                              handleUpdateGeneralTiming('slotDuration', Math.min(120, cur + 5));
                            }}
                            className="w-7 h-7 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/60 dark:hover:bg-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center justify-center font-bold text-xs transition-colors shrink-0 cursor-pointer"
                            title="৫ মিনিট বাড়ান"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {/* Quick preset chips */}
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          {[10, 15, 20, 30].map((mins) => {
                            const isSelected = (currentChamber.generalTiming.slotDuration || 15) === mins;
                            return (
                              <button
                                key={mins}
                                type="button"
                                onClick={() => handleUpdateGeneralTiming('slotDuration', mins)}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-emerald-800 text-amber-300 shadow-xs'
                                    : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60'
                                }`}
                              >
                                {toBengaliNumber(mins)} মি.
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Day Toggles */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">
                    সপ্তাহের কোন কোন দিন চেম্বার খোলা থাকবে (সক্রিয় / বন্ধ করুন)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
                      const dayObj = currentChamber.daySchedules[dayIdx];
                      if (!dayObj) return null;
                      const isEnabled = dayObj.enabled;
                      return (
                        <button
                          key={dayIdx}
                          type="button"
                          onClick={() => handleToggleDay(dayIdx)}
                          className={`p-3.5 rounded-2xl border text-center transition-all flex items-center justify-between gap-2 ${
                            isEnabled
                              ? 'border-emerald-600 bg-emerald-800 text-white shadow'
                              : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 text-zinc-400'
                          }`}
                        >
                          <span className="text-xs font-bold">{dayObj.dayNameBn}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              isEnabled ? 'bg-amber-400 text-emerald-950' : 'bg-zinc-200 dark:bg-zinc-800'
                            }`}
                          >
                            {isEnabled ? 'সক্রিয়' : 'বন্ধ'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* VIEW B: DAY-SPECIFIC TIMINGS (SEPARATE HOURS FOR EACH DAY OF WEEK) */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-100 uppercase tracking-wider">
                    সপ্তাহের ৭ দিনের পৃথক পৃথক সময়সূচী ও স্লট কনফিগারেশন
                  </h4>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                    নির্দিষ্ট বারের জন্য ভিন্ন শুরুর সময় বা বিরতি দিন
                  </span>
                </div>

                <div className="space-y-3">
                  {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
                    const dayObj = currentChamber.daySchedules[dayIdx] || {
                      enabled: false,
                      dayNameBn: '',
                      startTime: '16:00',
                      endTime: '21:00',
                      breakStart: '18:30',
                      breakDuration: 30,
                      slotDuration: 15
                    };
                    const isEnabled = dayObj.enabled;
                    const daySlotCount = isEnabled
                      ? calcSlotCount(
                          dayObj.startTime,
                          dayObj.endTime,
                          dayObj.breakStart,
                          dayObj.breakDuration,
                          dayObj.slotDuration
                        )
                      : 0;

                    return (
                      <div
                        key={dayIdx}
                        className={`p-4 rounded-2xl border transition-all space-y-3 ${
                          isEnabled
                            ? 'border-emerald-300 dark:border-emerald-700 bg-white dark:bg-[#101e17] shadow-sm'
                            : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/20 opacity-70'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-serif font-bold text-sm text-emerald-950 dark:text-emerald-100">
                              {dayObj.dayNameBn}
                            </span>
                            {isEnabled && (
                              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                                মোট {toBengaliNumber(daySlotCount)}টি স্লট
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleDay(dayIdx)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                              isEnabled
                                ? 'bg-emerald-800 text-white'
                                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                            }`}
                          >
                            {isEnabled ? 'সক্রিয় (খোলা)' : 'বন্ধ (Closed)'}
                          </button>
                        </div>

                        {isEnabled && (
                          <div className="space-y-3 pt-3 border-t border-emerald-900/10 dark:border-emerald-800/40 text-xs">
                            {/* Times: 3 Columns */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <TimePicker12h
                                label="শুরুর সময়"
                                value={dayObj.startTime || '16:00'}
                                onChange={(val) => handleUpdateDayTiming(dayIdx, 'startTime', val)}
                              />
                              <TimePicker12h
                                label="সমাপ্তির সময়"
                                value={dayObj.endTime || '21:00'}
                                onChange={(val) => handleUpdateDayTiming(dayIdx, 'endTime', val)}
                              />
                              <TimePicker12h
                                label="বিরতির শুরু"
                                value={dayObj.breakStart || '18:30'}
                                onChange={(val) => handleUpdateDayTiming(dayIdx, 'breakStart', val)}
                              />
                            </div>

                            {/* Durations: 2 Columns */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-emerald-900/10 dark:border-emerald-800/20 max-w-lg">
                              <div>
                                <label className="block text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
                                  বিরতির সময় (মিনিট)
                                </label>
                                <div className="p-1 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#101e17] shadow-sm">
                                  <input
                                    type="number"
                                    min="0"
                                    step="5"
                                    value={dayObj.breakDuration ?? 30}
                                    onChange={(e) =>
                                      handleUpdateDayTiming(
                                        dayIdx,
                                        'breakDuration',
                                        Number(e.target.value)
                                      )
                                    }
                                    className="w-full py-1.5 px-3 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/80 font-mono text-xs text-emerald-950 dark:text-emerald-100 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                  />
                                </div>
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                                    প্রতি স্লটের সময়
                                  </label>
                                  <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                    {toBengaliNumber(dayObj.slotDuration ?? 15)} মিনিট
                                  </span>
                                </div>
                                <div className="p-1 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#101e17] shadow-sm flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const cur = Number(dayObj.slotDuration) || 15;
                                      handleUpdateDayTiming(dayIdx, 'slotDuration', Math.max(5, cur - 5));
                                    }}
                                    className="w-7 h-7 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/60 dark:hover:bg-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center justify-center font-bold text-xs transition-colors shrink-0 cursor-pointer"
                                    title="৫ মিনিট কমান"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <input
                                    type="number"
                                    min="5"
                                    max="120"
                                    step="5"
                                    value={dayObj.slotDuration ?? 15}
                                    onChange={(e) => {
                                      const v = e.target.value === '' ? '' : Math.max(1, Math.min(180, parseInt(e.target.value) || 15));
                                      handleUpdateDayTiming(dayIdx, 'slotDuration', v);
                                    }}
                                    onBlur={(e) => {
                                      if (!e.target.value || Number(e.target.value) < 5) {
                                        handleUpdateDayTiming(dayIdx, 'slotDuration', 15);
                                      }
                                    }}
                                    className="w-full py-1 px-2 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/80 font-mono text-xs text-center text-emerald-950 dark:text-emerald-100 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const cur = Number(dayObj.slotDuration) || 15;
                                      handleUpdateDayTiming(dayIdx, 'slotDuration', Math.min(120, cur + 5));
                                    }}
                                    className="w-7 h-7 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/60 dark:hover:bg-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center justify-center font-bold text-xs transition-colors shrink-0 cursor-pointer"
                                    title="৫ মিনিট বাড়ান"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                  {[10, 15, 20, 30].map((mins) => (
                                    <button
                                      key={mins}
                                      type="button"
                                      onClick={() => handleUpdateDayTiming(dayIdx, 'slotDuration', mins)}
                                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                                        (dayObj.slotDuration ?? 15) === mins
                                          ? 'bg-emerald-800 text-amber-300 shadow-xs'
                                          : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60'
                                      }`}
                                    >
                                      {toBengaliNumber(mins)} মি.
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SECTION: DATE-SPECIFIC SPECIAL SCHEDULES (ONE-OFF DATES / OVERRIDES) */}
            <div className="p-5 rounded-2xl bg-amber-50/60 dark:bg-[#13221b] border border-amber-300/60 dark:border-amber-800/40 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 dark:border-amber-900/40 pb-3">
                <div>
                  <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                    <CalendarCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    নির্দিষ্ট কোনো বিশেষ তারিখের আলাদা শিডিউল যোগ করুন
                  </h4>
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                    কোনো বিশেষ তারিখে (যেমন: ছুটির দিনে অতিরিক্ত চেম্বার বা জরুরি বন্ধ) আলাদা স্লট ও সময় নির্ধারণের সুবিধা
                  </p>
                </div>
              </div>

              {/* Add Date Override Form */}
              <div className="p-4 rounded-xl bg-white/80 dark:bg-[#0e1a14]/80 border border-amber-200 dark:border-amber-900/40 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-900 dark:text-emerald-200 mb-1">
                      বিশেষ তারিখ নির্বাচন করুন <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={overrideDate}
                      onChange={(e) => setOverrideDate(e.target.value)}
                      className="w-full p-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#101e17] text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-900 dark:text-emerald-200 mb-1">
                      বিবরণ / শিরোনাম (ঐচ্ছিক)
                    </label>
                    <input
                      type="text"
                      placeholder="যেমন: বিশেষ সান্ধ্যকালীন চেম্বার"
                      value={overrideLabel}
                      onChange={(e) => setOverrideLabel(e.target.value)}
                      className="w-full p-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#101e17] text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-900 dark:text-emerald-200 mb-1">
                      অবস্থা (Status)
                    </label>
                    <select
                      value={overrideEnabled ? 'open' : 'closed'}
                      onChange={(e) => setOverrideEnabled(e.target.value === 'open')}
                      className="w-full p-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#101e17] text-xs font-semibold"
                    >
                      <option value="open">সক্রিয় চেম্বার (Open for Booking)</option>
                      <option value="closed">ছুটি / বন্ধ (Closed)</option>
                    </select>
                  </div>
                </div>

                {overrideEnabled && (
                  <div className="space-y-3 pt-3 border-t border-amber-100 dark:border-amber-900/30 text-xs">
                    {/* Times: 3 Columns */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <TimePicker12h
                        label="শুরুর সময়"
                        value={overrideStart}
                        onChange={(val) => setOverrideStart(val)}
                      />
                      <TimePicker12h
                        label="সমাপ্তির সময়"
                        value={overrideEnd}
                        onChange={(val) => setOverrideEnd(val)}
                      />
                      <TimePicker12h
                        label="বিরতির শুরু"
                        value={overrideBreakStart}
                        onChange={(val) => setOverrideBreakStart(val)}
                      />
                    </div>

                    {/* Durations: 2 Columns */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-amber-200/50 dark:border-amber-900/30 max-w-lg">
                      <div>
                        <label className="block text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
                          বিরতির সময় (মিনিট)
                        </label>
                        <div className="p-1 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#101e17] shadow-sm">
                          <input
                            type="number"
                            min="0"
                            step="5"
                            value={overrideBreakDuration}
                            onChange={(e) => setOverrideBreakDuration(Number(e.target.value))}
                            className="w-full py-1.5 px-3 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/80 font-mono text-xs text-emerald-950 dark:text-emerald-100 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                            প্রতি স্লটের সময়
                          </label>
                          <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            {toBengaliNumber(overrideSlotDuration || 15)} মিনিট
                          </span>
                        </div>
                        <div className="p-1 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#101e17] shadow-sm flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const cur = Number(overrideSlotDuration) || 15;
                              setOverrideSlotDuration(Math.max(5, cur - 5));
                            }}
                            className="w-7 h-7 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/60 dark:hover:bg-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center justify-center font-bold text-xs transition-colors shrink-0 cursor-pointer"
                            title="৫ মিনিট কমান"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="number"
                            min="5"
                            max="120"
                            step="5"
                            value={overrideSlotDuration}
                            onChange={(e) => {
                              const v = e.target.value === '' ? 15 : Math.max(1, Math.min(180, parseInt(e.target.value) || 15));
                              setOverrideSlotDuration(v);
                            }}
                            onBlur={(e) => {
                              if (!e.target.value || Number(e.target.value) < 5) {
                                setOverrideSlotDuration(15);
                              }
                            }}
                            className="w-full py-1 px-2 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/80 font-mono text-xs text-center text-emerald-950 dark:text-emerald-100 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const cur = Number(overrideSlotDuration) || 15;
                              setOverrideSlotDuration(Math.min(120, cur + 5));
                            }}
                            className="w-7 h-7 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/60 dark:hover:bg-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center justify-center font-bold text-xs transition-colors shrink-0 cursor-pointer"
                            title="৫ মিনিট বাড়ান"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          {[10, 15, 20, 30].map((mins) => (
                            <button
                              key={mins}
                              type="button"
                              onClick={() => setOverrideSlotDuration(mins)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                                (overrideSlotDuration || 15) === mins
                                  ? 'bg-emerald-800 text-amber-300 shadow-xs'
                                  : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60'
                              }`}
                            >
                              {toBengaliNumber(mins)} মি.
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleAddDateOverride}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>বিশেষ তারিখ সংরক্ষণ করুন</span>
                  </button>
                </div>
              </div>

              {/* Existing Date Overrides List */}
              {currentChamber.dateOverrides &&
                Object.keys(currentChamber.dateOverrides).length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200 block">
                      সক্রিয় বিশেষ তারিখসমূহ ({toBengaliNumber(Object.keys(currentChamber.dateOverrides).length)}টি):
                    </span>
                    <div className="divide-y divide-amber-200 dark:divide-amber-900/40 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-white dark:bg-[#0e1a14] overflow-hidden text-xs">
                      {Object.entries(currentChamber.dateOverrides).map(([dStr, cfg]) => {
                        const slots = cfg.enabled
                          ? calcSlotCount(
                              cfg.startTime,
                              cfg.endTime,
                              cfg.breakStart,
                              cfg.breakDuration,
                              cfg.slotDuration
                            )
                          : 0;
                        return (
                          <div
                            key={dStr}
                            className="p-3 flex flex-wrap items-center justify-between gap-3"
                          >
                            <div>
                              <div className="font-bold text-emerald-950 dark:text-emerald-100 flex items-center gap-2">
                                <span className="font-mono">{dStr}</span>
                                {cfg.dayNameBn && <span>({cfg.dayNameBn})</span>}
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    cfg.enabled
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                                      : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                  }`}
                                >
                                  {cfg.enabled ? `খোলা (${toBengaliNumber(slots)}টি স্লট)` : 'বন্ধ'}
                                </span>
                              </div>
                                {cfg.enabled && (
                                  <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">
                                    সময়: {time24ToComponents(cfg.startTime).timeBn} ({time24ToComponents(cfg.startTime).timeEn}) - {time24ToComponents(cfg.endTime).timeBn} ({time24ToComponents(cfg.endTime).timeEn}) | বিরতি:{' '}
                                    {cfg.breakStart ? `${time24ToComponents(cfg.breakStart).timeEn} (${toBengaliNumber(cfg.breakDuration)} মি.)` : 'নেই'} | স্লট:{' '}
                                    {toBengaliNumber(cfg.slotDuration)} মি.
                                  </div>
                                )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveDateOverride(dStr)}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                              title="এই তারিখের বিশেষ শিডিউল মুছে ফেলুন"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
            </div>

            {scheduleSaveMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-100 text-xs text-center font-bold animate-fade-in">
                {scheduleSaveMsg}
              </div>
            )}

            {/* Save Buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-emerald-900/10 dark:border-emerald-800/40">
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                পরিবর্তনগুলো রোগীর বুকিং ইঞ্জিনে তাৎক্ষণিকভাবে কার্যকর হবে।
              </span>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  বন্ধ করুন
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleSaveSchedule}
                  className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2"
                >
                  {isPending ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>সংরক্ষণ হচ্ছে...</span>
                    </>
                  ) : (
                    <span>শিডিউল সংরক্ষণ করুন</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE ADMIN PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#101e17] border border-amber-500/40 shadow-2xl p-6 sm:p-7 space-y-5 animate-scale-up max-h-[92vh] overflow-y-auto my-auto">
            {/* Close Button */}
            <button
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 mx-auto flex items-center justify-center shadow-inner">
                <KeyRound className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="font-serif text-xl font-bold text-emerald-950 dark:text-emerald-50">
                ডাক্তার পোর্টালের পাসওয়ার্ড পরিবর্তন
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                নিরাপত্তার স্বার্থে বর্তমান পাসওয়ার্ড যাচাই করে নতুন পাসওয়ার্ড নির্ধারণ করুন
              </p>
            </div>

            {/* Feedback alert */}
            {passwordFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  passwordFeedback.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'
                    : 'bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                }`}
              >
                {passwordFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{passwordFeedback.msg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              {/* Current Password */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                  বর্তমান পাসওয়ার্ড <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassCurrent ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="বর্তমান পাসওয়ার্ড দিন"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/30 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassCurrent(!showPassCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    {showPassCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                  নতুন পাসওয়ার্ড <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassNew ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="কমপক্ষে ৬ অক্ষরের নতুন পাসওয়ার্ড"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/30 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassNew(!showPassNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    {showPassNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                  নতুন পাসওয়ার্ড নিশ্চিত করুন <span className="text-red-500">*</span>
                </label>
                <input
                  type={showPassNew ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="পুনরায় নতুন পাসওয়ার্ড দিন"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/30 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
                >
                  {passwordLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>সংরক্ষণ হচ্ছে...</span>
                    </>
                  ) : (
                    <span>পাসওয়ার্ড সংরক্ষণ করুন</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMIZABLE MESSAGE / NOTIFICATION MODAL */}
      {messageModalApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-[#101e17] border border-emerald-500/40 shadow-2xl p-6 sm:p-8 space-y-5 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-emerald-900/10 dark:border-emerald-800/40 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 mb-1">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>রোগীর বার্তা কাস্টমাইজেশন ও যোগাযোগ</span>
                </div>
                <h3 className="font-serif font-bold text-xl text-emerald-950 dark:text-emerald-50">
                  রোগীকে কাস্টমাইজড মেসেজ পাঠান
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                  নিচের বার্তাটি আপনার প্রয়োজনমতো সম্পাদনা করে সরাসরি রোগীর হোয়াটসঅ্যাপে বা এসএমএসে পাঠান
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMessageModalApt(null)}
                className="p-2 rounded-full hover:bg-emerald-100/50 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Patient Snapshot */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-emerald-600 dark:text-emerald-400 block font-semibold text-[11px]">রোগীর নাম ও নম্বর</span>
                <span className="font-bold text-emerald-950 dark:text-emerald-100 text-sm">{messageModalApt.patientName}</span>
                <span className="ml-2 font-mono text-emerald-700 dark:text-emerald-300">({messageModalApt.phone})</span>
              </div>
              <div>
                <span className="text-emerald-600 dark:text-emerald-400 block font-semibold text-[11px]">সিরিয়াল ও চেম্বার</span>
                <span className="font-mono font-bold text-emerald-950 dark:text-emerald-100">{messageModalApt.serialNo}</span>
                <span className="ml-1 text-emerald-700 dark:text-emerald-300">• {messageModalApt.chamberTitleBn}</span>
              </div>
              <div>
                <span className="text-emerald-600 dark:text-emerald-400 block font-semibold text-[11px]">তারিখ ও স্লট</span>
                <span className="font-semibold text-emerald-950 dark:text-emerald-100">{messageModalApt.dateFormattedBn}</span>
                <span className="ml-1 text-amber-700 dark:text-amber-400 font-mono">({messageModalApt.slotTimeBn})</span>
              </div>
            </div>

            {/* Template Chips */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-emerald-950 dark:text-emerald-200">
                এক ক্লিকে প্রিমেড টেমপ্লেট নির্বাচন করুন:
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMessageTemplateType('confirm');
                    setCustomMessage(buildDefaultMessage(messageModalApt, 'confirm'));
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    messageTemplateType === 'confirm'
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-200/70 dark:hover:bg-emerald-900/60'
                  }`}
                >
                  📋 সিরিয়াল নিশ্চিতকরণ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMessageTemplateType('reminder');
                    setCustomMessage(buildDefaultMessage(messageModalApt, 'reminder'));
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    messageTemplateType === 'reminder'
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-200/70 dark:hover:bg-emerald-900/60'
                  }`}
                >
                  ⏰ সময়সূচী রিমাইন্ডার
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMessageTemplateType('reports');
                    setCustomMessage(buildDefaultMessage(messageModalApt, 'reports'));
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    messageTemplateType === 'reports'
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-200/70 dark:hover:bg-emerald-900/60'
                  }`}
                >
                  🧪 পূর্বের রিপোর্ট পাঠানোর নির্দেশ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMessageTemplateType('cancel');
                    setCustomMessage(buildDefaultMessage(messageModalApt, 'cancel'));
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    messageTemplateType === 'cancel'
                      ? 'bg-rose-700 text-white shadow-sm'
                      : 'bg-rose-100/70 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 hover:bg-rose-200/70 dark:hover:bg-rose-900/60'
                  }`}
                >
                  🚫 সিরিয়াল বাতিল বিজ্ঞপ্তি
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMessageTemplateType('reschedule');
                    setCustomMessage(buildDefaultMessage(messageModalApt, 'reschedule'));
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    messageTemplateType === 'reschedule'
                      ? 'bg-indigo-700 text-white shadow-sm'
                      : 'bg-indigo-100/70 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 hover:bg-indigo-200/70 dark:hover:bg-indigo-900/60'
                  }`}
                >
                  🔄 রিশিডিউল বিজ্ঞপ্তি
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMessageTemplateType('custom');
                    setCustomMessage(buildDefaultMessage(messageModalApt, 'custom'));
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    messageTemplateType === 'custom'
                      ? 'bg-zinc-700 text-white shadow-sm'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  ✍️ কাস্টম বার্তা
                </button>
              </div>
            </div>

            {/* Editable Text Area */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold text-emerald-950 dark:text-emerald-200">
                  বার্তাটি সম্পাদন করুন (Edit Text):
                </label>
                <span className="text-zinc-500 font-mono text-[11px]">
                  {customMessage.length} অক্ষর
                </span>
              </div>
              <textarea
                rows={7}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="এখানে আপনার বার্তা লিখুন বা সম্পাদনা করুন..."
                className="w-full p-3.5 rounded-2xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-[#14261d] text-emerald-950 dark:text-emerald-50 text-xs sm:text-sm font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-emerald-900/10 dark:border-emerald-800/40">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold transition-all cursor-pointer"
                >
                  {copiedToast ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedToast ? 'কপি হয়েছে!' : 'কপি করুন'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleSendCustomSms}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 text-xs font-bold transition-all cursor-pointer"
                  title="মোবাইল বা কম্পিউটারের ডিফল্ট এসএমএস অ্যাপে বার্তা খুলুন"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>এসএমএস অ্যাপে খুলুন</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMessageModalApt(null)}
                  className="py-2 px-4 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  বন্ধ করুন
                </button>
                <button
                  type="button"
                  onClick={handleSendCustomWhatsApp}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>হোয়াটসঅ্যাপে পাঠান</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* APPOINTMENT CANCELLATION MODAL */}
      {cancelApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#101e17] border border-rose-500/40 shadow-2xl p-6 sm:p-8 space-y-5 max-h-[92vh] overflow-y-auto my-auto">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-rose-900/10 dark:border-rose-800/40 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 mb-1">
                  <Ban className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span>সিরিয়াল বাতিলকরণ ও স্লট অবমুক্তকরণ</span>
                </div>
                <h3 className="font-serif font-bold text-xl text-emerald-950 dark:text-emerald-50">
                  সিরিয়ালটি বাতিল করতে চান?
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCancelApt(null)}
                className="p-2 rounded-full hover:bg-rose-100/50 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Patient Snapshot */}
            <div className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-zinc-500">রোগীর নাম:</span>
                <span className="font-bold text-emerald-950 dark:text-emerald-100">{cancelApt.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">সিরিয়াল নং:</span>
                <span className="font-mono font-bold text-emerald-950 dark:text-emerald-100">{cancelApt.serialNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">তারিখ ও স্লট:</span>
                <span className="font-semibold text-emerald-950 dark:text-emerald-100">{cancelApt.dateFormattedBn} • {cancelApt.slotTimeBn}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">মোবাইল নম্বর:</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-300">{cancelApt.phone}</span>
              </div>
            </div>

            {/* Slot Release Guarantee Callout */}
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700/60 text-emerald-900 dark:text-emerald-200 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>স্লটটি তাৎক্ষণিকভাবে খালি হয়ে যাবে</span>
              </div>
              <p className="leading-relaxed">
                এই সিরিয়ালটি বাতিল করার সাথে সাথেই <strong>{cancelApt.slotTimeBn}</strong> স্লটটি উন্মুক্ত হয়ে যাবে এবং অন্য যে কোনো রোগী তৎক্ষণাৎ ওয়েবসাইট থেকে এই স্লটটি বুকিং করতে পারবেন।
              </p>
            </div>

            {/* Reason Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-emerald-950 dark:text-emerald-200">
                বাতিলের কারণ নির্বাচন করুন:
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-white dark:bg-[#14261d] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="রোগীর পক্ষ থেকে বাতিল করতে অনুরোধ করা হয়েছে">রোগীর পক্ষ থেকে বাতিল করতে অনুরোধ করা হয়েছে</option>
                <option value="রোগীর সাথে ফোনে যোগাযোগ করা সম্ভব হয়নি">রোগীর সাথে ফোনে যোগাযোগ করা সম্ভব হয়নি</option>
                <option value="জরুরি ডাক্তারের চেম্বার ছুটি / বিশেষ কারণ">জরুরি ডাক্তারের চেম্বার ছুটি / বিশেষ কারণ</option>
                <option value="ভুল তথ্য বা ডুপ্লিকেট বুকিং">ভুল তথ্য বা ডুপ্লিকেট বুকিং</option>
                <option value="অন্যান্য">অন্যান্য কারণ...</option>
              </select>

              {cancelReason === 'অন্যান্য' && (
                <input
                  type="text"
                  value={cancelCustomReason}
                  onChange={(e) => setCancelCustomReason(e.target.value)}
                  placeholder="নির্দিষ্ট কারণ লিখুন..."
                  className="w-full p-2.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-white dark:bg-[#14261d] text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 mt-2"
                />
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setCancelApt(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                বাতিল নয়
              </button>
              <button
                type="button"
                disabled={cancelLoading}
                onClick={handleConfirmCancel}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
              >
                {cancelLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>বাতিল হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Ban className="w-3.5 h-3.5" />
                    <span>হ্যাঁ, সিরিয়াল বাতিল করুন</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECEPTIONIST PRINT SHEET MODAL */}
      {showPrintModal && (() => {
        // Exclude cancelled appointments so reception sheet is always live and clean
        const receptionAppointments = appointments.filter((apt) => apt.status !== 'cancelled');

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in overflow-y-auto">
            <div className="relative w-full max-w-5xl rounded-2xl sm:rounded-3xl bg-white text-zinc-900 p-4 sm:p-8 space-y-4 sm:space-y-6 max-h-[92vh] overflow-y-auto shadow-2xl border border-emerald-900/20">
              {/* Header with Title and Corner Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 border-b border-zinc-200 pb-4 sm:pb-5">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-emerald-100 text-emerald-800 mb-1.5 border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>লাইভ রিসিপশন তালিকা • বাতিলকৃত স্লট বাদ দেওয়া হয়েছে</span>
                  </div>
                  <h3 className="font-serif font-bold text-lg sm:text-2xl text-emerald-950">
                    ডা. দেবজ্যোতি দত্ত — চেম্বার রিসিপশন তালিকা
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-[11px] sm:text-xs text-zinc-600 flex-wrap">
                    <span>মুদ্রণ: {formatDateToBn(new Date().toISOString().slice(0, 10))}</span>
                    <span>•</span>
                    <span className="font-bold text-emerald-800">
                      সক্রিয় রোগী: {toBengaliNumber(receptionAppointments.length)} জন
                    </span>
                    <span>•</span>
                    <span className="text-zinc-500 font-medium">রিয়েলটাইম আপডেট</span>
                  </div>
                </div>

                {/* Corner Action Buttons */}
                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-between sm:justify-end">
                  {/* PDF Download Button */}
                  <button
                    type="button"
                    onClick={() => printReceptionSheet(receptionAppointments, true)}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95"
                    title="রিসিপশন তালিকাটি সরাসরি পিডিএফ (PDF) আকারে সেভ বা ডাউনলোড করুন"
                  >
                    <Download className="w-4 h-4 text-emerald-200" />
                    <span>পিডিএফ ডাউনলোড</span>
                  </button>

                  {/* Print Button */}
                  <button
                    type="button"
                    onClick={() => printReceptionSheet(receptionAppointments, false)}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
                    title="রিসিপশন ডেস্কের জন্য সরাসরি প্রিন্ট করুন"
                  >
                    <Printer className="w-4 h-4 text-emerald-700" />
                    <span>প্রিন্ট করুন</span>
                  </button>

                  {/* Close Modal Button */}
                  <button
                    type="button"
                    onClick={() => setShowPrintModal(false)}
                    className="p-2 sm:p-2.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-800 transition-colors cursor-pointer shrink-0"
                    title="উইন্ডো বন্ধ করুন"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Table Container */}
              <div className="overflow-x-auto rounded-xl border border-zinc-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-emerald-50 text-emerald-950 font-bold border-b border-zinc-200">
                    <tr>
                      <th className="py-2.5 px-3 border-r border-zinc-200 text-center w-12">নং</th>
                      <th className="py-2.5 px-3 border-r border-zinc-200 w-28">সিরিয়াল নং</th>
                      <th className="py-2.5 px-3 border-r border-zinc-200">রোগীর নাম ও মোবাইল</th>
                      <th className="py-2.5 px-3 border-r border-zinc-200">তারিখ ও সময় স্লট</th>
                      <th className="py-2.5 px-3 border-r border-zinc-200">চেম্বার</th>
                      <th className="py-2.5 px-3 border-r border-zinc-200 text-center">স্ট্যাটাস</th>
                      <th className="py-2.5 px-3 border-r border-zinc-200 text-right">পরামর্শ ফি</th>
                      <th className="py-2.5 px-3 text-center">রোগীর স্বাক্ষর / রিমার্কস</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {receptionAppointments.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-sm text-zinc-500 font-medium">
                          বর্তমানে কোনো সক্রিয় সিরিয়াল নেই। (সকল সিরিয়াল বাতিল বা স্লট উন্মুক্ত রয়েছে)
                        </td>
                      </tr>
                    ) : (
                      receptionAppointments.map((apt, idx) => (
                        <tr key={apt.id} className="hover:bg-zinc-50 transition-colors">
                          <td className="py-2.5 px-3 border-r border-zinc-200 text-center font-bold text-zinc-600">
                            {toBengaliNumber(idx + 1)}
                          </td>
                          <td className="py-2.5 px-3 border-r border-zinc-200 font-mono font-bold text-emerald-800">
                            {apt.serialNo}
                          </td>
                          <td className="py-2.5 px-3 border-r border-zinc-200">
                            <div className="font-bold text-zinc-900">{apt.patientName}</div>
                            <div className="text-[11px] font-mono text-zinc-500">{apt.phone}</div>
                          </td>
                          <td className="py-2.5 px-3 border-r border-zinc-200">
                            <div className="font-semibold text-zinc-800">{apt.dateFormattedBn}</div>
                            <div className="text-amber-700 font-mono font-bold text-[11px]">
                              {apt.slotTimeBn}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 border-r border-zinc-200 font-medium text-zinc-700">
                            {apt.chamberTitleBn}
                          </td>
                          <td className="py-2.5 px-3 border-r border-zinc-200 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                apt.status === 'confirmed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : apt.status === 'rescheduled'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : apt.status === 'completed'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {apt.status === 'confirmed'
                                ? 'নিশ্চিত'
                                : apt.status === 'rescheduled'
                                ? 'রিশিডিউলকৃত'
                                : apt.status === 'completed'
                                ? 'সম্পন্ন'
                                : 'অপেক্ষমাণ'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 border-r border-zinc-200 text-right font-bold text-zinc-800 font-mono">
                            {apt.chamberMode === 'offline' ? '১,০০০ ৳' : '১,২০০ ৳'}
                          </td>
                          <td className="py-2.5 px-3 min-w-[120px]"></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Modal Footer Note */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-zinc-500 pt-2 border-t border-zinc-100">
                <div>
                  * বাতিলকৃত কোনো সিরিয়াল এই তালিকায় অন্তর্ভুক্ত নয়। রিসিপশন ডেস্ক সর্বদা কেবল সক্রিয় রোগীদের দেখতে পাবে।
                </div>
                <div className="text-emerald-800 font-medium">
                  ডা. দেবজ্যোতি দত্ত চেম্বার পোর্টাল
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {deleteTargetApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#101e17] border border-rose-500/50 shadow-2xl p-6 sm:p-7 space-y-5 animate-scale-up max-h-[92vh] overflow-y-auto my-auto">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-rose-900/10 dark:border-rose-800/40 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-inner">
                  <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-emerald-950 dark:text-emerald-50">
                    স্থায়ীভাবে মুছে ফেলবেন?
                  </h3>
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                    এই সিদ্ধান্ত আর পরিবর্তন করা যাবে না
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTargetApt(null)}
                className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Patient Summary */}
            <div className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-zinc-500">রোগীর নাম:</span>
                <span className="font-bold text-emerald-950 dark:text-emerald-100">
                  {deleteTargetApt.patientName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">সিরিয়াল নং:</span>
                <span className="font-mono font-bold text-rose-700 dark:text-rose-400">
                  {deleteTargetApt.serialNo}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">তারিখ ও স্লট:</span>
                <span className="font-semibold text-emerald-950 dark:text-emerald-100">
                  {deleteTargetApt.dateFormattedBn} • {deleteTargetApt.slotTimeBn}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">মোবাইল নম্বর:</span>
                <span className="font-mono text-emerald-800 dark:text-emerald-300">
                  {deleteTargetApt.phone}
                </span>
              </div>
            </div>

            {/* Warning Callout */}
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>সতর্কতা: ডেটাবেজ ও ক্লাউড সিঙ্ক</span>
              </div>
              <p className="leading-relaxed">
                এই সিরিয়ালটি ডেটাবেজ থেকে চিরতরে মুছে যাবে। এমনকি পৃষ্ঠা রিলোড দিলেও বা অন্য কোনো ব্রাউজার থেকেও এটি আর কখনোই দেখা যাবে না।
              </p>
            </div>

            {/* Actions */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteTargetApt(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                বাতিল করুন
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={executeConfirmedDelete}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
              >
                {deleteLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>মুছে ফেলা হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>হ্যাঁ, চিরতরে মুছুন</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM RESTORE CONFIRMATION MODAL */}
      {restoreTargetApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#101e17] border border-emerald-500/50 shadow-2xl p-6 sm:p-7 space-y-5 animate-scale-up max-h-[92vh] overflow-y-auto my-auto">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-emerald-900/10 dark:border-emerald-800/40 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0 shadow-inner">
                  <RotateCcw className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-emerald-950 dark:text-emerald-50">
                    সিরিয়াল পুনরায় সক্রিয় করবেন?
                  </h3>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    সক্রিয় অ্যাপয়েন্টমেন্ট তালিকায় ফেরত যাবে
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRestoreTargetApt(null)}
                className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Patient Summary */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-zinc-500">রোগীর নাম:</span>
                <span className="font-bold text-emerald-950 dark:text-emerald-100">
                  {restoreTargetApt.patientName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">সিরিয়াল নং:</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  {restoreTargetApt.serialNo}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">তারিখ ও স্লট:</span>
                <span className="font-semibold text-emerald-950 dark:text-emerald-100">
                  {restoreTargetApt.dateFormattedBn} • {restoreTargetApt.slotTimeBn}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">মোবাইল নম্বর:</span>
                <span className="font-mono text-emerald-800 dark:text-emerald-300">
                  {restoreTargetApt.phone}
                </span>
              </div>
            </div>

            {/* Info Notice */}
            <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
              এই সিরিয়ালটি সফলভাবে পুনরায় সক্রিয় করা হলে তা সক্রিয় অ্যাপয়েন্টমেন্ট তালিকা এবং রিসিপশন শিটে আবার অন্তর্ভুক্ত হবে।
            </p>

            {/* Actions */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setRestoreTargetApt(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                না, ফিরিয়ে দিন
              </button>
              <button
                type="button"
                disabled={restoreLoading}
                onClick={executeConfirmedRestore}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
              >
                {restoreLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>সক্রিয় হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>হ্যাঁ, পুনরায় সক্রিয় করুন</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM BEAUTIFUL ALERT / MESSAGE MODAL */}
      {alertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-[#101e17] border border-emerald-500/40 shadow-2xl p-6 space-y-4 animate-scale-up text-center my-auto">
            {/* Icon */}
            <div className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center shadow-inner ${
              alertModal.type === 'error'
                ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400'
                : alertModal.type === 'warning'
                ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400'
                : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400'
            }`}>
              {alertModal.type === 'error' ? (
                <Ban className="w-6 h-6" />
              ) : alertModal.type === 'warning' ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <CheckCircle2 className="w-6 h-6" />
              )}
            </div>

            {/* Title & Message */}
            <div className="space-y-1.5">
              <h3 className="font-serif font-bold text-lg text-emerald-950 dark:text-emerald-50">
                {alertModal.title || (alertModal.type === 'error' ? 'দৃষ্টি আকর্ষণ' : 'বিজ্ঞপ্তি')}
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                {alertModal.message}
              </p>
            </div>

            {/* Action */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setAlertModal(null)}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer ${
                  alertModal.type === 'error'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : alertModal.type === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                }`}
              >
                ঠিক আছে
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
