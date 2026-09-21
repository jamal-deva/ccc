import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { ClickWrapper } from "./components/ClickWrapper";
import { Mail, Instagram } from 'lucide-react';
import { HeroDesign } from './components/HeroDesign';
import { useHeroMorph } from './hooks/useHeroMorph';

const Portfolio = lazy(() => import('./components/Portfolio'));
const heroDesktopHtml = import('./hero/hero-desktop.html?raw').then(m => m.default);
const heroMobileHtml = import('./hero/hero-mobile.html?raw').then(m => m.default);

interface HeroImage {
  src: string;
  delay?: number;
  isStatic?: boolean;
  zIndex?: number;
  scrollTo?: string;
  href?: string;
  isSmall?: boolean;
  noHover?: boolean;
  /** which part of the desktop -> tablet morph this layer belongs to */
  morph?: 'figure' | 'me2';
}

const mobileImages: HeroImage[] = [
  { src: '/mobile/mbme.webp',      isStatic: true, zIndex: 11, },
  { src: '/mobile/mbme.webp',      isStatic: true,              zIndex: 10, scrollTo: '#portfolio' },
];

const desktopImages: HeroImage[] = [
  { src: '/pc/me.webp',    delay: 2.2, isStatic: true,  noHover: false, morph: 'figure', zIndex: 2 },
  { src: '/pc/me%202.webp',  delay: 2.4, isStatic: true,  noHover: false, morph: 'me2', zIndex: 3 },
];

// Fixed canvas sizes of the exported hero designs
const HERO_DESKTOP = { width: 4591, height: 2350 };
const HERO_MOBILE  = { width: 1080, height: 1920 };

