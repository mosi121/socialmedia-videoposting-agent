import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | Social Media Video Poster',
  description: 'Terms of Service for Social Media Video Poster application.',
};

export default function TermsPage() {
  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 20px', fontFamily: 'var(--font-sans, sans-serif)', color: '#1E293B', lineHeight: '1.6' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/" style={{ fontSize: '13px', fontWeight: '700', color: '#047857', textDecoration: 'none' }}>
          ← Back to App
        </Link>
      </div>

      <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px', color: '#3B3B3B' }}>
        Terms of Service
      </h1>
      <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '28px' }}>
        Last updated: October 27, 2026
      </p>

      <section style={{ marginBottom: '24px', backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '12px', color: '#3B3B3B' }}>
          1. Acceptance of Terms
        </h2>
        <p style={{ fontSize: '14px' }}>
          By accessing or using <strong>Social Media Video Poster</strong>, you agree to comply with and be bound by these Terms of Service. This application is restricted to authorized team members and designated accounts.
        </p>
      </section>

      <section style={{ marginBottom: '24px', backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '12px', color: '#3B3B3B' }}>
          2. Platform Compliance
        </h2>
        <p style={{ fontSize: '14px', marginBottom: '12px' }}>
          Users agree to abide by the community guidelines and terms of service of each connected third-party platform:
        </p>
        <ul style={{ paddingLeft: '20px', fontSize: '14px' }}>
          <li style={{ marginBottom: '6px' }}><a href="https://www.youtube.com/t/terms" target="_blank" rel="noreferrer" style={{ color: '#047857' }}>YouTube Terms of Service</a></li>
          <li style={{ marginBottom: '6px' }}><a href="https://www.facebook.com/terms.php" target="_blank" rel="noreferrer" style={{ color: '#047857' }}>Meta Terms of Service</a> and Instagram Community Guidelines</li>
          <li style={{ marginBottom: '6px' }}><a href="https://www.tiktok.com/legal/terms-of-service" target="_blank" rel="noreferrer" style={{ color: '#047857' }}>TikTok Terms of Service</a></li>
        </ul>
      </section>

      <section style={{ marginBottom: '24px', backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '12px', color: '#3B3B3B' }}>
          3. User Responsibility &amp; Content Rights
        </h2>
        <p style={{ fontSize: '14px', marginBottom: '12px' }}>
          You retain full ownership and rights to all video files and creative materials you upload through this application. You represent and warrant that you hold all necessary licenses, copyrights, and permissions for any media published via the tool.
        </p>
      </section>

      <section style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '12px', color: '#3B3B3B' }}>
          4. Contact
        </h2>
        <p style={{ fontSize: '14px' }}>
          For inquiries regarding these terms, please contact: <a href="mailto:amorousbrood@gmail.com" style={{ color: '#047857', fontWeight: '700' }}>amorousbrood@gmail.com</a>.
        </p>
      </section>
    </div>
  );
}
