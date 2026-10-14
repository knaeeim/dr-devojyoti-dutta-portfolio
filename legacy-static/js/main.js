/* ==========================================================================
   ডা. দেবজ্যোতি দত্ত - মূল ওয়েবসাইট স্ক্রিপ্ট (বাংলা ভার্সন ও স্লট বুকিং)
   Interactive Bengali UI, Prakriti Quiz, 15-Minute Slot Engine & Modals
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const { 
    toBengaliNumber, 
    parseTimeToMinutes,
    formatTime12h,
    getStoredSchedules, 
    generateSlots, 
    getAppointments, 
    saveAppointments, 
    getUpcomingDatesForMode, 
    getBookedSlotIds, 
    generateSerialNo 
  } = window.AyurBooking;

  // --------------------------------------------------------------------------
  // 1. Theme Management (Light / Dark Mode)
  // --------------------------------------------------------------------------
  const themeToggleBtn = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  const root = document.documentElement;

  const savedTheme = localStorage.getItem('ayur_theme') || 'light';
  applyTheme(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const active = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(active);
      playZenTone(528);
    });
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem('ayur_theme', theme);
    if (themeIcon) {
      if (theme === 'dark') {
        themeIcon.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>`;
        themeToggleBtn.setAttribute('title', 'লাইট মোডে পরিবর্তন করুন');
      } else {
        themeIcon.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>`;
        themeToggleBtn.setAttribute('title', 'ডার্ক মোডে পরিবর্তন করুন');
      }
    }
  }

  // --------------------------------------------------------------------------
  // 2. Synthesized Zen Harmonic Tone (432Hz / 528Hz)
  // --------------------------------------------------------------------------
  let audioCtx = null;
  let soundEnabled = false;
  const soundToggleBtn = document.getElementById('sound-toggle');

  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      soundToggleBtn.classList.toggle('active', soundEnabled);
      soundToggleBtn.setAttribute('title', soundEnabled ? 'চিম সাউন্ড বন্ধ করুন' : 'হারমোনিক চিম চালু করুন (432Hz)');
      if (soundEnabled) {
        initAudio();
        playZenTone(432);
        soundToggleBtn.style.color = 'var(--color-accent)';
      } else {
        soundToggleBtn.style.color = '';
      }
    });
  }

  function initAudio() {
    if (!audioCtx) {
      const AudioClass = window.AudioContext || window.webkitAudioContext;
      if (AudioClass) audioCtx = new AudioClass();
    }
  }

  function playZenTone(freq = 432) {
    if (!soundEnabled) return;
    try {
      initAudio();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, audioCtx.currentTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 1.2);
    } catch (e) {
      // Audio not supported
    }
  }

  // --------------------------------------------------------------------------
  // 3. Scroll Progress & Sticky Navbar
  // --------------------------------------------------------------------------
  const scrollProgressBar = document.getElementById('scroll-progress');
  const navbar = document.querySelector('.navbar');
  const backToTopBtn = document.getElementById('back-to-top');

  window.addEventListener('scroll', () => {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
    if (scrollProgressBar) scrollProgressBar.style.width = `${progress}%`;

    if (navbar) {
      if (window.scrollY > 40) navbar.classList.add('scrolled');
      else navbar.classList.remove('scrolled');
    }

    if (backToTopBtn) {
      if (window.scrollY > 400) backToTopBtn.classList.add('show');
      else backToTopBtn.classList.remove('show');
    }
  }, { passive: true });

  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      playZenTone(528);
    });
  }

  // --------------------------------------------------------------------------
  // 4. Mobile Navigation Drawer
  // --------------------------------------------------------------------------
  const menuToggleBtn = document.getElementById('menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  const mobileNavBackdrop = document.getElementById('mobile-nav-backdrop');
  const mobileNavClose = document.getElementById('mobile-nav-close');
  const mobileLinks = document.querySelectorAll('.mobile-nav-links a');

  function openMobileMenu() {
    mobileNav.classList.add('open');
    mobileNavBackdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileMenu() {
    mobileNav.classList.remove('open');
    mobileNavBackdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (menuToggleBtn) menuToggleBtn.addEventListener('click', openMobileMenu);
  if (mobileNavClose) mobileNavClose.addEventListener('click', closeMobileMenu);
  if (mobileNavBackdrop) mobileNavBackdrop.addEventListener('click', closeMobileMenu);
  mobileLinks.forEach(link => link.addEventListener('click', closeMobileMenu));

  // --------------------------------------------------------------------------
  // 5. Active Nav Highlight on Scroll
  // --------------------------------------------------------------------------
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, { rootMargin: '-30% 0px -70% 0px' });

  sections.forEach(sec => sectionObserver.observe(sec));

  // --------------------------------------------------------------------------
  // 6. Bengali Animated Counter Numbers
  // --------------------------------------------------------------------------
  const statNumbers = document.querySelectorAll('.stat-number');
  let animatedStats = false;

  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !animatedStats) {
        animatedStats = true;
        statNumbers.forEach(stat => {
          const target = parseInt(stat.getAttribute('data-target'), 10);
          const suffix = stat.getAttribute('data-suffix') || '';
          let count = 0;
          const duration = 1600;
          const increment = Math.ceil(target / (duration / 25));

          const timer = setInterval(() => {
            count += increment;
            if (count >= target) {
              stat.textContent = toBengaliNumber(target) + suffix;
              clearInterval(timer);
            } else {
              stat.textContent = toBengaliNumber(count) + suffix;
            }
          }, 25);
        });
      }
    });
  }, { threshold: 0.2 });

  const heroStatsSection = document.querySelector('.hero-stats');
  if (heroStatsSection) statsObserver.observe(heroStatsSection);

  // --------------------------------------------------------------------------
  // 7. Interactive Prakriti (Dosha) Quiz in Bengali
  // --------------------------------------------------------------------------
  const quizData = [
    {
      question: "১. আপনার শারীরিক গঠন এবং হাড়ের কাঠামোর ধরন কেমন?",
      options: [
        { label: "পাতলা, হালকা হাড়, ক্ষীণ গড়ন; সহজে ওজন বাড়তে চায় না", dosha: "vata" },
        { label: "মাঝারি, সুঠাম ও পরিমিত গঠন; সহজেই ওজন কমানো বা বাড়ানো যায়", dosha: "pitta" },
        { label: "ভারী হাড়, চওড়া ও মজবুত গঠন; খুব সহজেই ওজন বেড়ে যায়", dosha: "kapha" }
      ]
    },
    {
      question: "২. আপনার ত্বকের প্রকৃতি এবং আবহাওয়ার সংবেদনশীলতা কেমন?",
      options: [
        { label: "শুষ্ক, খসখসে, পাতলা ত্বক; ঠাণ্ডা ও বাতাসযুক্ত আবহাওয়া অপছন্দ", dosha: "vata" },
        { label: "উষ্ণ, লালচে আভা, দ্রুত ব্রণ বা অ্যালার্জি প্রবণ; অতিরিক্ত রোদ ও গরম সহ্য হয় না", dosha: "pitta" },
        { label: "মসৃণ, তৈলাক্ত, নরম ও ঠাণ্ডা ত্বক; অতিরিক্ত ঠাণ্ডা ও স্যাঁতসেঁতে আবহাওয়া অপছন্দ", dosha: "kapha" }
      ]
    },
    {
      question: "৩. আপনার ক্ষুধা, হজম শক্তি (অগ্নি) এবং পেটের অবস্থা কেমন থাকে?",
      options: [
        { label: "অনিয়মিত ও পরিবর্তনশীল (বিষম অগ্নি); ঘন ঘন গ্যাস, পেট ফাঁপা বা কোষ্ঠকাঠিন্য", dosha: "vata" },
        { label: "তীব্র ও প্রখর (তীক্ষ্ণ অগ্নি); খাওয়ার সময় পার হলে মেজাজ খিটখিটে হয়, এসিডিটি প্রবণ", dosha: "pitta" },
        { label: "ধীর ও ধীরগতির (মন্দ অগ্নি); একবেলা না খেলেও কষ্ট হয় না, খাওয়ার পর পেটে ভারী ভাব", dosha: "kapha" }
      ]
    },
    {
      question: "৪. আপনার ঘুমের গভীরতা ও স্বপ্নের প্রকৃতি কেমন?",
      options: [
        { label: "হালকা ও ভাঙা ঘুম (৬ ঘণ্টার কম); স্বপ্নে ওড়াউড়ি, গতিময়তা বা দুশ্চিন্তা দেখা দেয়", dosha: "vata" },
        { label: "মধ্যম ও গভীর ঘুম (৬-৭ ঘণ্টা); রঙিন, তীব্র বা আগুনের স্বপ্ন; ঘুম ভাঙলে সতেজ লাগে", dosha: "pitta" },
        { label: "গভীর ও ভারী ঘুম (৮+ ঘণ্টা); সকালে সহজে ঘুম ভাঙতে চায় না; শান্ত ও ধীর স্বপ্ন", dosha: "kapha" }
      ]
    },
    {
      question: "৫. মানসিক চাপ বা উত্তেজনার পরিস্থিতিতে আপনার মন কীভাবে প্রতিক্রিয়া দেখায়?",
      options: [
        { label: "উদ্বেগ, ভয়, অস্থিরতা, মনের ভেতরে এলোমেলো চিন্তার ঝড় ও অনিদ্রা", dosha: "vata" },
        { label: "বিরক্তি, অধৈর্য ভাব, দ্রুত রাগ বা তীব্র সমালোচনা করার প্রবণতা", dosha: "pitta" },
        { label: "চুপচাপ সরে যাওয়া, কাজ ফেলে রাখা (procrastination) বা অবসাদ", dosha: "kapha" }
      ]
    },
    {
      question: "৬. আপনার স্মৃতিশক্তি, কাজের গতি এবং শারীরিক সক্ষমতা কেমন?",
      options: [
        { label: "দ্রুত বোঝেন কিন্তু দ্রুত ভুলে যান; হঠাৎ প্রচণ্ড শক্তি পান আবার হঠাৎ ক্লান্ত হয়ে পড়েন", dosha: "vata" },
        { label: "তীক্ষ্ণ স্মৃতিশক্তি ও লক্ষ্য স্থির রাখার ক্ষমতা; সুশৃঙ্খলভাবে কাজ শেষ করতে পারেন", dosha: "pitta" },
        { label: "শিখতে একটু সময় নিলেও সারাজীবন মনে থাকে; দীর্ঘ সময় কাজ করার চমৎকার ধৈর্য রয়েছে", dosha: "kapha" }
      ]
    }
  ];

  let currentQuestionIdx = 0;
  const userAnswers = [];

  const quizQuestionEl = document.getElementById('quiz-question');
  const quizOptionsEl = document.getElementById('quiz-options');
  const quizFillEl = document.getElementById('quiz-fill');
  const quizStepText = document.getElementById('quiz-step-text');
  const quizPrevBtn = document.getElementById('quiz-prev-btn');
  const quizNextBtn = document.getElementById('quiz-next-btn');
  const quizInteractiveArea = document.getElementById('quiz-interactive-area');
  const quizResultBox = document.getElementById('quiz-result-box');
  const retakeQuizBtn = document.getElementById('retake-quiz-btn');

  function renderQuizQuestion() {
    if (!quizQuestionEl || !quizOptionsEl) return;
    const q = quizData[currentQuestionIdx];
    quizQuestionEl.textContent = q.question;
    quizStepText.textContent = `প্রশ্ন ${toBengaliNumber(currentQuestionIdx + 1)} / ${toBengaliNumber(quizData.length)}`;
    quizFillEl.style.width = `${((currentQuestionIdx + 1) / quizData.length) * 100}%`;

    quizOptionsEl.innerHTML = '';
    q.options.forEach((opt, idx) => {
      const card = document.createElement('div');
      card.className = `option-card ${userAnswers[currentQuestionIdx] === opt.dosha ? 'selected' : ''}`;
      
      const doshaNamesBn = { vata: 'বাত (Vata)', pitta: 'পিত্ত (Pitta)', kapha: 'কফ (Kapha)' };

      card.innerHTML = `
        <div class="option-radio"></div>
        <div class="option-content">
          <h5>${doshaNamesBn[opt.dosha]} বৈশিষ্ট্য</h5>
          <p>${opt.label}</p>
        </div>
      `;
      card.addEventListener('click', () => {
        userAnswers[currentQuestionIdx] = opt.dosha;
        renderQuizQuestion();
        playZenTone(396 + idx * 80);
      });
      quizOptionsEl.appendChild(card);
    });

    quizPrevBtn.style.visibility = currentQuestionIdx === 0 ? 'hidden' : 'visible';
    quizNextBtn.textContent = currentQuestionIdx === quizData.length - 1 ? 'প্রকৃতি বিশ্লেষণ ফলাফল দেখুন' : 'পরবর্তী প্রশ্ন →';
  }

  if (quizNextBtn) {
    quizNextBtn.addEventListener('click', () => {
      if (!userAnswers[currentQuestionIdx]) {
        if (typeof Swal !== 'undefined') {
          Swal.fire({
            icon: 'info',
            title: 'বিকল্প নির্বাচন করুন',
            text: 'অনুগ্রহ করে আপনার শারীরিক প্রকৃতির সাথে মানানসই বিকল্পটি নির্বাচন করুন।',
            confirmButtonText: 'ঠিক আছে',
            confirmButtonColor: '#1b4332',
            customClass: { popup: 'ayur-swal-popup' }
          });
        } else {
          alert('অনুগ্রহ করে আপনার শারীরিক প্রকৃতির সাথে মানানসই বিকল্পটি নির্বাচন করুন।');
        }
        return;
      }
      if (currentQuestionIdx < quizData.length - 1) {
        currentQuestionIdx++;
        renderQuizQuestion();
      } else {
        calculatePrakritiResults();
      }
    });
  }

  if (quizPrevBtn) {
    quizPrevBtn.addEventListener('click', () => {
      if (currentQuestionIdx > 0) {
        currentQuestionIdx--;
        renderQuizQuestion();
      }
    });
  }

  if (retakeQuizBtn) {
    retakeQuizBtn.addEventListener('click', () => {
      currentQuestionIdx = 0;
      userAnswers.length = 0;
      quizResultBox.classList.remove('active');
      quizInteractiveArea.style.display = 'block';
      renderQuizQuestion();
    });
  }

  function calculatePrakritiResults() {
    let vataCount = 0, pittaCount = 0, kaphaCount = 0;
    userAnswers.forEach(ans => {
      if (ans === 'vata') vataCount++;
      if (ans === 'pitta') pittaCount++;
      if (ans === 'kapha') kaphaCount++;
    });

    const total = quizData.length;
    const vataPct = Math.round((vataCount / total) * 100);
    const pittaPct = Math.round((pittaCount / total) * 100);
    const kaphaPct = Math.round((kaphaCount / total) * 100);

    let dominant = 'বাত (Vata)';
    let maxPct = vataPct;
    if (pittaPct > maxPct) { dominant = 'পিত্ত (Pitta)'; maxPct = pittaPct; }
    if (kaphaPct > maxPct) { dominant = 'কফ (Kapha)'; maxPct = kaphaPct; }

    document.getElementById('vata-pct').textContent = `${toBengaliNumber(vataPct)}%`;
    document.getElementById('pitta-pct').textContent = `${toBengaliNumber(pittaPct)}%`;
    document.getElementById('kapha-pct').textContent = `${toBengaliNumber(kaphaPct)}%`;
    document.getElementById('dominant-dosha-title').textContent = `আপনার প্রধান প্রকৃতি: ${dominant}`;

    const recBox = document.getElementById('dosha-personalized-rec');
    if (recBox) {
      if (dominant.includes('বাত')) {
        recBox.innerHTML = `
          <h4>🧬 বাত প্রকৃতির জন্য বায়োলজিক্যাল ও এপিজেনেটিক গাইডলাইন:</h4>
          <p><strong>জীবনচর্যা (দিনচর্য্যা):</strong> নিয়মিত সময়ে উষ্ণ তিলের তেল দিয়ে শরীর ম্যাসাজ (অভ্যঙ্গ), নির্দিষ্ট সময়ে ঘুম ও উষ্ণ পরিমণ্ডল বজায় রাখুন। অতিরিক্ত মানসিক চাপ পরিহার করুন।</p>
          <p style="margin-top:0.5rem;"><strong>আহার (পথ্য):</strong> গরম, তরল, পুষ্টিকর ও ঘিযুক্ত খাবার গ্রহণ করুন। মিষ্টি, টক ও লবণাক্ত স্বাদ উপযোগী। অতিরিক্ত শুকনো, কাঁচা সালাদ বা বরফ শীতল পানীয় এড়িয়ে চলুন।</p>
          <p style="margin-top:0.5rem;"><strong>উপকারী ভেষজ:</strong> অশ্বগন্ধা, শতাবরী, দশমূল ও উষ্ণ জলে ত্রিফলা।</p>
        `;
      } else if (dominant.includes('পিত্ত')) {
        recBox.innerHTML = `
          <h4>🧬 পিত্ত প্রকৃতির জন্য বায়োলজিক্যাল ও এপিজেনেটিক গাইডলাইন:</h4>
          <p><strong>জীবনচর্যা (দিনচর্য্যা):</strong> শীতল পরিবেশে থাকা, অতিরিক্ত রোদ ও প্রচণ্ড মানসিক প্রতিযোগিতা এড়িয়ে চলা। নিয়মিত ধ্যান ও শান্ত পরিবেশে বিশ্রাম জরুরি।</p>
          <p style="margin-top:0.5rem;"><strong>আহার (পথ্য):</strong> প্রাকৃতিকভাবে শীতল, মিষ্টি ও তিতা স্বাদের খাবার। সবুজ শাকসবজি, ডাবের জল, ধনে ও মৌরি। অতিরিক্ত ঝাল, ভাজাপোড়া ও উত্তেজক খাদ্য সম্পূর্ণ পরিহার্য।</p>
          <p style="margin-top:0.5rem;"><strong>উপকারী ভেষজ:</strong> গুলঞ্চ (Guduchi), আমলকী, ব্রাহ্মী ও চন্দন রসায়ন।</p>
        `;
      } else {
        recBox.innerHTML = `
          <h4>🧬 কফ প্রকৃতির জন্য বায়োলজিক্যাল ও এপিজেনেটিক গাইডলাইন:</h4>
          <p><strong>জীবনচর্যা (দিনচর্য্যা):</strong> সকালে সূর্যোদয়ের পূর্বে ঘুম থেকে ওঠা (ব্রাহ্ম মুহূর্ত), নিয়মিত কায়িক পরিশ্রম ও শুকনো চূর্ণ দিয়ে শরীর ম্যাসাজ (উদ্বর্তন)। দিনের বেলা ঘুমানো সম্পূর্ণ নিষেধ।</p>
          <p style="margin-top:0.5rem;"><strong>আহার (পথ্য):</strong> হালকা, উষ্ণ, ঝাল ও তিতা স্বাদের খাবার। আদা জল, পরিমিত খাঁটি মধু এবং ডালজাতীয় খাবার। অতিরিক্ত মিষ্টি ও দুগ্ধজাত ভারী খাবার এড়িয়ে চলুন।</p>
          <p style="margin-top:0.5rem;"><strong>উপকারী ভেষজ:</strong> ত্রিকটু (পিপুল, গোলমরিচ, শুঁঠ), গুগগুলু, পুনর্নবা ও তুলসী।</p>
        `;
      }
    }

    quizInteractiveArea.style.display = 'none';
    quizResultBox.classList.add('active');
    playZenTone(528);

    const bookWithPrakritiBtn = document.getElementById('book-with-prakriti-btn');
    if (bookWithPrakritiBtn) {
      bookWithPrakritiBtn.onclick = () => {
        const notes = `প্রকৃতি টেস্ট ফলাফল: ${dominant} (বাত: ${toBengaliNumber(vataPct)}%, পিত্ত: ${toBengaliNumber(pittaPct)}%, কফ: ${toBengaliNumber(kaphaPct)}%)`;
        const notesField = document.getElementById('patient-notes');
        if (notesField) notesField.value = notes;
        const targetSec = document.getElementById('appointment-booking-hub');
        if (targetSec) targetSec.scrollIntoView({ behavior: 'smooth' });
      };
    }
  }

  renderQuizQuestion();

  // --------------------------------------------------------------------------
  // 8. Agni (Digestive Fire) Assessment Selector
  // --------------------------------------------------------------------------
  const agniCards = document.querySelectorAll('.agni-card');
  const agniDetailBox = document.getElementById('agni-detail-box');

  const agniDataBn = {
    sama: {
      title: "সম অগ্নি (Sama Agni — সম্পূর্ণ সুস্থ ও ভারসাম্যপূর্ণ মেটাবলিজম)",
      desc: "খাবার ৩-৪ ঘণ্টার মধ্যে সম্পূর্ণ হজম হয়। কোনো গ্যাস, পেট ফাঁপা বা এসিডিটি হয় না। রোগ প্রতিরোধ ক্ষমতা (ওজঃ) সর্বোচ্চ পর্যায়ে থাকে।",
      rec: "এই সুষম অবস্থা বজায় রাখতে সঠিক সময়ে আহার এবং ঋতু অনুযায়ী খাদ্য গ্রহণ করুন।"
    },
    visham: {
      title: "বিষম অগ্নি (Visham Agni — অনিয়মিত ও গ্যাস প্রবণ / বাত ভারসাম্যহীনতা)",
      desc: "ক্ষুধা কখনো খুব তীব্র আবার কখনো একদমই থাকে না। ঘন ঘন পেট ফাঁপা, গ্যাস, ঢেঁকুর ওঠা ও শুষ্ক কোষ্ঠকাঠিন্যের সমস্যা।",
      rec: "হিঙ্গ্বষ্টক চূর্ণ, খাবারের পূর্বে আদা-জিরার উষ্ণ চা এবং প্রতিদিন একই নির্দিষ্ট সময়ে খাবার গ্রহণের অভ্যাস গড়ে তুলুন।"
    },
    tikshna: {
      title: "তীক্ষ্ণ অগ্নি (Tikshna Agni — অতিরিক্ত তীব্র ও প্রদাহজনক / পিত্ত ভারসাম্যহীনতা)",
      desc: "প্রচণ্ড ক্ষুধা, খাবার দেরিতে খেলে বুকজ্বালা ও মেজাজ খিটখিটে হয়। এসিডিটি, বুক ও পেটে জ্বালাপোড়া ও পাতলা পায়খানা প্রবণ।",
      rec: "অবিপত্তিকর চূর্ণ, মৌরি ভেজানো জল এবং অ্যালোভেরা জুস দিয়ে পাকস্থলী শীতল রাখুন। ঝাল ও ভাজাপোড়া সম্পূর্ণ বর্জনীয়।"
    },
    manda: {
      title: "মন্দ অগ্নি (Manda Agni — ধীরগতি ও শ্লেষ্মা প্রবণ / কফ ভারসাম্যহীনতা)",
      desc: "ক্ষুধা খুব কম থাকে, খাবার খাওয়ার পর অনেকক্ষণ পেট ভারী হয়ে থাকে, জিহ্বায় সাদা আস্তরণ (আমদোষ) এবং ফ্যাটি লিভার ও মেটাবলিক সিন্ড্রোম দেখা দেয়।",
      rec: "ত্রিকটু চূর্ণ, হালকা উষ্ণ আদা জল, পাতলা স্যুপ এবং হালকা উপবাসের মাধ্যমে পাকস্থলীর জৈবিক আগুন পুনরুজ্জীবিত করুন।"
    }
  };

  agniCards.forEach(card => {
    card.addEventListener('click', () => {
      agniCards.forEach(c => c.style.borderColor = 'var(--border-color)');
      card.style.borderColor = 'var(--color-primary)';
      const type = card.getAttribute('data-agni');
      const data = agniDataBn[type];
      if (data && agniDetailBox) {
        agniDetailBox.style.display = 'block';
        agniDetailBox.innerHTML = `
          <div style="background: var(--bg-card); border-left: 4px solid var(--color-primary); padding: 1.4rem 1.8rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); border-left: 4px solid var(--color-primary);">
            <h4 style="color: var(--color-primary); margin-bottom: 0.4rem;">${data.title}</h4>
            <p style="margin-bottom: 0.6rem;">${data.desc}</p>
            <p style="font-size: 0.95rem; color: var(--color-accent); font-weight: 600;">🌿 ডা. দত্তের প্রেসক্রিপশন: ${data.rec}</p>
          </div>
        `;
      }
      playZenTone(480);
    });
  });

  // --------------------------------------------------------------------------
  // 9. Treatment & Specialization Filtering
  // --------------------------------------------------------------------------
  const filterBtns = document.querySelectorAll('.filter-btn');
  const treatmentCards = document.querySelectorAll('.treatment-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');
      treatmentCards.forEach(card => {
        const cat = card.getAttribute('data-category');
        if (filter === 'all' || cat.includes(filter)) {
          card.style.display = 'flex';
          card.classList.add('fade-in');
        } else {
          card.style.display = 'none';
        }
      });
      playZenTone(440);
    });
  });

  // --------------------------------------------------------------------------
  // 10. Skills Tab Switching
  // --------------------------------------------------------------------------
  const skillTabBtns = document.querySelectorAll('.skills-tab-btn');
  const skillGrids = document.querySelectorAll('.skills-tab-content');

  skillTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      skillTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const target = btn.getAttribute('data-tab');
      skillGrids.forEach(grid => {
        if (grid.getAttribute('id') === `skills-${target}`) {
          grid.style.display = 'grid';
          grid.classList.add('fade-in');
        } else {
          grid.style.display = 'none';
        }
      });
      playZenTone(460);
    });
  });

  // --------------------------------------------------------------------------
  // 11. Testimonials Slider
  // --------------------------------------------------------------------------
  const testimonialTrack = document.getElementById('testimonials-track');
  const testimonialSlides = document.querySelectorAll('.testimonial-slide');
  const sliderDots = document.querySelectorAll('.slider-dot');
  let currentSlide = 0;

  function goToSlide(index) {
    currentSlide = index;
    if (testimonialTrack) {
      testimonialTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
    }
    sliderDots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentSlide);
    });
  }

  sliderDots.forEach(dot => {
    dot.addEventListener('click', () => {
      const idx = parseInt(dot.getAttribute('data-index'), 10);
      goToSlide(idx);
    });
  });

  if (testimonialSlides.length > 0) {
    setInterval(() => {
      const next = (currentSlide + 1) % testimonialSlides.length;
      goToSlide(next);
    }, 6500);
  }

  // --------------------------------------------------------------------------
  // 12. FAQ Accordion
  // --------------------------------------------------------------------------
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    const answerEl = item.querySelector('.faq-answer');

    questionBtn.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      faqItems.forEach(otherItem => {
        otherItem.classList.remove('active');
        const otherAnswer = otherItem.querySelector('.faq-answer');
        if (otherAnswer) otherAnswer.style.maxHeight = null;
      });

      if (!isActive) {
        item.classList.add('active');
        answerEl.style.maxHeight = answerEl.scrollHeight + "px";
        playZenTone(400);
      }
    });
  });

  // --------------------------------------------------------------------------
  // 13. SMART 15-MINUTE SLOT BOOKING ENGINE (ONLINE & OFFLINE)
  // --------------------------------------------------------------------------
  let selectedMode = 'offline'; // default: ঢাকা চেম্বার (সরাসরি)
  let selectedDateObj = null;
  let selectedSlotObj = null;

  const modeOfflineTab = document.getElementById('mode-tab-offline');
  const modeOnlineTab = document.getElementById('mode-tab-online');
  const chamberNoticeBox = document.getElementById('chamber-notice-box');
  const datePillsRow = document.getElementById('date-pills-row');
  const slotsGrid = document.getElementById('slots-grid');
  const selectedDateLabel = document.getElementById('selected-date-label');
  const appointmentForm = document.getElementById('direct-appointment-form');
  const bookingSuccessBox = document.getElementById('booking-success-box');

  function initBookingHub() {
    loadAvailableDatesForMode(selectedMode);

    if (modeOfflineTab && modeOnlineTab) {
      modeOfflineTab.addEventListener('click', () => {
        selectedMode = 'offline';
        modeOfflineTab.classList.add('active');
        modeOnlineTab.classList.remove('active');
        updateChamberNotice();
        loadAvailableDatesForMode('offline');
        playZenTone(480);
      });

      modeOnlineTab.addEventListener('click', () => {
        selectedMode = 'online';
        modeOnlineTab.classList.add('active');
        modeOfflineTab.classList.remove('active');
        updateChamberNotice();
        loadAvailableDatesForMode('online');
        playZenTone(520);
      });
    }

    updateChamberNotice();
  }

  function updateChamberNotice() {
    const schedules = getStoredSchedules();
    const config = schedules[selectedMode];
    const activeDaysText = window.AyurBooking.getActiveDaysSummary ? window.AyurBooking.getActiveDaysSummary(selectedMode) : 'শুক্রবার ও শনিবার';

    if (chamberNoticeBox) {
      if (selectedMode === 'offline') {
        chamberNoticeBox.innerHTML = `
          <div style="font-size: 1.4rem;">🏛️</div>
          <div>
            <strong>ঢাকা চেম্বার তথ্য:</strong> ডা. দেবজ্যোতি দত্ত ঢাকায় সপ্তাহে নির্ধারিত দিনগুলোতে (<strong>${activeDaysText}</strong>) রোগী দেখেন।
            <span style="display:block; font-size: 0.86rem; color: var(--text-muted); margin-top: 3px;">
              স্থান: সেন্ট্রাল ঢাকা ও ধানমন্ডি এরিয়া • শুক্রবার ও শনিবারের সময়সূচি নিচে স্বতন্ত্রভাবে স্লটসহ প্রদর্শিত হচ্ছে।
            </span>
          </div>
        `;
      } else {
        chamberNoticeBox.innerHTML = `
          <div style="font-size: 1.4rem;">🌐</div>
          <div>
            <strong>অনলাইন ভিডিও কনসালটেশন:</strong> বাংলাদেশ, ভারত ও বিশ্বের যেকোনো প্রান্ত থেকে জুম (Zoom) বা হোয়াটসঅ্যাপ ভিডিও কলে পরামর্শ নিন।
            <span style="display:block; font-size: 0.86rem; color: var(--text-muted); margin-top: 3px;">
              সক্রিয় দিন: <strong>${activeDaysText}</strong> • ডিজিটাল প্রেসক্রিপশন ও কাস্টম ডায়েট চার্ট প্রদান করা হবে।
            </span>
          </div>
        `;
      }
    }
  }

  function loadAvailableDatesForMode(mode) {
    if (!datePillsRow) return;
    const dates = window.AyurBooking.getUpcomingDatesForMode(mode, 10);
    datePillsRow.innerHTML = '';
    selectedSlotObj = null;

    if (dates.length === 0) {
      datePillsRow.innerHTML = '<p style="color:var(--text-muted); padding: 1.2rem; grid-column: 1/-1;">এই মুহূর্তে অ্যাডমিন ড্যাশবোর্ড থেকে কোনো দিন সক্রিয় রাখা হয়নি।</p>';
      if (slotsGrid) slotsGrid.innerHTML = '';
      if (selectedDateLabel) selectedDateLabel.textContent = '';
      return;
    }

    // Find the first active date in the current running week (diffDays <= 7)
    const firstActiveDate = dates.find(d => d.isBookingOpen) || dates[0];
    selectedDateObj = firstActiveDate;

    // Render date pills: running week is active, subsequent weeks are disabled/locked
    dates.forEach((d) => {
      const isSelected = (selectedDateObj && selectedDateObj.dateStr === d.dateStr);
      const pill = document.createElement('div');

      if (d.isBookingOpen) {
        pill.className = `date-pill ${isSelected ? 'selected' : ''}`;
        pill.innerHTML = `
          <span class="day-name">${d.dayNameShortBn || d.dayNameBn}</span>
          <span class="day-num">${d.dayNumBn}</span>
          <span class="month-name">${d.monthBn}</span>
          <span class="week-status-badge open">বুকিং খোলা</span>
        `;

        pill.addEventListener('click', () => {
          document.querySelectorAll('.date-pill').forEach(p => p.classList.remove('selected'));
          pill.classList.add('selected');
          selectedDateObj = d;
          loadSlotsForDate(d.dateStr, mode, d);
          playZenTone(440);
        });
      } else {
        // Future week date (locked/disabled until 7 days prior)
        pill.className = 'date-pill date-pill-locked disabled';
        pill.title = 'চেম্বারের নিয়ম: পরবর্তী সপ্তাহের সিরিয়াল বুকিং ৭ দিন পূর্বে উন্মুক্ত হবে';
        pill.innerHTML = `
          <span class="day-name">${d.dayNameShortBn || d.dayNameBn}</span>
          <span class="day-num">${d.dayNumBn}</span>
          <span class="month-name">${d.monthBn}</span>
          <span class="week-status-badge locked">🔒 পরবর্তী সপ্তাহ</span>
        `;

        pill.addEventListener('click', () => {
          if (typeof Swal !== 'undefined') {
            Swal.fire({
              icon: 'info',
              title: 'অগ্রিম বুকিং নিয়ম',
              html: `📅 <b>${d.fullBn}</b> তারিখের অ্যাপয়েন্টমেন্ট বুকিং শুরু হবে ৭ দিন পূর্বে।<br><br>অনুগ্রহ করে বর্তমান সপ্তাহের উন্মুক্ত তারিখগুলো থেকে বেছে নিন।`,
              confirmButtonText: 'বুঝতে পেরেছি',
              confirmButtonColor: '#1b4332',
              customClass: { popup: 'ayur-swal-popup' }
            });
          } else {
            alert(`📅 ${d.fullBn} তারিখের অ্যাপয়েন্টমেন্ট বুকিং শুরু হবে ৭ দিন পূর্বে। অনুগ্রহ করে রানিং সপ্তাহের বুকিং গ্রহণ করুন।`);
          }
        });
      }

      datePillsRow.appendChild(pill);
    });

    // Auto-select and load 15-minute slots for the active date
    if (selectedDateObj && selectedDateObj.isBookingOpen) {
      loadSlotsForDate(selectedDateObj.dateStr, mode, selectedDateObj);
    } else if (slotsGrid) {
      slotsGrid.innerHTML = '<p style="color:var(--text-muted); grid-column: 1/-1; padding: 1.5rem; text-align:center;">বর্তমান সপ্তাহের বুকিং সক্রিয় দিন নির্বাচন করুন।</p>';
      if (selectedDateLabel) selectedDateLabel.textContent = '';
    }
  }

  function loadSlotsForDate(dateStr, mode, dateMeta) {
    if (!slotsGrid) return;
    const allSlots = window.AyurBooking.getSlotsForDate(dateStr, mode);
    const bookedIds = (window.AyurBooking.getBookedSlotIds ? window.AyurBooking.getBookedSlotIds(dateStr, mode) : []);

    let dayTimingText = '';
    if (dateMeta && dateMeta.timing && dateMeta.timing.startTime && dateMeta.timing.endTime) {
      try {
        const s = window.AyurBooking.formatTime12h(window.AyurBooking.parseTimeToMinutes(dateMeta.timing.startTime)).timeBn;
        const e = window.AyurBooking.formatTime12h(window.AyurBooking.parseTimeToMinutes(dateMeta.timing.endTime)).timeBn;
        dayTimingText = ` [সময়সূচি: ${s} হতে ${e}]`;
      } catch (err) {
        dayTimingText = '';
      }
    }

    if (selectedDateLabel && selectedDateObj) {
      selectedDateLabel.textContent = `${selectedDateObj.fullBn}${dayTimingText}`;
    }

    slotsGrid.innerHTML = '';
    selectedSlotObj = null;

    if (allSlots.length === 0) {
      slotsGrid.innerHTML = '<p style="color:var(--text-muted); grid-column: 1/-1; padding: 1.5rem; text-align:center;">এই তারিখে কোনো ১৫ মিনিটের স্লট উপলব্ধ নেই।</p>';
      return;
    }

    allSlots.forEach(slot => {
      const isBooked = bookedIds.includes(slot.id);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `slot-btn ${isBooked ? 'booked' : ''}`;
      btn.disabled = isBooked;

      btn.innerHTML = `
        <span class="slot-time">${slot.shortEn}</span>
        <span class="slot-status-label">${isBooked ? 'বুকড' : 'খালি (১৫ মি.)'}</span>
      `;

      if (!isBooked) {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          selectedSlotObj = slot;
          playZenTone(500);
        });
      }

      slotsGrid.appendChild(btn);
    });
  }

  // Handle Booking Form Submission
  if (appointmentForm) {
    appointmentForm.addEventListener('submit', (e) => {
      e.preventDefault();

      if (!selectedDateObj) {
        if (typeof Swal !== 'undefined') {
          Swal.fire({
            icon: 'warning',
            title: 'তারিখ নির্বাচন করুন',
            text: 'অনুগ্রহ করে অ্যাপয়েন্টমেন্টের কাঙ্ক্ষিত তারিখ নির্বাচন করুন।',
            confirmButtonText: 'ঠিক আছে',
            confirmButtonColor: '#1b4332',
            customClass: { popup: 'ayur-swal-popup' }
          });
        } else {
          alert('অনুগ্রহ করে অ্যাপয়েন্টমেন্টের তারিখ নির্বাচন করুন।');
        }
        return;
      }

      if (!selectedSlotObj) {
        if (typeof Swal !== 'undefined') {
          Swal.fire({
            icon: 'warning',
            title: 'সময় স্লট নির্বাচন করুন',
            text: 'অনুগ্রহ করে আপনার সুবিধাজনক একটি ১৫ মিনিটের সময় স্লট (Slot) নির্বাচন করুন।',
            confirmButtonText: 'ঠিক আছে',
            confirmButtonColor: '#1b4332',
            customClass: { popup: 'ayur-swal-popup' }
          });
        } else {
          alert('অনুগ্রহ করে আপনার সুবিধাজনক একটি ১৫ মিনিটের সময় স্লট (Slot) নির্বাচন করুন।');
        }
        return;
      }

      const name = document.getElementById('patient-name').value.trim();
      const phone = document.getElementById('patient-phone').value.trim();
      const email = document.getElementById('patient-email').value.trim(); // Optional!
      const age = document.getElementById('patient-age').value.trim();
      const gender = document.getElementById('patient-gender').value;
      const complaints = document.getElementById('patient-notes').value.trim();

      if (!name || !phone) {
        if (typeof Swal !== 'undefined') {
          Swal.fire({
            icon: 'warning',
            title: 'প্রয়োজনীয় তথ্য দিন',
            text: 'রোগীর পূর্ণ নাম এবং হোয়াটসঅ্যাপ/ফোন নম্বর প্রদান করা আবশ্যক।',
            confirmButtonText: 'ঠিক আছে',
            confirmButtonColor: '#1b4332',
            customClass: { popup: 'ayur-swal-popup' }
          });
        } else {
          alert('রোগীর নাম এবং হোয়াটসঅ্যাপ/ফোন নম্বর প্রদান করা আবশ্যক।');
        }
        return;
      }

      const schedules = getStoredSchedules();
      const config = schedules[selectedMode];
      const serialNo = generateSerialNo(selectedMode, selectedDateObj.dateStr);

      const newAppointment = {
        id: 'APT-' + Date.now(),
        serialNo: serialNo,
        patientName: name,
        phone: phone,
        email: email || '', // Optional
        age: age || '',
        gender: gender || 'Not Specified',
        chamberMode: selectedMode,
        chamberTitleBn: config.titleBn,
        appointmentDate: selectedDateObj.dateStr,
        dateFormattedBn: selectedDateObj.fullBn,
        slotId: selectedSlotObj.id,
        slotTimeBn: selectedSlotObj.timeBn,
        slotTimeEn: selectedSlotObj.timeEn,
        complaints: complaints || 'রুট-কজ আয়ুর্বেদিক চিকিৎসা ও পরামর্শ',
        status: 'pending', // বাইডিফল্ট পেন্ডিং এ পড়বে
        createdAt: new Date().toISOString()
      };

      // Save to persistent storage
      const existing = getAppointments();
      existing.unshift(newAppointment);
      saveAppointments(existing);
      try {
        window.dispatchEvent(new Event('storage'));
      } catch (err) {}

      if (typeof Swal !== 'undefined') {
        Swal.fire({
          icon: 'success',
          title: 'আবেদন সফলভাবে গৃহীত হয়েছে!',
          html: `ধন্যবাদ <b>${name}</b>!<br><br>আপনার সিরিয়াল নম্বর: <b style="font-size:1.3rem; color:#1b4332;">${serialNo}</b><br><br><small style="color:var(--text-muted);">অনুমোদনের পর আপনার হোয়াটসঅ্যাপ (${phone})-এ বার্তা পাঠানো হবে।</small>`,
          confirmButtonText: 'রশিদ দেখুন',
          confirmButtonColor: '#1b4332',
          customClass: { popup: 'ayur-swal-popup' }
        });
      }

      // Render Confirmation Slip in Pending State (No patient-side WhatsApp button)
      if (bookingSuccessBox) {
        appointmentForm.style.display = 'none';
        bookingSuccessBox.style.display = 'block';
        bookingSuccessBox.innerHTML = `
          <div style="text-align: center;">
            <div style="width: 65px; height: 65px; border-radius: 50%; background: rgba(217, 119, 6, 0.12); color: #d97706; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.2rem auto;">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </div>
            <span class="badge badge-warning" style="font-size: 0.95rem; padding: 0.4rem 1.1rem; margin-bottom: 0.9rem;">
              ⏳ পর্যালোচনায় অপেক্ষমান (Pending Approval)
            </span>
            <h3 style="color: var(--text-primary); margin-bottom: 0.5rem;">আপনার সিরিয়াল আবেদনটি সফলভাবে গৃহীত হয়েছে</h3>
            <p style="color: var(--text-secondary); max-width: 620px; margin: 0 auto 1.5rem auto; font-size: 0.98rem; line-height: 1.75;">
              ধন্যবাদ <strong>${name}</strong>। আপনার আবেদনটি ডা. দেবজ্যোতি দত্তের চেম্বার ড্যাশবোর্ডে জমা হয়েছে। ড্যাশবোর্ড থেকে চিকিৎসকের টিম আবেদনটি অনুমোদন (Accept) করার পর সরাসরি আপনার হোয়াটসঅ্যাপ <strong>(${phone})</strong>${email ? ` এবং ইমেইলে (<strong>${email}</strong>)` : ''} নিশ্চিতকরণ বার্তা পাঠানো হবে।
            </p>

            <div class="confirmation-slip">
              <span class="serial-number-badge" style="background: #d97706;">আবেদন সিরিয়াল নং: ${serialNo}</span>
              
              <div class="slip-details-grid">
                <div class="slip-item">
                  <strong>রোগীর নাম</strong>
                  <span>${name}</span>
                </div>
                <div class="slip-item">
                  <strong>হোয়াটসঅ্যাপ নম্বর</strong>
                  <span>${phone}</span>
                </div>
                <div class="slip-item">
                  <strong>চেম্বার</strong>
                  <span>${config.titleBn}</span>
                </div>
                <div class="slip-item">
                  <strong>তারিখ</strong>
                  <span>${selectedDateObj.fullBn}</span>
                </div>
                <div class="slip-item" style="grid-column: 1 / -1; background: var(--bg-secondary); padding: 0.8rem 1rem; border-radius: var(--radius-sm);">
                  <strong style="color: var(--color-primary);">অনুরোধকৃত ১৫ মিনিটের স্লট</strong>
                  <span style="font-size: 1.15rem; font-weight: 700; color: var(--color-primary);">${selectedSlotObj.timeBn} (${selectedSlotObj.timeEn})</span>
                </div>
                <div class="slip-item" style="grid-column: 1 / -1;">
                  <strong>বর্তমান স্ট্যাটাস</strong>
                  <span style="color: #d97706; font-weight: 700;">পেন্ডিং (ড্যাশবোর্ড অনুমোদনের অপেক্ষায়)</span>
                </div>
              </div>

              ${email ? `<p style="font-size:0.86rem; color:var(--text-muted); margin-top:0.8rem;">📧 অনুমোদন সম্পন্ন হলে একটি নিশ্চিতকরণ ইমেইলও পাঠানো হবে।</p>` : ''}
            </div>

            <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap; margin-top: 1.8rem;">
              <button type="button" class="btn btn-secondary" onclick="window.print()">
                <span>🖨️ এই আবেদন স্লিপটি প্রিন্ট / সেভ করুন</span>
              </button>
              <button type="button" class="btn btn-secondary" onclick="location.reload()">
                <span>নতুন সিরিয়াল আবেদন করুন</span>
              </button>
            </div>
          </div>
        `;

        bookingSuccessBox.scrollIntoView({ behavior: 'smooth' });
        playZenTone(528);
      }
    });
  }

  // Initialize booking hub
  initBookingHub();
});
