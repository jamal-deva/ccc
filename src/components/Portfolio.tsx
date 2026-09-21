import { Suspense, lazy } from 'react';
import { ClickWrapper } from './ClickWrapper';

const VideoThumbnail = lazy(() => import('./VideoThumbnail'));

const socialVideos = Array.from({ length: 12 }, (_, i) =>
  `https://cdn.jsdelivr.net/gh/Aamirnaqvi-mal/Videos@main/Portfolio/reels/${i + 1}.webm`
);

const featuredVideos = [
  "https://cdn.jsdelivr.net/gh/Aamirnaqvi-mal/Videos@main/Portfolio/long/1.webm",
  "https://cdn.jsdelivr.net/gh/Aamirnaqvi-mal/Videos@main/Portfolio/long/2%2C5%2C6%2C8%2C9/2.webm",
  "https://cdn.jsdelivr.net/gh/Aamirnaqvi-mal/Videos@main/Portfolio/long/3.webm",
  "https://cdn.jsdelivr.net/gh/Aamirnaqvi-mal/Videos@main/Portfolio/long/4.mp4",
  "https://cdn.jsdelivr.net/gh/Aamirnaqvi-mal/Videos@main/Portfolio/long/2%2C5%2C6%2C8%2C9/5.webm",
  "https://cdn.jsdelivr.net/gh/Aamirnaqvi-mal/Videos@main/Portfolio/long/2%2C5%2C6%2C8%2C9/6.webm",
  "https://cdn.jsdelivr.net/gh/Aamirnaqvi-mal/Videos@main/Portfolio/long/7.webm",
  "https://cdn.jsdelivr.net/gh/Aamirnaqvi-mal/Videos@main/Portfolio/long/2%2C5%2C6%2C8%2C9/8.webm",
  "https://cdn.jsdelivr.net/gh/Aamirnaqvi-mal/Videos@main/Portfolio/long/2%2C5%2C6%2C8%2C9/9.webm",
];

const stats = [
  { value: '3+', label: 'Years Experience'},
  { value: '99+', label: 'Projects Delivered' },
  { value: '12', label: 'Social Formats' },
  { value: '20+', label: 'Happy Clients' },
];

const skills = [
  { name: 'Motion Design'},
  { name: 'Brand Films'},
  { name: 'Social Content'},
  { name: 'Visual Identity'},
  { name: 'Art Direction'},
  { name: 'Storytelling'},
];

export default function Portfolio() {
  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-8 py-20">
      {/* Header */}
      <div className="text-center mb-20">
        <h2 className="syne text-black/90 mb-5 leading-none"
            style={{ fontSize: 'clamp(3rem, 8vw, 7rem)', letterSpacing: '0.04em' }}>
          PORTFOLIO
        </h2>
        <p className="ibm-font text-black/55 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
          Visual stories crafted to move people — from scroll-stopping reels to brand-defining films.
        </p>
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {skills.map((s) => (
            <ClickWrapper key={s.name} glowColor="rgba(201,168,76,0.3)" className="tag-pill">
              {s.name}
            </ClickWrapper>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
        {stats.map((s, i) => (
          <div key={i} className="stat-card"
            style={{
              background: 'rgba(0,0,0,0.04)',
              border: '1px solid rgba(0,0,0,0.07)',
              animationDelay: `${i * 0.4}s`,
              borderRadius: '1rem',
              padding: '1.5rem',
              textAlign: 'center',
            }}>
            <div className="syne font-bold text-black/90 stat-number-pulse"
                 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', animationDelay: `${i * 0.4}s` }}>
              {s.value}
            </div>
            <div className="ibm-font text-xs uppercase tracking-widest mt-1" style={{ color: 'var(--warm-gray)' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Showreel */}
      <div className="mb-20">
        <ClickWrapper scrollTo="#showreel" glowColor="rgba(201,168,76,0.3)" className="section-rule section-rule-interactive">
          <span className="syne text-sm font-semibold tracking-[0.25em] uppercase text-black/40 flex items-center gap-2">
            <span className="gold-dot" />
            SHOW REEL
          </span>
        </ClickWrapper>
        <div id="showreel" className="max-w-5xl mx-auto rounded-2xl overflow-hidden"
             style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
          <Suspense fallback={null}>
            <VideoThumbnail
              src="https://cdn.jsdelivr.net/gh/Aamirnaqvi-mal/Videos@main/Portfolio/long/2,5,6,8,9/1.mp4"
              title="SHOW REEL 2026"
              isShowreel={true}
              thumbnailIndex={1}
            />
          </Suspense>
        </div>
      </div>

      {/* Social Content */}
      <div className="mb-20">
        <ClickWrapper scrollTo="#social" glowColor="rgba(201,168,76,0.3)" className="section-rule section-rule-interactive">
          <span className="syne text-sm font-semibold tracking-[0.25em] uppercase text-black/40 flex items-center gap-2">
            <span className="gold-dot" />
            SOCIAL CONTENT
          </span>
        </ClickWrapper>
        <div id="social" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
          {socialVideos.map((url, i) => (
            <Suspense key={i} fallback={null}>
              <VideoThumbnail src={url} title={`REEL ${String(i + 1).padStart(2, '0')}`} aspectRatio="vertical" thumbnailIndex={i + 11} />
            </Suspense>
          ))}
        </div>
      </div>

      {/* Featured Work */}
      <div className="mb-20">
        <ClickWrapper scrollTo="#featured" glowColor="rgba(201,168,76,0.3)" className="section-rule section-rule-interactive">
          <span className="syne text-sm font-semibold tracking-[0.25em] uppercase text-black/40 flex items-center gap-2">
            <span className="gold-dot" />
            FEATURED WORK
          </span>
        </ClickWrapper>
        <div id="featured" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {featuredVideos.map((url, i) => (
            <Suspense key={i} fallback={null}>
              <VideoThumbnail src={url} title={`PROJECT ${String(i + 1).padStart(2, '0')}`} isShowreel={false} thumbnailIndex={i + 2} />
            </Suspense>
          ))}
        </div>
      </div>

      <p className="text-center ibm-font text-xs mt-12 pb-4">
        All content is original work. Brands and clients belong to their respective owners.
      </p>
    </div>
  );
}
