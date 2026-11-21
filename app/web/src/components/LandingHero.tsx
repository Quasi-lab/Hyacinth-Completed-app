import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { ArrowRight, ArrowUp, ChevronDown } from 'lucide-react';

interface LandingHeroProps {
  children: React.ReactNode;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ children }) => {
  const heroRef = useRef<HTMLElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [heroDismissed, setHeroDismissed] = useState(false);
  const heroHeightRef = useRef(0);
  const dismissScrollYRef = useRef(0);
  const isRestoringRef = useRef(false);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  // Opacity runs through CSS vars: Motion's inline opacity stayed stale in this app.
  // Layers move at different speeds to create depth while the dashboard rises into place.
  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, 220]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const dashboardY = useTransform(scrollYProgress, [0.35, 1], [56, 0]);
  const dashboardOpacity = useTransform(scrollYProgress, [0.35, 0.9], [0.5, 1]);

  // Once the hero is fully scrolled past, remove it from the page so the
  // dashboard top becomes the scroll floor. The explicit button is the only
  // way back, which keeps wheel/touch/keyboard scrolling untrapped.
  useEffect(() => {
    const handleScroll = () => {
      if (heroDismissed) return;
      const hero = heroRef.current;
      if (!hero || hero.getBoundingClientRect().bottom > 1) return;
      heroHeightRef.current = hero.offsetHeight;
      dismissScrollYRef.current = window.scrollY;
      setHeroDismissed(true);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [heroDismissed]);

  // Collapsing the hero shortens the document, so subtract its height from the
  // scroll position in the same frame to keep the dashboard visually still.
  useLayoutEffect(() => {
    if (!heroDismissed || !heroHeightRef.current) return;
    const height = heroHeightRef.current;
    heroHeightRef.current = 0;
    window.scrollTo({ top: Math.max(0, dismissScrollYRef.current - height), behavior: 'auto' });
  }, [heroDismissed]);

  // Re-measure scroll offsets once the hero is back in layout, otherwise the
  // parallax opacity stays at the dismissed value.
  useLayoutEffect(() => {
    if (heroDismissed || !isRestoringRef.current) return;
    isRestoringRef.current = false;
    window.dispatchEvent(new Event('resize'));
  }, [heroDismissed]);

  const restoreHero = () => {
    isRestoringRef.current = true;
    setHeroDismissed(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const scrollToDashboard = () => {
    const target = dashboardRef.current;
    if (!target) return;
    // offsetTop ignores the reveal transform, so the dashboard lands exactly at the top.
    window.scrollTo({ top: target.offsetTop, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  return (
    <>
      <section
        ref={heroRef}
        style={heroDismissed ? { display: 'none' } : undefined}
        aria-labelledby="landing-title"
        className="relative flex min-h-[100svh] items-center justify-center overflow-hidden border-b border-emerald-100/60 dark:border-slate-800 bg-gradient-to-b from-white via-[#F8FAFC] to-[#F8FAFC] dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 py-16"
      >
        {/* Decorative background layer: slowest-moving parallax layer */}
        <motion.div
          aria-hidden="true"
          style={{ y: reduceMotion ? 0 : backgroundY }}
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute -top-48 left-1/2 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-emerald-200/40 dark:bg-emerald-500/10 blur-3xl" />
          <div className="absolute -bottom-48 -right-32 h-[30rem] w-[30rem] rounded-full bg-teal-200/30 dark:bg-teal-500/10 blur-3xl" />
          <div
            className="absolute inset-0 opacity-40 dark:opacity-20"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(16, 185, 129, 0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(16, 185, 129, 0.12) 1px, transparent 1px)',
              backgroundSize: '64px 64px',
              maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
              WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
            }}
          />
        </motion.div>

        {/* Foreground content: faster-moving, fading layer */}
        <motion.div
          style={{
            y: reduceMotion ? 0 : contentY,
            '--hero-fade': reduceMotion ? 1 : contentOpacity,
          } as React.CSSProperties}
          className="relative z-10 mx-auto w-full max-w-4xl px-4 text-center opacity-[var(--hero-fade)] sm:px-6 lg:px-8"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 dark:border-emerald-500/25 bg-white/70 dark:bg-slate-900/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            Hyacinth Clinic · Clinical Intelligence
          </span>

          <h1
            id="landing-title"
            className="mt-6 text-balance text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl lg:text-6xl"
          >
            See the whole clinic.
            <br className="hidden sm:block" />{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
              One live view.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
            Admissions, physicians, ward capacity, and billing — unified into one real-time analytics
            dashboard built on the clinic's star schema.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-5">
            <button
              type="button"
              onClick={scrollToDashboard}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8FAFC] dark:focus-visible:ring-offset-slate-950"
            >
              Open the dashboard
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              5 dimensions · real-time sync · 8 specialties
            </span>
          </div>

          <div className="mt-14 flex justify-center">
            <button
              type="button"
              onClick={scrollToDashboard}
              aria-label="Scroll to the dashboard"
              className="inline-flex flex-col items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 transition-colors hover:text-emerald-700 dark:hover:text-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <span>Scroll to explore</span>
              <ChevronDown className="h-4 w-4 motion-safe:animate-bounce" aria-hidden="true" />
            </button>
          </div>
        </motion.div>
      </section>

      {/* Dashboard rises and fades in as the hero scrolls away */}
      <motion.div
        id="dashboard"
        ref={dashboardRef}
        style={{
          y: heroDismissed || reduceMotion ? 0 : dashboardY,
          '--dashboard-fade': heroDismissed || reduceMotion ? 1 : dashboardOpacity,
        } as React.CSSProperties}
        className="relative z-10 opacity-[var(--dashboard-fade)]"
      >
        {children}
      </motion.div>

      {heroDismissed && (
        <button
          type="button"
          onClick={restoreHero}
          className="fixed bottom-24 right-5 z-40 inline-flex min-h-12 items-center gap-2 rounded-full border border-emerald-200/80 bg-white/85 px-4 text-sm font-semibold text-emerald-800 shadow-lg shadow-emerald-900/10 backdrop-blur-md transition-colors hover:bg-white hover:text-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8FAFC] dark:border-emerald-500/25 dark:bg-slate-900/85 dark:text-emerald-300 dark:shadow-black/40 dark:hover:bg-slate-800 dark:hover:text-emerald-200 dark:focus-visible:ring-offset-slate-950"
        >
          <ArrowUp className="h-4 w-4" aria-hidden="true" />
          Back to top
        </button>
      )}
    </>
  );
};
