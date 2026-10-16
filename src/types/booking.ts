export type ChamberMode = 'offline' | 'online';

export type TimingType = 'general' | 'day_specific';

export interface ScheduleSession {
  id?: string;
  titleBn?: string;      // e.g. "সকাল সেশন", "বিকাল সেশন", "রাত সেশন"
  startTime: string;    // "09:30"
  endTime: string;      // "11:30"
  slotDuration?: number; // 15
  breakStart?: string;   // e.g. "10:30"
  breakDuration?: number; // in minutes, e.g. 20 (0 or undefined = no break)
}

export interface DayScheduleConfig {
  enabled: boolean;
  dayNameBn: string;
  startTime: string; // e.g. "16:00"
  endTime: string;   // e.g. "21:00"
  breakStart: string; // e.g. "18:30"
  breakDuration: number; // in minutes, e.g. 30
  slotDuration: number;  // in minutes, e.g. 15
  sessions?: ScheduleSession[]; // Multi-session / multi-shift support
}

export interface GeneralTimingConfig {
  startTime: string;
  endTime: string;
  breakStart: string;
  breakDuration: number;
  slotDuration: number;
  sessions?: ScheduleSession[];
}

export interface ChamberSchedule {
  chamberId: string;
  titleBn: string;
  titleEn: string;
  mode: ChamberMode;
  timingType: TimingType;
  generalTiming: GeneralTimingConfig;
  daySchedules: Record<number, DayScheduleConfig>;
  dateOverrides?: Record<string, DayScheduleConfig>;
  addressBn: string;
  feeBn: string;
  followUpFeeBn?: string;
}

export type SlotPeriod = 'morning' | 'noon' | 'afternoon' | 'evening' | 'night';

export interface Slot {
  id: string;
  startMinutes: number;
  endMinutes: number;
  timeEn: string;
  timeBn: string;
  shortEn: string;
  shortBn: string;
  period?: SlotPeriod;
  periodTitleBn?: string;
  sessionId?: string;
  sessionTitleBn?: string;
}

export interface CalendarDay {
  dateStr: string; // YYYY-MM-DD
  dayOfWeek: number; // 0-6
  dayNameBn: string;
  dayNameShortBn: string;
  dayNameEn: string;
  dayNumBn: string;
  dayNumEn: number;
  monthBn: string;
  monthEn: string;
  fullBn: string;
  fullEn: string;
  diffDays: number;
  isBookingOpen: boolean;
  statusLabelBn: string;
}

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'rescheduled'
  | 'completed'
  | 'cancelled';

export interface Appointment {
  id: string;
  serialNo: string;
  patientName: string;
  phone: string;
  email?: string;
  chamberMode: ChamberMode;
  chamberTitleBn: string;
  appointmentDate: string; // YYYY-MM-DD
  dateFormattedBn: string;
  slotId: string;
  slotTimeBn: string;
  slotTimeEn: string;
  complaints: string;
  status: AppointmentStatus;
  rescheduledReason?: string;
  rescheduledAt?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  createdAt: string;
}

export interface PrakritiQuestion {
  id: number;
  titleBn: string;
  subtitleBn: string;
  options: {
    textBn: string;
    dosha: 'vata' | 'pitta' | 'kapha';
    descBn: string;
  }[];
}

export interface PrakritiResult {
  primaryDosha: 'vata' | 'pitta' | 'kapha' | 'dvandvaja';
  doshaScores: {
    vata: number;
    pitta: number;
    kapha: number;
  };
  titleBn: string;
  subtitleBn: string;
  characteristicsBn: string[];
  dietaryRecommendationsBn: string[];
  lifestyleTipsBn: string[];
  herbalSupportBn: string[];
}