function App() {
  const [showContact, setShowContact] = useState(false);
  const [heroHidden, setHeroHidden] = useState(false);
  const [heroHtml, setHeroHtml] = useState<{ desktop: string; mobile: string } | null>(null);
  const [portfolioReady, setPortfolioReady] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  const portfolioSectionRef = useRef<HTMLDivElement>(null);
  const loaderHiddenRef = useRef(false);

  const hideLoader = () => {
    if (loaderHiddenRef.current) return;
    loaderHiddenRef.current = true;
    const loader = document.getElementById('app-loader');
    const root = document.getElementById('root');
    if (loader) loader.classList.add('hidden');
    if (root) root.classList.add('app-ready');
  };

  // Detect mobile once at mount; update only on orientation change, not scroll.
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

  useHeroMorph(mobile);

  useEffect(() => {
    let cancelled = false;
    const startTime = performance.now();
    const MIN_LOAD_TIME = 1500;
    Promise.all([heroDesktopHtml, heroMobileHtml]).then(([desktop, mobile]) => {
      if (cancelled) return;
      setHeroHtml({ desktop, mobile });
      const elapsed = performance.now() - startTime;
      const delay = Math.max(0, MIN_LOAD_TIME - elapsed);
      setTimeout(hideLoader, delay);
    });
    return () => { cancelled = true; };
  }, []);

  // Prefetch the portfolio and video-thumbnail chunks shortly after the
  // hero renders so they're already cached when the user scrolls down.
  useEffect(() => {
    const timer = setTimeout(() => {
      void import('./components/Portfolio');
      void import('./components/VideoThumbnail');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Defer portfolio mounting until the user scrolls or is idle — keeps the
  // first paint focused entirely on the hero (no 21 video tiles, no
  // IntersectionObservers, no GSAP competing for CPU/network).
  useEffect(() => {
    if (portfolioReady) return;
    const trigger = () => setPortfolioReady(true);
    window.addEventListener('scroll', trigger, { once: true, passive: true });
    window.addEventListener('touchmove', trigger, { once: true, passive: true });
    window.addEventListener('wheel', trigger, { once: true, passive: true });
    const idle = (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback;
    let idleId: number | undefined;
    if (idle) {
      idleId = idle(trigger, { timeout: 3000 });
    } else {
      const t = setTimeout(trigger, 3000);
      return () => {
        clearTimeout(t);
        window.removeEventListener('scroll', trigger);
        window.removeEventListener('touchmove', trigger);
        window.removeEventListener('wheel', trigger);
      };
    }
    const cancelIdle = (window as unknown as { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback;
    return () => {
      if (idleId && cancelIdle) cancelIdle(idleId);
      window.removeEventListener('scroll', trigger);
      window.removeEventListener('touchmove', trigger);
      window.removeEventListener('wheel', trigger);
    };
  }, [portfolioReady]);

  useEffect(() => {
    if (!portfolioReady) return;
    let cancelled = false;
    let cleanup = () => {};

    const loadAnimations = async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      if (cancelled || !portfolioSectionRef.current) return;

      gsap.registerPlugin(ScrollTrigger);
      ScrollTrigger.config({ ignoreMobileResize: true });
      const isMobileView = window.innerWidth < 768;
      const portfolio = portfolioSectionRef.current;

      if (!isMobileView) {
        const desktopEls = gsap.utils.toArray('.desktop-image');
        const desktopParallaxEls = desktopEls.filter((el: Element) => !el.classList.contains('no-parallax-y'));
        gsap.timeline({
          scrollTrigger: { trigger: portfolio, start: 'top bottom', end: 'center top', scrub: 2 },
        }).to(desktopParallaxEls, { y: 200, ease: 'power1.out' });
      }

      portfolio.style.willChange = 'transform';
      gsap.to(portfolio, {
        y: () => isMobileView ? -window.innerHeight * 1.5 : -900,
        scrollTrigger: { trigger: portfolio, start: 'top bottom', end: 'bottom top', scrub: isMobileView ? 1.5 : 2 },
      });

      ScrollTrigger.create({
        trigger: portfolio, start: 'center bottom', fastScrollEnd: true,
        onEnter: () => setShowContact(true), onLeaveBack: () => setShowContact(false),
      });

      ScrollTrigger.create({
        trigger: portfolio, start: 'top top', end: 'top top',
        onEnter: () => setHeroHidden(true), onLeaveBack: () => setHeroHidden(false),
      });

      cleanup = () => ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };

    const frame = requestAnimationFrame(() => requestAnimationFrame(loadAnimations));
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      cleanup();
    };
  }, [portfolioReady]);

  const vh = (n: number) => mobile ? `${n}svh` : `${n}vh`;

  return (
    <div className="relative hero-ready">
{/* Fixed background — desktop */}
      <ClickWrapper
        className="fixed inset-0 z-0 bg-interactive hidden md:block"
        scrollTo="#portfolio"
        glowColor="rgba(255,255,255,0.15)"
        noHover
        style={{ overflow: 'hidden' }}
      >
        <img src="/pc/bg.webp" alt="" fetchPriority="high" decoding="async" className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: 'left center' }} />
        <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.08)' }} />
      </ClickWrapper>

      {/* Fixed background — mobile */}
      <ClickWrapper
        className="fixed inset-0 z-0 bg-interactive md:hidden"
        scrollTo="#portfolio"
        glowColor="rgba(255,255,255,0.15)"
        noHover
        style={{ overflow: 'hidden' }}
      >
        <img src="/mobile/mbbg.webp" alt="" fetchPriority="high" decoding="async" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.08)' }} />
      </ClickWrapper>

      {/* Hero Section */}
      <div
        ref={heroRef}
        className={`relative w-full overflow-hidden bg-transparent transition-opacity duration-500 ${heroHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        style={{ minHeight: vh(100), height: vh(100) }}
      >
        {/* Mobile layers — only rendered on mobile to keep the 57KB desktop
            hero HTML out of the mobile DOM (huge perf win on phones) */}
        {mobile && (
          <div className="md:hidden">
            {mobileImages.map((img, index) => (
              <ClickWrapper
                key={index}
                href={img.href}
                scrollTo={img.scrollTo}
                glowColor="rgba(201,168,76,0.3)"
                noHover
                className="mobile-image hero-image-layer fixed overflow-hidden"
                style={{
                  ...(img.isStatic
                    ? { inset: 0, width: '100%', height: '100%', zIndex: img.zIndex }
                    : {
                        inset: 0, width: '100%', height: '100%',
                        zIndex: img.zIndex,
                        animation: `slideUp 1s ease-out ${img.delay}s forwards`,
                        transform: 'translateY(100vh)',
                      })
                }}
              >
                <img src={img.src} alt="" decoding="async" fetchPriority="high" className="w-full h-full object-contain" />
              </ClickWrapper>
            ))}

            {/* Mobile-only hero design (mobile.html) */}
            {heroHtml && (
              <HeroDesign
                html={heroHtml.mobile}
                width={HERO_MOBILE.width}
                height={HERO_MOBILE.height}
                fit="contain"
                className="mobile-image hero-image-layer fixed no-parallax-y hero-enter"
                style={{ inset: 0, width: '100%', height: '100%', zIndex: 20 }}
              />
            )}
          </div>
        )}

        {/* Desktop layers — only rendered on desktop */}
        {!mobile && (
          <div className="hidden md:block">
            {desktopImages.map((img, index) => (
              <ClickWrapper
                key={index}
                href={img.href}
                scrollTo={img.scrollTo}
                glowColor="rgba(201,168,76,0.3)"
                noHover
                className={`desktop-image hero-image-layer fixed overflow-hidden ${img.isSmall ? 'name-hover' : ''}`}
                style={{
                  ...(img.isSmall
                    ? {
                        top: -10, left: -30, width: '38%', maxWidth: 520, height: 'auto', zIndex: 50,
                        animation: `slideUp 1s ease-out ${img.delay}s forwards`,
                        transform: 'translateY(100vh)',
                      }
                    : {
                        inset: 0, width: '100%', height: '100%',
                        zIndex: img.zIndex ?? (img.isStatic ? 0 : index + 10),
                        animation: img.isStatic ? 'none' : `slideUp 1s ease-out ${img.delay}s forwards`,
                        transform: img.isStatic ? 'translateY(0)' : 'translateY(100vh)',
                        pointerEvents: 'none',
                      })
                }}
              >
                <div className={`w-full h-full ${img.morph === 'figure' ? 'hero-rig-figure' : img.morph === 'me2' ? 'hero-me2' : ''}`}>
                  <img src={img.src} alt="" decoding="async" fetchPriority="high" className={`${img.isSmall ? 'w-full h-auto' : 'w-full h-full object-contain'} ${img.morph === 'me2' ? 'hero-img-me2' : 'hero-img-me'}`} />
                </div>
              </ClickWrapper>
            ))}

            {/* Title — rendered behind me.webp */}
            {heroHtml && (
              <HeroDesign
                html={heroHtml.desktop}
                width={HERO_DESKTOP.width}
                height={HERO_DESKTOP.height}
                fit="contain"
                group
                hideTestimonials
                className="desktop-image hero-image-layer fixed no-parallax-y hero-design-text hero-enter"
                style={{ inset: 0, width: '100%', height: '100%', zIndex: 1 }}
              />
            )}

            {/* Testimonials — rendered on top */}
            {heroHtml && (
              <HeroDesign
                html={heroHtml.desktop}
                width={HERO_DESKTOP.width}
                height={HERO_DESKTOP.height}
                fit="contain"
                group
                hideTitle
                className="desktop-image hero-image-layer fixed no-parallax-y hero-design-text hero-enter"
                style={{ inset: 0, width: '100%', height: '100%', zIndex: 20 }}
              />
            )}
          </div>
        )}

        {/* Scroll indicator */}
        <div className="hero-enter absolute bottom-4 sm:bottom-6 md:bottom-8 left-0 right-0 z-[60] flex justify-center pointer-events-none">
          <button
            className="scroll-indicator group flex flex-col items-center gap-4 pointer-events-auto"
            onClick={() => {
              const el = document.querySelector('#portfolio');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            aria-label="Scroll to portfolio"
          >
            <span className="scroll-indicator-label ibm-font">SCROLL</span>
            <span className="scroll-indicator-track">
              <span className="scroll-indicator-dot" />
            </span>
          </button>
        </div>
      </div>


      {/* Portfolio Panel */}
      <div
        ref={portfolioSectionRef}
        id="portfolio"
        className="relative w-full portfolio-panel z-[99]"
        style={{
          minHeight: vh(100),
          boxShadow: mobile
            ? '0 -10px 30px -5px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.4)'
            : `0 -30px 80px -10px rgba(255,255,255,0.12), 0 -60px 120px -20px rgba(201,168,76,0.06), inset 0 1px 0 rgba(255,255,255,0.6), 0 30px 80px -10px rgba(0,0,0,0.35)`,
        }}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-20">
          {portfolioReady ? (
            <Suspense fallback={<div style={{ minHeight: '60vh' }} />}>
              <Portfolio />
            </Suspense>
          ) : (
            <div style={{ minHeight: '60vh' }} />
          )}
        </div>
      </div>

       {/* Contact Section */}
      {showContact && (
        <div
          id="contact-section"
          className={`fixed bottom-0 left-0 right-0 w-full overflow-hidden flex flex-col items-center justify-center z-30 bg-transparent opacity-0 animate-fade-in-delayed px-6`}
          style={{
            height: mobile ? '100svh' : '100vh',
            animationDelay: '0.2s',
            animationFillMode: 'forwards',
            pointerEvents: 'auto'
          }}
        >
         {/* Main Heading */}
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-bosenAlt text-[#181f22] text-center mb-0 tracking-wide max-w-4xl">
            LET'S START A CONVERSATION
          </h2>

         {/* Subheading */}
<p className="text-[#181f22] text-xl md:text-4xl lg:text-4xl ibm-font mb-8 text-center max-w-3xl">
  Drop me a message, let's make something users will love.
</p>

<div className="space-y-10 text-center max-w-full">
            {/* Email */}
            <div className="flex flex-col items-center gap-2">
              <Mail className="text-[#181f22] w-8 h-8" />
              <a
                href="https://mail.google.com/mail/?view=cm&to=Aamirnaqvi03@gmail.com" target="_blank"
                className="text-[#181f22] font-bosenAlt text-xl md:text-xl lg:text-2xl tracking-wide hover:text-blue-500 transition-colors duration-200 break-words px-4"
              >
                AAMIRNAQVI03@GMAIL.COM
              </a>
              <p className="text-[#181f22] text-xl md:text-xl lg:text-2xl ibm-font mb-0 text-center">
  Let's create something that actually works.
</p>
            </div>

            {/* Whatsapp */}
            <div className="flex flex-col items-center gap-0">
              <svg className="text-[#181f22] w-8 h-8" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <a
                href="https://wa.link/uhhv7i"
                target="_blank"
                rel="noopener noreferrer"
  className="text-[#181f22] font-bosenAlt text-xl md:text-xl lg:text-2xl tracking-wide hover:text-blue-500 transition-colors duration-200"
              >
                WHATSAPP
              </a>
              <p className="text-[#181f22] text-xl md:text-xl lg:text-2xl ibm-font mb-0 text-center">
          Lets talk more further
              </p>
            </div>

            {/* Instagram */}
            <div className="flex flex-col items-center gap-2">
              <Instagram className="text-[#181f22] w-8 h-8" />
              <a
                href="https://www.instagram.com/aamir.naqvii/"
                target="_blank"
                rel="noopener noreferrer"
                  className="text-[#181f22] font-bosenAlt text-xl md:text-xl lg:text-2xl tracking-wide hover:text-blue-500 transition-colors duration-200"
              >
                INSTAGRAM
              </a>
           <p className="text-[#181f22] text-xl md:text-xl lg:text-2xl ibm-font mb-0 text-center">
                Tap in for visuals with purpose. - follow the flow.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
