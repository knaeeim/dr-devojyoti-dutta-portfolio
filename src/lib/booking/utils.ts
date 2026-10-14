import {
  ChamberMode,
  ChamberSchedule,
  Slot,
  CalendarDay,
  DayScheduleConfig
} from '@/types/booking';

export const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
export const bnDays = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
export const bnDaysShort = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র', 'শনি'];
export const bnMonths = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

export function toBengaliNumber(num: number | string | null | undefined): string {
  if (num === null || num === undefined) return '';
  return num.toString().replace(/\d/g, (d) => bnDigits[parseInt(d, 10)]);
}

export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  const h = parts[0] || 0;
  const m = parts[1] || 0;
  return h * 60 + m;
}

export function minutesToTime24(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const padH = String(h).padStart(2, '0');
  const padM = String(m).padStart(2, '0');
  return `${padH}:${padM}`;
}

export function formatTime12h(totalMinutes: number) {
  let hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;

  const padMinutes = minutes < 10 ? '0' + minutes : String(minutes);
  const padHours = hours < 10 ? '0' + hours : String(hours);

  const timeEn = `${padHours}:${padMinutes} ${ampm}`;
  const timeBn = `${toBengaliNumber(padHours)}:${toBengaliNumber(padMinutes)} ${ampm === 'PM' ? 'অপরাহ্ন' : 'পূর্বাহ্ন'}`;

  let period: 'afternoon' | 'evening' | 'night' = 'evening';
  if (totalMinutes < 17 * 60) {
    period = 'afternoon';
  } else if (totalMinutes < 20 * 60) {
    period = 'evening';
  } else {
    period = 'night';
  }

  return { timeEn, timeBn, totalMinutes, hour12: String(padHours), minute: String(padMinutes), ampm, period };
}

export function time24ToComponents(time24: string) {
  const totalMinutes = parseTimeToMinutes(time24);
  return formatTime12h(totalMinutes);
}

export function componentsToTime24(hour12: string | number, minute: string | number, ampm: string): string {
  let h = typeof hour12 === 'string' ? parseInt(hour12, 10) : hour12;
  const m = typeof minute === 'string' ? parseInt(minute, 10) : minute;
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  const padH = String(h).padStart(2, '0');
  const padM = String(m).padStart(2, '0');
  return `${padH}:${padM}`;
}

