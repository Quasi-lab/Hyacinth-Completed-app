import React, { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { ArrowRight, ChevronDown } from 'lucide-react';

interface LandingHeroProps {
  children: React.ReactNode;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ children }) => {
  const heroRef = useRef<HTMLElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

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
        aria-labelledby="landing-title"
        className="relative flex min-h-[100svh] items-center justify-center overflow-hidden border-b border-emerald-100/60 bg-gradient-to-b from-white via-[#F8FAFC] to-[#F8FAFC] py-16"
      >
        {/* Decorative background layer: slowest-moving parallax layer */}
        <motion.div
          aria-hidden="true"
          style={{ y: reduceMotion ? 0 : backgroundY }}
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute -top-48 left-1/2 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-emerald-200/40 blur-3xl" />
          <div className="absolute -bottom-48 -right-32 h-[30rem] w-[30rem] rounded-full bg-teal-200/30 blur-3xl" />
          <div
            className="absolute inset-0 opacity-40"
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
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-800 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            Hyacinth Clinic · Clinical Intelligence
          </span>

          <h1
            id="landing-title"
            className="mt-6 text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl"
          >
            See the whole clinic.
            <br className="hidden sm:block" />{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              One live view.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Admissions, physicians, ward capacity, and billing — unified into one real-time analytics
            dashboard built on the clinic's star schema.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-5">
            <button
              type="button"
              onClick={scrollToDashboard}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8FAFC]"
            >
              Open the dashboard
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="text-xs font-medium text-slate-500">
              5 dimensions · real-time sync · 8 specialties
            </span>
          </div>

          <div className="mt-14 flex justify-center">
            <button
              type="button"
              onClick={scrollToDashboard}
              aria-label="Scroll to the dashboard"
              className="inline-flex flex-col items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 transition-colors hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
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
          y: reduceMotion ? 0 : dashboardY,
          '--dashboard-fade': reduceMotion ? 1 : dashboardOpacity,
        } as React.CSSProperties}
        className="relative z-10 opacity-[var(--dashboard-fade)]"
      >
        {children}
      </motion.div>
    </>
  );
};
