'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md';
}

export default function ThemeToggle({ className = '', size = 'md' }: ThemeToggleProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hasDarkClass = document.documentElement.classList.contains('dark');
    const stored = localStorage.getItem('ayur_theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (hasDarkClass || stored === 'dark' || (!stored && systemPrefersDark)) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      localStorage.setItem('ayur_theme', next);
    } catch {}
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
    window.dispatchEvent(new CustomEvent('ayur-theme-change', { detail: next }));
  };

  const isSmall = size === 'sm';
  const containerSize = isSmall ? 'h-8 w-8' : 'h-9 w-9';
  const iconSize = isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4';

  if (!mounted) {
    return (
      <div
        className={`${containerSize} rounded-xl border border-emerald-800/10 dark:border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/40 shrink-0 ${className}`}
      />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`relative inline-flex items-center justify-center shrink-0 ${containerSize} rounded-xl bg-emerald-50/80 dark:bg-emerald-950/70 border border-emerald-200/80 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/70 hover:text-emerald-950 dark:hover:text-emerald-100 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-2xs active:scale-95 group cursor-pointer ${className}`}
      title={theme === 'dark' ? 'লাইট মোডে পরিবর্তন করুন (Light Mode)' : 'ডার্ক মোডে পরিবর্তন করুন (Dark Mode)'}
      aria-label="Toggle Theme"
    >
      <div className={`relative ${iconSize} flex items-center justify-center`}>
        {theme === 'dark' ? (
          <Sun className={`${iconSize} text-amber-400 rotate-0 scale-100 transition-all duration-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]`} />
        ) : (
          <Moon className={`${iconSize} text-emerald-800 dark:text-emerald-200 rotate-0 scale-100 transition-all duration-300`} />
        )}
      </div>
    </button>
  );
}
