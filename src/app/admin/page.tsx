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
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  MessageSquare,
  Coins,
  Layers,
  Split,
  Coffee
} from 'lucide-react';
import {
  Appointment,
  AppointmentStatus,
  ChamberMode,
  ChamberSchedule,
  DayScheduleConfig,
  ScheduleSession
} from '@/types/booking';
import {
  defaultSchedules,
  toBengaliNumber,
  formatDateToBn,
  parseTimeToMinutes,
  time24ToComponents,
  getUpcomingDates,
  generateSlotsFromTiming,
  getEffectiveTimingForDate,
  isSlotPastTime,
  getDhakaCurrentTime,
  parseSlotTimeToMinutes,
  formatRelativeTimeBn
} from '@/lib/booking/utils';
import ThemeToggle from '@/components/layout/ThemeToggle';
import TimePicker12h from '@/components/admin/TimePicker12h';
import SessionTitleInput from '@/components/admin/SessionTitleInput';
import { printSinglePageSerialSlip, printReceptionSheet } from '@/lib/booking/print-slip';
import {
  DEFAULT_SMS_TEMPLATES,
  ChamberTemplatesConfig,
  TemplateType,
  evaluateSms,
  interpolateTemplate
} from '@/lib/sms/templates';

export type SortOption =
  | 'created_desc'
  | 'created_asc'
  | 'slot_asc'
  | 'slot_desc'
  | 'date_asc'
  | 'date_desc'
  | 'serial_asc'
  | 'serial_desc'
  | 'name_asc'
  | 'name_desc';

export const getSortOptionLabel = (sort: SortOption): string => {
  switch (sort) {
    case 'slot_asc':
      return 'স্লটের সময়: আগে থেকে পরে (সময়ক্রম)';
    case 'slot_desc':
      return 'স্লটের সময়: পরে থেকে আগে';
    case 'created_desc':
      return 'সর্বশেষ বুকিং আগে';
    case 'created_asc':
      return 'পুরনো বুকিং আগে';
    case 'date_asc':
      return 'তারিখ: নিকটবর্তী আগে';
    case 'date_desc':
      return 'তারিখ: দূরবর্তী আগে';
    case 'serial_asc':
      return 'সিরিয়াল নং: ছোট থেকে বড়';
    case 'serial_desc':
      return 'সিরিয়াল নং: বড় থেকে ছোট';
    case 'name_asc':
      return 'রোগীর নাম: ক-হ / A-Z';
    case 'name_desc':
      return 'রোগীর নাম: হ-ক / Z-A';
    default:
      return 'সর্বশেষ বুকিং আগে';
  }
};

