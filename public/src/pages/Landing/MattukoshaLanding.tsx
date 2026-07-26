import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const paragraphStyle: React.CSSProperties = {
  fontSize: 15.5, lineHeight: 1.9, color: 'var(--ps-text)', marginBottom: 20,
};

const MattukoshaLanding: React.FC = () => {
  const [showEnterButton, setShowEnterButton] = useState(false);
  const [inlineButtonVisible, setInlineButtonVisible] = useState(false);
  const articleRef = useRef<HTMLDivElement>(null);
  const inlineButtonRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const el = articleRef.current;
      if (!el) return;
      const midpoint = el.offsetTop + el.offsetHeight / 2;
      setShowEnterButton(window.scrollY + window.innerHeight / 2 >= midpoint);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Hide the floating button while the inline "enter" button (further down
  // the article) is itself on screen, so the two never show at once.
  useEffect(() => {
    const el = inlineButtonRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInlineButtonVisible(entry.isIntersecting),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const floatingButtonVisible = showEnterButton && !inlineButtonVisible;

  return (
    <div style={{ background: 'var(--ps-bg)', minHeight: '100vh' }}>
      {/* ── Floating "enter the app" button — slides in from the right once
           the reader has scrolled past the halfway point of the article, and
           hides again while the inline button below is itself visible ── */}
      <Link
        to="/mattukosha/app"
        title="ಮಟ್ಟುಕೋಶ ಪ್ರವೇಶಿಸಿ"
        style={{
          position: 'fixed', top: '50%', right: floatingButtonVisible ? 18 : -80,
          transform: 'translateY(-50%)', zIndex: 60,
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--ps-grad)', color: '#fff', textDecoration: 'none',
          borderRadius: 999, padding: '14px 20px 14px 16px',
          boxShadow: 'var(--ps-shadow-md)',
          transition: 'right .35s ease, opacity .35s ease',
          opacity: floatingButtonVisible ? 1 : 0,
        }}
      >
        <ArrowRight style={{ width: 18, height: 18 }} />
        <span className="kn-sans" style={{ fontSize: 13.5, fontWeight: 700, whiteSpace: 'nowrap' }}>
          ಮಟ್ಟುಕೋಶ ಪ್ರವೇಶಿಸಿ
        </span>
      </Link>

      <div ref={articleRef} className="kn-sans" style={{ maxWidth: 760, margin: '0 auto', padding: '56px 22px 90px' }}>
        <h1 className="kn-serif" style={{ fontWeight: 700, fontSize: 'clamp(26px, 4vw, 36px)', color: 'var(--ps-text)', marginBottom: 30, textAlign: 'center' }}>
          ಯಕ್ಷಮಟ್ಟುಕೋಶ
        </h1>

        <p style={paragraphStyle}>ಸಹೃದಯಿ ಯಕ್ಷಬಾಂಧವರೇ,</p>

        <p style={paragraphStyle}>
          ಮಟ್ಟುಗಳು ಯಕ್ಷಗಾನ ಕಲೆಯ ಸೊಗಡಿನ ಜೀವಾಳ, ಮಾತ್ರವಲ್ಲ ರಂಗದಲ್ಲಿ ರಸಸೃಷ್ಟಿಗೆ ಪೂರಕವಾದ ಮೂಲಭೂತವಾದ ತಳಹದಿ.
          ಯಕ್ಷಗಾನ ಸಾಹಿತ್ಯದ ಛಂದಸ್ಸುಗಳು ಈ ಮಟ್ಟುಗಳಿಗೆ ಆಧಾರ, ಈ ಛಂದಸ್ಸಿಗೆ ಅನುಗುಣವಾಗಿ ಕೆಲವೇ ರಾಗ ತಾಳಗಳ
          ಸಂಯೋಜನೆಯು ಹೊಂದಿಕೊಂಡು ಯಕ್ಷಗಾನದ ಹಿಮ್ಮೇಳ ಗಾಯನವು ಸಂಪನ್ನಗೊಳ್ಳುತ್ತದೆ. ರಂಗದ ಮೇಲೆ ರಸ ಸೃಷ್ಟಿಯಲ್ಲಿ
          ಹಿಮ್ಮೇಳದ ಭಾಗವತನು ಪ್ರಥಮ ವೇಷಧಾರಿಯಾಗುವ ಜವಾಬ್ದಾರಿಯಲ್ಲಿದ್ದರೆ, ಪ್ರಸಂಗವನ್ನು ರಚಿಸಿದ ಪ್ರಸಂಗಕವಿಯು ಈ
          ಪ್ರಥಮ ವೇಷಧಾರಿಯನ್ನು ಮುನ್ನಡೆಸುವ ನಿರ್ದೇಶಕನಿರುತ್ತಾನೆ. ಆದುದರಿಂದಲೇ, ಪ್ರಸಂಗವೊಂದನ್ನು ಆಡುವಾಗ
          ಪ್ರಸಂಗಕವಿಯನ್ನು ನೆನೆಯದೇ ಹೋಗುವುದು ಸುಸಂಸ್ಕೃತಿಯಲ್ಲ.
        </p>

        <p style={paragraphStyle}>
          ಎಂದಿನವರೆಗೆ ಸೂಕ್ತ ಮಟ್ಟುಗಳ ಸದುಪಯೋಗ ಹಾಗೂ ಅದಕ್ಕೆ ಹೊಂದಿಕೊಂಡ ಸೂಕ್ತ ಹಿನ್ನಲೆ ಗಾಯನ ಇರುತ್ತದೋ, ಅಲ್ಲಿಯವರೆಗೆ
          ಯಕ್ಷಗಾನ ಕಲೆಗೆ ಸಾವಿಲ್ಲ. ಹಾಗಾಗಿ ಯಕ್ಷಗಾನ ಪ್ರಸಂಗಕವಿಯಾಗಬಯಸುವವನು ಮಟ್ಟುಗಳ ಸಾಮಾನ್ಯ ಜ್ಞಾನ, ಅವುಗಳನ್ನು
          ಆಧರಿಸುವ ಛಂದಸ್ಸಿನ ಲಕ್ಷಣ, ಕಥನದ ಸನ್ನಿವೇಶ ಮತ್ತು ಭಾವನಾಲಹರಿಗೆ ಹೊಂದಿಕೆ ಇವುಗಳ ಕುರಿತಾಗಿ ಸಂಪೂರ್ಣ ಹಿಡಿತವನ್ನು
          ಹೊಂದಲೇಬೇಕು. ಅದೇ ರೀತಿ ಭಾಗವತನಾದವನು ಸನ್ನಿವೇಶ ಹಾಗೂ ಭಾವನಾಲಹರಿಗೆ ಸೂಕ್ತವಾದ, ಮುಖ್ಯವಾಗಿ ಮಟ್ಟಿನ
          ಛಂದೋಬಂಧಕ್ಕೆ ಹೊಂದಿಕೊಳ್ಳುವ ರಾಗ ತಾಳಗಳನ್ನೇ ಉಪಯೋಗಿಸುವ ವಿವೇಚನೆಯನ್ನು ಹೊಂದಿರಬೇಕು.
        </p>

        <p style={paragraphStyle}>
          ಯಕ್ಷಗಾನದ ಉಳಿವು, ಬೆಳೆವಿನ ಮಾತುಗಳಿರುವಲ್ಲಿ ಯಕ್ಷಗಾನ ಮಟ್ಟುಗಳ ಕುರಿತಾದ ಕಾಳಜಿ ಅನಿವಾರ್ಯ. ಹಾಗಾಗಿ, ಯಕ್ಷಗಾನದ
          ನೂರಾರು ಮಟ್ಟುಗಳನ್ನು ಸರಳವಾಗಿ ತಿಳಿಸಿಕೊಡುವುದೇ ನಮ್ಮ ಆಶಯ. ಇಲ್ಲಿ ಮಟ್ಟುಗಳು ಯಾ ಅವುಗಳ ಹಿಂದಿನ
          ಯಕ್ಷಛಂದಸ್ಸುಗಳ ಕುರಿತಾದ ಗಾಢವಾದ ಪಾಂಡಿತ್ಯವನ್ನು ಮೆರೆಸುವ ಬದಲು ಸುಲಭ ಪಾಠಗಳನ್ನೇ ಒಪ್ಪಿಸುವ ಪ್ರಾಮಾಣಿಕ
          ಪ್ರಯತ್ನ ನಮ್ಮದು.
        </p>

        <p style={paragraphStyle}>
          ಒಂದೊಂದೇ ಮಟ್ಟಿನ ವಿವರವಾದ ಮಾಹಿತಿಯನ್ನು ತಿಳಿಯುವ ಮುನ್ನ, ಮಟ್ಟುಗಳ ಮತ್ತು ಯಕ್ಷಗಾನ ಛಂದಸ್ಸಿನ ನಡುವಿನ ನಂಟನ್ನು
          ಪೂರ್ವಭಾವಿಯಾಗಿ ಅರಿಯುವುದು ಅನಿವಾರ್ಯ. ಆದುದರಿಂದಲೇ ಪರಿಚಯಾತ್ಮಕವಾದ &ldquo;ಮಟ್ಟಿನ ಸೌಧಕ್ಕೆ ಮೆಟ್ಟಿಲು&rdquo;
          ಎಂಬ ಲೇಖನವನ್ನು ದಯವಿಟ್ಟು ಮೊದಲು ಓದಿ (ಕೊಂಡಿಯನ್ನು ಕೆಳಗೆ ಕೊಡಲಾಗಿದೆ). ಈ ಲೇಖನವನ್ನು ಪ್ರತೀ ಮಟ್ಟಿನ
          ವಿವರವಾದ ಮಾಹಿತಿ ದಸ್ತಾವೇಜಿನಲ್ಲೂ, ಮಟ್ಟುಗಳ ಕೋಷ್ಟಕದಲ್ಲೂ ಕೊಂಡಿಯ ಮೂಲಕ ಸುಲಭದಲ್ಲಿ ಓದಲು ಸಿಗುವಂತೆ
          ಕೊಟ್ಟಿದ್ದೇವೆ.
        </p>

        <div style={{
          background: 'var(--ps-accent-soft)', borderRadius: 14, padding: '18px 22px', margin: '28px 0',
          textAlign: 'center',
        }}>
          <span className="kn-serif" style={{ fontWeight: 700, fontSize: 18, color: 'var(--ps-accent-text)' }}>
            ಮಟ್ಟಿನ ಸೌಧಕ್ಕೆ ಮೆಟ್ಟಿಲು
          </span>
        </div>

        <p style={paragraphStyle}>
          ಪ್ರತೀ ಮಟ್ಟಿನ ಕುರಿತಾದ ಮಾಹಿತಿ ವಿವರಗಳಲ್ಲಿ ರಂಗದ ಸನ್ನಿವೇಶಕ್ಕೆ ಹೊಂದಿಕೆ ಹಾಗೂ ಹಾಡಲು ಸೂಕ್ತವಾದ ರಾಗ ತಾಳಗಳ
          ಸಂಯೋಜನೆಗಳ ಕುರಿತಾಗಿಯೂ ಮಾತುಗಳಿರುವುದನ್ನು ಗಮನಿಸಿ. ಮುಂದಿನ ದಿನಗಳಲ್ಲಿ, ಮಟ್ಟುಗಳಿಗೆ ಹೊಂದುವ ಸೂಕ್ತ ರಾಗ
          ತಾಳಗಳಲ್ಲಿ, ಸೊಗಡುಗಳಲ್ಲಿ, ಹಾಡುಗಾರಿಕೆಯ ಧ್ವನಿಮುದ್ರಿಕೆಗಳ ಕೊಂಡಿಯನ್ನೂ ಸೇರಿಸುವ ಆಶಯದಲ್ಲಿದ್ದೇವೆ.
        </p>

        <p style={paragraphStyle}>
          ಯಕ್ಷಗಾನಕ್ಕೆ ಸಂಬಂಧಿಸಿ ಅಂತರಜಾಲ ದಾಖಲೀಕರಣ ಹಾಗೂ ಉಚಿತ ಪ್ರಸಾರದ ಮೂಲಕ ಯಾರೂ ಈವರೆಗೆ ಮಾಡದ ಕೆಲಸಗಳನ್ನೇ
          ಆರಿಸಿಕೊಂಡು ಸ್ವಯಂಸೇವೆ ಬಲದಲ್ಲೇ ಸಾಗುತ್ತಿರುವ ನಮ್ಮ ಅನೇಕ ಪ್ರಯತ್ನಗಳಲ್ಲಿ &ldquo;ಯಕ್ಷಮಟ್ಟುಕೋಶ&rdquo;ವು ಅತೀ
          ಪ್ರಮುಖ ಕೆಲಸವಾಗಿ ಹೊಮ್ಮಲಿ ಎಂಬುದು ನಮ್ಮ ಪ್ರಾರ್ಥನೆ.
        </p>

        <p style={paragraphStyle}>
          ಮಟ್ಟುಗಳ ವಿವರಗಳನ್ನು ಬೇರೆ ಬೇರೆ ದಸ್ತಾವೇಜುಗಳಲ್ಲಿ ಬರೆದು, ಕೊಂಡಿಗಳ ಮೂಲಕ ಯಕ್ಷಮಟ್ಟುಕೋಶದ ಕೋಷ್ಟಕದಲ್ಲಿ
          ಕೊಡಲಾಗುತ್ತಿದೆ. ಈವರೆಗೆ ಬರೇ ೧೦ ಮಟ್ಟುಗಳ ಮಾಹಿತಿಯನ್ನು ಸೇರಿಸಿದ್ದು, ಕ್ರಮೇಣ ನೂರಾರು ಸಂಖ್ಯೆಯಲ್ಲಿರುವ
          ಯಕ್ಷಗಾನ ಪ್ರಪಂಚದ ಎಲ್ಲಾ ಮಟ್ಟುಗಳನ್ನು ಸೇರಿಸುವ ಯೋಜನೆಯಲ್ಲಿದ್ದೇವೆ. ಯಕ್ಷಮಟ್ಟುಕೋಶದ ಕೋಷ್ಟಕಕ್ಕಾಗಿ ಈ
          ಕೆಳಗಿನ ಕೊಂಡಿಯನ್ನು ಒತ್ತಿ.
        </p>

        <div style={{ textAlign: 'center', margin: '32px 0' }}>
          <Link ref={inlineButtonRef} to="/mattukosha/app/library" style={{
            display: 'inline-block', background: 'var(--ps-grad)', color: '#fff', textDecoration: 'none',
            borderRadius: 999, padding: '14px 30px', fontWeight: 700, fontSize: 15.5,
            boxShadow: 'var(--ps-shadow-md)',
          }}>
            ಮಟ್ಟುಕೋಶ ಪ್ರವೇಶಿಸಿ
          </Link>
        </div>

        <p style={paragraphStyle}>
          ಈ ಯೋಜನೆಯ ಅಭೂತಪೂರ್ವ ಯಶಸ್ಸಿಗಾಗಿ ನಿಮ್ಮ ಸಹಾಯ, ಸಹಕಾರ ಹಾಗೂ ಶುಭಹಾರೈಕೆಯ ನಿರೀಕ್ಷೆಯಲ್ಲಿ,
        </p>

        <div style={{ fontSize: 14.5, lineHeight: 2, color: 'var(--ps-muted)', marginTop: 28 }}>
          <p style={{ margin: 0 }}>ಶ್ರೀ ಶ್ರೀಧರ ಡಿ. ಎಸ್., ಪ್ರಧಾನ ನಿರ್ದೇಶಕರು</p>
          <p style={{ margin: 0 }}>ಶ್ರೀ ಗಿಂಡೀಮನೆ ಮೃತ್ಯುಂಜಯ, ಸಹ ನಿರ್ದೇಶಕರು</p>
          <p style={{ margin: 0 }}>ಶ್ರೀ ಅನಂತ ಪದ್ಮನಾಭ ಫಾಟಕ್‌, ಸಹ ನಿರ್ದೇಶಕರು</p>
          <p style={{ margin: 0 }}>ಶ್ರೀ ಅಜಿತ್‌ ಕಾರಂತ್‌, ಪ್ರಧಾನ ಸಂಪಾದಕರು</p>
          <p style={{ margin: 0 }}>ಶ್ರೀಮತಿ ಅಶ್ವಿನಿ ಹೊದಲ, ಸಹ ಸಂಪಾದಕರು</p>
          <p style={{ margin: 0 }}>ಡಾ. ಆನಂದರಾಮ ಉಪಾಧ್ಯ, ಶ್ರೀ ನಟರಾಜ ಉಪಾಧ್ಯ, ಶ್ರೀ ರವಿ ಮಡೋಡಿ (ವಿಶ್ವಸ್ಥರು, ಯಕ್ಷವಾಹಿನಿ ಸಂಸ್ಥೆ)</p>
        </div>
      </div>
    </div>
  );
};

export default MattukoshaLanding;
