import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/sections/HeroSection';
import AboutSection from '@/components/sections/AboutSection';
import ExpertiseSection from '@/components/sections/ExpertiseSection';
import TreatmentsSection from '@/components/sections/TreatmentsSection';
import BookingHub from '@/components/booking/BookingHub';
import PrakritiQuiz from '@/components/quiz/PrakritiQuiz';
import AuthorSection from '@/components/sections/AuthorSection';
import TestimonialsSection from '@/components/sections/TestimonialsSection';
import FaqSection from '@/components/sections/FaqSection';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8faf8] dark:bg-[#0a130f] text-emerald-950 dark:text-emerald-50 selection:bg-emerald-200 selection:text-emerald-900">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <AboutSection />
        <ExpertiseSection />
        <TreatmentsSection />
        <BookingHub />
        <PrakritiQuiz />
        <AuthorSection />
        <TestimonialsSection />
        <FaqSection />
      </main>
      <Footer />
    </div>
  );
}
