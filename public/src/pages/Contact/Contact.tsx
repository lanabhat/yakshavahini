import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, MessageCircle, Globe } from 'lucide-react';

interface ContactPerson {
  nameKannada: string;
  nameEnglish: string;
  phone: string; // as displayed, with a space
}

const CONTACTS: ContactPerson[] = [
  { nameKannada: 'ಸುಹಾಸ್ ಮರಾಠೆ', nameEnglish: 'Suhas Marathe', phone: '99404 69916' },
  { nameKannada: 'ಉಮೇಶ ಶಿರೂರು', nameEnglish: 'Umesh Sirooru', phone: '94483 53910' },
  { nameKannada: 'ಲ. ನಾ. ಭಟ್', nameEnglish: 'L. N. Bhat', phone: '77608 23455' },
];

const EMAIL = 'yakshavahini@gmail.com';

const waLink = (phone: string) => `https://wa.me/91${phone.replace(/\s/g, '')}`;

const Contact: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--ps-bg)' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '22px 22px 60px' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ps-muted)', textDecoration: 'none', marginBottom: 18, fontSize: 13.5, width: 'fit-content' }}>
          <ArrowLeft style={{ width: 15, height: 15 }} /> ಮುಖಪುಟಕ್ಕೆ
        </Link>

        <h1 className="kn-serif" style={{ fontWeight: 700, fontSize: 26, color: 'var(--ps-text)', margin: '0 0 20px' }}>
          ಸಂಪರ್ಕ
        </h1>

        <p className="kn-sans" style={{ fontSize: 14.5, color: 'var(--ps-text)', lineHeight: 1.7, marginBottom: 24 }}>
          ಈ ಕೆಳಗಿನ ವಾಟ್ಸಾಪ್ ಸಂಖ್ಯೆಗಳನ್ನು ನಿಮ್ಮ ಪರಿಚಯದೊಂದಿಗೆ ಸಂಪರ್ಕಿಸಬಹುದು.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
          {CONTACTS.map((c) => (
            <a key={c.phone} href={waLink(c.phone)} target="_blank" rel="noopener"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                background: 'var(--ps-surface)', border: '1px solid var(--ps-border)', borderRadius: 14,
                padding: '14px 18px', textDecoration: 'none',
              }}>
              <div>
                <div className="kn-serif" style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--ps-text)' }}>
                  {c.nameKannada} <span className="kn-sans" style={{ fontWeight: 400, color: 'var(--ps-muted)', fontSize: 13 }}>({c.nameEnglish})</span>
                </div>
                <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13.5, color: 'var(--ps-muted)', marginTop: 2 }}>
                  {c.phone}
                </div>
              </div>
              <MessageCircle style={{ width: 20, height: 20, color: 'var(--ps-accent-text)', flexShrink: 0 }} />
            </a>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
          <a href="https://www.yakshavahini.com" target="_blank" rel="noopener"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--ps-surface)', border: '1px solid var(--ps-border)', borderRadius: 14,
              padding: '14px 18px', textDecoration: 'none', width: 'fit-content',
            }}>
            <Globe style={{ width: 18, height: 18, color: 'var(--ps-accent-text)' }} />
            <span style={{ fontSize: 14, color: 'var(--ps-text)' }}>www.yakshavahini.com</span>
          </a>

          <a href={`mailto:${EMAIL}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--ps-surface)', border: '1px solid var(--ps-border)', borderRadius: 14,
              padding: '14px 18px', textDecoration: 'none', width: 'fit-content',
            }}>
            <Mail style={{ width: 18, height: 18, color: 'var(--ps-accent-text)' }} />
            <span style={{ fontSize: 14, color: 'var(--ps-text)' }}>{EMAIL}</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Contact;
