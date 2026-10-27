import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Data Deletion Instructions | Social Media Video Poster',
  description: 'Instructions on how to request data deletion for Social Media Video Poster.',
};

export default function DataDeletionPage() {
  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 20px', fontFamily: 'var(--font-sans, sans-serif)', color: '#1E293B', lineHeight: '1.6' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/" style={{ fontSize: '13px', fontWeight: '700', color: '#047857', textDecoration: 'none' }}>
          ← Back to App
        </Link>
      </div>

      <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px', color: '#3B3B3B' }}>
        User Data Deletion Instructions
      </h1>
      <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '28px' }}>
        Compliant with Meta Platform and Google Data Privacy Guidelines
      </p>

      <section style={{ marginBottom: '24px', backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '12px', color: '#3B3B3B' }}>
          How to Remove Your Data
        </h2>
        <p style={{ fontSize: '14px', marginBottom: '14px' }}>
          <strong>Social Media Video Poster</strong> does not save your personal profile data on external marketing databases. We only store encrypted OAuth connection tokens required to upload your videos.
        </p>
        <p style={{ fontSize: '14px', marginBottom: '14px' }}>
          If you want to delete your stored tokens, channel associations, and posting records from our database, you can do so in two ways:
        </p>
        
        <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #CBD5E1', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '8px' }}>Option 1: In-App Disconnect</h3>
          <p style={{ fontSize: '13px' }}>
            Inside the application, click on any connected channel pill and choose <strong>Disconnect</strong>. This immediately deletes the stored access token from our database.
          </p>
        </div>

        <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #CBD5E1', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '8px' }}>Option 2: Direct Email Request</h3>
          <p style={{ fontSize: '13px' }}>
            Send an email to <a href="mailto:amorousbrood@gmail.com" style={{ color: '#047857', fontWeight: '700' }}>amorousbrood@gmail.com</a> with the subject line <strong>&quot;Data Deletion Request&quot;</strong> and include the email address of your account. All associated tokens, logs, and staging files will be permanently purged within 24 hours.
          </p>
        </div>

        <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '8px' }}>Option 3: Revoke via Facebook</h3>
          <ol style={{ paddingLeft: '20px', fontSize: '13px' }}>
            <li style={{ marginBottom: '4px' }}>Go to your Facebook Account&apos;s <strong>Settings &amp; Privacy</strong> $\rightarrow$ <strong>Settings</strong>.</li>
            <li style={{ marginBottom: '4px' }}>Look for <strong>Apps and Websites</strong> where you will see all apps linked to your profile.</li>
            <li style={{ marginBottom: '4px' }}>Find <strong>Social Media Poster</strong> in the list.</li>
            <li style={{ marginBottom: '4px' }}>Click <strong>Remove</strong>. This immediately invalidates our access.</li>
          </ol>
        </div>
      </section>
    </div>
  );
}
