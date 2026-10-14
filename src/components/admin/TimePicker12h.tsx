'use client';

import React from 'react';
import {
  time24ToComponents,
  componentsToTime24,
  toBengaliNumber
} from '@/lib/booking/utils';

interface TimePicker12hProps {
  value: string; // 24-hour format "HH:MM", e.g. "16:00"
  onChange: (value24: string) => void;
  label?: string;
  disabled?: boolean;
}

const HOURS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
const DEFAULT_MINUTES = [
  '00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'
];

export default function TimePicker12h({
  value,
  onChange,
  label,
  disabled = false
}: TimePicker12hProps) {
  const comp = time24ToComponents(value || '16:00');

  const currentHour = comp.hour12 || '04';
  const currentMinute = comp.minute || '00';
  const currentAmpm = (comp.ampm as 'AM' | 'PM') || 'PM';

  const allMinutes = DEFAULT_MINUTES.includes(currentMinute)
    ? DEFAULT_MINUTES
    : [...DEFAULT_MINUTES, currentMinute].sort();

  const handleHourChange = (newHour: string) => {
    const val24 = componentsToTime24(newHour, currentMinute, currentAmpm);
    onChange(val24);
  };

  const handleMinuteChange = (newMinute: string) => {
    const val24 = componentsToTime24(currentHour, newMinute, currentAmpm);
    onChange(val24);
  };

  const handleAmpmChange = (newAmpm: 'AM' | 'PM') => {
    const val24 = componentsToTime24(currentHour, currentMinute, newAmpm);
    onChange(val24);
  };

  return (
    <div className="w-full min-w-0 space-y-1">
      {label && (
        <div className="flex items-center justify-between gap-1 text-[11px] font-medium text-emerald-800 dark:text-emerald-300">
          <span className="truncate font-semibold">{label}</span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold shrink-0">
            {toBengaliNumber(currentHour)}:{toBengaliNumber(currentMinute)} {currentAmpm}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between gap-1 p-1 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#101e17] shadow-sm w-full min-w-0 overflow-hidden">
        <div className="flex items-center gap-1 min-w-0">
          {/* Hour Select */}
          <select
            disabled={disabled}
            value={currentHour}
            onChange={(e) => handleHourChange(e.target.value)}
            className="w-[42px] sm:w-[46px] py-1 px-0.5 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-100 font-bold font-mono text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer text-center shrink-0"
            title="ঘণ্টা (Hour)"
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>

          <span className="font-black text-emerald-700 dark:text-emerald-400 text-xs shrink-0">:</span>

          {/* Minute Select */}
          <select
            disabled={disabled}
            value={currentMinute}
            onChange={(e) => handleMinuteChange(e.target.value)}
            className="w-[42px] sm:w-[46px] py-1 px-0.5 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-100 font-bold font-mono text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer text-center shrink-0"
            title="মিনিট (Minute)"
          >
            {allMinutes.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* AM / PM Segmented Switch */}
        <div className="flex items-center rounded-lg bg-emerald-100/70 dark:bg-emerald-950 p-0.5 shrink-0 border border-emerald-200/50 dark:border-emerald-800/60 ml-auto">
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleAmpmChange('AM')}
            className={`px-2 py-0.5 rounded-md text-[10px] font-black transition-all cursor-pointer ${
              currentAmpm === 'AM'
                ? 'bg-amber-500 text-emerald-950 shadow-sm'
                : 'text-emerald-800 dark:text-emerald-400 hover:text-emerald-950 dark:hover:text-white'
            }`}
            title="সকাল / পূর্বাহ্ন (AM)"
          >
            AM
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleAmpmChange('PM')}
            className={`px-2 py-0.5 rounded-md text-[10px] font-black transition-all cursor-pointer ${
              currentAmpm === 'PM'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-emerald-800 dark:text-emerald-400 hover:text-emerald-950 dark:hover:text-white'
            }`}
            title="বিকাল / রাত / অপরাহ্ন (PM)"
          >
            PM
          </button>
        </div>
      </div>
    </div>
  );
}
