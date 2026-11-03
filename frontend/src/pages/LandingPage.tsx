import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const darkOverlayRef = useRef<HTMLDivElement>(null);

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  const handleLogin = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const handleExplore = () => {
    const el = document.getElementById('challenge');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Natural scroll animations: compacts nav, transitions color to black, fades hero, fills steps
  useEffect(() => {
    const nav = navRef.current;
    const heroContent = heroContentRef.current;
    const steps = stepsRef.current;
    const bar = barRef.current;
    const overlay = darkOverlayRef.current;
    const stepEls = Array.from(document.querySelectorAll('.step'));

    const onScroll = () => {
      const sy = window.scrollY;
      const H = window.innerHeight;

      // 1. Compact Navbar
      nav?.classList.toggle('s', sy > 40);

      // 2. Scroll Progress Bar
      const mxs = Math.max(1, document.documentElement.scrollHeight - H);
      const p = Math.min(1, sy / mxs);
      if (bar) bar.style.transform = `scaleX(${p})`;

      // 3. COLOR TRANSITION TO BLACK ON SCROLL:
      // As user scrolls down, background darkens smoothly to deep black
      const dk = Math.min(1, Math.max(0, (sy - H * 0.05) / (H * 0.5)));
      if (overlay) {
        overlay.style.opacity = String(dk * 0.96);
      }

      // 4. Hero Content: lifts and fades directly in lockstep with scroll
      const hf = Math.max(0, 1 - sy / (H * 0.45));
      if (heroContent) {
        heroContent.style.opacity = String(hf);
        heroContent.style.transform = `translateY(${-sy * 0.25}px)`;
        heroContent.style.visibility = hf <= 0 ? 'hidden' : 'visible';
      }

      // 5. Timeline steps fill progress
      if (steps) {
        const r = steps.getBoundingClientRect();
        const pr = Math.min(1, Math.max(0, (H * 0.75 - r.top) / (r.height + H * 0.05)));
        steps.style.setProperty('--pr', String(pr));
        stepEls.forEach((s, i) => s.classList.toggle('on', pr >= i / 3.4));
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();

    // Intersection Observer for cards reveal
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            if (e.target.classList.contains('rv')) {
              setTimeout(() => e.target.classList.add('done'), 1500);
            }
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.06, rootMargin: '0px 0px -6% 0px' }
    );

    document.querySelectorAll('.rv, .hd, .fade').forEach((e) => {
      if (e.id !== 'h1' && !e.closest('#hero')) io.observe(e);
    });

    setTimeout(() => {
      document.querySelectorAll('#hero .hd, #hero .fade').forEach((e) => e.classList.add('in'));
    }, 150);

    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) && !(e.target as Element).closest('#bg')) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      document.removeEventListener('click', handleOutsideClick);
      io.disconnect();
    };
  }, []);

  return (
    <>
      {/* PERSISTENT REALISTIC WATER BACKGROUND (CONTINUOUS NATURAL FLUID VIDEO) */}
      <div className="water-stage" aria-hidden="true">
        <video
          src="/assets/video/origin.mp4"
          poster="/assets/img/background.webp"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
        {/* Dark overlay that transitions the color to deep black on scroll */}
        <div className="water-dark-overlay" ref={darkOverlayRef} />
      </div>

      {/* PROGRESS BAR */}
      <div id="bar" ref={barRef} />

      {/* FLOATING GLASS PILL NAVBAR (ORIGINAL PILL) */}
      <nav className="glass g-l landing-nav" id="nav" ref={navRef}>
        <a className="logo" href="#top">
          AQUANET <b>X</b>
        </a>
        <div className="links">
          <a href="#challenge" onClick={closeMenu}>The Challenge</a>
          <a href="#platform" onClick={closeMenu}>Platform</a>
          <a href="#how" onClick={closeMenu}>How It Works</a>
          <a href="#offline" onClick={closeMenu}>About</a>
        </div>
        <div className="nb">
          <button className="btn hide" onClick={handleLogin}>
            {user ? 'Dashboard' : 'Login'}
          </button>
          <button className="btn p" onClick={handleGetStarted}>
            {user ? 'Dashboard' : 'Get Started'}
          </button>
          <button
            className="btn burger"
            id="bg"
            aria-label="Menu"
            aria-expanded={isMenuOpen}
            onClick={toggleMenu}
          >
            Menu
          </button>
        </div>
      </nav>

      {/* MOBILE MENU */}
      <div className={`glass g-d ${isMenuOpen ? 'o' : ''}`} id="lp-menu" ref={menuRef}>
        <a href="#challenge" onClick={closeMenu}>The Challenge</a>
        <a href="#platform" onClick={closeMenu}>Platform</a>
        <a href="#how" onClick={closeMenu}>How It Works</a>
        <a href="#offline" onClick={closeMenu}>About</a>
        <button className="btn" onClick={() => { closeMenu(); handleLogin(); }}>
          {user ? 'Dashboard' : 'Login'}
        </button>
      </div>

      <main id="top" style={{ position: 'relative', zIndex: 2, isolation: 'isolate' }}>
        {/* HERO SECTION (WITH ORIGINAL ENTRANCE ANIMATION & OUTFIT FONT) */}
        <section id="hero">
          <div ref={heroContentRef}>
            <h1 className="hd" id="h1">
              <span><b>Predict floods.</b></span>
              <span><b>Prevent shortages.</b></span>
              <span><b>Recover every drop.</b></span>
            </h1>
            <p className="lead fade" style={{ transitionDelay: '0.4s' }}>
              An offline-first urban water intelligence and emergency safety platform for cities that need to see water clearly.
            </p>
            <div className="row fade" style={{ transitionDelay: '0.6s' }}>
              <button className="btn p" id="explore" onClick={handleExplore}>
                Explore AQUANET X
              </button>
              <button className="btn" onClick={handleGetStarted}>
                {user ? 'Open Dashboard' : 'Get Started'}
              </button>
            </div>
          </div>
        </section>

        {/* 01 THE CHALLENGE (ORIGINAL CONTENT) */}
        <section id="challenge">
          <h2 className="hd">
            <span><b>Water moves through a city.</b></span>
            <span><b>Intelligence should too.</b></span>
          </h2>
          <div className="grid g3">
            <div className="glass card rv" style={{ '--i': 0 } as React.CSSProperties}>
              <div className="ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="#B8F5EF" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M2 9c3-3 5 3 8 0s5 3 8 0 3 0 4 0M2 15c3-3 5 3 8 0s5 3 8 0 3 0 4 0" />
                </svg>
              </div>
              <h3>Flood Intelligence</h3>
              <p>Understand changing flood conditions and identify areas at risk.</p>
            </div>

            <div className="glass card rv" style={{ '--i': 1 } as React.CSSProperties}>
              <div className="ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="#B8F5EF" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />
                </svg>
              </div>
              <h3>Water Intelligence</h3>
              <p>Monitor water availability, weather conditions, and water stress.</p>
            </div>

            <div className="glass card rv" style={{ '--i': 2 } as React.CSSProperties}>
              <div className="ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="#B8F5EF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <h3>Emergency Safety</h3>
              <p>Support communities with offline-first emergency information.</p>
            </div>
          </div>
        </section>

        {/* 02 PLATFORM (ORIGINAL CONTENT WITH DYNAMIC ANIMATED SVGS) */}
        <section id="platform">
          <h2 className="hd">
            <span><b>One platform.</b></span>
            <span><b>A clearer view of water.</b></span>
          </h2>
          <div className="grid g2">
            <div className="glass g-d card rv" style={{ '--i': 0 } as React.CSSProperties}>
              <svg viewBox="0 0 300 110">
                <path fill="rgba(102,232,224,.45)" d="M0 60C40 40 70 75 110 55S190 30 220 45 280 20 300 30V110H0z">
                  <animate attributeName="d" dur="5s" repeatCount="indefinite" values="M0 60C40 40 70 75 110 55S190 30 220 45 280 20 300 30V110H0z;M0 45C40 70 70 40 110 60S190 60 220 30 280 45 300 40V110H0z;M0 60C40 40 70 75 110 55S190 30 220 45 280 20 300 30V110H0z" />
                </path>
                <line x1="0" y1="38" x2="300" y2="38" stroke="#B8F5EF" strokeDasharray="4 5" opacity=".7" />
              </svg>
              <h3>Flood Intelligence</h3>
              <p>Rising-water patterns and at-risk zones, surfaced before they become emergencies.</p>
            </div>

            <div className="glass g-d card rv" style={{ '--i': 1 } as React.CSSProperties}>
              <svg viewBox="0 0 300 110">
                <rect x="125" y="6" width="50" height="98" rx="14" fill="none" stroke="#B8F5EF" opacity=".7" />
                <clipPath id="k-crop"><rect x="127" y="8" width="46" height="94" rx="12" /></clipPath>
                <rect clipPath="url(#k-crop)" x="127" y="40" width="46" height="70" fill="#39D8D0" opacity=".65">
                  <animate attributeName="y" values="34;66;34" dur="7s" repeatCount="indefinite" />
                </rect>
                <circle cx="60" cy="55" r="4" fill="#66E8E0">
                  <animate attributeName="r" values="4;22;4" dur="3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;0;1" dur="3s" repeatCount="indefinite" />
                </circle>
                <circle cx="240" cy="55" r="4" fill="#66E8E0">
                  <animate attributeName="r" values="4;22;4" dur="3s" begin="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;0;1" dur="3s" begin="1.5s" repeatCount="indefinite" />
                </circle>
              </svg>
              <h3>Water Stress</h3>
              <p>See how supply and demand are shifting across neighbourhoods.</p>
            </div>

            <div className="glass g-d card rv" style={{ '--i': 2 } as React.CSSProperties}>
              <svg viewBox="0 0 300 110">
                <g fill="#B8F5EF" opacity=".85">
                  <ellipse cx="130" cy="30" rx="48" ry="17" />
                  <ellipse cx="165" cy="24" rx="34" ry="19" />
                  <ellipse cx="190" cy="34" rx="30" ry="14" />
                </g>
                <g stroke="#66E8E0" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M115 62v10"><animateTransform attributeName="transform" type="translate" values="0 0;-6 36" dur="1.2s" repeatCount="indefinite" /></path>
                  <path d="M150 62v10"><animateTransform attributeName="transform" type="translate" values="0 0;-6 36" dur="1.5s" repeatCount="indefinite" /></path>
                  <path d="M185 62v10"><animateTransform attributeName="transform" type="translate" values="0 0;-6 36" dur="1.3s" repeatCount="indefinite" /></path>
                </g>
              </svg>
              <h3>Weather Intelligence</h3>
              <p>Rain, wind, and storm signals translated into plain, usable guidance.</p>
            </div>

            <div className="glass g-d card rv" style={{ '--i': 3 } as React.CSSProperties}>
              <svg viewBox="0 0 300 110">
                <g fill="none" stroke="#66E8E0" strokeWidth="3" strokeLinecap="round">
                  <path d="M112 62a40 40 0 0 1 66-26" />
                  <path d="M186 44a40 40 0 0 1-8 44" />
                  <path d="M166 98a40 40 0 0 1-54-30" />
                  <animateTransform attributeName="transform" type="rotate" from="0 150 58" to="360 150 58" dur="12s" repeatCount="indefinite" />
                </g>
                <path d="M150 40s14 15 14 25a14 14 0 0 1-28 0c0-10 14-25 14-25z" fill="#B8F5EF" opacity=".9" />
              </svg>
              <h3>Smart Recovery</h3>
              <p>Recover and reuse water, and plan the days after an event with confidence.</p>
            </div>
          </div>
        </section>

        {/* 03 HOW IT WORKS (ORIGINAL CONTENT) */}
        <section id="how">
          <h2 className="hd">
            <span><b>From first signal</b></span>
            <span><b>to full recovery.</b></span>
          </h2>
          <div className="steps" id="steps" ref={stepsRef}>
            <div className="line"><i /></div>
            <div className="step">
              <div className="dot">1</div>
              <div className="glass g-l card"><h3>Observe</h3><p>Gather water and weather conditions.</p></div>
            </div>
            <div className="step">
              <div className="dot">2</div>
              <div className="glass g-l card"><h3>Predict</h3><p>Anticipate flood and stress risk.</p></div>
            </div>
            <div className="step">
              <div className="dot">3</div>
              <div className="glass g-l card"><h3>Respond</h3><p>Share clear safety guidance.</p></div>
            </div>
            <div className="step">
              <div className="dot">4</div>
              <div className="glass g-l card"><h3>Recover</h3><p>Restore and reuse every drop.</p></div>
            </div>
          </div>
        </section>

        {/* 04 ABOUT / OFFLINE (ORIGINAL CONTENT) */}
        <section id="offline">
          <div className="sonar"><i /><i /><i /><b /></div>
          <h2 className="hd">
            <span><b>Intelligence that</b></span>
            <span><b>stays with you.</b></span>
          </h2>
          <p className="lead fade">Because emergency information matters most when connectivity is weakest.</p>
          <div className="grid g3">
            <div className="glass card rv" style={{ '--i': 0 } as React.CSSProperties}>
              <h3>Offline Access</h3>
              <p>Designed so key information stays reachable when the network drops.</p>
            </div>
            <div className="glass card rv" style={{ '--i': 1 } as React.CSSProperties}>
              <h3>Emergency Readiness</h3>
              <p>Safety guidance built to be found fast, under pressure.</p>
            </div>
            <div className="glass card rv" style={{ '--i': 2 } as React.CSSProperties}>
              <h3>Low-Bandwidth Experience</h3>
              <p>Lightweight by design, so it works on slow connections.</p>
            </div>
          </div>
        </section>

        {/* 05 CTA (ORIGINAL CONTENT) */}
        <section className="cta">
          <h2 className="hd">
            <span><b>Every drop matters.</b></span>
            <span><b>Every prediction counts.</b></span>
          </h2>
          <p className="fade">Build a safer, more water-wise city with intelligence that keeps moving.</p>
          <button className="btn p fade" onClick={handleGetStarted}>
            {user ? 'Open Dashboard' : 'Get Started'}
          </button>
        </section>
      </main>

      {/* FOOTER (ORIGINAL CONTENT) */}
      <footer style={{ position: 'relative', zIndex: 2 }}>
        <div className="glass g-l">AQUANET X &copy; 2026. Urban water intelligence.</div>
      </footer>
    </>
  );
}
