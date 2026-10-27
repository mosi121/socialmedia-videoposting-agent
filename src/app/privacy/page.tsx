import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | Social Media Video Poster',
  description: 'Privacy Policy and data usage terms for Social Media Video Poster application.',
};

export default function PrivacyPolicyPage() {
  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 20px', fontFamily: 'var(--font-sans, sans-serif)', color: '#1E293B', lineHeight: '1.6' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/" style={{ fontSize: '13px', fontWeight: '700', color: '#047857', textDecoration: 'none' }}>
          ← Back to App
        </Link>
      </div>

      <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px', color: '#3B3B3B' }}>
        Privacy Policy
      </h1>
      <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '28px' }}>
        Last updated: October 27, 2026
      </p>

      <section style={{ marginBottom: '24px', backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '12px', color: '#3B3B3B' }}>
          1. Overview
        </h2>
        <p style={{ fontSize: '14px', marginBottom: '12px' }}>
          <strong>Social Media Video Poster</strong> (&quot;we&quot;, &quot;our&quot;, or &quot;the tool&quot;) is an internal multi-platform content publishing tool designed to help verified team members draft, optimize, and publish video content to their authorized social media channels, including <strong>YouTube</strong>, <strong>Instagram</strong>, <strong>Facebook</strong>, and <strong>TikTok</strong>.
        </p>
        <p style={{ fontSize: '14px' }}>
          We respect your privacy and are committed to protecting the limited data required to provide this posting service.
        </p>
      </section>

      <section style={{ marginBottom: '24px', backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '12px', color: '#3B3B3B' }}>
          2. Information We Collect and Access
        </h2>
        <p style={{ fontSize: '14px', marginBottom: '12px' }}>
          When you authorize our application via Google OAuth, Meta Graph API, or TikTok OAuth, we collect only the minimal data strictly required to publish your videos:
        </p>
        <ul style={{ paddingLeft: '20px', fontSize: '14px', marginBottom: '12px' }}>
          <li style={{ marginBottom: '6px' }}><strong>Authentication Tokens:</strong> OAuth access tokens and refresh tokens necessary to authenticate video upload requests on your behalf.</li>
          <li style={{ marginBottom: '6px' }}><strong>Channel / Page Identifiers:</strong> Basic identifiers such as your YouTube Channel Title, Facebook Page Name, Instagram Business Username, and TikTok display handle so you can select the destination for your posts.</li>
          <li style={{ marginBottom: '6px' }}><strong>Uploaded Media &amp; Metadata:</strong> The video files, titles, descriptions, and hashtags you explicitly choose to publish.</li>
        </ul>
        <p style={{ fontSize: '14px' }}>
          We <strong>do not</strong> collect your personal passwords, read your private direct messages, or access personal media outside the videos you stage for publication.
        </p>
      </section>

      <section style={{ marginBottom: '24px', backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '12px', color: '#3B3B3B' }}>
          3. How We Use Information
        </h2>
        <p style={{ fontSize: '14px', marginBottom: '12px' }}>
          We use the information collected solely for the following purposes:
        </p>
        <ul style={{ paddingLeft: '20px', fontSize: '14px' }}>
          <li style={{ marginBottom: '6px' }}>Uploading and publishing videos to the channels you actively select (YouTube, Instagram Reels, Facebook Pages, TikTok).</li>
          <li style={{ marginBottom: '6px' }}>Generating suggested titles, hooks, and hashtags using Google Gemini AI based on your video topic.</li>
          <li style={{ marginBottom: '6px' }}>Displaying post status and live confirmation links back to your published videos.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '24px', backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '12px', color: '#3B3B3B' }}>
          4. Data Storage and Security
        </h2>
        <p style={{ fontSize: '14px', marginBottom: '12px' }}>
          All authentication tokens and post staging data are stored in a secured Supabase database with Row Level Security (RLS) enabled. Temporary staged videos are stored in secure cloud storage solely for the purpose of transferring the media container to Meta, Google, and TikTok APIs.
        </p>
        <p style={{ fontSize: '14px' }}>
          We <strong>never sell, lease, or share</strong> your data or access tokens with any third parties or advertising networks.
        </p>
      </section>

      <section style={{ marginBottom: '24px', backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '12px', color: '#3B3B3B' }}>
          5. Revocation and Data Deletion
        </h2>
        <p style={{ fontSize: '14px', marginBottom: '12px' }}>
          You may revoke our application&apos;s access to your social media accounts at any time:
        </p>
        <ul style={{ paddingLeft: '20px', fontSize: '14px', marginBottom: '12px' }}>
          <li style={{ marginBottom: '6px' }}><strong>Google / YouTube:</strong> Visit <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer" style={{ color: '#047857' }}>Google Account Permissions</a>.</li>
          <li style={{ marginBottom: '6px' }}><strong>Meta (Facebook &amp; Instagram):</strong> Visit <a href="https://www.facebook.com/settings?tab=business_tools" target="_blank" rel="noreferrer" style={{ color: '#047857' }}>Facebook Business Integrations</a>.</li>
          <li style={{ marginBottom: '6px' }}><strong>TikTok:</strong> Visit your TikTok Privacy and Safety settings under Authorized Apps.</li>
        </ul>
        <p style={{ fontSize: '14px' }}>
          For user data deletion instructions and requests, please see our <Link href="/data-deletion" style={{ color: '#047857', fontWeight: '700' }}>Data Deletion Page</Link>.
        </p>
      </section>

      <section style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '12px', color: '#3B3B3B' }}>
          6. Contact Us
        </h2>
        <p style={{ fontSize: '14px' }}>
          If you have any questions regarding this Privacy Policy or your authorized accounts, contact our team at: <a href="mailto:amorousbrood@gmail.com" style={{ color: '#047857', fontWeight: '700' }}>amorousbrood@gmail.com</a>.
        </p>
      </section>
    </div>
  );
}
