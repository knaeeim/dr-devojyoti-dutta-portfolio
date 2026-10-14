/* ==========================================================================
   ডা. দেবজ্যোতি দত্ত - অ্যাপয়েন্টমেন্ট ও ফ্লেক্সিবল স্লট ইঞ্জিন
   Day-Specific & General Timing Engine (Friday/Saturday & Online Flex)
   ========================================================================== */

(function (window) {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. Bengali & Time Conversion Utilities
  // --------------------------------------------------------------------------
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  const bnDays = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
  const bnDaysShort = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র', 'শনি'];
  const bnMonths = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];

  function toBengaliNumber(num) {
    if (num === null || num === undefined) return '';
    return num.toString().replace(/\d/g, d => bnDigits[d]);
  }

  function parseTimeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const parts = timeStr.split(':').map(Number);
    const h = parts[0] || 0;
    const m = parts[1] || 0;
    return (h * 60) + m;
  }

  function minutesToTime24(totalMinutes) {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const padH = String(h).padStart(2, '0');
    const padM = String(m).padStart(2, '0');
    return `${padH}:${padM}`;
  }

  function formatTime12h(totalMinutes) {
    let hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;

    const padMinutes = minutes < 10 ? '0' + minutes : minutes;
    const padHours = hours < 10 ? '0' + hours : hours;

    const timeEn = `${padHours}:${padMinutes} ${ampm}`;
    const timeBn = `${toBengaliNumber(padHours)}:${toBengaliNumber(padMinutes)} ${ampm === 'PM' ? 'অপরাহ্ন' : 'পূর্বাহ্ন'}`;

    return { timeEn, timeBn, totalMinutes, hour12: String(padHours), minute: String(padMinutes), ampm };
  }

  function time24ToComponents(time24) {
    const totalMinutes = parseTimeToMinutes(time24);
    return formatTime12h(totalMinutes);
  }

  function componentsToTime24(hour12, minute, ampm) {
    let h = parseInt(hour12, 10) || 12;
    const m = parseInt(minute, 10) || 0;
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    const padH = String(h).padStart(2, '0');
    const padM = String(m).padStart(2, '0');
    return `${padH}:${padM}`;
  }

  // --------------------------------------------------------------------------
  // 2. Default Chamber Schedules with Day-Specific & General Options
  // --------------------------------------------------------------------------
  const defaultSchedules = {
    // ------------------------------------------------------------------------
    // OFFLINE (ঢাকা চেম্বার): শুক্রবার ও শনিবারের সময় আলাদা
    // ------------------------------------------------------------------------
    offline: {
      chamberId: 'dhaka_chamber',
      titleBn: 'ঢাকা চেম্বার (সরাসরি)',
      titleEn: 'Dhaka Chamber (In-Person)',
      mode: 'offline',
      timingType: 'day_specific', // 'day_specific' or 'general'
      generalTiming: {
        startTime: '16:00', // 04:00 PM
        endTime: '21:00',   // 09:00 PM
        breakStart: '18:30', // 06:30 PM
        breakDuration: 30,  // 30 min
        slotDuration: 15
      },
      // ৭ দিনের আলাদা কনফিগারেশন: ডিফল্টভাবে শুধু শুক্র ও শনি সক্রিয়
      daySchedules: {
        0: { enabled: false, dayNameBn: 'রবিবার', startTime: '16:00', endTime: '20:00', breakStart: '18:00', breakDuration: 30, slotDuration: 15 },
        1: { enabled: false, dayNameBn: 'সোমবার', startTime: '16:00', endTime: '20:00', breakStart: '18:00', breakDuration: 30, slotDuration: 15 },
        2: { enabled: false, dayNameBn: 'মঙ্গলবার', startTime: '16:00', endTime: '20:00', breakStart: '18:00', breakDuration: 30, slotDuration: 15 },
        3: { enabled: false, dayNameBn: 'বুধবার', startTime: '16:00', endTime: '20:00', breakStart: '18:00', breakDuration: 30, slotDuration: 15 },
        4: { enabled: false, dayNameBn: 'বৃহস্পতিবার', startTime: '16:00', endTime: '20:00', breakStart: '18:00', breakDuration: 30, slotDuration: 15 },
        // শুক্রবার: বিকাল ০৪:০০ থেকে রাত ০৯:০০
        5: { enabled: true, dayNameBn: 'শুক্রবার', startTime: '16:00', endTime: '21:00', breakStart: '18:30', breakDuration: 30, slotDuration: 15 },
        // শনিবার: দুপুর ০২:৩০ থেকে রাত ০৮:৩০ (শুক্রবার ও শনিবার আলাদা সময়!)
        6: { enabled: true, dayNameBn: 'শনিবার', startTime: '14:30', endTime: '20:30', breakStart: '17:00', breakDuration: 30, slotDuration: 15 }
      },
      addressBn: '২/১ জায়েদা ভিলা, শ্যামলী কল্যাণ সমিতি, শ্যামলী-১২০৭, ঢাকা',
      feeBn: '১,০০০ টাকা'
    },

    // ------------------------------------------------------------------------
    // ONLINE (অনলাইন ভিডিও): জেনারেল এবং ডে-স্পেসিফিক উভয়ই সাপোর্ট করে
    // ------------------------------------------------------------------------
    online: {
      chamberId: 'online_chamber',
      titleBn: 'অনলাইন ভিডিও কনসালটেশন',
      titleEn: 'Global Online Telehealth',
      mode: 'online',
      timingType: 'general', // ডিফল্ট 'general', অ্যাডমিন চাইলে 'day_specific' করতে পারবে
      generalTiming: {
        startTime: '19:00', // 07:00 PM
        endTime: '22:30',   // 10:30 PM
        breakStart: '20:30', // 08:30 PM
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
      feeBn: '১,২০০ টাকা'
    }
  };

  // --------------------------------------------------------------------------
  // 3. Storage Functions
  // --------------------------------------------------------------------------
  function getStoredSchedules() {
    const raw = localStorage.getItem('ayur_chamber_config_v2');
    if (!raw) {
      localStorage.setItem('ayur_chamber_config_v2', JSON.stringify(defaultSchedules));
      return defaultSchedules;
    }
    try {
      const parsed = JSON.parse(raw);
      // Ensure all fields exist
      if (!parsed.offline || !parsed.offline.daySchedules) {
        localStorage.setItem('ayur_chamber_config_v2', JSON.stringify(defaultSchedules));
        return defaultSchedules;
      }
      return parsed;
    } catch (e) {
      return defaultSchedules;
    }
  }

  function saveSchedules(schedules) {
    localStorage.setItem('ayur_chamber_config_v2', JSON.stringify(schedules));
  }

  function getAppointments() {
    const raw = localStorage.getItem('ayur_all_appointments');
    if (!raw) {
      const initial = [
        {
          id: 'APT-1001',
          serialNo: 'DD-DH-261016-01',
          patientName: 'তানভীর আহমেদ',
          phone: '+880 1711-223344',
          email: 'tanvir.ahmed@gmail.com',
          chamberMode: 'offline',
          chamberTitleBn: 'ঢাকা চেম্বার (সরাসরি)',
          appointmentDate: '2026-10-16',
          dateFormattedBn: '১৬ অক্টোবর, ২০২৬ (শুক্রবার)',
          slotId: 'slot_960_975',
          slotTimeBn: '০৪:০০ অপরাহ্ন - ০৪:১৫ অপরাহ্ন',
          slotTimeEn: '04:00 PM - 04:15 PM',
          complaints: 'টাইপ-২ ডায়াবেটিস ও পেটের দীর্ঘদিনের গ্যাস/আইবিএস সমস্যা।',
          status: 'confirmed',
          createdAt: new Date().toISOString()
        },
        {
          id: 'APT-1002',
          serialNo: 'DD-ON-261018-01',
          patientName: 'নাজমা বেগম',
          phone: '+880 1819-887766',
          email: '',
          chamberMode: 'online',
          chamberTitleBn: 'অনলাইন ভিডিও কনসালটেশন',
          appointmentDate: '2026-10-18',
          dateFormattedBn: '১৮ অক্টোবর, ২০২৬ (রবিবার)',
          slotId: 'slot_1140_1155',
          slotTimeBn: '০৭:০০ অপরাহ্ন - ০৭:১৫ অপরাহ্ন',
          slotTimeEn: '07:00 PM - 07:15 PM',
          complaints: 'হরমোনের ভারসাম্যহীনতা ও ফ্যাটি লিভার।',
          status: 'confirmed',
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem('ayur_all_appointments', JSON.stringify(initial));
      return initial;
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }

  function saveAppointments(appointments) {
    localStorage.setItem('ayur_all_appointments', JSON.stringify(appointments));
  }

  // --------------------------------------------------------------------------
  // 4. Resolve Active Timing for Any Given Day & Chamber
  // --------------------------------------------------------------------------
  function getEffectiveTimingForDay(mode, dayOfWeek) {
    const schedules = getStoredSchedules();
    const config = schedules[mode] || defaultSchedules[mode];

    const dayConfig = (config.daySchedules && config.daySchedules[dayOfWeek]) ? config.daySchedules[dayOfWeek] : null;

    if (!dayConfig || !dayConfig.enabled) {
      return null; // Day is not enabled!
    }

    // If day-specific timing is selected for this chamber, return this day's settings
    if (config.timingType === 'day_specific') {
      return {
        enabled: true,
        dayOfWeek: dayOfWeek,
        dayNameBn: bnDays[dayOfWeek],
        startTime: dayConfig.startTime || '16:00',
        endTime: dayConfig.endTime || '21:00',
        breakStart: dayConfig.breakStart || '18:30',
        breakDuration: parseInt(dayConfig.breakDuration || 30, 10),
        slotDuration: parseInt(dayConfig.slotDuration || 15, 10)
      };
    }

    // Otherwise, use general timing for all enabled days
    const gen = config.generalTiming || defaultSchedules[mode].generalTiming;
    return {
      enabled: true,
      dayOfWeek: dayOfWeek,
      dayNameBn: bnDays[dayOfWeek],
      startTime: gen.startTime || '16:00',
      endTime: gen.endTime || '21:00',
      breakStart: gen.breakStart || '18:30',
      breakDuration: parseInt(gen.breakDuration || 30, 10),
      slotDuration: parseInt(gen.slotDuration || 15, 10)
    };
  }

  // --------------------------------------------------------------------------
  // 5. 15-Minute Slot Generation Algorithm (Excluding Break Interval)
  // --------------------------------------------------------------------------
  function generateSlotsFromTiming(timing) {
    if (!timing) return [];

    const startMin = parseTimeToMinutes(timing.startTime);
    const endMin = parseTimeToMinutes(timing.endTime);
    const breakStartMin = timing.breakStart ? parseTimeToMinutes(timing.breakStart) : -1;
    const breakEndMin = breakStartMin >= 0 ? breakStartMin + (timing.breakDuration || 0) : -1;
    const duration = timing.slotDuration || 15;

    const slots = [];
    let cur = startMin;

    while (cur + duration <= endMin) {
      const slotEnd = cur + duration;

      // Check if slot falls in break window
      const overlapsBreak = (breakStartMin >= 0) && (
        (cur >= breakStartMin && cur < breakEndMin) ||
        (slotEnd > breakStartMin && slotEnd <= breakEndMin) ||
        (cur <= breakStartMin && slotEnd >= breakEndMin)
      );

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
          shortBn: startFormatted.timeBn
        });
      }

      cur += duration;
    }

    return slots;
  }

  // --------------------------------------------------------------------------
  // 6. Calendar & Active Days Filtering (Strict 7-Day Running Week Booking)
  // --------------------------------------------------------------------------
  function getUpcomingDatesForMode(mode, count = 10) {
    const schedules = getStoredSchedules();
    const config = schedules[mode] || defaultSchedules[mode];

    // Find all days that are currently enabled in the dashboard
    const enabledDays = [];
    if (config.daySchedules) {
      for (let day = 0; day < 7; day++) {
        if (config.daySchedules[day] && config.daySchedules[day].enabled) {
          enabledDays.push(day);
        }
      }
    }

    if (enabledDays.length === 0) {
      return [];
    }

    const dates = [];
    const today = new Date();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Generate upcoming active days
    // Running week rule: Appointments within next 7 days (diffDays <= 7) are active,
    // future week dates (diffDays > 7) are disabled/locked until 7 days prior.
    for (let i = 1; i <= 45 && dates.length < count; i++) {
      const d = new Date(todayMidnight);
      d.setDate(todayMidnight.getDate() + i);
      const dayOfWeek = d.getDay();

      if (enabledDays.includes(dayOfWeek)) {
        const diffTime = d.getTime() - todayMidnight.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        // Active only for the running week (7 days window)
        const isBookingOpen = (diffDays <= 7);

        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;

        const timing = getEffectiveTimingForDay(mode, dayOfWeek);

        dates.push({
          dateStr: dateStr,
          dayOfWeek: dayOfWeek,
          dayNameBn: bnDays[dayOfWeek],
          dayNameShortBn: bnDaysShort[dayOfWeek],
          dayNameEn: d.toLocaleDateString('en-US', { weekday: 'short' }),
          dayNumBn: toBengaliNumber(d.getDate()),
          dayNumEn: d.getDate(),
          monthBn: bnMonths[d.getMonth()],
          monthEn: d.toLocaleDateString('en-US', { month: 'short' }),
          fullBn: `${toBengaliNumber(d.getDate())} ${bnMonths[d.getMonth()]}, ${toBengaliNumber(yyyy)} (${bnDays[dayOfWeek]})`,
          fullEn: `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} (${d.toLocaleDateString('en-US', { weekday: 'short' })})`,
          timing: timing,
          diffDays: diffDays,
          isBookingOpen: isBookingOpen,
          statusLabelBn: isBookingOpen ? 'বুকিং খোলা' : 'পরবর্তী সপ্তাহে উন্মুক্ত'
        });
      }
    }

    return dates;
  }

  // Generate slots for a specific date and chamber
  function getSlotsForDate(dateStr, mode) {
    if (!dateStr) return [];
    const parts = dateStr.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    const dayOfWeek = d.getDay();

    const timing = getEffectiveTimingForDay(mode, dayOfWeek);
    if (!timing) return [];

    return generateSlotsFromTiming(timing);
  }

  // Check booked slots
  function getBookedSlotIds(dateStr, mode) {
    const appointments = getAppointments();
    return appointments
      .filter(apt => apt.appointmentDate === dateStr && apt.chamberMode === mode && apt.status !== 'cancelled')
      .map(apt => apt.slotId);
  }

  // Serial generator
  function generateSerialNo(mode, dateStr) {
    const appointments = getAppointments();
    const prefix = mode === 'offline' ? 'DD-DH' : 'DD-ON';
    const compactDate = dateStr.replace(/-/g, '').slice(2);
    const countSameDay = appointments.filter(apt => apt.appointmentDate === dateStr && apt.chamberMode === mode).length + 1;
    const serialSeq = String(countSameDay).padStart(2, '0');
    return `${prefix}-${compactDate}-${serialSeq}`;
  }

  // Active days label in Bengali
  function getActiveDaysSummary(mode) {
    const schedules = getStoredSchedules();
    const config = schedules[mode] || defaultSchedules[mode];
    const enabledDays = [];
    if (config.daySchedules) {
      for (let d = 0; d < 7; d++) {
        if (config.daySchedules[d] && config.daySchedules[d].enabled) {
          enabledDays.push(bnDays[d]);
        }
      }
    }
    return enabledDays.length > 0 ? enabledDays.join(' ও ') : 'কোনো দিন নির্ধারিত নেই';
  }

  // Export to window
  window.AyurBooking = {
    bnDays,
    bnDaysShort,
    toBengaliNumber,
    parseTimeToMinutes,
    minutesToTime24,
    formatTime12h,
    time24ToComponents,
    componentsToTime24,
    defaultSchedules,
    getStoredSchedules,
    saveSchedules,
    getAppointments,
    saveAppointments,
    getEffectiveTimingForDay,
    generateSlotsFromTiming,
    getUpcomingDatesForMode,
    getSlotsForDate,
    getBookedSlotIds,
    generateSerialNo,
    getActiveDaysSummary
  };

})(window);