export const sortAppointmentList = (list: Appointment[], sortCriteria: SortOption): Appointment[] => {
  return [...list].sort((a, b) => {
    switch (sortCriteria) {
      case 'slot_asc': {
        const d = (a.appointmentDate || '').localeCompare(b.appointmentDate || '');
        if (d !== 0) return d;
        const minA = parseSlotTimeToMinutes(a.slotTimeEn || a.slotTimeBn);
        const minB = parseSlotTimeToMinutes(b.slotTimeEn || b.slotTimeBn);
        if (minA !== minB) return minA - minB;
        const numA = parseInt((a.serialNo || '').replace(/\D/g, ''), 10) || 0;
        const numB = parseInt((b.serialNo || '').replace(/\D/g, ''), 10) || 0;
        return numA - numB;
      }
      case 'slot_desc': {
        const d = (b.appointmentDate || '').localeCompare(a.appointmentDate || '');
        if (d !== 0) return d;
        const minA = parseSlotTimeToMinutes(a.slotTimeEn || a.slotTimeBn);
        const minB = parseSlotTimeToMinutes(b.slotTimeEn || b.slotTimeBn);
        if (minA !== minB) return minB - minA;
        const numA = parseInt((a.serialNo || '').replace(/\D/g, ''), 10) || 0;
        const numB = parseInt((b.serialNo || '').replace(/\D/g, ''), 10) || 0;
        return numB - numA;
      }
      case 'date_asc': {
        const d = (a.appointmentDate || '').localeCompare(b.appointmentDate || '');
        if (d !== 0) return d;
        const minA = parseSlotTimeToMinutes(a.slotTimeEn || a.slotTimeBn);
        const minB = parseSlotTimeToMinutes(b.slotTimeEn || b.slotTimeBn);
        if (minA !== minB) return minA - minB;
        const numA = parseInt((a.serialNo || '').replace(/\D/g, ''), 10) || 0;
        const numB = parseInt((b.serialNo || '').replace(/\D/g, ''), 10) || 0;
        return numA - numB;
      }
      case 'date_desc': {
        const d = (b.appointmentDate || '').localeCompare(a.appointmentDate || '');
        if (d !== 0) return d;
        const minA = parseSlotTimeToMinutes(a.slotTimeEn || a.slotTimeBn);
        const minB = parseSlotTimeToMinutes(b.slotTimeEn || b.slotTimeBn);
        if (minA !== minB) return minB - minA;
        const numA = parseInt((a.serialNo || '').replace(/\D/g, ''), 10) || 0;
        const numB = parseInt((b.serialNo || '').replace(/\D/g, ''), 10) || 0;
        return numB - numA;
      }
      case 'serial_asc': {
        const numA = parseInt((a.serialNo || '').replace(/\D/g, ''), 10) || 0;
        const numB = parseInt((b.serialNo || '').replace(/\D/g, ''), 10) || 0;
        if (numA !== numB) return numA - numB;
        return (a.serialNo || '').localeCompare(b.serialNo || '');
      }
      case 'serial_desc': {
        const numA = parseInt((a.serialNo || '').replace(/\D/g, ''), 10) || 0;
        const numB = parseInt((b.serialNo || '').replace(/\D/g, ''), 10) || 0;
        if (numA !== numB) return numB - numA;
        return (b.serialNo || '').localeCompare(a.serialNo || '');
      }
      case 'name_asc': {
        return (a.patientName || '').localeCompare(b.patientName || '', 'bn');
      }
      case 'name_desc': {
        return (b.patientName || '').localeCompare(a.patientName || '', 'bn');
      }
      case 'created_asc': {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeA - timeB;
      }
      case 'created_desc':
      default: {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      }
    }
  });
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [schedules, setSchedules] = useState<Record<ChamberMode, ChamberSchedule>>(defaultSchedules);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('created_desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const [confirmPromptApt, setConfirmPromptApt] = useState<Appointment | null>(null);

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
  const [overrideIsMultiSession, setOverrideIsMultiSession] = useState(false);
  const [overrideSessions, setOverrideSessions] = useState<ScheduleSession[]>([]);

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
    'confirm' | 'reminder' | 'reports' | 'cancel' | 'reschedule' | 'custom' | 'compact'
  >('confirm');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [copiedToast, setCopiedToast] = useState(false);
  const [smsBalance, setSmsBalance] = useState<number | null>(null);
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailRecipientInput, setEmailRecipientInput] = useState('');
  const [smsStatusMsg, setSmsStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // SMS Template Configuration Modal State
  const [templatesConfig, setTemplatesConfig] = useState<ChamberTemplatesConfig>(DEFAULT_SMS_TEMPLATES);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplateMode, setSelectedTemplateMode] = useState<'offline' | 'online'>('offline');
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<TemplateType>('confirm');
  const [editingTemplates, setEditingTemplates] = useState<ChamberTemplatesConfig>(DEFAULT_SMS_TEMPLATES);
  const [isSavingTemplates, setIsSavingTemplates] = useState(false);
  const [templateSaveFeedback, setTemplateSaveFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Admin Direct Booking Modal State (Admin Super Power - Direct Walk-in / Phone)
  const [showDirectBookingModal, setShowDirectBookingModal] = useState(false);
  const [directChamberMode, setDirectChamberMode] = useState<ChamberMode>('offline');
  const [directDate, setDirectDate] = useState<string>('');
  const [directSlotId, setDirectSlotId] = useState<string>('');
  const [directSlotTimeBn, setDirectSlotTimeBn] = useState<string>('');
  const [directSlotTimeEn, setDirectSlotTimeEn] = useState<string>('');
  const [directPatientName, setDirectPatientName] = useState<string>('');
  const [directPhone, setDirectPhone] = useState<string>('');
  const [directEmail, setDirectEmail] = useState<string>('');
  const [directComplaints, setDirectComplaints] = useState<string>('');
  const [directBookedSlots, setDirectBookedSlots] = useState<string[]>([]);
  const [directBookingLoading, setDirectBookingLoading] = useState(false);
  const [directBookingFeedback, setDirectBookingFeedback] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);
  const [createdDirectAppointment, setCreatedDirectAppointment] = useState<Appointment | null>(null);

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

  // Helper to format date like 16/OCT/2026
  const formatTemplateDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const mIdx = parseInt(parts[1], 10) - 1;
      const mStr = months[mIdx] || parts[1];
      return `${parts[2]}/${mStr}/${parts[0]}`;
    }
    return dateStr;
  };

  // Helper to build default notification messages
  const buildDefaultMessage = (
    apt: Appointment,
    type: 'confirm' | 'reminder' | 'reports' | 'cancel' | 'reschedule' | 'custom' | 'compact'
  ) => {
    const isOnline = apt.chamberMode === 'online';
    const modeKey: 'online' | 'offline' = isOnline ? 'online' : 'offline';
    const dateFormatted = formatTemplateDate(apt.appointmentDate);
    const timeFormatted = apt.slotTimeEn || apt.slotTimeBn;

    if (type === 'custom') {
      return `*Mr./Mrs. ${apt.patientName},*

• সিরিয়াল নম্বর: ${apt.serialNo}
• তারিখ: ${dateFormatted}
• সময়: ${timeFormatted}
• মোড: ${isOnline ? 'অনলাইন ভিডিও কনসালটেশন' : 'শ্যামলী চেম্বার, ঢাকা'}

দেবজ্যোতি দত্তের চেম্বার থেকে বার্তা: `;
    }

    const templateSource =
      (templatesConfig && templatesConfig[modeKey] && templatesConfig[modeKey][type]) ||
      (DEFAULT_SMS_TEMPLATES[modeKey] && DEFAULT_SMS_TEMPLATES[modeKey][type]) ||
      '';

    return interpolateTemplate(templateSource, {
      patientName: apt.patientName,
      serialNo: apt.serialNo,
      date: dateFormatted,
      time: timeFormatted,
      chamberMode: modeKey,
      chamberAddress: '২/১, জাহেদা ভিলা, শ্যামলী কল্যাণ সমিতি, শ্যামলী, ঢাকা-১২০৭।',
      mapsUrl: 'https://maps.app.goo.gl/NgPzAZamW3Ucy8799',
      formUrl: 'https://forms.gle/L6YfWn7Z12nV3aK66',
      helpline: '01712854941'
    });
  };

  // Open Message Customizer Modal
  const handleOpenMessageModal = (
    apt: Appointment,
    type: 'confirm' | 'reminder' | 'reports' | 'cancel' | 'reschedule' | 'custom' | 'compact' = 'confirm'
  ) => {
    const initialType =
      apt.status === 'cancelled'
        ? 'cancel'
        : apt.status === 'rescheduled'
        ? 'reschedule'
        : type;
    setMessageModalApt(apt);
    setEmailRecipientInput(apt.email || '');
    setMessageTemplateType(initialType);
    setCustomMessage(buildDefaultMessage(apt, initialType));
    setCopiedToast(false);
    setSmsStatusMsg(null);
    fetchSmsBalance();
  };

  // Phone normalization & communication helpers
  const normalizePhoneDigits = (phone?: string): string => {
    if (!phone) return '';
    const bnToEnMap: Record<string, string> = {
      '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
      '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
    };
    return phone.replace(/[০-৯]/g, (d) => bnToEnMap[d] || d);
  };

  const getCleanWhatsAppNumber = (phone?: string): string => {
    if (!phone) return '';
    const normalized = normalizePhoneDigits(phone);
    let digits = normalized.replace(/\D/g, '');
    if (digits.startsWith('01') && digits.length === 11) {
      digits = '88' + digits;
    } else if (digits.startsWith('1') && digits.length === 10) {
      digits = '880' + digits;
    }
    return digits;
  };

  const getCleanSmsNumber = (phone?: string): string => {
    if (!phone) return '';
    const normalized = normalizePhoneDigits(phone);
    let digits = normalized.replace(/\D/g, '');
    if (digits.startsWith('8801') && digits.length === 13) {
      return '01' + digits.slice(4);
    }
    if (digits.startsWith('01') && digits.length === 11) {
      return digits;
    }
    return digits;
  };

  const isAppleDevice = () => {
    if (typeof navigator === 'undefined') return false;
    return /iPhone|iPad|iPod|Macintosh/i.test(navigator.userAgent);
  };

  // Helper to reliably identify foreign / international patients
  const isForeignPatient = (apt?: Appointment | null): boolean => {
    if (!apt) return false;
    if (
      apt.complaints &&
      (apt.complaints.includes('বিদেশী') ||
        apt.complaints.includes('প্রবাসী') ||
        apt.complaints.includes('বর্তমান দেশ/অবস্থান'))
    ) {
      return true;
    }
    if (apt.chamberMode === 'online') {
      const p = (apt.phone || '').trim().replace(/[\s\-()]/g, '');
      if (
        p &&
        !p.startsWith('01') &&
        !p.startsWith('+8801') &&
        !p.startsWith('8801') &&
        !p.startsWith('008801')
      ) {
        return true;
      }
    }
    return false;
  };

  const getSmsUrl = (phone: string, message: string) => {
    const cleanPhone = getCleanSmsNumber(phone);
    const separator = isAppleDevice() ? '&' : '?';
    return `sms:${cleanPhone}${separator}body=${encodeURIComponent(message)}`;
  };

  const getWhatsAppUrl = (phone: string, message: string) => {
    const cleanPhone = getCleanWhatsAppNumber(phone);
    if (!cleanPhone) {
      return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    }
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
  };

  // Toggle or mark message sent status for an appointment
  const handleToggleMessageSent = async (
    aptId: string,
    channel: 'sms' | 'whatsapp' | 'email' | 'manual' = 'manual',
    sent = true
  ) => {
    const nowIso = new Date().toISOString();

    // 1. Immediately persist in localStorage for instant offline/reload retention
    try {
      const localSent = JSON.parse(localStorage.getItem('dr_dutta_sent_messages') || '{}');
      if (sent) {
        localSent[aptId] = { sent: true, sentAt: nowIso, channel };
      } else {
        delete localSent[aptId];
      }
      localStorage.setItem('dr_dutta_sent_messages', JSON.stringify(localSent));
    } catch {}

    // 2. Optimistic UI update
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === aptId
          ? {
              ...a,
              messageSent: sent,
              messageSentAt: sent ? nowIso : undefined,
              messageChannel: sent ? channel : undefined
            }
          : a
      )
    );
    if (messageModalApt && messageModalApt.id === aptId) {
      setMessageModalApt((prev) =>
        prev
          ? {
              ...prev,
              messageSent: sent,
              messageSentAt: sent ? nowIso : undefined,
              messageChannel: sent ? channel : undefined
            }
          : null
      );
    }

    // 3. Persist to server (and Supabase PostgreSQL)
    try {
      await fetch('/api/admin/appointments/message-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: aptId, channel, sent })
      });
    } catch (err) {
      console.warn('Failed to persist message status update to server', err);
    }
  };

  // Send via WhatsApp
  const handleSendCustomWhatsApp = () => {
    if (!messageModalApt) return;
    if (messageModalApt.status === 'pending') {
      handleUpdateStatus(messageModalApt.id, 'confirmed');
    }
    handleToggleMessageSent(messageModalApt.id, 'whatsapp', true);
    const url = getWhatsAppUrl(messageModalApt.phone, customMessage);
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);
  };

  // Send via SMS app
  const handleSendCustomSms = () => {
    if (!messageModalApt) return;
    handleToggleMessageSent(messageModalApt.id, 'sms', true);
    try {
      navigator.clipboard.writeText(customMessage);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2000);
    } catch {}
    const url = getSmsUrl(messageModalApt.phone, customMessage);
    const link = document.createElement('a');
    link.href = url;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);
  };

  // Copy message to clipboard
  const handleCopyMessage = () => {
    if (!customMessage) return;
    navigator.clipboard.writeText(customMessage);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  // Fetch SMS credit balance from BulkSMSBD API
  const fetchSmsBalance = async () => {
    try {
      const res = await fetch('/api/admin/sms/balance');
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success && typeof data.balance === 'number') {
        setSmsBalance(data.balance);
      }
    } catch {}
  };

  // Fetch customizable SMS templates
  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/admin/sms/templates');
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success && data.templates) {
        setTemplatesConfig(data.templates);
        setEditingTemplates(data.templates);
      }
    } catch {}
  };

  // Save SMS templates to persistent store
  const handleSaveTemplates = async () => {
    setIsSavingTemplates(true);
    setTemplateSaveFeedback(null);
    try {
      const res = await fetch('/api/admin/sms/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templates: editingTemplates })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setTemplateSaveFeedback({ type: 'error', text: data.error || 'টেমপ্লেট সংরক্ষণ ব্যর্থ হয়েছে।' });
      } else {
        setTemplatesConfig(data.templates);
        setTemplateSaveFeedback({ type: 'success', text: 'এসএমএস টেমপ্লেট সফলভাবে সংরক্ষিত হয়েছে!' });
        setTimeout(() => {
          setTemplateSaveFeedback(null);
        }, 3000);
      }
    } catch {
      setTemplateSaveFeedback({ type: 'error', text: 'সার্ভার যোগাযোগে সমস্যা দেখা দিয়েছে।' });
    } finally {
      setIsSavingTemplates(false);
    }
  };

  const handleResetTemplateToDefault = (mode: 'offline' | 'online', key: TemplateType) => {
    setEditingTemplates(prev => ({
      ...prev,
      [mode]: {
        ...prev[mode],
        [key]: DEFAULT_SMS_TEMPLATES[mode][key]
      }
    }));
  };

  const handleResetAllTemplatesToDefault = () => {
    setEditingTemplates(JSON.parse(JSON.stringify(DEFAULT_SMS_TEMPLATES)));
  };

  useEffect(() => {
    fetchSmsBalance();
    fetchTemplates();
  }, []);

  // Send Direct SMS via BulkSMSBD Gateway (1-Click send)
  const handleSendDirectSms = async () => {
    if (!messageModalApt) return;
    if (!customMessage.trim()) {
      setSmsStatusMsg({ type: 'error', text: 'বার্তা খালি রাখা যাবে না।' });
      return;
    }

    setIsSendingSms(true);
    setSmsStatusMsg(null);

    try {
      const res = await fetch('/api/admin/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: messageModalApt.phone,
          message: customMessage.trim(),
          appointmentId: messageModalApt.id
        })
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setSmsStatusMsg({
          type: 'error',
          text: data?.error || 'এসএমএস পাঠাতে ব্যর্থ হয়েছে।'
        });
      } else {
        if (messageModalApt.status === 'pending') {
          handleUpdateStatus(messageModalApt.id, 'confirmed');
        }
        handleToggleMessageSent(messageModalApt.id, 'sms', true);
        setSmsStatusMsg({
          type: 'success',
          text: data?.message || `সফলভাবে রোগীর মোবাইলে (${messageModalApt.phone}) এসএমএস পাঠানো হয়েছে!`
        });
        fetchSmsBalance();
      }
    } catch (err: unknown) {
      setSmsStatusMsg({
        type: 'error',
        text: 'সার্ভারের সাথে সংযোগ বিচ্ছিন্ন হয়েছে।'
      });
    } finally {
      setIsSendingSms(false);
    }
  };

  // Send Direct Email via SMTP / Resend (1-Click send for abroad patients)
  const handleSendDirectEmail = async () => {
    if (!messageModalApt) return;
    const targetEmail = (emailRecipientInput || messageModalApt.email || '').trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      setSmsStatusMsg({
        type: 'error',
        text: 'রোগীর কোনো বৈধ ইমেইল ঠিকানা নেই। অনুগ্রহ করে সঠিক ইমেইল লিখুন।'
      });
      return;
    }
    if (!customMessage.trim()) {
      setSmsStatusMsg({ type: 'error', text: 'বার্তা খালি রাখা যাবে না।' });
      return;
    }

    setIsSendingEmail(true);
    setSmsStatusMsg(null);

    try {
      const res = await fetch('/api/admin/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          message: customMessage.trim(),
          appointmentId: messageModalApt.id,
          patientName: messageModalApt.patientName,
          serialNo: messageModalApt.serialNo
        })
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setSmsStatusMsg({
          type: 'error',
          text: data?.error || 'ইমেইল পাঠাতে ব্যর্থ হয়েছে।'
        });
      } else {
        if (messageModalApt.status === 'pending') {
          handleUpdateStatus(messageModalApt.id, 'confirmed');
        }
        handleToggleMessageSent(messageModalApt.id, 'email', true);
        setSmsStatusMsg({
          type: 'success',
          text: data?.message || `সফলভাবে রোগীর ইমেইলে (${targetEmail}) বার্তা পাঠানো হয়েছে!`
        });
      }
    } catch (err: unknown) {
      setSmsStatusMsg({
        type: 'error',
        text: 'সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি।'
      });
    } finally {
      setIsSendingEmail(false);
    }
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

      // Read sent messages from localStorage
      let localSentMap: Record<string, { sent: boolean; sentAt?: string; channel?: 'sms' | 'whatsapp' | 'email' | 'manual' }> = {};
      try {
        localSentMap = JSON.parse(localStorage.getItem('dr_dutta_sent_messages') || '{}');
      } catch {}

      // 1. Fetch appointments (fetch all so top KPI stats remain 100% accurate)
      const queryParams = new URLSearchParams();
      if (deletedIds.length > 0) {
        queryParams.set('deleted_ids', JSON.stringify(deletedIds));
      }

      queryParams.set('_t', Date.now().toString());
      const aptRes = await fetch(`/api/admin/appointments?${queryParams.toString()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      if (aptRes.status === 401) {
        router.push('/admin/login');
        return;
      }
      const aptData = await aptRes.json();
      if (aptData.success && Array.isArray(aptData.appointments)) {
        const filtered = aptData.appointments
          .filter((a: Appointment) => !deletedIds.includes(a.id))
          .map((a: Appointment) => {
            const clientSent = localSentMap[a.id];
            // If server has it or client localStorage has it, preserve messageSent
            const isSent = Boolean(a.messageSent || clientSent?.sent);
            const sentAt = a.messageSentAt || clientSent?.sentAt;
            const channel = a.messageChannel || clientSent?.channel || 'manual';
            if (isSent) {
              localSentMap[a.id] = { sent: true, sentAt, channel };
            }
            return {
              ...a,
              messageSent: isSent,
              messageSentAt: isSent ? sentAt : undefined,
              messageChannel: isSent ? channel : undefined
            };
          });

        // Update localStorage with merged list
        try {
          localStorage.setItem('dr_dutta_sent_messages', JSON.stringify(localSentMap));
        } catch {}

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
  }, []);

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

  // Fetch booked slots for Direct Booking Modal
  useEffect(() => {
    if (!showDirectBookingModal || !directDate) return;
    const fetchBooked = async () => {
      try {
        const res = await fetch(
          `/api/appointments?date=${directDate}&mode=${directChamberMode}`
        );
        const data = await res.json();
        if (data.success && Array.isArray(data.bookedSlotIds)) {
          setDirectBookedSlots(data.bookedSlotIds);
        }
      } catch (err) {
        console.error('Error fetching booked slots for direct booking', err);
      }
    };
    fetchBooked();
  }, [showDirectBookingModal, directDate, directChamberMode]);

  // Open Direct Booking Modal (Admin Super Power - Direct Walk-in / Phone)
  const handleOpenDirectBooking = () => {
    const targetMode: ChamberMode = 'offline';
    setDirectChamberMode(targetMode);
    const chamber = schedules[targetMode];
    const upcoming = chamber ? getUpcomingDates(chamber, 14) : [];
    const initialDate = upcoming.length > 0 ? upcoming[0].dateStr : '';
    setDirectDate(initialDate);
    setDirectSlotId('');
    setDirectSlotTimeBn('');
    setDirectSlotTimeEn('');
    setDirectPatientName('');
    setDirectPhone('');
    setDirectEmail('');
    setDirectComplaints('');
    setDirectBookingFeedback(null);
    setCreatedDirectAppointment(null);
    setShowDirectBookingModal(true);
  };

  const handleDirectChamberChange = (mode: ChamberMode) => {
    setDirectChamberMode(mode);
    const targetChamber = schedules[mode];
    const upcoming = targetChamber ? getUpcomingDates(targetChamber, 14) : [];
    const initialDate = upcoming.length > 0 ? upcoming[0].dateStr : '';
    setDirectDate(initialDate);
    setDirectSlotId('');
    setDirectSlotTimeBn('');
    setDirectSlotTimeEn('');
  };

  const handleDirectBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directPatientName.trim()) {
      setDirectBookingFeedback({ type: 'error', msg: 'অনুগ্রহ করে রোগীর পুরো নাম প্রদান করুন।' });
      return;
    }
    if (!directPhone.trim()) {
      setDirectBookingFeedback({ type: 'error', msg: 'অনুগ্রহ করে রোগীর মোবাইল নম্বর প্রদান করুন।' });
      return;
    }
    if (!directDate || !directSlotId) {
      setDirectBookingFeedback({ type: 'error', msg: 'অনুগ্রহ করে একটি তারিখ এবং সময় স্লট নির্বাচন করুন।' });
      return;
    }

    setDirectBookingLoading(true);
    setDirectBookingFeedback(null);

    try {
      const res = await fetch('/api/admin/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: directPatientName.trim(),
          phone: directPhone.trim(),
          email: directEmail.trim(),
          chamberMode: directChamberMode,
          appointmentDate: directDate,
          slotId: directSlotId,
          slotTimeBn: directSlotTimeBn,
          slotTimeEn: directSlotTimeEn,
          complaints: directComplaints.trim(),
          status: 'confirmed',
          bypassPastCheck: true
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'সিরিয়াল তৈরি করতে ব্যর্থ হয়েছে');
      }

      const newApt: Appointment = data.appointment;
      setAppointments((prev) => [newApt, ...prev]);
      setCreatedDirectAppointment(newApt);
      setDirectBookingFeedback({
        type: 'success',
        msg: `সিরিয়াল (${newApt.serialNo}) সফলভাবে নিশ্চিত ও বুকিং সম্পন্ন হয়েছে!`
      });
      setNotificationMsg(`নতুন সিরিয়াল (${newApt.serialNo}) তৈরি সম্পন্ন হয়েছে`);
      setTimeout(() => setNotificationMsg(null), 5000);
    } catch (err: any) {
      setDirectBookingFeedback({
        type: 'error',
        msg: err?.message || 'বুকিং সম্পন্ন করা সম্ভব হয়নি।'
      });
    } finally {
      setDirectBookingLoading(false);
    }
  };

  // Handle Search debounce / enter
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  // Status changer (sends confirmation email if confirmed)
  const handleUpdateStatus = async (id: string, newStatus: AppointmentStatus): Promise<boolean> => {
    if (newStatus === 'pending') {
      showAlert('অপেক্ষমাণ (Pending) স্ট্যাটাস শুধুমাত্র নতুন রোগীর প্রথম আবেদনের জন্য। প্যানেল থেকে পুনরায় অপেক্ষমাণ করা যাবে না।', 'সতর্কতা', 'warning');
      return false;
    }

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
        return true;
      } else {
        showAlert(data.error || 'স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।', 'স্ট্যাটাস পরিবর্তন ত্রুটি', 'error');
        return false;
      }
    } catch (err) {
      showAlert('স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে। সার্ভারের সাথে সংযোগে সমস্যা।', 'ত্রুটি', 'error');
      return false;
    }
  };

  // Handle Confirm and prompt instant messaging option
  const handleConfirmAndNotifyPrompt = async (apt: Appointment) => {
    const success = await handleUpdateStatus(apt.id, 'confirmed');
    if (success) {
      setConfirmPromptApt({ ...apt, status: 'confirmed' });
      setTimeout(() => {
        setConfirmPromptApt((curr) => (curr?.id === apt.id ? null : curr));
      }, 12000);
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

  // Toggle between Single-Block mode and Multi-Session mode for a day
  const handleToggleDayMultiSession = (dayIndex: number) => {
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

      if (Array.isArray(currentDay.sessions) && currentDay.sessions.length > 0) {
        // Switch back to single block: clear sessions
        daySchedules[dayIndex] = { ...currentDay, sessions: undefined };
      } else {
        // Switch to multi-session: initialize default sessions (e.g. morning, afternoon, evening)
        const defaultDur = currentDay.slotDuration || 15;
        const initialSessions: ScheduleSession[] = [
          {
            id: `sess_${Date.now()}_1`,
            titleBn: 'সকাল সেশন',
            startTime: '09:30',
            endTime: '11:30',
            slotDuration: defaultDur
          },
          {
            id: `sess_${Date.now()}_2`,
            titleBn: 'বিকাল সেশন',
            startTime: '15:30',
            endTime: '17:00',
            slotDuration: defaultDur
          },
          {
            id: `sess_${Date.now()}_3`,
            titleBn: 'রাত সেশন',
            startTime: '19:00',
            endTime: '21:00',
            slotDuration: defaultDur
          }
        ];
        daySchedules[dayIndex] = { ...currentDay, sessions: initialSessions };
      }

      return {
        ...prev,
        [scheduleActiveChamber]: { ...chamber, daySchedules }
      };
    });
  };

  // Add a new session to a day
  const handleAddDaySession = (dayIndex: number) => {
    setSchedules((prev) => {
      const chamber = { ...prev[scheduleActiveChamber] };
      const daySchedules = { ...chamber.daySchedules };
      const currentDay = daySchedules[dayIndex];
      if (!currentDay) return prev;

      const sessions = Array.isArray(currentDay.sessions) ? [...currentDay.sessions] : [];
      const defaultDur = currentDay.slotDuration || 15;

      let start = '19:00';
      let end = '21:00';
      let title = `সেশন ${sessions.length + 1}`;
      if (sessions.length > 0) {
        const last = sessions[sessions.length - 1];
        const lastEndMin = parseTimeToMinutes(last.endTime);
        const nextStartMin = Math.min(23 * 60, lastEndMin + 30);
        const nextEndMin = Math.min(23 * 60 + 45, nextStartMin + 90);
        start = `${String(Math.floor(nextStartMin / 60)).padStart(2, '0')}:${String(nextStartMin % 60).padStart(2, '0')}`;
        end = `${String(Math.floor(nextEndMin / 60)).padStart(2, '0')}:${String(nextEndMin % 60).padStart(2, '0')}`;
      }

      sessions.push({
        id: `sess_${Date.now()}_${sessions.length + 1}`,
        titleBn: title,
        startTime: start,
        endTime: end,
        slotDuration: defaultDur
      });

      daySchedules[dayIndex] = { ...currentDay, sessions };
      return {
        ...prev,
        [scheduleActiveChamber]: { ...chamber, daySchedules }
      };
    });
  };

  // Update a session in a day
  const handleUpdateDaySession = (
    dayIndex: number,
    sessionIndex: number,
    field: keyof ScheduleSession,
    value: any
  ) => {
    setSchedules((prev) => {
      const chamber = { ...prev[scheduleActiveChamber] };
      const daySchedules = { ...chamber.daySchedules };
      const currentDay = daySchedules[dayIndex];
      if (!currentDay || !Array.isArray(currentDay.sessions)) return prev;

      const sessions = [...currentDay.sessions];
      const target = { ...sessions[sessionIndex] };
      if (field === 'slotDuration') {
        target.slotDuration = Math.max(5, Math.min(120, Number(value) || 15));
      } else {
        (target as any)[field] = value;
      }
      sessions[sessionIndex] = target;

      daySchedules[dayIndex] = { ...currentDay, sessions };
      return {
        ...prev,
        [scheduleActiveChamber]: { ...chamber, daySchedules }
      };
    });
  };

  // Remove a session from a day
  const handleRemoveDaySession = (dayIndex: number, sessionIndex: number) => {
    setSchedules((prev) => {
      const chamber = { ...prev[scheduleActiveChamber] };
      const daySchedules = { ...chamber.daySchedules };
      const currentDay = daySchedules[dayIndex];
      if (!currentDay || !Array.isArray(currentDay.sessions)) return prev;

      const sessions = currentDay.sessions.filter((_, i) => i !== sessionIndex);
      daySchedules[dayIndex] = {
        ...currentDay,
        sessions: sessions.length > 0 ? sessions : undefined
      };

      return {
        ...prev,
        [scheduleActiveChamber]: { ...chamber, daySchedules }
      };
    });
  };

  // Multi-session handlers for Date Override Form
  const handleToggleOverrideMultiSession = () => {
    if (!overrideIsMultiSession) {
      if (overrideSessions.length === 0) {
        setOverrideSessions([
          {
            id: `session_1_${Date.now()}`,
            titleBn: 'সকাল সেশন',
            startTime: overrideStart || '09:30',
            endTime: '11:30',
            slotDuration: overrideSlotDuration || 15
          },
          {
            id: `session_2_${Date.now() + 1}`,
            titleBn: 'বিকাল সেশন',
            startTime: '15:30',
            endTime: overrideEnd || '17:00',
            slotDuration: overrideSlotDuration || 15
          }
        ]);
      }
      setOverrideIsMultiSession(true);
    } else {
      setOverrideIsMultiSession(false);
    }
  };

  const handleAddOverrideSession = () => {
    const nextIdx = overrideSessions.length + 1;
    const defaultTitle =
      nextIdx === 1 ? 'সকাল সেশন' : nextIdx === 2 ? 'বিকাল সেশন' : nextIdx === 3 ? 'রাত সেশন' : `সেশন ${toBengaliNumber(nextIdx)}`;
    const lastSession = overrideSessions[overrideSessions.length - 1];
    let newStart = '19:00';
    let newEnd = '21:00';
    if (lastSession?.endTime) {
      const parts = lastSession.endTime.split(':').map(Number);
      const endMins = (parts[0] || 0) * 60 + (parts[1] || 0) + 60;
      const sH = String(Math.floor(endMins / 60) % 24).padStart(2, '0');
      const sM = String(endMins % 60).padStart(2, '0');
      const eMins = endMins + 120;
      const eH = String(Math.floor(eMins / 60) % 24).padStart(2, '0');
      const eM = String(eMins % 60).padStart(2, '0');
      newStart = `${sH}:${sM}`;
      newEnd = `${eH}:${eM}`;
    }
    setOverrideSessions((prev) => [
      ...prev,
      {
        id: `session_${Date.now()}`,
        titleBn: defaultTitle,
        startTime: newStart,
        endTime: newEnd,
        slotDuration: overrideSlotDuration || 15
      }
    ]);
  };

  const handleUpdateOverrideSession = (
    sessionIndex: number,
    field: keyof ScheduleSession,
    value: any
  ) => {
    setOverrideSessions((prev) => {
      const updated = [...prev];
      const target = { ...updated[sessionIndex] };
      if (field === 'slotDuration') {
        target.slotDuration = Math.max(5, Math.min(120, Number(value) || 15));
      } else {
        (target as any)[field] = value;
      }
      updated[sessionIndex] = target;
      return updated;
    });
  };

  const handleRemoveOverrideSession = (sessionIndex: number) => {
    setOverrideSessions((prev) => prev.filter((_, i) => i !== sessionIndex));
  };

  // Add Date-Specific Override
  const handleAddDateOverride = () => {
    if (!overrideDate) {
      showAlert('অনুগ্রহ করে একটি নির্দিষ্ট তারিখ নির্বাচন করুন।', 'তারিখ নির্বাচন আবশ্যক', 'warning');
      return;
    }
    if (overrideEnabled && overrideIsMultiSession && overrideSessions.length === 0) {
      showAlert('সেশনভিত্তিক শিডিউলে কমপক্ষে একটি সেশন যোগ করুন।', 'সেশন প্রয়োজন', 'warning');
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
        slotDuration: Math.max(5, Math.min(240, Number(overrideSlotDuration) || 15)),
        sessions: overrideIsMultiSession && overrideSessions.length > 0 ? overrideSessions : undefined
      };
      return {
        ...prev,
        [scheduleActiveChamber]: { ...chamber, dateOverrides }
      };
    });
    setOverrideDate('');
    setOverrideLabel('');
    setOverrideSessions([]);
    setOverrideIsMultiSession(false);
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

  // Day total slot count helper (calculates sessions or single block)
  const calcDaySlotCount = (dayObj?: DayScheduleConfig): number => {
    if (!dayObj || !dayObj.enabled) return 0;
    if (Array.isArray(dayObj.sessions) && dayObj.sessions.length > 0) {
      return dayObj.sessions.reduce((acc, sess) => {
        const hasBreak = Number(sess.breakDuration) > 0 && !!sess.breakStart;
        return (
          acc +
          calcSlotCount(
            sess.startTime,
            sess.endTime,
            hasBreak ? sess.breakStart : undefined,
            hasBreak ? sess.breakDuration : 0,
            sess.slotDuration || dayObj.slotDuration || 15
          )
        );
      }, 0);
    }
    const hasBreak = Number(dayObj.breakDuration) > 0 && !!dayObj.breakStart;
    return calcSlotCount(
      dayObj.startTime,
      dayObj.endTime,
      hasBreak ? dayObj.breakStart : undefined,
      hasBreak ? dayObj.breakDuration : 0,
      dayObj.slotDuration
    );
  };

  // Calculations for stats using Bangladesh Standard Time
  const todayDhaka = getDhakaCurrentTime();
  const todayStr = todayDhaka.dateStr;
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
    if (filterMode && filterMode !== 'all') {
      if (a.chamberMode !== filterMode) return false;
    }
    if (filterDate) {
      if (a.appointmentDate !== filterDate) return false;
    }
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

  // Sort appointments based on selected criteria
  const sortedAppointments = sortAppointmentList(displayedAppointments, sortBy);

  const totalItems = sortedAppointments.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedAppointments = sortedAppointments.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const startItemNo = totalItems === 0 ? 0 : startIndex + 1;
  const endItemNo = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);

  // Reset page to 1 when filters, search, or sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterMode, filterStatus, filterDate, searchQuery, sortBy]);

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

  // Direct Booking (Admin Super Power) Slots & Dates Calculations
  const directChamber = schedules[directChamberMode];
  const directUpcomingDates = directChamber ? getUpcomingDates(directChamber, 14) : [];
  const directTiming =
    directChamber && directDate
      ? getEffectiveTimingForDate(directChamber, directDate)
      : null;
  const directSlots = generateSlotsFromTiming(directTiming);

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-emerald-950 dark:text-emerald-50">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#13201a]/95 backdrop-blur-md border-b border-emerald-900/10 dark:border-emerald-800/40">
        <div className="max-w-[1600px] w-full mx-auto py-2 sm:py-2.5 px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Brand (Never shrinks, never truncates) */}
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-950 border border-amber-400/40 flex items-center justify-center text-amber-300 font-bold text-xs sm:text-sm shadow-xs shrink-0">
                DD
              </div>
              <div className="shrink-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className="font-serif font-bold text-sm sm:text-base md:text-lg text-emerald-950 dark:text-emerald-50 leading-tight whitespace-nowrap">
                    দেবজ্যোতি দত্ত
                  </h1>
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 shrink-0">
                    অ্যাডমিন
                  </span>
                </div>
                <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 whitespace-nowrap hidden xl:block">
                  সিরিয়াল ও চেম্বার শিডিউলার ড্যাশবোর্ড
                </p>
              </div>
            </div>

            {/* Mobile Header Quick Right Controls (Theme + Logout) */}
            <div className="flex sm:hidden items-center gap-1.5 shrink-0">
              <ThemeToggle size="sm" />
              <button
                type="button"
                onClick={handleLogout}
                className="h-8 w-8 flex items-center justify-center rounded-xl bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/70 hover:text-red-900 dark:hover:text-red-100 transition-colors cursor-pointer"
                title="লগআউট"
                aria-label="লগআউট"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Desktop / Tablet Single-Row Action Navigation (NEVER wraps to second line!) */}
            <div className="hidden sm:flex items-center gap-1.5 md:gap-2 shrink-0 flex-nowrap">
              {/* Direct Walk-in / Phone Booking Button (Admin Super Power) */}
              <button
                type="button"
                onClick={handleOpenDirectBooking}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-xs hover:shadow-sm transition-all active:scale-95 whitespace-nowrap cursor-pointer"
                title="রোগীর সরাসরি সিরিয়াল বুকিং করুন (ওটিপি ছাড়া)"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
                <span>নতুন সিরিয়াল</span>
              </button>

              {/* Primary Management Tools */}
              <button
                type="button"
                onClick={() => setShowScheduleModal(true)}
                className="inline-flex items-center gap-1 h-8 px-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 text-xs font-semibold hover:bg-emerald-200/70 dark:hover:bg-emerald-900/80 hover:text-emerald-950 dark:hover:text-emerald-100 border border-emerald-300 dark:border-emerald-800 dark:hover:border-emerald-700 transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
                title="চেম্বার শিডিউল ও ডে-স্পেসিফিক এডিটর"
              >
                <Settings className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>শিডিউল</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingTemplates(JSON.parse(JSON.stringify(templatesConfig)));
                  setTemplateSaveFeedback(null);
                  setShowTemplateModal(true);
                }}
                className="inline-flex items-center gap-1 h-8 px-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/90 hover:text-emerald-950 dark:hover:text-emerald-100 dark:hover:border-emerald-600 transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
                title="অনলাইন ও অফলাইন এসএমএস ও মেসেজ টেমপ্লেট পরিবর্তন করুন"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>মেসেজ টেমপ্লেট</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                className="inline-flex items-center gap-1 h-8 px-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-900/60 hover:text-emerald-950 dark:hover:text-emerald-100 dark:hover:border-emerald-700 transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
                title="রিসিপশন প্রিন্ট"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="hidden md:inline">রিসিপশন</span>
                <span>প্রিন্ট</span>
              </button>

              {/* Vertical Divider */}
              <div className="h-4 w-px bg-emerald-300/60 dark:bg-emerald-800 mx-0.5" />

              {/* Account Utilities (Icon + Tooltip, labels expand on large screens) */}
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(true);
                  setPasswordFeedback(null);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="inline-flex items-center gap-1 h-8 px-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/60 hover:text-amber-950 dark:hover:text-amber-100 dark:hover:border-amber-700 transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                title="ডাক্তার পোর্টালের পাসওয়ার্ড পরিবর্তন করুন"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="hidden lg:inline">পাসওয়ার্ড</span>
              </button>

              <ThemeToggle size="sm" />

              <Link
                href="/"
                className="inline-flex items-center gap-1 h-8 px-2.5 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 transition-colors whitespace-nowrap"
                title="মূল ওয়েবসাইট দেখুন"
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden lg:inline">ওয়েবসাইট</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1 h-8 px-2.5 rounded-xl bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs font-semibold hover:bg-red-200 dark:hover:bg-red-900/70 hover:text-red-900 dark:hover:text-red-100 transition-colors cursor-pointer whitespace-nowrap"
                title="পোর্টাল থেকে লগআউট করুন"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden lg:inline">লগআউট</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Swipeable Quick-Actions Bar (Horizontal Touch Bar) */}
        <div className="flex sm:hidden overflow-x-auto no-scrollbar gap-1.5 px-3 py-2 border-t border-emerald-900/5 dark:border-emerald-800/30 bg-emerald-50/50 dark:bg-emerald-950/30 touch-pan-x">
          <button
            type="button"
            onClick={handleOpenDirectBooking}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold whitespace-nowrap shadow-xs active:scale-95 shrink-0"
            title="নতুন সিরিয়াল বুকিং"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>নতুন সিরিয়াল</span>
          </button>

          <button
            type="button"
            onClick={() => setShowScheduleModal(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-100/90 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-xs font-bold whitespace-nowrap shadow-xs active:scale-95 shrink-0"
          >
            <Settings className="w-3.5 h-3.5 text-amber-500" />
            <span>শিডিউল</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingTemplates(JSON.parse(JSON.stringify(templatesConfig)));
              setTemplateSaveFeedback(null);
              setShowTemplateModal(true);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-[#192a23] border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 hover:text-emerald-950 dark:hover:text-emerald-100 text-xs font-bold whitespace-nowrap shadow-xs active:scale-95 shrink-0"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>টেমপ্লেট</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPrintModal(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#192a23] border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold whitespace-nowrap shadow-xs active:scale-95 shrink-0"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-600" />
            <span>প্রিন্ট</span>
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
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-bold whitespace-nowrap shadow-xs active:scale-95 shrink-0"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
            <span>পাসওয়ার্ড</span>
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#192a23] border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold whitespace-nowrap shadow-xs shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>ওয়েবসাইট</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] w-full mx-auto p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
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

        {/* Interactive Confirm & Send Message Action Prompt Banner */}
        {confirmPromptApt && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-800 to-emerald-950 text-white text-xs sm:text-sm font-semibold flex flex-wrap items-center justify-between gap-3 shadow-lg border border-emerald-600/80 animate-slide-down">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-amber-300 shrink-0" />
              <span>
                <strong>{confirmPromptApt.patientName}</strong>-এর সিরিয়াল (#{confirmPromptApt.serialNo}) সফলভাবে নিশ্চিত হয়েছে! আপনি কি রোগীকে এখনই কনফার্মেশন বার্তা পাঠাতে চান?
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const apt = confirmPromptApt;
                  setConfirmPromptApt(null);
                  handleOpenMessageModal(apt, 'confirm');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-white" />
                <span>হ্যাঁ, মেসেজ পাঠান</span>
              </button>
              <button
                type="button"
                onClick={() => setConfirmPromptApt(null)}
                className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-medium cursor-pointer"
              >
                পরে পাঠাব
              </button>
            </div>
          </div>
        )}

        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {/* Card 1 */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#13201a] border border-emerald-900/10 dark:border-emerald-700/30 shadow-sm space-y-1">
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

          {/* Card 3 - Today's Appointments */}
          <button
            type="button"
            onClick={() => {
              if (filterDate !== todayStr) {
                setFilterDate(todayStr);
                setSortBy('slot_asc');
              } else {
                setFilterDate('');
              }
            }}
            className={`p-4 sm:p-5 rounded-2xl border shadow-sm space-y-1 text-left transition-all cursor-pointer ${
              filterDate === todayStr
                ? 'bg-emerald-100 dark:bg-emerald-900/60 border-emerald-500 ring-2 ring-emerald-500/40'
                : 'bg-white dark:bg-[#13201a] border-emerald-900/10 dark:border-emerald-700/30 hover:border-emerald-400'
            }`}
            title="ক্লিক করে আজকের সিরিয়ালগুলো স্লটের সময় অনুযায়ী ফিল্টার করুন"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 block">
                আজকের সিরিয়াল
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                {todayDhaka.day}/{todayDhaka.month}
              </span>
            </div>
            <div className="font-serif text-2xl sm:text-3xl font-black text-emerald-950 dark:text-emerald-50">
              {toBengaliNumber(todayCount)}
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-500 flex items-center justify-between">
              <span>আজকের অ্যাপয়েন্টমেন্ট</span>
              {filterDate === todayStr && <span className="text-amber-500 font-bold text-[10px]">(ফিল্টার সক্রিয়)</span>}
            </span>
          </button>

          {/* Card 4 */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#13201a] border border-emerald-900/10 dark:border-emerald-700/30 shadow-sm space-y-1">
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
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#13201a] border border-emerald-900/10 dark:border-emerald-700/30 shadow-sm space-y-1 col-span-2 sm:col-span-1">
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
        <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-[#13201a] border border-emerald-900/10 dark:border-emerald-700/30 shadow-sm space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-3.5">
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

          {/* Filter & Sort Controls: 2x2 grid on mobile, row on desktop */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {/* Sort Control */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-[11px] sm:text-xs font-semibold text-emerald-800 dark:text-emerald-300 shrink-0 flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                সর্ট:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full sm:w-auto py-1.5 px-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#13201a] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="created_desc">সর্বশেষ বুকিং আগে</option>
                <option value="created_asc">পুরনো বুকিং আগে</option>
                <option value="slot_asc">স্লটের সময়: আগে থেকে পরে (সময়ক্রম)</option>
                <option value="slot_desc">স্লটের সময়: পরে থেকে আগে</option>
                <option value="date_asc">তারিখ: নিকটবর্তী আগে</option>
                <option value="date_desc">তারিখ: দূরবর্তী আগে</option>
                <option value="serial_asc">সিরিয়াল নং: ছোট থেকে বড়</option>
                <option value="serial_desc">সিরিয়াল নং: বড় থেকে ছোট</option>
                <option value="name_asc">রোগীর নাম: ক-হ / A-Z</option>
                <option value="name_desc">রোগীর নাম: হ-ক / Z-A</option>
              </select>
            </div>

            {/* Chamber Filter */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-[11px] sm:text-xs font-semibold text-emerald-800 dark:text-emerald-300 shrink-0">
                চেম্বার:
              </span>
              <select
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value)}
                className="w-full sm:w-auto py-1.5 px-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#13201a] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                className="w-full sm:w-auto py-1.5 px-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#13201a] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
            <div className="col-span-2 sm:col-span-1 flex flex-wrap items-center justify-between sm:justify-start gap-1.5 sm:gap-2">
              <span className="text-[11px] sm:text-xs font-semibold text-emerald-800 dark:text-emerald-300 shrink-0 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>তারিখ:</span>
              </span>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="flex-1 sm:flex-initial py-1.5 px-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#13201a] text-xs font-medium text-emerald-950 dark:text-emerald-100 dark:[color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              />
              {filterDate && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSortBy(sortBy === 'slot_asc' ? 'created_desc' : 'slot_asc')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                      sortBy === 'slot_asc'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-200'
                    }`}
                    title="ঐদিনের স্লটের সময়ক্রম অনুযায়ী রোগীদের সাজান (সকাল থেকে রাত)"
                  >
                    <Clock className="w-3 h-3" />
                    <span>স্লট সময়ক্রম</span>
                    {sortBy === 'slot_asc' && <Check className="w-3 h-3 ml-0.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterDate('')}
                    className="text-xs text-red-500 hover:underline shrink-0 font-medium px-1"
                  >
                    রিসেট
                  </button>
                </div>
              )}
            </div>

            {/* Direct Booking Shortcut Button */}
            <button
              type="button"
              onClick={handleOpenDirectBooking}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-2xs hover:shadow-xs transition-all shrink-0 cursor-pointer"
              title="নতুন রোগী সিরিয়াল তৈরি করুন"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">নতুন</span>
              <span>সিরিয়াল</span>
            </button>

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
        <div id="appointments-section" className="rounded-2xl bg-white dark:bg-[#13201a] border border-emerald-900/10 dark:border-emerald-700/30 shadow-sm overflow-hidden">
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
                <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[960px]">
                  <thead className="bg-emerald-50/80 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 font-bold border-b border-emerald-900/10 dark:border-emerald-800/40 select-none">
                    <tr>
                      <th
                        onClick={() => setSortBy(sortBy === 'serial_asc' ? 'serial_desc' : 'serial_asc')}
                        className="py-3 px-3.5 w-[135px] min-w-[130px] cursor-pointer hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 select-none transition-colors"
                        title="সিরিয়াল অনুযায়ী সর্ট করুন"
                      >
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <span>সিরিয়াল নং</span>
                          {sortBy === 'serial_asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                          ) : sortBy === 'serial_desc' ? (
                            <ArrowDown className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 text-emerald-400/70 opacity-60" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => setSortBy(sortBy === 'name_asc' ? 'name_desc' : 'name_asc')}
                        className="py-3 px-3.5 w-[185px] min-w-[165px] cursor-pointer hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 select-none transition-colors"
                        title="রোগীর নাম অনুযায়ী সর্ট করুন"
                      >
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <span>রোগীর নাম ও যোগাযোগ</span>
                          {sortBy === 'name_asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                          ) : sortBy === 'name_desc' ? (
                            <ArrowDown className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 text-emerald-400/70 opacity-60" />
                          )}
                        </div>
                      </th>
                      <th className="py-3 px-3.5 w-[115px] min-w-[105px] whitespace-nowrap">চেম্বার</th>
                      <th
                        onClick={() => setSortBy(sortBy === 'slot_asc' ? 'slot_desc' : 'slot_asc')}
                        className="py-3 px-3.5 w-[165px] min-w-[150px] cursor-pointer hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 select-none transition-colors"
                        title="স্লটের সময় অনুযায়ী সর্ট করুন (আগে থেকে পরে)"
                      >
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <span>তারিখ ও সময় স্লট</span>
                          {sortBy === 'slot_asc' || sortBy === 'date_asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                          ) : sortBy === 'slot_desc' || sortBy === 'date_desc' ? (
                            <ArrowDown className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 text-emerald-400/70 opacity-60" />
                          )}
                        </div>
                      </th>
                      <th className="py-3 px-3.5 w-[140px] max-w-[150px] whitespace-nowrap">সমস্যার বিবরণ</th>
                      <th className="py-3 px-3.5 w-[145px] min-w-[135px] whitespace-nowrap">স্ট্যাটাস</th>
                      <th className="py-3 px-3.5 w-[215px] min-w-[205px] text-right whitespace-nowrap">অ্যাকশন ও যোগাযোগ</th>
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
                        <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-100/80 dark:bg-emerald-950/80 border border-emerald-300/70 dark:border-emerald-800/80 font-mono text-[11px] font-bold text-emerald-950 dark:text-emerald-200 tracking-tight shadow-2xs select-all">
                            <span>{apt.serialNo}</span>
                          </div>
                          {apt.status === 'cancelled' && (
                            <div className="mt-1">
                              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800 whitespace-nowrap">
                                বাতিলকৃত
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Patient */}
                        <td className="py-3 px-3.5 align-middle">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-emerald-950 dark:text-emerald-100 text-xs sm:text-[13px] leading-snug">
                              {apt.patientName}
                            </span>
                            {isForeignPatient(apt) && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 shadow-2xs whitespace-nowrap">
                                <span>🌍</span>
                                <span>বিদেশী রোগী</span>
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-medium mt-0.5">
                            {apt.phone}
                          </div>
                          {apt.email && (
                            <div
                              className="text-[10.5px] text-emerald-700/80 dark:text-emerald-400/80 flex items-center gap-1 mt-0.5 font-sans"
                              title={apt.email}
                            >
                              <Mail className="w-3 h-3 shrink-0 opacity-70" />
                              <span className="truncate max-w-[140px]">{apt.email}</span>
                            </div>
                          )}
                          {apt.createdAt && (
                            <div
                              className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-1 font-sans"
                              title={`অনুরোধ আসার সময়: ${new Date(apt.createdAt).toLocaleString('bn-BD')}`}
                            >
                              <Clock className="w-2.5 h-2.5 shrink-0 opacity-70 text-emerald-600 dark:text-emerald-400" />
                              <span>অনুরোধ: <strong className="font-semibold text-emerald-900 dark:text-emerald-300">{formatRelativeTimeBn(apt.createdAt)}</strong></span>
                            </div>
                          )}
                        </td>

                        {/* Chamber */}
                        <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              apt.chamberMode === 'offline'
                                ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 border border-emerald-200/80 dark:border-emerald-800/60'
                                : 'bg-sky-100 dark:bg-sky-950/60 text-sky-900 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/60'
                            }`}
                          >
                            {apt.chamberMode === 'offline' ? (
                              <MapPin className="w-3 h-3 shrink-0 text-emerald-700 dark:text-emerald-400" />
                            ) : (
                              <Video className="w-3 h-3 shrink-0 text-sky-700 dark:text-sky-400" />
                            )}
                            <span>{apt.chamberTitleBn}</span>
                          </span>
                        </td>

                        {/* Date & Slot */}
                        <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                          <div className="font-semibold text-emerald-950 dark:text-emerald-100 flex items-center gap-1 text-[11px] sm:text-xs">
                            <Calendar className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>{apt.dateFormattedBn}</span>
                          </div>
                          <div className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold font-mono flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>{apt.slotTimeBn}</span>
                          </div>
                          {apt.status === 'cancelled' && (
                            <div className="mt-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>স্লট খালি রয়েছে</span>
                            </div>
                          )}
                        </td>

                        {/* Complaints */}
                        <td className="py-3 px-3.5 align-middle w-[140px] max-w-[150px]">
                          {apt.complaints ? (
                            <div
                              className="text-[11px] text-emerald-900/90 dark:text-emerald-200/90 line-clamp-2 leading-relaxed cursor-help"
                              title={apt.complaints}
                            >
                              {apt.complaints.length > 22 ? `${apt.complaints.slice(0, 22)}...` : apt.complaints}
                            </div>
                          ) : (
                            <span className="text-xs text-emerald-800/40 dark:text-emerald-500/40 font-mono">—</span>
                          )}
                          {apt.rescheduledReason && (
                            <div
                              className="text-[10px] text-indigo-700 dark:text-indigo-300 mt-1 font-medium bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 truncate"
                              title={`রিশিডিউল: ${apt.rescheduledReason}`}
                            >
                              রিশিডিউল: {apt.rescheduledReason.length > 14 ? `${apt.rescheduledReason.slice(0, 14)}...` : apt.rescheduledReason}
                            </div>
                          )}
                          {apt.cancellationReason && (
                            <div
                              className="text-[10px] text-rose-700 dark:text-rose-300 mt-1 font-medium bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-900/60 truncate"
                              title={`বাতিল: ${apt.cancellationReason}`}
                            >
                              বাতিল: {apt.cancellationReason.length > 14 ? `${apt.cancellationReason.slice(0, 14)}...` : apt.cancellationReason}
                            </div>
                          )}
                        </td>

                        {/* Status Badges & Quick Dropdown */}
                        <td className="py-3 px-3.5 align-middle whitespace-nowrap space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {apt.status === 'pending' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                অপেক্ষমাণ
                              </span>
                            )}
                            {apt.status === 'confirmed' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                নিশ্চিত
                              </span>
                            )}
                            {apt.status === 'rescheduled' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700/60">
                                <Clock className="w-2.5 h-2.5" />
                                রিশিডিউলকৃত
                              </span>
                            )}
                            {apt.status === 'completed' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-700/60">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                সম্পন্ন
                              </span>
                            )}
                            {apt.status === 'cancelled' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-700/60">
                                <Ban className="w-2.5 h-2.5" />
                                বাতিল
                              </span>
                            )}
                          </div>

                          {/* Message Sent Track Badge / Action Indicator */}
                          {apt.status !== 'cancelled' && (
                            <div className="pt-0.5">
                              {apt.messageSent ? (
                                <button
                                  type="button"
                                  onClick={() => handleToggleMessageSent(apt.id, apt.messageChannel || 'manual', false)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 hover:bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:hover:bg-teal-900/80 dark:text-teal-300 border border-teal-300 dark:border-teal-700 transition-all cursor-pointer"
                                  title={apt.messageSentAt ? `বার্তা পাঠানো হয়েছে (${formatRelativeTimeBn(apt.messageSentAt)}) — ক্লিক করে রিমুভ করুন` : 'ক্লিক করে রিমুভ করুন'}
                                >
                                  <Check className="w-2.5 h-2.5 text-teal-600 dark:text-teal-400 stroke-[3]" />
                                  <span>মেসেজ প্রেরিত</span>
                                  {apt.messageChannel === 'whatsapp' && <span className="opacity-75 font-mono text-[9px]">(WA)</span>}
                                  {apt.messageChannel === 'sms' && <span className="opacity-75 font-mono text-[9px]">(SMS)</span>}
                                </button>
                              ) : apt.status === 'confirmed' ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenMessageModal(apt, 'confirm')}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 hover:bg-amber-100/80 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300/70 dark:border-amber-700/50 transition-all cursor-pointer"
                                  title="রোগীকে কনফার্মেশন মেসেজ পাঠান"
                                >
                                  <MessageCircle className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                                  <span>মেসেজ বাকি</span>
                                </button>
                              ) : null}
                            </div>
                          )}

                          {apt.status !== 'cancelled' ? (
                            <select
                              value={apt.status}
                              onChange={(e) =>
                                handleUpdateStatus(apt.id, e.target.value as AppointmentStatus)
                              }
                              className="w-full py-1 px-1.5 rounded-lg text-[11px] font-semibold border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#192a23] text-emerald-950 dark:text-emerald-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-2xs"
                            >
                              {apt.status === 'pending' && (
                                <option value="pending" disabled>
                                  অপেক্ষমাণ (নতুন অনুরোধ)
                                </option>
                              )}
                              <option value="confirmed">নিশ্চিত করুন</option>
                              <option value="completed">সম্পন্ন (Completed)</option>
                              <option value="cancelled">বাতিল (Cancelled)</option>
                            </select>
                          ) : (
                            <span className="text-[10.5px] text-zinc-500 italic block">
                              স্লট উন্মুক্ত রয়েছে
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3.5 align-middle text-right whitespace-nowrap">
                          {apt.status === 'cancelled' ? (
                            <div className="grid grid-cols-2 gap-1.5 w-[215px] ml-auto">
                              {/* 1. Print Slip */}
                              <button
                                type="button"
                                onClick={() => printSinglePageSerialSlip(apt)}
                                className="inline-flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 text-[11px] font-bold shadow-xs transition-all cursor-pointer"
                                title="১ পৃষ্ঠার ডিজিটাল স্লিপ দেখুন বা প্রিন্ট করুন"
                              >
                                <Printer className="w-3 h-3 shrink-0" />
                                <span>স্লিপ প্রিন্ট</span>
                              </button>

                              {/* 2. Send Custom Message */}
                              <button
                                type="button"
                                onClick={() => handleOpenMessageModal(apt, 'cancel')}
                                className="inline-flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white text-[11px] font-bold shadow-xs cursor-pointer transition-all"
                                title="রোগীকে কাস্টমাইজড বাতিল বার্তা বা নোটিশ পাঠান"
                              >
                                <MessageCircle className="w-3 h-3 fill-white shrink-0" />
                                <span>মেসেজ</span>
                              </button>

                              {/* 3. Restore Appointment */}
                              <button
                                type="button"
                                onClick={() => setRestoreTargetApt(apt)}
                                className="inline-flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold shadow-xs transition-all cursor-pointer"
                                title="বাতিল সিরিয়ালটি পুনরায় সক্রিয় করুন"
                              >
                                <RotateCcw className="w-3 h-3 shrink-0" />
                                <span>সক্রিয় করুন</span>
                              </button>

                              {/* 4. Delete Permanently */}
                              <button
                                type="button"
                                onClick={() => setDeleteTargetApt(apt)}
                                className="inline-flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-[11px] font-bold shadow-xs transition-all cursor-pointer"
                                title="ডাটাবেজ থেকে চিরতরে মুছে ফেলুন"
                              >
                                <Trash2 className="w-3 h-3 shrink-0" />
                                <span>মুছে ফেলুন</span>
                              </button>
                            </div>
                          ) : apt.status === 'pending' ? (
                            <div className="grid grid-cols-2 gap-1.5 w-[215px] ml-auto">
                              {/* Primary Confirm */}
                              <button
                                type="button"
                                onClick={() => handleConfirmAndNotifyPrompt(apt)}
                                className="col-span-2 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold shadow-md hover:shadow-lg transition-all cursor-pointer animate-pulse hover:animate-none"
                                title="সিরিয়াল নিশ্চিত করুন ও রোগীর ইমেইলে কনফার্মেশন পাঠান"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                <span>সিরিয়াল নিশ্চিত করুন</span>
                              </button>

                              {/* Reschedule */}
                              <button
                                type="button"
                                onClick={() => handleOpenReschedule(apt)}
                                className="inline-flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold shadow-xs transition-all cursor-pointer"
                                title="সিরিয়ালের তারিখ ও সময় পরিবর্তন"
                              >
                                <Clock className="w-3 h-3 shrink-0" />
                                <span>রিশিডিউল</span>
                              </button>

                              {/* Cancel */}
                              <button
                                type="button"
                                onClick={() => handleOpenCancelModal(apt)}
                                className="inline-flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-[11px] font-bold shadow-xs transition-all cursor-pointer"
                                title="সিরিয়াল বাতিল করুন"
                              >
                                <Ban className="w-3 h-3 shrink-0" />
                                <span>বাতিল</span>
                              </button>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-1.5 w-[215px] ml-auto">
                              {/* 1. Reschedule Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenReschedule(apt)}
                                className="inline-flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold shadow-xs transition-all cursor-pointer"
                                title="সিরিয়ালের তারিখ ও সময় পরিবর্তন এবং রোগীকে ইমেইল নোটিফিকেশন প্রদান"
                              >
                                <Clock className="w-3 h-3 shrink-0" />
                                <span>রিশিডিউল</span>
                              </button>

                              {/* 2. Print Single-Page Slip */}
                              <button
                                type="button"
                                onClick={() => printSinglePageSerialSlip(apt)}
                                className="inline-flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 text-[11px] font-bold shadow-xs transition-all cursor-pointer"
                                title="১ পৃষ্ঠার অফিসিয়াল ডিজিটাল স্লিপ প্রিন্ট করুন"
                              >
                                <Printer className="w-3 h-3 shrink-0" />
                                <span>স্লিপ প্রিন্ট</span>
                              </button>

                              {/* 3. Send Message */}
                              <button
                                type="button"
                                onClick={() => handleOpenMessageModal(apt, 'confirm')}
                                className={`inline-flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-lg text-[11px] font-bold shadow-xs cursor-pointer transition-all ${
                                  apt.messageSent
                                    ? 'bg-teal-700 hover:bg-teal-800 text-white'
                                    : 'bg-[#25D366] hover:bg-[#20bd5a] text-white'
                                }`}
                                title={apt.messageSent ? 'বার্তা ইতিমধ্যে পাঠানো হয়েছে (পুনরায় পাঠাতে বা দেখতে ক্লিক করুন)' : 'বার্তাটি পছন্দমতো কাস্টমাইজ করে হোয়াটসঅ্যাপে বা এসএমএসে পাঠান'}
                              >
                                {apt.messageSent ? (
                                  <Check className="w-3 h-3 text-white stroke-[2.5]" />
                                ) : (
                                  <MessageCircle className="w-3 h-3 fill-white shrink-0" />
                                )}
                                <span>{apt.messageSent ? 'মেসেজ প্রেরিত' : 'মেসেজ'}</span>
                              </button>

                              {/* 4. Cancel Appointment */}
                              <button
                                type="button"
                                onClick={() => handleOpenCancelModal(apt)}
                                className="inline-flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-[11px] font-bold shadow-xs transition-all cursor-pointer"
                                title="সিরিয়াল বাতিল করুন এবং স্লটটি তৎক্ষণাৎ নতুন রোগীর জন্য উন্মুক্ত করে দিন"
                              >
                                <Ban className="w-3 h-3 shrink-0" />
                                <span>বাতিল</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE & TABLET PATIENT CARDS VIEW (Shown on Mobile screens: block lg:hidden) */}
              <div className="block lg:hidden p-3 sm:p-4 space-y-3.5 bg-emerald-950/5 dark:bg-[#08120d]/60">
                {paginatedAppointments.map((apt, idx) => {
                  const isEven = idx % 2 === 0;
                  const isCancelled = apt.status === 'cancelled';
                  const seqNumber = (validCurrentPage - 1) * ITEMS_PER_PAGE + idx + 1;
                  const statusAccent =
                    apt.status === 'confirmed'
                      ? 'border-l-4 border-l-emerald-500'
                      : apt.status === 'pending'
                      ? 'border-l-4 border-l-amber-500'
                      : apt.status === 'rescheduled'
                      ? 'border-l-4 border-l-indigo-500'
                      : apt.status === 'completed'
                      ? 'border-l-4 border-l-blue-500'
                      : 'border-l-4 border-l-rose-500';

                  const cardBg = isCancelled
                    ? 'bg-rose-50/40 dark:bg-rose-950/25 border-rose-200 dark:border-rose-900/50'
                    : isEven
                    ? 'bg-white dark:bg-[#13201a] border-emerald-900/15 dark:border-emerald-700/40 shadow-xs'
                    : 'bg-[#f4f9f6] dark:bg-[#182921] border-emerald-900/20 dark:border-emerald-600/50 shadow-xs';

                  return (
                    <div
                      key={apt.id}
                      className={`rounded-2xl border ${statusAccent} ${cardBg} p-3.5 sm:p-4 transition-all relative overflow-hidden`}
                    >
                      {/* Card Top: Structured 2-tier header for perfect mobile alignment & aesthetics */}
                      <div className="mb-2.5 pb-2.5 border-b border-emerald-900/10 dark:border-emerald-700/30 space-y-2">
                        {/* Row 1: Serial Badge + Status & Quick Delete */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-black text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 bg-emerald-100/90 dark:bg-emerald-900/70 px-2.5 py-0.5 rounded-lg border border-emerald-300/40 shadow-2xs">
                            {apt.serialNo}
                          </span>

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

                        {/* Row 2: Consultation Chamber Pill + Message Sent Badge */}
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold whitespace-nowrap shadow-2xs ${
                              apt.chamberMode === 'offline'
                                ? 'bg-emerald-100/90 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/60'
                                : 'bg-sky-100/90 dark:bg-sky-950/60 text-sky-900 dark:text-sky-200 border border-sky-200 dark:border-sky-800/60'
                            }`}
                          >
                            {apt.chamberMode === 'offline' ? (
                              <MapPin className="w-3 h-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Video className="w-3 h-3 shrink-0 text-sky-600 dark:text-sky-400" />
                            )}
                            <span>{apt.chamberTitleBn}</span>
                          </span>

                          {apt.messageSent && (
                            <button
                              type="button"
                              onClick={() => handleToggleMessageSent(apt.id, apt.messageChannel || 'manual', false)}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 hover:bg-teal-200 text-teal-800 dark:bg-teal-950/80 dark:hover:bg-teal-900 dark:text-teal-300 border border-teal-300 dark:border-teal-700/60 cursor-pointer transition-colors shrink-0 shadow-2xs"
                              title={apt.messageSentAt ? `মেসেজ পাঠানো হয়েছে (${formatRelativeTimeBn(apt.messageSentAt)}) — ক্লিক করে রিমুভ করুন` : 'ক্লিক করে রিমুভ করুন'}
                            >
                              <Check className="w-2.5 h-2.5 text-teal-600 dark:text-teal-400 stroke-[3]" />
                              <span>মেসেজ প্রেরিত</span>
                            </button>
                          )}
                        </div>
                      </div>

                    {/* Patient Name & Quick Dial/WhatsApp Direct Touch Buttons */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-sm sm:text-base text-emerald-950 dark:text-emerald-50 leading-tight">
                            {apt.patientName}
                          </h3>
                          {isForeignPatient(apt) && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 shadow-2xs whitespace-nowrap">
                              <span>🌍</span>
                              <span>বিদেশী রোগী</span>
                            </span>
                          )}
                        </div>
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
                        {apt.createdAt && (
                          <div
                            className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-1 font-sans"
                            title={`অনুরোধ আসার সময়: ${new Date(apt.createdAt).toLocaleString('bn-BD')}`}
                          >
                            <Clock className="w-2.5 h-2.5 shrink-0 opacity-70 text-emerald-600 dark:text-emerald-400" />
                            <span>অনুরোধ: <strong className="font-semibold text-emerald-900 dark:text-emerald-300">{formatRelativeTimeBn(apt.createdAt)}</strong></span>
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
                          href={getWhatsAppUrl(
                            apt.phone,
                            `প্রিয় ${apt.patientName}, দেবজ্যোতি দত্তের চেম্বার থেকে আপনার সিরিয়াল (${apt.serialNo}) সংক্রান্ত বার্তা:`
                          )}
                          onClick={() => handleToggleMessageSent(apt.id, 'whatsapp', true)}
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
                          className="py-1 px-2.5 rounded-lg text-xs font-semibold border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#192a23] text-emerald-950 dark:text-emerald-100 focus:outline-none"
                        >
                          {apt.status === 'pending' && (
                            <option value="pending" disabled>
                              অপেক্ষমাণ (নতুন অনুরোধ)
                            </option>
                          )}
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
                        <div className="space-y-2">
                          {apt.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => handleConfirmAndNotifyPrompt(apt)}
                              className="w-full inline-flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 text-white text-xs font-bold shadow-md active:scale-95 animate-pulse hover:animate-none cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                              <span>সিরিয়াল নিশ্চিত করুন (Confirm)</span>
                            </button>
                          )}

                          {apt.status === 'pending' && (
                            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/50 text-[11px] text-amber-900 dark:text-amber-300 flex items-center gap-1.5 font-medium">
                              <Lock className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                              <span>সিরিয়াল নিশ্চিত করার পর মেসেজ ও স্লিপ প্রিন্ট সক্রিয় হবে</span>
                            </div>
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
                              disabled={apt.status === 'pending'}
                              onClick={() => {
                                if (apt.status === 'pending') {
                                  showAlert('প্রথমে সিরিয়াল নিশ্চিত করুন। তারপর ডিজিটাল স্লিপ প্রিন্ট করা যাবে।', 'সিরিয়াল অপেক্ষমাণ', 'warning');
                                  return;
                                }
                                printSinglePageSerialSlip(apt);
                              }}
                              className={`inline-flex items-center justify-center gap-1 py-2 px-2 rounded-lg border text-xs font-bold shadow-xs active:scale-95 ${
                                apt.status === 'pending'
                                  ? 'border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800/40 text-zinc-400 dark:text-zinc-500 opacity-50 cursor-not-allowed'
                                  : 'border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200'
                              }`}
                            >
                              {apt.status === 'pending' ? <Lock className="w-3.5 h-3.5 text-zinc-400" /> : <Printer className="w-3.5 h-3.5" />}
                              <span>স্লিপ প্রিন্ট</span>
                            </button>

                            {/* 3. Send Message */}
                            <button
                              type="button"
                              disabled={apt.status === 'pending'}
                              onClick={() => {
                                if (apt.status === 'pending') {
                                  showAlert('প্রথমে সিরিয়াল নিশ্চিত করুন। তারপর রোগীকে কনফার্মেশন বার্তা পাঠানো যাবে।', 'সিরিয়াল অপেক্ষমাণ', 'warning');
                                  return;
                                }
                                handleOpenMessageModal(apt, 'confirm');
                              }}
                              className={`inline-flex items-center justify-center gap-1 py-2 px-2 rounded-lg text-xs font-bold shadow-xs active:scale-95 transition-all ${
                                apt.status === 'pending'
                                  ? 'bg-zinc-300 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 opacity-50 cursor-not-allowed'
                                  : apt.messageSent
                                  ? 'bg-teal-700 hover:bg-teal-800 text-white'
                                  : 'bg-[#25D366] hover:bg-[#20bd5a] text-white'
                              }`}
                            >
                              {apt.status === 'pending' ? (
                                <Lock className="w-3.5 h-3.5 text-zinc-400" />
                              ) : apt.messageSent ? (
                                <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                              ) : (
                                <MessageCircle className="w-3.5 h-3.5 fill-white" />
                              )}
                              <span>{apt.messageSent ? 'মেসেজ প্রেরিত' : 'মেসেজ পাঠান'}</span>
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

                    {/* Card Bottom: Clear Visual End Marker & Serial Completion Indicator */}
                    <div className="mt-3 pt-2.5 border-t border-dashed border-emerald-900/10 dark:border-emerald-700/35 flex items-center justify-between text-[11px] text-emerald-800/80 dark:text-emerald-400/80">
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
                        <span>সিরিয়াল #{toBengaliNumber(seqNumber)} সমাপ্ত</span>
                      </span>
                      <span className="font-mono text-[10px] opacity-75">
                        আইডি: {apt.id.slice(-6)}
                      </span>
                    </div>
                  </div>
                );
              })}
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

        {/* Admin Dashboard Bottom Footer Note */}
        <div className="pt-8 pb-4 text-center text-xs text-emerald-800/60 dark:text-emerald-400/50 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-emerald-900/10 dark:border-emerald-800/30 mt-8">
          <div>
            © {new Date().getFullYear()} সর্বস্বত্ব <span className="font-semibold text-emerald-950 dark:text-emerald-200">WebZen Bangladesh</span> কর্তৃক সংরক্ষিত।
          </div>
          <div className="flex items-center gap-1.5">
            <span>Designed & Developed by</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-300">WebZen Bangladesh</span>
          </div>
        </div>
      </main>

      {/* RESCHEDULE APPOINTMENT MODAL */}
      {rescheduleApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl sm:rounded-3xl bg-white dark:bg-[#13201a] border border-amber-500/40 shadow-2xl p-4 sm:p-7 space-y-4 sm:space-y-6 max-h-[94vh] overflow-y-auto my-auto">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-emerald-900/10 dark:border-emerald-800/40 pb-3 sm:pb-4 gap-2.5">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>সিরিয়াল শিডিউল পরিবর্তন ও পুনর্বণ্টন</span>
                </div>
                <h3 className="font-serif font-bold text-xl text-emerald-950 dark:text-emerald-50">
                  অ্যাপয়েন্টমেন্ট রিশিডিউল করুন
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                  নতুন তারিখ ও সময় নির্বাচন করে রিশিডিউল সম্পন্ন করুন। পরবর্তীতে মেসেজ বাটনে ক্লিক করে রোগীকে নোটিফিকেশন পাঠাতে পারবেন।
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
                          : 'border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#192a23] hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-emerald-950 dark:text-emerald-100'
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
                    const isPast = isSlotPastTime(rescheduleDate, slot.startMinutes);
                    const isSelected = rescheduleSlotId === slot.id;
                    const isDisabled = isBooked || isPast;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => {
                          if (!isDisabled) {
                            setRescheduleSlotId(slot.id);
                            setRescheduleSlotTimeBn(slot.timeBn);
                            setRescheduleSlotTimeEn(slot.timeEn);
                          }
                        }}
                        className={`min-h-[58px] h-full p-2 rounded-xl border text-xs font-mono font-medium transition-all flex flex-col items-center justify-center ${
                          isBooked
                            ? 'opacity-40 bg-gray-100 dark:bg-gray-800/40 border-gray-300 cursor-not-allowed text-gray-500 line-through'
                            : isPast
                            ? 'opacity-40 bg-zinc-100 dark:bg-zinc-800/40 border-zinc-300 dark:border-zinc-700 cursor-not-allowed text-zinc-500'
                            : isSelected
                            ? 'bg-amber-500 text-white border-amber-600 shadow-md font-bold'
                            : 'bg-white dark:bg-[#192a23] border-emerald-200 dark:border-emerald-800 hover:border-emerald-500 text-emerald-950 dark:text-emerald-100'
                        }`}
                      >
                        <div className={isPast && !isBooked ? 'line-through decoration-zinc-400' : ''}>
                          {slot.shortBn || slot.timeBn}
                        </div>
                        <div className="text-[10px] opacity-80 font-sans">
                          {isBooked ? 'বুকড' : isPast ? 'টাইম ওভার' : slot.shortEn}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 3: Reschedule Reason */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-emerald-950 dark:text-emerald-200 uppercase tracking-wider">
                ৩. সময় পরিবর্তনের কারণ (ঐচ্ছিক):
              </label>
              <input
                type="text"
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                placeholder="যেমন: রোগীর অনুরোধে বা চেম্বারের সময় সমন্বয়"
                className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#192a23] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
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
            <div className="grid grid-cols-1 sm:flex sm:items-center sm:justify-end gap-2.5 pt-3 border-t border-emerald-900/10 dark:border-emerald-800/40">
              <button
                type="button"
                onClick={() => setRescheduleApt(null)}
                className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-800 text-center cursor-pointer"
              >
                বাতিল করুন
              </button>
              <button
                type="button"
                onClick={handleConfirmReschedule}
                disabled={rescheduleLoading || !rescheduleSlotId}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all cursor-pointer text-center"
              >
                {rescheduleLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>রিশিডিউল করা হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4" />
                    <span>রিশিডিউল করুন</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPREHENSIVE SCHEDULE & DAY-SPECIFIC / DATE-SPECIFIC SETTINGS MODAL */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-5xl rounded-2xl sm:rounded-3xl bg-white dark:bg-[#13201a] border border-emerald-500/30 shadow-2xl flex flex-col h-[92vh] h-[92dvh] max-h-[92vh] max-h-[92dvh] my-auto overflow-hidden">
            {/* Modal Header (Docked at Top) */}
            <div className="flex justify-between items-start border-b border-emerald-900/10 dark:border-emerald-800/40 p-4 sm:p-6 pb-3 sm:pb-4 gap-2.5 shrink-0 bg-white dark:bg-[#13201a] z-10">
              <div>
                <h3 className="font-serif font-bold text-lg sm:text-xl text-emerald-950 dark:text-emerald-50 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-amber-500 shrink-0" />
                  <span>চেম্বার শিডিউলার — সার্বজনীন ও ডে-স্পেসিফিক ইঞ্জিন</span>
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                  সার্বজনীন সময়ের পাশাপাশি প্রতিটি বারের জন্য আলাদা সময়সূচী বা নির্দিষ্ট তারিখের বিশেষ শিডিউল কনফিগার করুন
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="p-1.5 sm:p-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto overflow-x-hidden flex-1 overscroll-contain">

            {/* Chamber Tab Switch */}
            <div className="grid grid-cols-1 sm:grid-cols-2 rounded-2xl bg-emerald-100/70 dark:bg-emerald-950 p-1.5 gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setScheduleActiveChamber('offline')}
                className={`py-2.5 sm:py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  scheduleActiveChamber === 'offline'
                    ? 'bg-emerald-800 text-white shadow-md'
                    : 'text-emerald-900 dark:text-emerald-200 hover:bg-emerald-200/50'
                }`}
              >
                <MapPin className="w-4 h-4 text-amber-300 shrink-0" />
                <span>ঢাকা চেম্বার (সরাসরি)</span>
              </button>
              <button
                type="button"
                onClick={() => setScheduleActiveChamber('online')}
                className={`py-2.5 sm:py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  scheduleActiveChamber === 'online'
                    ? 'bg-emerald-800 text-white shadow-md'
                    : 'text-emerald-900 dark:text-emerald-200 hover:bg-emerald-200/50'
                }`}
              >
                <Video className="w-4 h-4 text-amber-300 shrink-0" />
                <span>অনলাইন ভিডিও কনসালটেশন</span>
              </button>
            </div>

            {/* TIMING TYPE SELECTOR (General vs Day-Specific) */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-amber-50/50 dark:from-emerald-950/50 dark:to-emerald-900/30 border border-emerald-200 dark:border-emerald-800/60 space-y-2.5 sm:space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
                <div>
                  <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-100 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    সময়সূচীর ধরন নির্ধারণ করুন
                  </h4>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                    {currentChamber.timingType === 'day_specific'
                      ? 'দিনভিত্তিক মোড সক্রিয়: সপ্তাহের প্রতিটি বারের জন্য আলাদা শুরুর সময়, সমাপ্তি ও বিরতি প্রযোজ্য।'
                      : 'সার্বজনীন মোড সক্রিয়: সপ্তাহের সকল সক্রিয় দিনের জন্য একই সময় প্রযোজ্য।'}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:flex rounded-xl bg-white dark:bg-[#13201a] p-1 border border-emerald-300 dark:border-emerald-700 shrink-0 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleUpdateTimingType('general')}
                    className={`px-3 py-2 sm:py-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
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
                    className={`px-3 py-2 sm:py-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
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
                <div className="p-5 rounded-2xl bg-white dark:bg-[#13201a] border border-emerald-900/10 dark:border-emerald-700/30 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-100 uppercase tracking-wider">
                      সার্বজনীন চেম্বার সময়সূচী (সকল সক্রিয় বারের জন্য)
                    </h4>
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-0.5 rounded-full">
                      স্লট সংখ্যা:{' '}
                      {(() => {
                        const hasGenBreak =
                          Number(currentChamber.generalTiming.breakDuration) > 0 &&
                          !!currentChamber.generalTiming.breakStart;
                        return toBengaliNumber(
                          calcSlotCount(
                            currentChamber.generalTiming.startTime,
                            currentChamber.generalTiming.endTime,
                            hasGenBreak ? currentChamber.generalTiming.breakStart : undefined,
                            hasGenBreak ? currentChamber.generalTiming.breakDuration : 0,
                            currentChamber.generalTiming.slotDuration
                          )
                        );
                      })()}
                      টি
                    </span>
                  </div>

                  <div className="space-y-4 text-xs">
                    {/* Time Inputs: 2 Columns for Start & End */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                    </div>

                    {/* Break Option in General Timing */}
                    {(() => {
                      const hasGenBreak =
                        Number(currentChamber.generalTiming.breakDuration) > 0 &&
                        !!currentChamber.generalTiming.breakStart;
                      return (
                        <div className="pt-2 border-t border-emerald-900/10 dark:border-emerald-800/20">
                          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <Coffee className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                              <span className="text-xs font-semibold text-emerald-950 dark:text-emerald-200">
                                মাঝপথে বিরতি (Break)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (hasGenBreak) {
                                  handleUpdateGeneralTiming('breakDuration', 0);
                                  handleUpdateGeneralTiming('breakStart', '');
                                } else {
                                  handleUpdateGeneralTiming('breakStart', '18:30');
                                  handleUpdateGeneralTiming('breakDuration', 30);
                                }
                              }}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                hasGenBreak
                                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300/80'
                                  : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-300/80'
                              }`}
                            >
                              {hasGenBreak ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-amber-600" />
                                  <span>
                                    বিরতি চালু ({toBengaliNumber(currentChamber.generalTiming.breakDuration)} মি.) — বন্ধ করুন
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>কোনো বিরতি নেই — বিরতি যোগ করুন</span>
                                </>
                              )}
                            </button>
                          </div>

                          {hasGenBreak ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2.5 p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 max-w-lg animate-fade-in">
                              <TimePicker12h
                                label="বিরতি শুরুর সময়"
                                value={currentChamber.generalTiming.breakStart || '18:30'}
                                onChange={(val) => handleUpdateGeneralTiming('breakStart', val)}
                              />
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                                    বিরতির সময়কাল
                                  </label>
                                  <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400">
                                    {toBengaliNumber(currentChamber.generalTiming.breakDuration)} মিনিট
                                  </span>
                                </div>
                                <div className="p-1 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#13201a] shadow-sm">
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
                                <div className="flex items-center gap-1.5 mt-1.5">
                                  {[15, 20, 30, 45].map((mins) => (
                                    <button
                                      key={mins}
                                      type="button"
                                      onClick={() => handleUpdateGeneralTiming('breakDuration', mins)}
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                                        currentChamber.generalTiming.breakDuration === mins
                                          ? 'bg-amber-600 text-white'
                                          : 'bg-white dark:bg-[#13201a] text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                      }`}
                                    >
                                      {toBengaliNumber(mins)} মি.
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-2 text-[11px] text-emerald-700/80 dark:text-emerald-400/80 italic">
                              ✓ কোনো বিরতি নেই — শুরুর সময় থেকে শেষ পর্যন্ত একনাগাড়ে সব স্লট উন্মুক্ত থাকবে।
                            </div>
                          )}
                        </div>
                      );
                    })()}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                            প্রতি রোগীর স্লট সময়কাল
                          </label>
                          <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            {toBengaliNumber(currentChamber.generalTiming.slotDuration || 15)} মিনিট
                          </span>
                        </div>
                        <div className="p-1 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#13201a] shadow-sm flex items-center gap-1">
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-emerald-900/10 dark:border-emerald-800/20 pb-2">
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
                    const isMultiSession = Array.isArray(dayObj.sessions) && dayObj.sessions.length > 0;
                    const daySlotCount = isEnabled ? calcDaySlotCount(dayObj) : 0;

                    return (
                      <div
                        key={dayIdx}
                        className={`p-4 rounded-2xl border transition-all space-y-3 ${
                          isEnabled
                            ? 'border-emerald-300 dark:border-emerald-700 bg-white dark:bg-[#13201a] shadow-sm'
                            : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/20 opacity-70'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="font-serif font-bold text-sm sm:text-base text-emerald-950 dark:text-emerald-100">
                              {dayObj.dayNameBn}
                            </span>
                            {isEnabled && (
                              <>
                                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                  মোট {toBengaliNumber(daySlotCount)}টি স্লট {isMultiSession ? `(${toBengaliNumber(dayObj.sessions!.length)}টি সেশন)` : ''}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleToggleDayMultiSession(dayIdx)}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border cursor-pointer active:scale-95 ${
                                    isMultiSession
                                      ? 'bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/80 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                                      : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                                  }`}
                                  title={isMultiSession ? 'একক সময় ব্লকে ফিরে যান' : 'সকাল, বিকাল ও রাত একাধিক ভাগে সেশন বিভক্ত করুন'}
                                >
                                  <Layers className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                  <span>{isMultiSession ? 'সেশন ভিত্তিক সক্রিয়' : 'একাধিক ভাগে সেশন করুন'}</span>
                                </button>
                              </>
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
                            {isMultiSession ? (
                              /* MULTI-SESSION BUILDER FOR THIS DAY */
                              <div className="space-y-2.5">
                                <div className="flex flex-wrap items-center justify-between text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                                  <span>এই দিনে একাধিক ভাগে সেশন নির্ধারিত (যেমন: সকাল, বিকাল, রাত):</span>
                                  <span className="text-[10px] opacity-75">প্রয়োজনমতো সময় ও স্লট নির্ধারণ করুন</span>
                                </div>

                                {dayObj.sessions!.map((sess, sIdx) => {
                                  const hasSessBreak = Number(sess.breakDuration) > 0 && !!sess.breakStart;
                                  const sessSlotCount = calcSlotCount(
                                    sess.startTime,
                                    sess.endTime,
                                    hasSessBreak ? sess.breakStart : undefined,
                                    hasSessBreak ? sess.breakDuration : 0,
                                    sess.slotDuration || dayObj.slotDuration || 15
                                  );

                                  return (
                                    <div
                                      key={sess.id || sIdx}
                                      className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 space-y-2.5 transition-all"
                                    >
                                      <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                          <span className="w-5 h-5 rounded-full bg-emerald-800 text-amber-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                                            {toBengaliNumber(sIdx + 1)}
                                          </span>
                                          <SessionTitleInput
                                            value={sess.titleBn || ''}
                                            placeholder="সেশনের নাম (যেমন: সকাল সেশন)"
                                            onChange={(val) =>
                                              handleUpdateDaySession(dayIdx, sIdx, 'titleBn', val)
                                            }
                                            className="py-1 px-2.5 rounded-lg border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-[#13201a] text-[16px] sm:text-xs font-bold text-emerald-950 dark:text-emerald-100 w-44 sm:w-48 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                          />
                                        </div>

                                        <div className="flex items-center gap-2">
                                          <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                                            {toBengaliNumber(sessSlotCount)}টি স্লট
                                          </span>
                                          {dayObj.sessions!.length > 1 && (
                                            <button
                                              type="button"
                                              onClick={() => handleRemoveDaySession(dayIdx, sIdx)}
                                              className="p-1 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                                              title="এই সেশনটি মুছুন"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                                        <TimePicker12h
                                          label="শুরুর সময়"
                                          value={sess.startTime || '09:30'}
                                          onChange={(val) =>
                                            handleUpdateDaySession(dayIdx, sIdx, 'startTime', val)
                                          }
                                        />
                                        <TimePicker12h
                                          label="সমাপ্তির সময়"
                                          value={sess.endTime || '11:30'}
                                          onChange={(val) =>
                                            handleUpdateDaySession(dayIdx, sIdx, 'endTime', val)
                                          }
                                        />
                                        <div>
                                          <div className="flex items-center justify-between mb-1">
                                            <label className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                                              স্লটের সময়
                                            </label>
                                            <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                              {toBengaliNumber(sess.slotDuration || dayObj.slotDuration || 15)} মি.
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1 flex-wrap">
                                            {[10, 15, 20, 30].map((mins) => (
                                              <button
                                                key={mins}
                                                type="button"
                                                onClick={() =>
                                                  handleUpdateDaySession(dayIdx, sIdx, 'slotDuration', mins)
                                                }
                                                className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                                                  (sess.slotDuration || dayObj.slotDuration || 15) === mins
                                                    ? 'bg-emerald-800 text-amber-300 shadow-xs'
                                                    : 'bg-white dark:bg-[#13201a] text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                                }`}
                                              >
                                                {toBengaliNumber(mins)} মি.
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Session Break Option */}
                                      <div className="pt-2 border-t border-emerald-900/10 dark:border-emerald-800/30">
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                          <div className="flex items-center gap-1.5">
                                            <Coffee className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                            <span className="text-[11px] font-semibold text-emerald-900 dark:text-emerald-200">
                                              মাঝপথে বিরতি (Break)
                                            </span>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (hasSessBreak) {
                                                handleUpdateDaySession(dayIdx, sIdx, 'breakDuration', 0);
                                                handleUpdateDaySession(dayIdx, sIdx, 'breakStart', '');
                                              } else {
                                                const sMin = parseTimeToMinutes(sess.startTime || '09:30');
                                                const eMin = parseTimeToMinutes(sess.endTime || '11:30');
                                                const midMin = Math.round((sMin + eMin) / 2 / 15) * 15;
                                                const bH = String(Math.floor(midMin / 60) % 24).padStart(2, '0');
                                                const bM = String(midMin % 60).padStart(2, '0');
                                                handleUpdateDaySession(dayIdx, sIdx, 'breakStart', `${bH}:${bM}`);
                                                handleUpdateDaySession(dayIdx, sIdx, 'breakDuration', 20);
                                              }
                                            }}
                                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                              hasSessBreak
                                                ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200'
                                                : 'bg-emerald-100/70 hover:bg-emerald-200/70 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                            }`}
                                          >
                                            {hasSessBreak ? (
                                              <>
                                                <Check className="w-3 h-3 text-amber-600" />
                                                <span>বিরতি চালু ({toBengaliNumber(sess.breakDuration)} মি.) — বন্ধ করুন</span>
                                              </>
                                            ) : (
                                              <>
                                                <Plus className="w-3 h-3 text-emerald-600" />
                                                <span>বিরতি নেই — বিরতি যোগ করুন</span>
                                              </>
                                            )}
                                          </button>
                                        </div>

                                        {hasSessBreak && (
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2 p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/40 animate-fade-in text-xs">
                                            <TimePicker12h
                                              label="বিরতি শুরুর সময়"
                                              value={sess.breakStart || '10:30'}
                                              onChange={(val) => handleUpdateDaySession(dayIdx, sIdx, 'breakStart', val)}
                                            />
                                            <div>
                                              <div className="flex items-center justify-between mb-1">
                                                <label className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                                                  বিরতির সময়কাল
                                                </label>
                                                <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400">
                                                  {toBengaliNumber(sess.breakDuration)} মিনিট
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-1">
                                                <input
                                                  type="number"
                                                  min="5"
                                                  max="120"
                                                  step="5"
                                                  value={sess.breakDuration}
                                                  onChange={(e) =>
                                                    handleUpdateDaySession(dayIdx, sIdx, 'breakDuration', Math.max(0, Number(e.target.value) || 0))
                                                  }
                                                  className="w-full py-1.5 px-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#13201a] font-mono text-xs text-center font-bold text-emerald-950 dark:text-emerald-100"
                                                />
                                                <div className="flex gap-1 shrink-0">
                                                  {[15, 20, 30].map((mins) => (
                                                    <button
                                                      key={mins}
                                                      type="button"
                                                      onClick={() => handleUpdateDaySession(dayIdx, sIdx, 'breakDuration', mins)}
                                                      className={`px-1.5 py-1 rounded text-[10px] font-bold cursor-pointer ${
                                                        sess.breakDuration === mins
                                                          ? 'bg-amber-600 text-white'
                                                          : 'bg-white dark:bg-[#13201a] text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
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
                                    </div>
                                  );
                                })}

                                <button
                                  type="button"
                                  onClick={() => handleAddDaySession(dayIdx)}
                                  className="w-full py-2.5 px-3 rounded-xl border border-dashed border-emerald-400 dark:border-emerald-700 bg-white/70 dark:bg-emerald-950/30 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                                >
                                  <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                  <span>+ আরও একটি সেশন/শিফট যোগ করুন (যেমন: বিকাল বা রাত)</span>
                                </button>
                              </div>
                            ) : (
                              /* SINGLE CONTINUOUS BLOCK WITH OPTIONAL BREAK */
                              <div className="space-y-3">
                                {/* Times: 2 Columns for Start & End */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                                </div>

                                {/* Slot Duration */}
                                <div className="max-w-xs">
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                                      প্রতি স্লটের সময়
                                    </label>
                                    <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                      {toBengaliNumber(dayObj.slotDuration ?? 15)} মিনিট
                                    </span>
                                  </div>
                                  <div className="p-1 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#13201a] shadow-sm flex items-center gap-1">
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

                                {/* Optional Break Section */}
                                {(() => {
                                  const hasDayBreak = Number(dayObj.breakDuration) > 0 && !!dayObj.breakStart;
                                  return (
                                    <div className="pt-2.5 border-t border-emerald-900/10 dark:border-emerald-800/20">
                                      <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 flex-wrap">
                                        <div className="flex items-center gap-1.5">
                                          <Coffee className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                          <span className="text-xs font-semibold text-emerald-950 dark:text-emerald-200">
                                            মাঝপথে বিরতি (Break)
                                          </span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (hasDayBreak) {
                                              handleUpdateDayTiming(dayIdx, 'breakDuration', 0);
                                              handleUpdateDayTiming(dayIdx, 'breakStart', '');
                                            } else {
                                              handleUpdateDayTiming(dayIdx, 'breakStart', '18:30');
                                              handleUpdateDayTiming(dayIdx, 'breakDuration', 30);
                                            }
                                          }}
                                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                            hasDayBreak
                                              ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300/80'
                                              : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-300/80'
                                          }`}
                                        >
                                          {hasDayBreak ? (
                                            <>
                                              <Check className="w-3.5 h-3.5 text-amber-600" />
                                              <span>বিরতি চালু ({toBengaliNumber(dayObj.breakDuration)} মি.) — বন্ধ করুন</span>
                                            </>
                                          ) : (
                                            <>
                                              <Plus className="w-3.5 h-3.5 text-emerald-600" />
                                              <span>কোনো বিরতি নেই — বিরতি যোগ করুন</span>
                                            </>
                                          )}
                                        </button>
                                      </div>

                                      {hasDayBreak ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2.5 p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 max-w-lg animate-fade-in">
                                          <TimePicker12h
                                            label="বিরতি শুরুর সময়"
                                            value={dayObj.breakStart || '18:30'}
                                            onChange={(val) => handleUpdateDayTiming(dayIdx, 'breakStart', val)}
                                          />
                                          <div>
                                            <div className="flex items-center justify-between mb-1">
                                              <label className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                                                বিরতির সময়কাল
                                              </label>
                                              <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400">
                                                {toBengaliNumber(dayObj.breakDuration)} মিনিট
                                              </span>
                                            </div>
                                            <div className="p-1 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#13201a] shadow-sm">
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
                                            <div className="flex items-center gap-1.5 mt-1.5">
                                              {[15, 20, 30, 45].map((mins) => (
                                                <button
                                                  key={mins}
                                                  type="button"
                                                  onClick={() => handleUpdateDayTiming(dayIdx, 'breakDuration', mins)}
                                                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                                                    dayObj.breakDuration === mins
                                                      ? 'bg-amber-600 text-white'
                                                      : 'bg-white dark:bg-[#13201a] text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                                  }`}
                                                >
                                                  {toBengaliNumber(mins)} মি.
                                                </button>
                                              ))}
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="mt-2 text-[11px] text-emerald-700/80 dark:text-emerald-400/80 italic">
                                          ✓ কোনো বিরতি নেই — শুরুর সময় থেকে শেষ পর্যন্ত একনাগাড়ে সব স্লট উন্মুক্ত থাকবে।
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SECTION: DATE-SPECIFIC SPECIAL SCHEDULES (ONE-OFF DATES / OVERRIDES) */}
            <div className="p-5 rounded-2xl bg-amber-50/60 dark:bg-[#192a23] border border-amber-300/60 dark:border-amber-800/40 space-y-4">
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
              <div className="p-4 rounded-xl bg-white/80 dark:bg-[#13201a]/80 border border-amber-200 dark:border-amber-900/40 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-900 dark:text-emerald-200 mb-1">
                      বিশেষ তারিখ নির্বাচন করুন <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={overrideDate}
                      onChange={(e) => setOverrideDate(e.target.value)}
                      className="w-full p-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#13201a] text-xs font-mono text-emerald-950 dark:text-emerald-100 dark:[color-scheme:dark] cursor-pointer"
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
                      className="w-full p-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#13201a] text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-900 dark:text-emerald-200 mb-1">
                      অবস্থা (Status)
                    </label>
                    <select
                      value={overrideEnabled ? 'open' : 'closed'}
                      onChange={(e) => setOverrideEnabled(e.target.value === 'open')}
                      className="w-full p-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#13201a] text-xs font-semibold"
                    >
                      <option value="open">সক্রিয় চেম্বার (Open for Booking)</option>
                      <option value="closed">ছুটি / বন্ধ (Closed)</option>
                    </select>
                  </div>
                </div>

                {overrideEnabled && (
                  <div className="space-y-3 pt-3 border-t border-amber-100 dark:border-amber-900/30 text-xs">
                    {/* Session Mode Selector */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-100/60 dark:bg-amber-950/40 border border-amber-300/60 dark:border-amber-800/60">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-amber-700 dark:text-amber-300" />
                        <span className="text-xs font-bold text-amber-950 dark:text-amber-200">
                          সেশন বিভাজন (একাধিক ভাগ / শিফট)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleToggleOverrideMultiSession}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          overrideIsMultiSession
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-white dark:bg-[#13201a] text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 hover:bg-amber-50'
                        }`}
                      >
                        <Split className="w-3.5 h-3.5" />
                        {overrideIsMultiSession ? 'সেশন ভিত্তিক সক্রিয়' : 'একাধিক ভাগে সেশন করুন'}
                      </button>
                    </div>

                    {overrideIsMultiSession ? (
                      /* Multi-Session Builder for Specific Date */
                      <div className="space-y-3 pt-1">
                        <div className="space-y-2">
                          {overrideSessions.map((session, sIdx) => {
                            const hasSessBreak = Number(session.breakDuration) > 0 && !!session.breakStart;
                            const sessSlots = calcSlotCount(
                              session.startTime,
                              session.endTime,
                              hasSessBreak ? session.breakStart : undefined,
                              hasSessBreak ? session.breakDuration : 0,
                              session.slotDuration || overrideSlotDuration || 15
                            );
                            return (
                              <div
                                key={session.id || sIdx}
                                className="p-3 rounded-xl bg-amber-100/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 space-y-2.5"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 flex-1">
                                    <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold">
                                      {toBengaliNumber(sIdx + 1)}
                                    </span>
                                    <SessionTitleInput
                                      value={session.titleBn || ''}
                                      placeholder="যেমন: সকাল সেশন / বিকাল সেশন"
                                      onChange={(val) =>
                                        handleUpdateOverrideSession(sIdx, 'titleBn', val)
                                      }
                                      className="font-bold text-[16px] sm:text-xs bg-white dark:bg-[#13201a] px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-100 w-44 sm:w-48 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 font-mono">
                                      {toBengaliNumber(sessSlots)}টি স্লট
                                    </span>
                                    {overrideSessions.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveOverrideSession(sIdx)}
                                        className="p-1 rounded-lg text-red-500 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors cursor-pointer"
                                        title="এই সেশনটি মুছে ফেলুন"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                                  <TimePicker12h
                                    label="শুরুর সময়"
                                    value={session.startTime}
                                    onChange={(val) =>
                                      handleUpdateOverrideSession(sIdx, 'startTime', val)
                                    }
                                  />
                                  <TimePicker12h
                                    label="সমাপ্তির সময়"
                                    value={session.endTime}
                                    onChange={(val) =>
                                      handleUpdateOverrideSession(sIdx, 'endTime', val)
                                    }
                                  />
                                  <div>
                                    <label className="block text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
                                      প্রতি স্লট (মিনিট)
                                    </label>
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="number"
                                        min="5"
                                        max="120"
                                        step="5"
                                        value={session.slotDuration ?? overrideSlotDuration ?? 15}
                                        onChange={(e) =>
                                          handleUpdateOverrideSession(
                                            sIdx,
                                            'slotDuration',
                                            Number(e.target.value)
                                          )
                                        }
                                        className="w-full py-1.5 px-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#13201a] font-mono text-xs text-center font-bold text-emerald-950 dark:text-emerald-100"
                                      />
                                      <div className="flex gap-1">
                                        {[10, 15, 20].map((mins) => (
                                          <button
                                            key={mins}
                                            type="button"
                                            onClick={() =>
                                              handleUpdateOverrideSession(sIdx, 'slotDuration', mins)
                                            }
                                            className={`px-1.5 py-1 rounded text-[10px] font-bold cursor-pointer ${
                                              (session.slotDuration ?? 15) === mins
                                                ? 'bg-amber-600 text-white'
                                                : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                            }`}
                                          >
                                            {toBengaliNumber(mins)}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Session Break Option */}
                                <div className="pt-2 border-t border-amber-900/10 dark:border-amber-800/30">
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <div className="flex items-center gap-1.5">
                                      <Coffee className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                      <span className="text-[11px] font-semibold text-amber-950 dark:text-amber-200">
                                        মাঝপথে বিরতি (Break)
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (hasSessBreak) {
                                          handleUpdateOverrideSession(sIdx, 'breakDuration', 0);
                                          handleUpdateOverrideSession(sIdx, 'breakStart', '');
                                        } else {
                                          const sMin = parseTimeToMinutes(session.startTime || '09:30');
                                          const eMin = parseTimeToMinutes(session.endTime || '11:30');
                                          const midMin = Math.round((sMin + eMin) / 2 / 15) * 15;
                                          const bH = String(Math.floor(midMin / 60) % 24).padStart(2, '0');
                                          const bM = String(midMin % 60).padStart(2, '0');
                                          handleUpdateOverrideSession(sIdx, 'breakStart', `${bH}:${bM}`);
                                          handleUpdateOverrideSession(sIdx, 'breakDuration', 20);
                                        }
                                      }}
                                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                        hasSessBreak
                                          ? 'bg-amber-200 text-amber-950 dark:bg-amber-900 dark:text-amber-100'
                                          : 'bg-white dark:bg-[#13201a] text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                                      }`}
                                    >
                                      {hasSessBreak ? (
                                        <>
                                          <Check className="w-3 h-3 text-amber-700" />
                                          <span>বিরতি চালু ({toBengaliNumber(session.breakDuration)} মি.) — বন্ধ করুন</span>
                                        </>
                                      ) : (
                                        <>
                                          <Plus className="w-3 h-3 text-amber-700" />
                                          <span>বিরতি নেই — বিরতি যোগ করুন</span>
                                        </>
                                      )}
                                    </button>
                                  </div>

                                  {hasSessBreak && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2 p-2 rounded-xl bg-white/70 dark:bg-[#13201a]/70 border border-amber-300 dark:border-amber-800/40 animate-fade-in text-xs">
                                      <TimePicker12h
                                        label="বিরতি শুরুর সময়"
                                        value={session.breakStart || '10:30'}
                                        onChange={(val) => handleUpdateOverrideSession(sIdx, 'breakStart', val)}
                                      />
                                      <div>
                                        <div className="flex items-center justify-between mb-1">
                                          <label className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                                            বিরতির সময়কাল
                                          </label>
                                          <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400">
                                            {toBengaliNumber(session.breakDuration)} মিনিট
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <input
                                            type="number"
                                            min="5"
                                            max="120"
                                            step="5"
                                            value={session.breakDuration}
                                            onChange={(e) =>
                                              handleUpdateOverrideSession(
                                                sIdx,
                                                'breakDuration',
                                                Math.max(0, Number(e.target.value) || 0)
                                              )
                                            }
                                            className="w-full py-1.5 px-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#13201a] font-mono text-xs text-center font-bold text-emerald-950 dark:text-emerald-100"
                                          />
                                          <div className="flex gap-1 shrink-0">
                                            {[15, 20, 30].map((mins) => (
                                              <button
                                                key={mins}
                                                type="button"
                                                onClick={() => handleUpdateOverrideSession(sIdx, 'breakDuration', mins)}
                                                className={`px-1.5 py-1 rounded text-[10px] font-bold cursor-pointer ${
                                                  session.breakDuration === mins
                                                    ? 'bg-amber-600 text-white'
                                                    : 'bg-white dark:bg-[#13201a] text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
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
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <button
                            type="button"
                            onClick={handleAddOverrideSession}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-dashed border-amber-400 text-amber-800 dark:text-amber-200 hover:bg-amber-100/50 dark:hover:bg-amber-950/50 text-xs font-bold transition-all cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ আরও একটি সেশন/শিফট যোগ করুন</span>
                          </button>
                          <span className="text-xs font-bold text-amber-900 dark:text-amber-200 font-mono">
                            মোট স্লট:{' '}
                            {toBengaliNumber(
                              overrideSessions.reduce((acc, sess) => {
                                const hasB = Number(sess.breakDuration) > 0 && !!sess.breakStart;
                                return (
                                  acc +
                                  calcSlotCount(
                                    sess.startTime,
                                    sess.endTime,
                                    hasB ? sess.breakStart : undefined,
                                    hasB ? sess.breakDuration : 0,
                                    sess.slotDuration || overrideSlotDuration || 15
                                  )
                                );
                              }, 0)
                            )}
                            টি
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* Single Continuous Block Controls */
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        </div>

                        {/* Slot Duration */}
                        <div className="max-w-xs">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                              প্রতি স্লটের সময়
                            </label>
                            <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                              {toBengaliNumber(overrideSlotDuration || 15)} মিনিট
                            </span>
                          </div>
                          <div className="p-1 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#13201a] shadow-sm flex items-center gap-1">
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

                        {/* Optional Break in Date Override */}
                        {(() => {
                          const hasOverrideBreak = Number(overrideBreakDuration) > 0 && !!overrideBreakStart;
                          return (
                            <div className="pt-2.5 border-t border-amber-900/10 dark:border-amber-800/20">
                              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/70 dark:bg-[#13201a]/70 border border-amber-200 dark:border-amber-800/40 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                  <Coffee className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                  <span className="text-xs font-semibold text-emerald-950 dark:text-emerald-200">
                                    মাঝপথে বিরতি (Break)
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (hasOverrideBreak) {
                                      setOverrideBreakDuration(0);
                                      setOverrideBreakStart('');
                                    } else {
                                      setOverrideBreakStart('18:30');
                                      setOverrideBreakDuration(30);
                                    }
                                  }}
                                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                    hasOverrideBreak
                                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300/80'
                                      : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-300/80'
                                  }`}
                                >
                                  {hasOverrideBreak ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-amber-600" />
                                      <span>বিরতি চালু ({toBengaliNumber(overrideBreakDuration)} মি.) — বন্ধ করুন</span>
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>কোনো বিরতি নেই — বিরতি যোগ করুন</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              {hasOverrideBreak ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2.5 p-3 rounded-xl bg-white/80 dark:bg-[#13201a]/80 border border-amber-200 dark:border-amber-900/30 max-w-lg animate-fade-in">
                                  <TimePicker12h
                                    label="বিরতি শুরুর সময়"
                                    value={overrideBreakStart || '18:30'}
                                    onChange={(val) => setOverrideBreakStart(val)}
                                  />
                                  <div>
                                    <div className="flex items-center justify-between mb-1">
                                      <label className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                                        বিরতির সময়কাল
                                      </label>
                                      <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400">
                                        {toBengaliNumber(overrideBreakDuration)} মিনিট
                                      </span>
                                    </div>
                                    <div className="p-1 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#13201a] shadow-sm">
                                      <input
                                        type="number"
                                        min="0"
                                        step="5"
                                        value={overrideBreakDuration}
                                        onChange={(e) => setOverrideBreakDuration(Number(e.target.value))}
                                        className="w-full py-1.5 px-3 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/80 font-mono text-xs text-emerald-950 dark:text-emerald-100 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                      />
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-1.5">
                                      {[15, 20, 30, 45].map((mins) => (
                                        <button
                                          key={mins}
                                          type="button"
                                          onClick={() => setOverrideBreakDuration(mins)}
                                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                                            overrideBreakDuration === mins
                                              ? 'bg-amber-600 text-white'
                                              : 'bg-white dark:bg-[#13201a] text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                          }`}
                                        >
                                          {toBengaliNumber(mins)} মি.
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-2 text-[11px] text-emerald-700/80 dark:text-emerald-400/80 italic">
                                  ✓ কোনো বিরতি নেই — শুরুর সময় থেকে শেষ পর্যন্ত একনাগাড়ে সব স্লট উন্মুক্ত থাকবে।
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleAddDateOverride}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow transition-all cursor-pointer"
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
                    <div className="divide-y divide-amber-200 dark:divide-amber-900/40 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-white dark:bg-[#13201a] overflow-hidden text-xs">
                      {Object.entries(currentChamber.dateOverrides).map(([dStr, cfg]) => {
                        const slots = cfg.enabled ? calcDaySlotCount(cfg as any) : 0;
                        const hasSessions = Array.isArray(cfg.sessions) && cfg.sessions.length > 0;
                        return (
                          <div
                            key={dStr}
                            className="p-3 flex flex-wrap items-center justify-between gap-3"
                          >
                            <div className="flex-1 min-w-[240px]">
                              <div className="font-bold text-emerald-950 dark:text-emerald-100 flex items-center gap-2 flex-wrap">
                                <span className="font-mono">{dStr}</span>
                                {cfg.dayNameBn && <span>({cfg.dayNameBn})</span>}
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    cfg.enabled
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                                      : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                  }`}
                                >
                                  {cfg.enabled
                                    ? `খোলা (${toBengaliNumber(slots)}টি স্লট${hasSessions ? ` • ${toBengaliNumber(cfg.sessions!.length)}টি সেশন` : ''})`
                                    : 'বন্ধ'}
                                </span>
                              </div>

                              {cfg.enabled && (
                                <>
                                  {hasSessions ? (
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                      {cfg.sessions!.map((sess, sIdx) => {
                                        const sessSlots = calcSlotCount(
                                          sess.startTime,
                                          sess.endTime,
                                          undefined,
                                          0,
                                          sess.slotDuration || cfg.slotDuration || 15
                                        );
                                        return (
                                          <span
                                            key={sess.id || sIdx}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-950 dark:text-amber-200 text-[11px] font-semibold border border-amber-200/80 dark:border-amber-800/60"
                                          >
                                            <span className="font-bold text-amber-800 dark:text-amber-300">
                                              {sess.titleBn}:
                                            </span>
                                            <span className="font-mono">
                                              {time24ToComponents(sess.startTime).timeEn} - {time24ToComponents(sess.endTime).timeEn}
                                            </span>
                                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                                              ({toBengaliNumber(sessSlots)}টি স্লট)
                                            </span>
                                          </span>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">
                                      সময়: {time24ToComponents(cfg.startTime).timeBn} ({time24ToComponents(cfg.startTime).timeEn}) - {time24ToComponents(cfg.endTime).timeBn} ({time24ToComponents(cfg.endTime).timeEn}) | বিরতি:{' '}
                                      {cfg.breakStart ? `${time24ToComponents(cfg.breakStart).timeEn} (${toBengaliNumber(cfg.breakDuration)} মি.)` : 'নেই'} | স্লট:{' '}
                                      {toBengaliNumber(cfg.slotDuration)} মি.
                                    </div>
                                  )}
                                </>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveDateOverride(dStr)}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
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

            </div>

            {/* Save Buttons (Docked Sticky Footer with Safe-Area Padding) */}
            <div className="shrink-0 border-t border-emerald-900/10 dark:border-emerald-800/40 p-3.5 sm:p-5 bg-white/95 dark:bg-[#13201a]/95 backdrop-blur-md z-10 space-y-2.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] shadow-lg">
              {scheduleSaveMsg && (
                <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-100 text-xs text-center font-bold animate-fade-in shadow-2xs">
                  {scheduleSaveMsg}
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                  পরিবর্তনগুলো রোগীর বুকিং ইঞ্জিনে তাৎক্ষণিকভাবে কার্যকর হবে।
                </span>

                <div className="flex gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 text-center cursor-pointer active:scale-95 transition-all"
                  >
                    বন্ধ করুন
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleSaveSchedule}
                    className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
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
        </div>
      )}

      {/* CHANGE ADMIN PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl sm:rounded-3xl bg-white dark:bg-[#13201a] border border-amber-500/40 shadow-2xl p-4 sm:p-7 space-y-4 sm:space-y-5 animate-scale-up max-h-[94vh] overflow-y-auto my-auto">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl sm:rounded-3xl bg-white dark:bg-[#13201a] border border-emerald-500/40 shadow-2xl p-4 sm:p-7 space-y-4 sm:space-y-5 max-h-[94vh] overflow-y-auto my-auto">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-emerald-900/10 dark:border-emerald-800/40 pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>রোগীর বার্তা ও সরাসরি এসএমএস</span>
                  </div>
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300" title="সরকারি অনুমোদিত বাল্ক এসএমএস সেন্ডার আইডি">
                    <span>Sender ID: 8809617643375</span>
                  </div>
                  {smsBalance !== null && (
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                      <span>ব্যালেন্স: {smsBalance} টি এসএমএস</span>
                    </div>
                  )}
                </div>
                <h3 className="font-serif font-bold text-xl text-emerald-950 dark:text-emerald-50">
                  রোগীকে সরাসরি এসএমএস পাঠান
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                  নিচের বার্তাটি নির্বাচন বা সম্পাদনা করে এক ক্লিকে রোগীর মোবাইলে সরাসরি পাঠিয়ে দিন।
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMessageModalApt(null);
                  setSmsStatusMsg(null);
                }}
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
                <span className="ml-2 font-mono text-emerald-700 dark:text-emerald-300 font-bold">({messageModalApt.phone})</span>
                {isForeignPatient(messageModalApt) && (
                  <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-400/40">
                    🌍 বিদেশী রোগী
                  </span>
                )}
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

            {/* Patient Message Status Tracking Bar */}
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-zinc-600 dark:text-zinc-400">মেসেজ ট্র্যাকিং:</span>
                {messageModalApt.messageSent ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-300 dark:border-teal-700">
                    <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 stroke-[3]" />
                    <span>বার্তা ইতিমধ্যে পাঠানো হয়েছে {messageModalApt.messageSentAt ? `(${formatRelativeTimeBn(messageModalApt.messageSentAt)})` : ''}</span>
                    {messageModalApt.messageChannel && (
                      <span className="font-mono text-[10px] opacity-75">[{messageModalApt.messageChannel.toUpperCase()}]</span>
                    )}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>রোগীকে এখনো বার্তা পাঠানো হয়নি</span>
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleToggleMessageSent(messageModalApt.id, 'manual', !messageModalApt.messageSent)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer transition-colors whitespace-nowrap"
              >
                {messageModalApt.messageSent ? 'আন-মার্ক করুন' : '✓ পাঠানো হয়েছে চিহ্নিত করুন'}
              </button>
            </div>

            {/* Template Chips */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <label className="block text-xs font-bold text-emerald-950 dark:text-emerald-200">
                  এক ক্লিকে প্রিমেড টেমপ্লেট নির্বাচন করুন ({messageModalApt.chamberMode === 'online' ? '🌐 অনলাইন ভিডিও' : '🏢 শ্যামলী চেম্বার'}):
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTemplateMode(messageModalApt.chamberMode === 'online' ? 'online' : 'offline');
                    setEditingTemplates(JSON.parse(JSON.stringify(templatesConfig)));
                    setTemplateSaveFeedback(null);
                    setShowTemplateModal(true);
                  }}
                  className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200 underline flex items-center gap-1 cursor-pointer"
                >
                  <Settings className="w-3 h-3" />
                  <span>টেমপ্লেট পরিবর্তন ও কনফিগার</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMessageTemplateType('compact');
                    setCustomMessage(buildDefaultMessage(messageModalApt, 'compact'));
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    messageTemplateType === 'compact'
                      ? 'bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-400'
                      : 'bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-200/70 dark:hover:bg-emerald-900/60'
                  }`}
                >
                  📱 সংক্ষিপ্ত এসএমএস (দ্রুত ও সাশ্রয়ী)
                </button>
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
              <div className="flex flex-wrap justify-between items-center text-xs gap-1.5">
                <label className="font-bold text-emerald-950 dark:text-emerald-200">
                  বার্তাটি সম্পাদন করুন (Edit Text):
                </label>
                {(() => {
                  const evalResult = evaluateSms(customMessage);
                  return (
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                      <span className="font-bold text-emerald-950 dark:text-emerald-100">
                        {evalResult.charCount} অক্ষর
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-sans font-bold ${
                        evalResult.isUnicode
                          ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                          : 'bg-emerald-100 dark:bg-emerald-900/70 text-emerald-800 dark:text-emerald-300'
                      }`}>
                        {evalResult.isUnicode ? 'বাংলা (Unicode)' : 'English (GSM-7)'}
                      </span>
                      <span>
                        কয়টায় যাবে: <strong className="text-emerald-800 dark:text-emerald-300">{evalResult.smsCount}টি SMS</strong>
                      </span>
                      <span>
                        কাটবে: <strong className="text-amber-700 dark:text-amber-400">~৳{evalResult.estimatedCost.toFixed(2)}</strong>
                      </span>
                    </div>
                  );
                })()}
              </div>
              <textarea
                rows={7}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="এখানে আপনার বার্তা লিখুন বা সম্পাদনা করুন..."
                className="w-full p-3.5 rounded-2xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-[#192a23] text-emerald-950 dark:text-emerald-50 text-xs sm:text-sm font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
              />
            </div>

            {/* Status Feedback Banner */}
            {smsStatusMsg && (
              <div
                className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 transition-all animate-fade-in ${
                  smsStatusMsg.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                }`}
              >
                {smsStatusMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 text-[12px] leading-relaxed">
                  <span className="font-bold block mb-0.5">
                    {smsStatusMsg.type === 'success' ? 'এসএমএস সফলভাবে প্রেরিত হয়েছে' : 'এসএমএস প্রেরণে সমস্যা'}
                  </span>
                  <span>{smsStatusMsg.text}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-3.5 border-t border-emerald-900/10 dark:border-emerald-800/40 space-y-2.5">
              {/* Direct 1-Click Email Section (Available for all patients - domestic and foreign) */}
              {messageModalApt && (
                <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-transparent border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between text-xs flex-wrap gap-1">
                    <span className="font-bold text-emerald-950 dark:text-emerald-100 flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>রোগীর ইমেইলে বার্তা পাঠান:</span>
                    </span>
                    {isForeignPatient(messageModalApt) && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-400/40">
                        🌍 বিদেশী রোগী
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                    <input
                      type="email"
                      value={emailRecipientInput}
                      onChange={(e) => setEmailRecipientInput(e.target.value)}
                      placeholder="রোগীর ইমেইল এড্রেস..."
                      className="flex-1 py-2 px-3 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-[#192a23] text-emerald-950 dark:text-emerald-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleSendDirectEmail}
                      disabled={isSendingEmail || !customMessage.trim()}
                      className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 active:scale-95 disabled:opacity-50 text-white text-xs font-bold shadow-md cursor-pointer whitespace-nowrap"
                      title="১-ক্লিকে রোগীর ইমেইলে বার্তা পাঠানো হবে"
                    >
                      {isSendingEmail ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>ইমেইল পাঠানো হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5 text-amber-300" />
                          <span>সরাসরি ইমেইল পাঠান (১-ক্লিক)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Primary Send Actions: Direct SMS & WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* 1. Direct 1-Click SMS */}
                <button
                  type="button"
                  onClick={handleSendDirectSms}
                  disabled={isSendingSms || !customMessage.trim()}
                  className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-emerald-600/25 transition-all cursor-pointer whitespace-nowrap"
                  title="ক্লিক করলেই সরাসরি বাল্কএসএমএস গেটওয়ে দিয়ে রোগীর নম্বরে এসএমএস চলে যাবে"
                >
                  {isSendingSms ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>সরাসরি পাঠানো হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-emerald-100" />
                      <span>সরাসরি এসএমএস পাঠান</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-white/20 text-white">
                        ১-ক্লিক
                      </span>
                    </>
                  )}
                </button>

                {/* 2. WhatsApp */}
                <a
                  href={getWhatsAppUrl(messageModalApt.phone, customMessage)}
                  onClick={() => handleToggleMessageSent(messageModalApt.id, 'whatsapp', true)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] active:scale-[0.98] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-[#25D366]/25 transition-all cursor-pointer whitespace-nowrap"
                  title="রোগীর সাথে হোয়াটসঅ্যাপ চ্যাট ওপেন করে বার্তা পাঠান"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>হোয়াটসঅ্যাপে পাঠান</span>
                </a>
              </div>

              {/* Secondary Utility Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyMessage}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold transition-all cursor-pointer whitespace-nowrap"
                    title="বার্তাটি ক্লিপবোর্ডে কপি করুন"
                  >
                    {copiedToast ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedToast ? 'কপি হয়েছে!' : 'কপি করুন'}</span>
                  </button>

                  <a
                    href={getSmsUrl(messageModalApt.phone, customMessage)}
                    onClick={() => {
                      try {
                        navigator.clipboard.writeText(customMessage);
                        setCopiedToast(true);
                        setTimeout(() => setCopiedToast(false), 2000);
                      } catch {}
                    }}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer whitespace-nowrap"
                    title="মোবাইলের নিজস্ব মেসেজিং অ্যাপে খুলুন"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>ডিভাইস অ্যাপ</span>
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMessageModalApt(null);
                    setSmsStatusMsg(null);
                  }}
                  className="h-9 px-4 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold transition-all cursor-pointer whitespace-nowrap"
                >
                  বন্ধ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* APPOINTMENT CANCELLATION MODAL */}
      {cancelApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl sm:rounded-3xl bg-white dark:bg-[#13201a] border border-rose-500/40 shadow-2xl p-4 sm:p-7 space-y-4 sm:space-y-5 max-h-[94vh] overflow-y-auto my-auto">
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
                className="w-full p-2.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-white dark:bg-[#192a23] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
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
                  className="w-full p-2.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-white dark:bg-[#192a23] text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 mt-2"
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
        const baseReceptionList = filterStatus === 'cancelled'
          ? appointments.filter((apt) => apt.status !== 'cancelled')
          : displayedAppointments.filter((apt) => apt.status !== 'cancelled');

        // Strictly sort according to active dashboard sort criteria
        const receptionAppointments = sortAppointmentList(baseReceptionList, sortBy);
        const activeSortLabel = getSortOptionLabel(sortBy);

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
                    দেবজ্যোতি দত্ত — চেম্বার রিসিপশন তালিকা
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-[11px] sm:text-xs text-zinc-600 flex-wrap">
                    <span>মুদ্রণ: {formatDateToBn(getDhakaCurrentTime().dateStr)}</span>
                    <span>•</span>
                    <span className="font-bold text-emerald-800">
                      সক্রিয় রোগী: {toBengaliNumber(receptionAppointments.length)} জন
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full font-semibold border border-emerald-300 text-[10px] sm:text-[11px]">
                      <ArrowUpDown className="w-3 h-3 text-emerald-600" />
                      <span>সর্ট: {activeSortLabel}</span>
                    </span>
                  </div>
                </div>

                {/* Corner Action Buttons */}
                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-between sm:justify-end">
                  {/* PDF Download Button */}
                  <button
                    type="button"
                    onClick={() => printReceptionSheet(receptionAppointments, true, activeSortLabel)}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95"
                    title="রিসিপশন তালিকাটি সরাসরি পিডিএফ (PDF) আকারে সেভ বা ডাউনলোড করুন"
                  >
                    <Download className="w-4 h-4 text-emerald-200" />
                    <span>পিডিএফ ডাউনলোড</span>
                  </button>

                  {/* Print Button */}
                  <button
                    type="button"
                    onClick={() => printReceptionSheet(receptionAppointments, false, activeSortLabel)}
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
                      <th
                        onClick={() => setSortBy(sortBy === 'serial_asc' ? 'serial_desc' : 'serial_asc')}
                        className="py-2.5 px-3 border-r border-zinc-200 w-28 cursor-pointer hover:bg-emerald-100/70 select-none transition-colors"
                        title="সিরিয়াল অনুযায়ী সর্ট করুন"
                      >
                        <div className="flex items-center gap-1">
                          <span>সিরিয়াল নং</span>
                          {sortBy === 'serial_asc' ? (
                            <ArrowUp className="w-3 h-3 text-emerald-700" />
                          ) : sortBy === 'serial_desc' ? (
                            <ArrowDown className="w-3 h-3 text-emerald-700" />
                          ) : (
                            <ArrowUpDown className="w-2.5 h-2.5 text-zinc-400" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => setSortBy(sortBy === 'name_asc' ? 'name_desc' : 'name_asc')}
                        className="py-2.5 px-3 border-r border-zinc-200 cursor-pointer hover:bg-emerald-100/70 select-none transition-colors"
                        title="রোগীর নাম অনুযায়ী সর্ট করুন"
                      >
                        <div className="flex items-center gap-1">
                          <span>রোগীর নাম ও মোবাইল</span>
                          {sortBy === 'name_asc' ? (
                            <ArrowUp className="w-3 h-3 text-emerald-700" />
                          ) : sortBy === 'name_desc' ? (
                            <ArrowDown className="w-3 h-3 text-emerald-700" />
                          ) : (
                            <ArrowUpDown className="w-2.5 h-2.5 text-zinc-400" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => setSortBy(sortBy === 'slot_asc' ? 'slot_desc' : 'slot_asc')}
                        className="py-2.5 px-3 border-r border-zinc-200 cursor-pointer hover:bg-emerald-100/70 select-none transition-colors"
                        title="স্লটের সময় অনুযায়ী সর্ট করুন"
                      >
                        <div className="flex items-center gap-1">
                          <span>তারিখ ও সময় স্লট</span>
                          {sortBy === 'slot_asc' || sortBy === 'date_asc' ? (
                            <ArrowUp className="w-3 h-3 text-emerald-700" />
                          ) : sortBy === 'slot_desc' || sortBy === 'date_desc' ? (
                            <ArrowDown className="w-3 h-3 text-emerald-700" />
                          ) : (
                            <ArrowUpDown className="w-2.5 h-2.5 text-zinc-400" />
                          )}
                        </div>
                      </th>
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
                            {apt.chamberMode === 'offline' ? '১,০০০ ৳' : isForeignPatient(apt) ? '$১০ ডলার' : '৮০০ ৳'}
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
                  দেবজ্যোতি দত্ত চেম্বার পোর্টাল
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {deleteTargetApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl sm:rounded-3xl bg-white dark:bg-[#13201a] border border-rose-500/50 shadow-2xl p-4 sm:p-7 space-y-4 sm:space-y-5 animate-scale-up max-h-[94vh] overflow-y-auto my-auto">
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
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#13201a] border border-emerald-500/50 shadow-2xl p-6 sm:p-7 space-y-5 animate-scale-up max-h-[92vh] overflow-y-auto my-auto">
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

      {/* CUSTOMIZABLE SMS & MESSAGE TEMPLATES MANAGER MODAL */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-5xl rounded-3xl bg-white dark:bg-[#13201a] border border-emerald-500/30 shadow-2xl p-4 sm:p-6 md:p-7 space-y-5 animate-scale-up my-auto max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-emerald-100 dark:border-emerald-900/50 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shadow-inner">
                  <MessageSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg sm:text-xl text-emerald-950 dark:text-emerald-50">
                    মেসেজ ও এসএমএস টেমপ্লেট ম্যানেজার
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    অনলাইন ও অফলাইন চেম্বারের জন্য কাস্টমাইজড বার্তা সেট করুন এবং লাইভ এসএমএস চার্জ ইভ্যালুয়েশন দেখুন।
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher Tabs (Offline vs Online) */}
            <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-1.5 rounded-2xl border border-emerald-200/70 dark:border-emerald-800/70 flex gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setSelectedTemplateMode('offline')}
                className={`flex-1 py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
                  selectedTemplateMode === 'offline'
                    ? 'bg-emerald-800 text-white shadow-md'
                    : 'text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/50'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 shrink-0" />
                <span className="hidden sm:inline">🏢 শ্যামলী চেম্বার (সরাসরি ভিজিট / Offline)</span>
                <span className="sm:hidden">🏢 শ্যামলী চেম্বার (Offline)</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTemplateMode('online')}
                className={`flex-1 py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
                  selectedTemplateMode === 'online'
                    ? 'bg-emerald-800 text-white shadow-md'
                    : 'text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/50'
                }`}
              >
                <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-300 shrink-0" />
                <span className="hidden sm:inline">🌐 অনলাইন ভিডিও কনসালটেশন (Online)</span>
                <span className="sm:hidden">🌐 অনলাইন ভিডিও কল</span>
              </button>
            </div>

            {/* Template Type Tabs (Polished PC & Mobile Responsive Grid) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-bold text-emerald-950 dark:text-emerald-100 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>টেমপ্লেটের ধরন নির্বাচন করুন:</span>
                </label>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:inline">
                  (ক্লিক করে টেমপ্লেট নির্বাচন ও সম্পাদনা করুন)
                </span>
              </div>

              {/* Grid Layout: 6 Equal Columns on PC, 3 on Tablet, 2 on Mobile */}
              <div className="p-1.5 sm:p-2 rounded-2xl bg-emerald-50/70 dark:bg-[#0c1812]/90 border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 sm:gap-2">
                  {[
                    { key: 'confirm', label: 'নিশ্চিতকরণ (Confirm)', icon: '📋' },
                    { key: 'reminder', label: 'রিমাইন্ডার (Reminder)', icon: '⏰' },
                    { key: 'reports', label: 'রিপোর্ট আহ্বান (Reports)', icon: '🧪' },
                    { key: 'reschedule', label: 'রিশিডিউল (Reschedule)', icon: '🔄' },
                    { key: 'cancel', label: 'বাতিল (Cancel)', icon: '🚫' },
                    { key: 'compact', label: 'সংক্ষিপ্ত (Compact)', icon: '📱' }
                  ].map((tab) => {
                    const isSelected = selectedTemplateKey === tab.key;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setSelectedTemplateKey(tab.key as TemplateType)}
                        className={`flex items-center justify-center gap-1.5 px-2.5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-xs font-bold transition-all cursor-pointer text-center select-none ${
                          isSelected
                            ? 'bg-emerald-700 dark:bg-emerald-600 text-white shadow-md shadow-emerald-950/30 border border-emerald-400/80 ring-2 ring-emerald-400/50 scale-[1.02]'
                            : 'bg-white dark:bg-[#14241d] text-emerald-950 dark:text-emerald-200/90 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/40 border border-emerald-900/10 dark:border-emerald-700/40 hover:border-emerald-400/50 shadow-2xs'
                        }`}
                      >
                        <span className="text-sm shrink-0">{tab.icon}</span>
                        <span className="truncate">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Variable Pills (One-Click Insert) */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  ক্লিক করে ভ্যারিয়েবল বসান:
                </span>
                <span className="text-[11px] text-amber-700 dark:text-amber-400">
                  (বার্তা পাঠানোর সময় স্বয়ংক্রিয়ভাবে রোগীর তথ্যে রূপান্তরিত হবে)
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  { tag: '{patientName}', desc: 'রোগীর নাম' },
                  { tag: '{serialNo}', desc: 'সিরিয়াল নম্বর' },
                  { tag: '{date}', desc: 'তারিখ' },
                  { tag: '{time}', desc: 'সময়' },
                  { tag: '{chamberAddress}', desc: 'চেম্বারের ঠিকানা' },
                  { tag: '{mapsUrl}', desc: 'গুগল ম্যাপ লিঙ্ক' },
                  { tag: '{formUrl}', desc: 'তথ্য ফর্ম লিঙ্ক' },
                  { tag: '{helpline}', desc: 'হেল্পলাইন' }
                ].map((pill) => (
                  <button
                    key={pill.tag}
                    type="button"
                    onClick={() => {
                      const currentVal = editingTemplates[selectedTemplateMode][selectedTemplateKey] || '';
                      setEditingTemplates({
                        ...editingTemplates,
                        [selectedTemplateMode]: {
                          ...editingTemplates[selectedTemplateMode],
                          [selectedTemplateKey]:
                            currentVal +
                            (currentVal.endsWith(' ') || currentVal.endsWith('\n') || currentVal.length === 0 ? '' : ' ') +
                            pill.tag
                        }
                      });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1a2e24] border border-amber-300 dark:border-amber-800/70 hover:border-amber-500 dark:hover:border-amber-600 text-amber-900 dark:text-amber-200 hover:text-amber-950 dark:hover:text-amber-100 font-mono text-[11px] font-semibold hover:bg-amber-100/60 dark:hover:bg-amber-900/60 transition-colors cursor-pointer flex items-center gap-1 active:scale-95 shadow-2xs"
                  >
                    <span>+ {pill.tag}</span>
                    <span className="text-[10px] text-zinc-400 font-sans">({pill.desc})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2-Column Grid: Left Editor, Right Live Evaluator & Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* LEFT COLUMN: Text Editor */}
              <div className="lg:col-span-7 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-950 dark:text-emerald-200">
                    টেমপ্লেট বার্তা সম্পাদনা করুন:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleResetTemplateToDefault(selectedTemplateMode, selectedTemplateKey)}
                    className="text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer text-[11px]"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>এই টেমপ্লেটটি ডিফল্টে ফেরত নিন</span>
                  </button>
                </div>

                <textarea
                  rows={12}
                  value={editingTemplates[selectedTemplateMode][selectedTemplateKey] || ''}
                  onChange={(e) => {
                    setEditingTemplates({
                      ...editingTemplates,
                      [selectedTemplateMode]: {
                        ...editingTemplates[selectedTemplateMode],
                        [selectedTemplateKey]: e.target.value
                      }
                    });
                  }}
                  placeholder="এখানে টেমপ্লেট বার্তা লিখুন..."
                  className="w-full p-4 rounded-2xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-[#192a23] text-emerald-950 dark:text-emerald-50 text-xs sm:text-sm font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed font-mono"
                />
              </div>

              {/* RIGHT COLUMN: Live Evaluator & Preview */}
              {(() => {
                const currentText = editingTemplates[selectedTemplateMode][selectedTemplateKey] || '';
                const samplePreviewText = interpolateTemplate(currentText, {
                  patientName: 'মোঃ রহিম সাহেব',
                  serialNo: selectedTemplateMode === 'online' ? 'ON-105' : 'DD-102',
                  date: '২০ অক্টোবর ২০২৬',
                  time: 'বিকাল ৫:৩০',
                  chamberMode: selectedTemplateMode,
                  chamberAddress: '২/১, জাহেদা ভিলা, শ্যামলী কল্যাণ সমিতি, শ্যামলী, ঢাকা-১২০৭।',
                  mapsUrl: 'https://maps.app.goo.gl/NgPzAZamW3Ucy8799',
                  formUrl: 'https://forms.gle/L6YfWn7Z12nV3aK66',
                  helpline: '01712854941'
                });
                const evalResult = evaluateSms(samplePreviewText);

                return (
                  <div className="lg:col-span-5 space-y-4">
                    {/* EVALUATION METRICS CARD */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-[#162720] dark:to-[#10221a] border border-emerald-300/80 dark:border-emerald-700/80 shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-emerald-200/80 dark:border-emerald-800 pb-2">
                        <span className="font-bold text-xs text-emerald-950 dark:text-emerald-100 flex items-center gap-1.5">
                          <Coins className="w-4 h-4 text-amber-500" />
                          এসএমএস ইভ্যালুয়েশন ও চার্জ
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            evalResult.isUnicode
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                              : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300'
                          }`}
                        >
                          {evalResult.encoding}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="p-2.5 rounded-xl bg-white/80 dark:bg-black/30 border border-emerald-200/60 dark:border-emerald-800/60">
                          <span className="block text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold">
                            অক্ষর সংখ্যা
                          </span>
                          <span className="font-mono text-base font-bold text-emerald-950 dark:text-emerald-100">
                            {evalResult.charCount}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-white/80 dark:bg-black/30 border border-emerald-200/60 dark:border-emerald-800/60">
                          <span className="block text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold">
                            কয়টায় যাবে
                          </span>
                          <span className="font-mono text-base font-bold text-emerald-700 dark:text-emerald-300">
                            {evalResult.smsCount} টি SMS
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-white/80 dark:bg-black/30 border border-emerald-200/60 dark:border-emerald-800/60">
                          <span className="block text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold">
                            এসএমএস রেট
                          </span>
                          <span className="font-mono text-sm font-bold text-zinc-700 dark:text-zinc-300">
                            ৳ ০.৩৫ /টি
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60">
                          <span className="block text-[10px] text-amber-800 dark:text-amber-300 font-semibold">
                            কয়টা কাটবে (মোট খরচ)
                          </span>
                          <span className="font-mono text-base font-bold text-amber-700 dark:text-amber-300">
                            ~৳ {evalResult.estimatedCost.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-emerald-900/80 dark:text-emerald-300/80 leading-relaxed bg-white/60 dark:bg-black/20 p-2.5 rounded-xl border border-emerald-200/40 dark:border-emerald-800/40">
                        {evalResult.isUnicode ? (
                          <span>
                            📌 <strong>বাংলা টেক্সট:</strong> প্রথম ৭০ অক্ষরের পর প্রতি ৬৭ অক্ষরে ১টি করে এসএমএস পার্ট যুক্ত হয়।
                          </span>
                        ) : (
                          <span>
                            📌 <strong>ইংরেজি টেক্সট:</strong> প্রতি ১৬০ অক্ষর পর্যন্ত মাত্র ১টি একক এসএমএস কাউন্ট হয়।
                          </span>
                        )}
                      </div>
                    </div>

                    {/* LIVE REALISTIC PREVIEW BOX */}
                    <div className="p-3.5 rounded-2xl bg-zinc-100 dark:bg-[#162720] border border-zinc-200 dark:border-emerald-800/60 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-emerald-600" />
                          রোগীর মোবাইলে যেমন দেখাবে (লাইভ প্রিভিউ):
                        </span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-white dark:bg-[#0c1511] border border-zinc-300/70 dark:border-emerald-900/50 text-[11px] text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap font-sans leading-relaxed max-h-56 overflow-y-auto shadow-inner">
                        {samplePreviewText}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Feedback Banner */}
            {templateSaveFeedback && (
              <div
                className={`p-3 rounded-2xl text-xs flex items-center gap-2 ${
                  templateSaveFeedback.type === 'success'
                    ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
                }`}
              >
                {templateSaveFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span className="font-semibold">{templateSaveFeedback.text}</span>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-emerald-100 dark:border-emerald-900/50">
              <button
                type="button"
                onClick={handleResetAllTemplatesToDefault}
                className="text-xs text-rose-700 dark:text-rose-400 hover:underline flex items-center justify-center sm:justify-start gap-1 cursor-pointer font-semibold py-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>সবগুলো টেমপ্লেট ফ্যাক্টরি ডিফল্টে রিসেট করুন</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="flex-1 sm:flex-initial py-2.5 px-4 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold transition-all cursor-pointer text-center"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleSaveTemplates}
                  disabled={isSavingTemplates}
                  className="flex-1 sm:flex-initial py-2.5 px-6 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer text-center whitespace-nowrap"
                >
                  {isSavingTemplates ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>সংরক্ষণ করা হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-amber-300" />
                      <span>টেমপ্লেট সংরক্ষণ করুন</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DIRECT WALK-IN / PHONE APPOINTMENT BOOKING MODAL (ADMIN SUPER POWER - NO OTP) */}
      {showDirectBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl sm:rounded-3xl bg-white dark:bg-[#13201a] border border-emerald-500/40 shadow-2xl p-4 sm:p-7 space-y-4 sm:space-y-6 max-h-[94vh] overflow-y-auto my-auto">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-emerald-900/10 dark:border-emerald-800/40 pb-3 sm:pb-4 gap-2.5">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-950 dark:to-teal-950 text-emerald-850 dark:text-emerald-300 mb-1 border border-emerald-300 dark:border-emerald-800">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>অ্যাডমিন সুপার পাওয়ার • নো ওটিপি</span>
                </div>
                <h3 className="font-serif font-bold text-xl text-emerald-950 dark:text-emerald-50">
                  সরাসরি সিরিয়াল বুকিং
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                  চেম্বার কাউন্টার বা ফোনে আসা রোগীর তাৎক্ষণিক কনফার্মড সিরিয়াল তৈরি করুন
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDirectBookingModal(false)}
                className="p-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* If Booking is created, display Confirmation & Quick Super Actions */}
            {createdDirectAppointment ? (
              <div className="text-center py-3 space-y-4 animate-scale-up">
                <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-1.5 border border-emerald-300 dark:border-emerald-800">
                    সিরিয়াল কনফার্মড ও সংরক্ষিত
                  </span>
                  <h3 className="text-2xl font-serif font-black text-emerald-950 dark:text-emerald-50">
                    বুকিং সফলভাবে সম্পন্ন হয়েছে!
                  </h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 max-w-md mx-auto">
                    সিরিয়ালটি ডাটাবেজে কনফার্মড হিসেবে যুক্ত হয়েছে এবং রোগীর ইমেইল প্রদান করা থাকলে স্বয়ংক্রিয় কনফার্মেশন মেইল পাঠানো হয়েছে।
                  </p>
                </div>

                {/* Serial details card */}
                <div className="max-w-md mx-auto p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-left space-y-2.5 text-xs">
                  <div className="flex items-center justify-between border-b border-emerald-900/10 dark:border-emerald-800/40 pb-2">
                    <span className="text-emerald-700 dark:text-emerald-400 font-medium">সিরিয়াল নম্বর:</span>
                    <span className="font-mono font-black text-base text-emerald-900 dark:text-emerald-100 bg-white dark:bg-[#192a23] px-3 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-700 shadow-2xs">
                      {createdDirectAppointment.serialNo}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-700 dark:text-emerald-400 font-medium">রোগীর নাম:</span>
                    <span className="font-bold text-emerald-950 dark:text-emerald-100">{createdDirectAppointment.patientName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-700 dark:text-emerald-400 font-medium">মোবাইল নম্বর:</span>
                    <span className="font-mono text-emerald-900 dark:text-emerald-200">{createdDirectAppointment.phone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-700 dark:text-emerald-400 font-medium">তারিখ ও সময়:</span>
                    <span className="font-medium text-emerald-950 dark:text-emerald-100">
                      {createdDirectAppointment.dateFormattedBn || createdDirectAppointment.appointmentDate} ({createdDirectAppointment.slotTimeBn})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-700 dark:text-emerald-400 font-medium">চেম্বার মাধ্যম:</span>
                    <span className="font-medium text-emerald-950 dark:text-emerald-100">
                      {createdDirectAppointment.chamberMode === 'online' ? 'অনলাইন ভিডিও কনসালটেশন' : 'শ্যামলী চেম্বার (সরাসরি)'}
                    </span>
                  </div>
                </div>

                {/* Instant Super Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-md mx-auto pt-2">
                  <button
                    type="button"
                    onClick={() => printSinglePageSerialSlip(createdDirectAppointment)}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>রিসিপ্ট স্লিপ প্রিন্ট করুন</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowDirectBookingModal(false);
                      handleOpenMessageModal(createdDirectAppointment, 'confirm');
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-200 dark:hover:bg-emerald-900 border border-emerald-300 dark:border-emerald-700 font-bold text-xs shadow-xs transition-all cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>মেসেজ / হোয়াটসঅ্যাপ পাঠান</span>
                  </button>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleOpenDirectBooking}
                    className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline font-bold cursor-pointer"
                  >
                    + আরেকটি নতুন সিরিয়াল দিন
                  </button>
                  <span className="text-zinc-300 dark:text-zinc-700">•</span>
                  <button
                    type="button"
                    onClick={() => setShowDirectBookingModal(false)}
                    className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 font-medium cursor-pointer"
                  >
                    সম্পন্ন ও বন্ধ করুন
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleDirectBookingSubmit} className="space-y-4 sm:space-y-5">
                {/* Feedback Error / Notice */}
                {directBookingFeedback && (
                  <div
                    className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                      directBookingFeedback.type === 'error'
                        ? 'bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300'
                        : 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300'
                    }`}
                  >
                    {directBookingFeedback.type === 'error' ? (
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                    )}
                    <span>{directBookingFeedback.msg}</span>
                  </div>
                )}

                {/* Chamber Mode Selector Tabs */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-emerald-950 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                    ১. চেম্বার মাধ্যম নির্বাচন করুন:
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-emerald-50/70 dark:bg-emerald-950/60 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60">
                    <button
                      type="button"
                      onClick={() => handleDirectChamberChange('offline')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        directChamberMode === 'offline'
                          ? 'bg-emerald-700 text-white shadow-sm'
                          : 'text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>শ্যামলী চেম্বার (সরাসরি)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDirectChamberChange('online')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        directChamberMode === 'online'
                          ? 'bg-emerald-700 text-white shadow-sm'
                          : 'text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40'
                      }`}
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>অনলাইন ভিডিও কনসালটেশন</span>
                    </button>
                  </div>
                </div>

                {/* Patient Information Inputs */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-emerald-950 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                    ২. রোগীর বিবরণ (নাম ও মোবাইল নম্বর আবশ্যক):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 block mb-1">
                        রোগীর পুরো নাম <span className="text-rose-500">*</span>
                      </span>
                      <input
                        type="text"
                        required
                        value={directPatientName}
                        onChange={(e) => setDirectPatientName(e.target.value)}
                        placeholder="যেমন: মোঃ রফিকুল ইসলাম"
                        className="w-full py-2 px-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#192a23] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 block mb-1">
                        মোবাইল নম্বর <span className="text-rose-500">*</span>
                      </span>
                      <input
                        type="tel"
                        required
                        value={directPhone}
                        onChange={(e) => setDirectPhone(e.target.value)}
                        placeholder="যেমন: 01712345678"
                        className="w-full py-2 px-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#192a23] text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 block mb-1">
                        ইমেইল এড্রেস (ঐচ্ছিক - কনফার্মেশন যাবে)
                      </span>
                      <input
                        type="email"
                        value={directEmail}
                        onChange={(e) => setDirectEmail(e.target.value)}
                        placeholder="patient@example.com"
                        className="w-full py-2 px-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#192a23] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 block mb-1">
                        শারীরিক সমস্যা / লক্ষণ (ঐচ্ছিক)
                      </span>
                      <input
                        type="text"
                        value={directComplaints}
                        onChange={(e) => setDirectComplaints(e.target.value)}
                        placeholder="যেমন: বাত-ব্যথা, পাইলস, পেটের সমস্যা"
                        className="w-full py-2 px-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#192a23] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Step 3: Select Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-emerald-950 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                    ৩. তারিখ নির্বাচন করুন:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1">
                    {directUpcomingDates.map((day) => {
                      const isSelected = directDate === day.dateStr;
                      return (
                        <button
                          key={day.dateStr}
                          type="button"
                          onClick={() => {
                            setDirectDate(day.dateStr);
                            setDirectSlotId('');
                            setDirectSlotTimeBn('');
                            setDirectSlotTimeEn('');
                          }}
                          className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-800 text-white shadow-md'
                              : 'border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#192a23] hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-emerald-950 dark:text-emerald-100'
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

                {/* Step 4: Select Slot */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-emerald-950 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                      ৪. সময় স্লট নির্বাচন করুন:
                    </label>
                    {directSlotTimeBn && (
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 font-mono">
                        নির্বাচিত: {directSlotTimeBn}
                      </span>
                    )}
                  </div>

                  {directSlots.length === 0 ? (
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs">
                      এই তারিখে চেম্বার বন্ধ বা কোনো সময় স্লট উপলব্ধ নেই। অনুগ্রহ করে অন্য তারিখ নির্বাচন করুন।
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                      {directSlots.map((slot) => {
                        const isBooked = directBookedSlots.includes(slot.id);
                        const isPast = isSlotPastTime(directDate, slot.startMinutes);
                        const isSelected = directSlotId === slot.id;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            disabled={isBooked}
                            onClick={() => {
                              if (!isBooked) {
                                setDirectSlotId(slot.id);
                                setDirectSlotTimeBn(slot.timeBn);
                                setDirectSlotTimeEn(slot.timeEn);
                              }
                            }}
                            className={`min-h-[56px] h-full p-2 rounded-xl border text-xs font-mono font-medium transition-all flex flex-col items-center justify-center cursor-pointer ${
                              isBooked
                                ? 'opacity-40 bg-gray-100 dark:bg-gray-800/40 border-gray-300 cursor-not-allowed text-gray-500 line-through'
                                : isSelected
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-700 shadow-md font-bold'
                                : isPast
                                ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300/80 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 hover:border-amber-500'
                                : 'bg-white dark:bg-[#192a23] border-emerald-200 dark:border-emerald-800 hover:border-emerald-500 text-emerald-950 dark:text-emerald-100'
                            }`}
                          >
                            <div>{slot.shortBn || slot.timeBn}</div>
                            <div className="text-[10px] opacity-80 font-sans">
                              {isBooked ? 'বুকড' : isPast ? 'ওয়াক-ইন / চলতি' : slot.shortEn}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Submit & Cancel Buttons */}
                <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowDirectBookingModal(false)}
                    className="w-full sm:w-auto py-2.5 px-4 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    বাতিল
                  </button>

                  <button
                    type="submit"
                    disabled={directBookingLoading || !directSlotId || !directPatientName.trim() || !directPhone.trim()}
                    className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {directBookingLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>সিরিয়াল নিশ্চিত করা হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>সরাসরি সিরিয়াল নিশ্চিত করুন</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* CUSTOM BEAUTIFUL ALERT / MESSAGE MODAL */}
      {alertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-[#13201a] border border-emerald-500/40 shadow-2xl p-6 space-y-4 animate-scale-up text-center my-auto">
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
