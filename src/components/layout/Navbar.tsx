'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Menu,
  X,
  Calendar,
  Shield,
  MessageCircle,
  Award,
  ChevronDown,
  ChevronRight,
  Stethoscope,
  BookOpen,
  HeartPulse,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '8801712854941';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setScrolled(scrollY > 15);

      // Hero section or top of the page: explicitly clear any active highlight
      if (scrollY < 200) {
        setActiveSection('');
        return;
      }

      // If near page bottom, activate the final section (FAQ)
      const isAtBottom =
        window.innerHeight + scrollY >= document.documentElement.scrollHeight - 80;
      if (isAtBottom) {
        setActiveSection('#faq');
        return;
      }

      const sections = [
        'about',
        'skills',
        'treatments',
        'booking',
        'prakriti',
        'research',
        'testimonials',
        'faq'
      ];

      let currentSection = '';
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          // Active when the section is positioned under the sticky navbar
          if (rect.top <= 160 && rect.bottom > 160) {
            currentSection = `#${section}`;
            break;
          }
        }
      }

      setActiveSection(currentSection);
    };

    // Run once on mount to ensure top position is cleared
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Primary 4 links that always sit in a single clean row
  const primaryNavLinks = [
    { href: '#treatments', label: 'চিকিৎসা সেবা' },
    { href: '#booking', label: 'সিরিয়াল বুকিং', isHot: true },
    { href: '#prakriti', label: 'প্রকৃতি পরীক্ষা' },
    { href: '#about', label: 'চিকিৎসা দর্শন' },
  ];

  // Secondary links housed neatly inside the arrow dropdown menu
  const secondaryNavLinks = [
    { href: '#skills', label: 'ক্লিনিক্যাল দক্ষতা ও পঞ্চকর্ম', desc: 'ক্লাসিক্যাল নাড়ি পরীক্ষা ও থেরাপি', icon: Stethoscope },
    { href: '#research', label: 'বই ও গবেষণা', desc: '"স্বাস্থ্য দর্পণ" ও বৈজ্ঞানিক প্রকাশনা', icon: BookOpen },
    { href: '#testimonials', label: 'রোগী অভিমত ও আরোগ্য বার্তা', desc: 'আইবিএস ও জটিল রোগের সুস্থতার গল্প', icon: HeartPulse },
    { href: '#faq', label: 'সাধারণ জিজ্ঞাসা (FAQ)', desc: 'সিরিয়াল ও চিকিৎসা সংক্রান্ত উত্তর', icon: HelpCircle },
    { href: '/admin', label: 'ডাক্তার ও অ্যাডমিন পোর্টাল', desc: 'সিরিয়াল ম্যানেজমেন্ট ও চেম্বার শিডিউল', icon: Shield, isSpecial: true },
  ];

  const allNavLinks = [
    { href: '#treatments', label: 'চিকিৎসা সেবা' },
    { href: '#booking', label: 'স্লট বুকিং', isHot: true },
    { href: '#prakriti', label: 'প্রকৃতি পরীক্ষা' },
    { href: '#about', label: 'চিকিৎসা দর্শন' },
    { href: '#skills', label: 'ক্লিনিক্যাল দক্ষতা' },
    { href: '#research', label: 'বই ও গবেষণা' },
    { href: '#testimonials', label: 'রোগী অভিমত' },
    { href: '#faq', label: 'জিজ্ঞাসা' },
  ];

  return (
    <>
      {/* Top Notice Bar */}
      <div className="bg-gradient-to-r from-emerald-950 via-[#0b281b] to-emerald-950 text-emerald-200 text-xs py-1.5 px-4 border-b border-emerald-800/40 hidden md:block">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-[11px]">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-900/80 border border-emerald-700/60 text-emerald-300 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              স্মার্ট সিরিয়াল বুকিং চালু
            </span>
            <span className="text-emerald-700">•</span>
            <span className="text-emerald-200 font-medium">
              ন্যাশনাল ইনস্টিটিউট অব আয়ুর্বেদ (NIA), জয়পুর • খুলনা বিশ্ববিদ্যালয়
            </span>
          </div>

          <div className="flex items-center gap-3.5">
            <a
              href={`https://wa.me/${whatsappNumber}?text=%E0%A6%A8%E0%A6%AE%E0%A6%B8%E0%A7%8D%E0%A6%95%E0%A6%BE%E0%A6%B0%20%E0%A6%A1%E0%A6%BE.%20%E0%A6%A6%E0%A7%87%E0%A6%AC%E0%A6%9C%E0%A7%8D%E0%A6%AF%E0%A7%8B%E0%A6%A4%E0%A6%BF%20%E0%A6%A6%E0%A6%A4%E0%A7%8D%E0%A6%A4%E0%A7%87%E0%A6%B0%20%E0%A6%9A%E0%A7%87%E0%A6%AE%E0%A7%8D%E0%A6%AC%E0%A6%BE%E0%A6%B0%E0%A7%87%E0%A6%B0%20%E0%A6%B8%E0%A6%BF%E0%A6%B0%E0%A6%BF%E0%A6%AF%E0%A6%BC%E0%A6%BE%E0%A6%B2%20%E0%A6%B8%E0%A6%AE%E0%A7%8D%E0%A6%AA%E0%A6%B0%E0%A7%8D%E0%A6%95%E0%A7%87%20%E0%A6%9C%E0%A6%BE%E0%A6%A8%E0%A6%A4%E0%A7%87%20%E0%A6%9A%E0%A6%BE%E0%A6%87।`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[#25D366] hover:text-[#3ce07b] font-semibold transition-colors"
              title="হোয়াটসঅ্যাপে সরাসরি চ্যাট করুন"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-[#25D366]/20" />
              <span>হোয়াটসঅ্যাপ: +৮৮০ ১৭১২-৮৫৪৯৪১</span>
            </a>
            <span className="text-emerald-700">|</span>
            <Link
              href="/admin"
              className="text-amber-300 hover:text-amber-200 flex items-center gap-1 font-semibold transition-colors hover:underline"
            >
              <Shield className="w-3 h-3 text-amber-400" />
              <span>ডাক্তার ড্যাশবোর্ড</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Sticky Navbar (Single Clean Line Guaranteed) */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 dark:bg-[#0a130f]/95 backdrop-blur-xl shadow-lg shadow-emerald-950/5 dark:shadow-black/40 border-b border-emerald-900/10 dark:border-emerald-500/15 py-2'
            : 'bg-white/90 dark:bg-[#0a130f]/85 backdrop-blur-md py-2.5 border-b border-emerald-900/5 dark:border-emerald-500/10'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-2">
            {/* Brand Logo & Name */}
            <Link
              href="/"
              onClick={() => setActiveSection('')}
              className="flex items-center gap-2.5 shrink-0 group"
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-950 flex items-center justify-center text-amber-300 font-bold text-base shadow-sm group-hover:scale-105 transition-all duration-200 border border-amber-400/30">
                  <span>DD</span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0a130f]" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-serif font-bold text-base text-emerald-950 dark:text-emerald-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors leading-tight whitespace-nowrap">
                    ডা. দেবজ্যোতি দত্ত
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300/40">
                    BAMS
                  </span>
                </div>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium whitespace-nowrap">
                  Ayurvedacharya • NIA Jaipur
                </span>
              </div>
            </Link>

            {/* Desktop Navigation (Guaranteed 1-Line Layout with Arrow Dropdown) */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
              {primaryNavLinks.map((link) => {
                const isActive = activeSection === link.href;
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setActiveSection(link.href)}
                    className={`relative px-3 py-1.5 rounded-xl text-xs xl:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
                      isActive
                        ? 'text-emerald-950 dark:text-emerald-50 bg-emerald-100 dark:bg-emerald-900/60 shadow-xs'
                        : 'text-emerald-900/80 dark:text-emerald-200/80 hover:text-emerald-950 dark:hover:text-white hover:bg-emerald-50/80 dark:hover:bg-emerald-900/30'
                    }`}
                  >
                    <span>{link.label}</span>
                    {link.isHot && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    )}
                  </a>
                );
              })}

              {/* Arrow Dropdown Menu for Secondary Items */}
              <div
                ref={dropdownRef}
                className="relative"
                onMouseEnter={() => setIsDropdownOpen(true)}
                onMouseLeave={() => setIsDropdownOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`px-3 py-1.5 rounded-xl text-xs xl:text-sm font-semibold transition-all duration-200 flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                    isDropdownOpen
                      ? 'bg-emerald-100/90 dark:bg-emerald-900/60 text-emerald-950 dark:text-emerald-100'
                      : 'text-emerald-900/80 dark:text-emerald-200/80 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
                  }`}
                  aria-expanded={isDropdownOpen}
                >
                  <span>আরও তথ্য</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300 transition-transform duration-200 ${
                      isDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Card */}
                <div
                  className={`absolute top-full right-0 mt-1.5 w-72 rounded-2xl bg-white/98 dark:bg-[#101e17]/98 backdrop-blur-xl border border-emerald-900/10 dark:border-emerald-700/40 shadow-2xl p-2 space-y-1 transition-all duration-200 z-50 ${
                    isDropdownOpen
                      ? 'opacity-100 visible translate-y-0'
                      : 'opacity-0 invisible -translate-y-2 pointer-events-none'
                  }`}
                >
                  <div className="px-3 py-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase border-b border-emerald-900/5 dark:border-emerald-800/40">
                    অন্যান্য শাখা ও সেবা
                  </div>

                  {secondaryNavLinks.map((item) => {
                    const Icon = item.icon;
                    const isLinkInternal = item.href.startsWith('#');
                    const Component = isLinkInternal ? 'a' : Link;

                    return (
                      <Component
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsDropdownOpen(false)}
                        className={`flex items-start gap-2.5 p-2 rounded-xl text-xs transition-colors group ${
                          item.isSpecial
                            ? 'bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-900/60 hover:bg-amber-100'
                            : 'text-emerald-950 dark:text-emerald-100 hover:bg-emerald-50 dark:hover:bg-emerald-900/40'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-emerald-100/70 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shrink-0 group-hover:scale-105 transition-transform mt-0.5">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold flex items-center justify-between">
                            <span>{item.label}</span>
                            <ChevronRight className="w-3 h-3 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 truncate">
                            {item.desc}
                          </p>
                        </div>
                      </Component>
                    );
                  })}
                </div>
              </div>
            </nav>

            {/* Right CTAs (WhatsApp, Theme Toggle, Booking Button) */}
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              {/* WhatsApp Quick Direct Button */}
              <a
                href={`https://wa.me/${whatsappNumber}?text=%E0%A6%A8%E0%A6%AE%E0%A6%B8%E0%A7%8D%E0%A6%95%E0%A6%BE%E0%A6%B0%20%E0%A6%A1%E0%A6%BE.%20%E0%A6%A6%E0%A7%87%E0%A6%AC%E0%A6%9C%E0%A7%8B%E0%A6%A4%E0%A6%BF%20%E0%A6%A6%E0%A6%A4%E0%A7%8D%E0%A6%A4%E0%A7%87%E0%A6%B0%20%E0%A6%9A%E0%A7%87%E0%A6%AE%E0%A7%8D%E0%A6%AC%E0%A6%BE%E0%A6%B0%E0%A7%87%E0%A6%B0%20%E0%A6%B8%E0%A6%BF%E0%A6%B0%E0%A6%BF%E0%A6%AF%E0%A6%BC%E0%A6%BE%E0%A6%B2%20%E0%A6%B8%E0%A6%AE%E0%A7%8D%E0%A6%AA%E0%A6%B0%E0%A7%8D%E0%A6%95%E0%A7%87%20%E0%A6%9C%E0%A6%BE%E0%A6%A8%E0%A6%A4%E0%A7%87%20%E0%A6%9A%E0%A6%BE%E0%A6%87।`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[#25D366] hover:bg-[#25D366]/10 transition-colors cursor-pointer"
                title="রোগী হেল্পলাইন: সরাসরি হোয়াটসঅ্যাপে চ্যাট করুন"
                aria-label="WhatsApp Contact"
              >
                <MessageCircle className="w-4 h-4 fill-[#25D366]/20" />
              </a>

              {/* Theme Toggle Button */}
              <ThemeToggle />

              {/* Primary Booking Button */}
              <a
                href="#booking"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold text-xs shadow-sm hover:shadow-md transition-all active:scale-95 border border-emerald-600/40 cursor-pointer whitespace-nowrap"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-300" />
                <span>সিরিয়াল বুক করুন</span>
              </a>
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex items-center gap-2 lg:hidden">
              <ThemeToggle />
              <button
                onClick={() => setIsOpen(!isOpen)}
                type="button"
                className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200/80 dark:border-emerald-800/80 transition-colors cursor-pointer"
                aria-label="টগল মেনু"
              >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isOpen && (
          <div className="lg:hidden fixed inset-x-0 top-[57px] bg-white/95 dark:bg-[#0a130f]/95 backdrop-blur-2xl border-b border-emerald-900/10 dark:border-emerald-500/15 shadow-2xl transition-all duration-300 max-h-[calc(100vh-57px)] overflow-y-auto animate-fade-in">
            <div className="p-5 space-y-4">
              {/* Mobile notice banner */}
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  স্মার্ট সিরিয়াল বুকিং চালু
                </span>
                <span className="text-amber-700 dark:text-amber-400 font-bold text-[11px]">
                  ঢাকা ও অনলাইন চেম্বার
                </span>
              </div>

              {/* Navigation links */}
              <div className="grid grid-cols-1 gap-1">
                {allNavLinks.map((link) => {
                  const isActive = activeSection === link.href;
                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={() => {
                        setIsOpen(false);
                        setActiveSection(link.href);
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl text-sm font-semibold transition-colors ${
                        isActive
                          ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-950 dark:text-emerald-50"
                          : "text-emerald-950 dark:text-emerald-100 hover:bg-emerald-50 dark:hover:bg-emerald-900/40"
                      }`}
                    >
                      <span>{link.label}</span>
                      <ChevronRight className={`w-4 h-4 ${isActive ? "text-emerald-700 dark:text-emerald-300" : "text-emerald-500"}`} />
                    </a>
                  );
                })}
              </div>

              {/* Mobile CTAs */}
              <div className="pt-3 border-t border-emerald-900/10 dark:border-emerald-800/40 space-y-2.5">
                <a
                  href="#booking"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold text-sm shadow-md cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-amber-300" />
                  <span>সিরিয়াল বুকিং করুন</span>
                </a>

                <a
                  href={`https://wa.me/${whatsappNumber}?text=%E0%A6%A8%E0%A6%AE%E0%A6%B8%E0%A7%8D%E0%A6%95%E0%A6%BE%E0%A6%B0%20%E0%A6%A1%E0%A6%BE.%20%E0%A6%A6%E0%A7%87%E0%A6%AC%E0%A6%9C%E0%A7%8B%E0%A6%A4%E0%A6%BF%20%E0%A6%A6%E0%A6%A4%E0%A7%8D%E0%A6%A4%E0%A7%87%E0%A6%B0%20%E0%A6%9A%E0%A7%87%E0%A6%AE%E0%A7%8D%E0%A6%AC%E0%A6%BE%E0%A6%B0%E0%A7%87%E0%A6%B0%20%E0%A6%B8%E0%A6%BF%E0%A6%B0%E0%A6%BF%E0%A6%AF%E0%A6%BC%E0%A6%BE%E0%A6%B2%20%E0%A6%B8%E0%A6%AE%E0%A7%8D%E0%A6%AA%E0%A6%B0%E0%A7%8D%E0%A6%95%E0%A7%87%20%E0%A6%9C%E0%A6%BE%E0%A6%A8%E0%A6%A4%E0%A7%87%20%E0%A6%9A%E0%A6%BE%E0%A6%87।`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 text-[#128C7E] dark:text-[#25D366] font-bold text-sm hover:bg-[#25D366]/20 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>হোয়াটসঅ্যাপে তাৎক্ষণিক যোগাযোগ</span>
                </a>

                <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold text-xs hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
                >
                  <Shield className="w-3.5 h-3.5 text-amber-500" />
                  <span>ডাক্তার ও অ্যাডমিন পোর্টাল</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