export const defaultSchedules: Record<ChamberMode, ChamberSchedule> = {
  offline: {
    chamberId: 'dhaka_chamber',
    titleBn: 'ঢাকা চেম্বার (সরাসরি)',
    titleEn: 'Dhaka Chamber (In-Person)',
    mode: 'offline',
    timingType: 'day_specific',
    generalTiming: {
      startTime: '16:00',
      endTime: '21:00',
      breakStart: '18:30',
      breakDuration: 30,
      slotDuration: 15
    },
    daySchedules: {
      0: { enabled: false, dayNameBn: 'রবিবার', startTime: '16:00', endTime: '20:00', breakStart: '18:00', breakDuration: 30, slotDuration: 15 },
      1: { enabled: false, dayNameBn: 'সোমবার', startTime: '16:00', endTime: '20:00', breakStart: '18:00', breakDuration: 30, slotDuration: 15 },
      2: { enabled: false, dayNameBn: 'মঙ্গলবার', startTime: '16:00', endTime: '20:00', breakStart: '18:00', breakDuration: 30, slotDuration: 15 },
      3: { enabled: false, dayNameBn: 'বুধবার', startTime: '16:00', endTime: '20:00', breakStart: '18:00', breakDuration: 30, slotDuration: 15 },
      4: { enabled: false, dayNameBn: 'বৃহস্পতিবার', startTime: '16:00', endTime: '20:00', breakStart: '18:00', breakDuration: 30, slotDuration: 15 },
      5: { enabled: true, dayNameBn: 'শুক্রবার', startTime: '16:00', endTime: '21:00', breakStart: '18:30', breakDuration: 30, slotDuration: 15 },
      6: { enabled: true, dayNameBn: 'শনিবার', startTime: '14:30', endTime: '20:30', breakStart: '17:00', breakDuration: 30, slotDuration: 15 }
    },
    addressBn: '২/১ জায়েদা ভিলা, শ্যামলী কল্যাণ সমিতি, শ্যামলী-১২০৭, ঢাকা',
    feeBn: '১,০০০ টাকা'
  },
  online: {
    chamberId: 'online_chamber',
    titleBn: 'অনলাইন ভিডিও কনসালটেশন',
    titleEn: 'Global Online Telehealth',
    mode: 'online',
    timingType: 'general',
    generalTiming: {
      startTime: '19:00',
      endTime: '22:30',
      breakStart: '20:30',
      breakDuration: 15,
      slotDuration: 15
    },
    daySchedules: {
      0: { enabled: true, dayNameBn: 'রবিবার', startTime: '19:00', endTime: '22:30', breakStart: '20:30', breakDuration: 15, slotDuration: 15 },
      1: { enabled: false, dayNameBn: 'সোমবার', startTime: '19:00', endTime: '22:30', breakStart: '20:30', breakDuration: 15, slotDuration: 15 },
      2: { enabled: true, dayNameBn: 'মঙ্গলবার', startTime: '19:00', endTime: '22:30', breakStart: '20:30', breakDuration: 15, slotDuration: 15 },
      3: { enabled: false, dayNameBn: 'বুধবার', startTime: '19:00', endTime: '22:30', breakStart: '20:30', breakDuration: 15, slotDuration: 15 },
      4: { enabled: true, dayNameBn: 'বৃহস্পতিবার', startTime: '19:00', endTime: '22:30', breakStart: '20:30', breakDuration: 15, slotDuration: 15 },
      5: { enabled: false, dayNameBn: 'শুক্রবার', startTime: '20:00', endTime: '23:00', breakStart: '21:30', breakDuration: 15, slotDuration: 15 },
      6: { enabled: false, dayNameBn: 'শনিবার', startTime: '20:00', endTime: '23:00', breakStart: '21:30', breakDuration: 15, slotDuration: 15 }
    },
    addressBn: 'জুম (Zoom) অথবা হোয়াটসঅ্যাপ ভিডিও কল',
    feeBn: '৮০০ টাকা'
  }
};

export function getEffectiveTimingForDay(
  schedule: ChamberSchedule,
  dayOfWeek: number
): DayScheduleConfig | null {
  const dayConfig = schedule.daySchedules?.[dayOfWeek];
  if (!dayConfig || !dayConfig.enabled) {
    return null;
  }

  if (schedule.timingType === 'day_specific') {
    return {
      enabled: true,
      dayNameBn: bnDays[dayOfWeek],
      startTime: dayConfig.startTime || '16:00',
      endTime: dayConfig.endTime || '21:00',
      breakStart: dayConfig.breakStart || '18:30',
      breakDuration: Number(dayConfig.breakDuration || 30),
      slotDuration: Number(dayConfig.slotDuration || 15)
    };
  }

  const gen = schedule.generalTiming;
  return {
    enabled: true,
    dayNameBn: bnDays[dayOfWeek],
    startTime: gen.startTime || '16:00',
    endTime: gen.endTime || '21:00',
    breakStart: gen.breakStart || '18:30',
    breakDuration: Number(gen.breakDuration || 30),
    slotDuration: Number(gen.slotDuration || 15)
  };
}

export function getEffectiveTimingForDate(
  schedule: ChamberSchedule,
  dateStr: string
): DayScheduleConfig | null {
  if (!dateStr) return null;

  // 1. Check explicit date-specific override
  if (schedule.dateOverrides && schedule.dateOverrides[dateStr]) {
    const override = schedule.dateOverrides[dateStr];
    if (!override.enabled) return null;
    return override;
  }

  // 2. Fall back to standard day-of-week timing
  const parts = dateStr.split('-').map(Number);
  if (parts.length < 3) return null;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  const dayOfWeek = d.getDay();

  return getEffectiveTimingForDay(schedule, dayOfWeek);
}

export function generateSlotsFromTiming(timing: DayScheduleConfig | null): Slot[] {
  if (!timing || !timing.enabled) return [];

  const startMin = parseTimeToMinutes(timing.startTime);
  const endMin = parseTimeToMinutes(timing.endTime);
  const breakStartMin = timing.breakStart ? parseTimeToMinutes(timing.breakStart) : -1;
  const breakEndMin = breakStartMin >= 0 ? breakStartMin + (timing.breakDuration || 0) : -1;
  const duration = timing.slotDuration || 15;

  const slots: Slot[] = [];
  let cur = startMin;

  while (cur + duration <= endMin) {
    const slotEnd = cur + duration;

    // Check if slot overlaps break window
    const overlapsBreak =
      breakStartMin >= 0 &&
      ((cur >= breakStartMin && cur < breakEndMin) ||
        (slotEnd > breakStartMin && slotEnd <= breakEndMin) ||
        (cur <= breakStartMin && slotEnd >= breakEndMin));

    if (!overlapsBreak) {
      const startFormatted = formatTime12h(cur);
      const endFormatted = formatTime12h(slotEnd);

      slots.push({
        id: `slot_${cur}_${slotEnd}`,
        startMinutes: cur,
        endMinutes: slotEnd,
        timeEn: `${startFormatted.timeEn} - ${endFormatted.timeEn}`,
        timeBn: `${startFormatted.timeBn} - ${endFormatted.timeBn}`,
        shortEn: startFormatted.timeEn,
        shortBn: startFormatted.timeBn,
        period: startFormatted.period
      });
    }

    cur += duration;
  }

  return slots;
}

export function getUpcomingDates(
  schedule: ChamberSchedule,
  count = 10
): CalendarDay[] {
  const enabledDays: number[] = [];
  if (schedule.daySchedules) {
    for (let day = 0; day < 7; day++) {
      if (schedule.daySchedules[day]?.enabled) {
        enabledDays.push(day);
      }
    }
  }

  const dates: CalendarDay[] = [];
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  for (let i = 1; i <= 45 && dates.length < count; i++) {
    const d = new Date(todayMidnight);
    d.setDate(todayMidnight.getDate() + i);
    const dayOfWeek = d.getDay();

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const override = schedule.dateOverrides?.[dateStr];
    const isDayActive = override !== undefined ? override.enabled : enabledDays.includes(dayOfWeek);

    if (isDayActive) {
      const diffTime = d.getTime() - todayMidnight.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      const isBookingOpen = diffDays <= 7;

      dates.push({
        dateStr,
        dayOfWeek,
        dayNameBn: bnDays[dayOfWeek],
        dayNameShortBn: bnDaysShort[dayOfWeek],
        dayNameEn: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumBn: toBengaliNumber(d.getDate()),
        dayNumEn: d.getDate(),
        monthBn: bnMonths[d.getMonth()],
        monthEn: d.toLocaleDateString('en-US', { month: 'short' }),
        fullBn: `${toBengaliNumber(d.getDate())} ${bnMonths[d.getMonth()]}, ${toBengaliNumber(yyyy)} (${bnDays[dayOfWeek]})`,
        fullEn: `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} (${d.toLocaleDateString('en-US', { weekday: 'short' })})`,
        diffDays,
        isBookingOpen,
        statusLabelBn: override?.dayNameBn
          ? `${override.dayNameBn} • বিশেষ সময়`
          : isBookingOpen
          ? 'বুকিং খোলা'
          : 'পরবর্তী সপ্তাহে উন্মুক্ত'
      });
    }
  }

  return dates;
}

export function generateSerialNo(
  mode: ChamberMode,
  dateStr: string,
  existingCountOnDate: number
): string {
  const prefix = mode === 'offline' ? 'DD-DH' : 'DD-ON';
  const compactDate = dateStr.replace(/-/g, '').slice(2);
  const serialSeq = String(existingCountOnDate + 1).padStart(2, '0');
  return `${prefix}-${compactDate}-${serialSeq}`;
}

export function formatDateToBn(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-').map(Number);
  if (parts.length < 3) return dateStr;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  const dayBn = toBengaliNumber(d.getDate());
  const monthBn = bnMonths[d.getMonth()];
  const yearBn = toBengaliNumber(d.getFullYear());
  const weekdayBn = bnDays[d.getDay()];
  return `${dayBn} ${monthBn}, ${yearBn} (${weekdayBn})`;
}
