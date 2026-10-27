'use client';

import React, { useState, useEffect, useRef } from 'react';
import LoginView from '@/components/LoginView';
import {
  Upload,
  Sparkles,
  Send,
  RefreshCw,
  Youtube,
  Instagram,
  Facebook,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  Zap,
  Check,
  LogOut,
  AlertCircle,
  Plus,
  ShieldCheck,
} from 'lucide-react';

interface PlatformPack {
  title: string;
  hook?: string;
  description: string;
  hashtags: string[];
  discussionQuestion?: string;
  soundSuggestion?: string;
}

interface GeneratedPack {
  summary: string;
  youtube: PlatformPack;
  instagram: PlatformPack;
  facebook: PlatformPack;
  tiktok: PlatformPack;
}

export default function MobileSocialPoster() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authStatus, setAuthStatus] = useState<any>(null);

  // Video & Prompt States
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>('');
  const [stagedVideoUrl, setStagedVideoUrl] = useState<string>('');
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  const [topic, setTopic] = useState('');
  const [userNotes, setUserNotes] = useState('');
  const [tone, setTone] = useState('High-energy, viral, engaging');
  const [isShortForm, setIsShortForm] = useState(true);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // AI Content Pack State
  const [isGenerating, setIsGenerating] = useState(false);
  const [contentPack, setContentPack] = useState<GeneratedPack | null>(null);
  const [activePlatform, setActivePlatform] = useState<'youtube' | 'instagram' | 'facebook' | 'tiktok'>('youtube');

  // Publishing Destination States
  const [selectedPlatforms, setSelectedPlatforms] = useState({
    youtube: true,
    instagram: true,
    facebook: true,
    tiktok: true,
  });
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResults, setPublishResults] = useState<any>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);

  // OAuth Connect Modal State
  const [connectModalPlatform, setConnectModalPlatform] = useState<'youtube' | 'instagram' | 'facebook' | 'tiktok' | null>(null);
  const [connectStatusMsg, setConnectStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [manualToken, setManualToken] = useState('');
  const [isConnectingManual, setIsConnectingManual] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Restore persisted session on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('social_agent_user');
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error('Failed to parse user session', e);
    } finally {
      setAuthChecked(true);
    }
  }, []);

  const refreshAuthStatus = () => {
    if (currentUser?.email) {
      fetch(`/api/auth/status?email=${encodeURIComponent(currentUser.email)}`)
        .then((r) => r.json())
        .then((data) => setAuthStatus(data))
        .catch((err) => console.error('Failed to load auth status', err));
    }
  };

  // Fetch user-scoped status whenever user changes
  useEffect(() => {
    refreshAuthStatus();
  }, [currentUser]);

  // Listen for OAuth popup completion messages
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_RESULT') {
        const plat = (event.data.platform || connectModalPlatform || '').toLowerCase();
        const platTitle = plat === 'youtube' ? 'YouTube' : plat === 'instagram' ? 'Instagram' : plat === 'facebook' ? 'Facebook' : plat === 'tiktok' ? 'TikTok' : plat.toUpperCase();

        if (event.data.success) {
          setConnectStatusMsg({
            type: 'success',
            text: `✓ ${platTitle} account connected successfully!`,
          });
          if (plat) {
            setSelectedPlatforms((prev) => ({ ...prev, [plat]: true }));
          }
          refreshAuthStatus();
          setTimeout(() => {
            setConnectModalPlatform(null);
            setConnectStatusMsg(null);
          }, 1500);
        } else {
          setConnectStatusMsg({
            type: 'error',
            text: 'Not connected. Try later.',
          });
        }
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [connectModalPlatform]);

  const handleLogout = () => {
    localStorage.removeItem('social_agent_user');
    localStorage.removeItem('social_agent_token');
    setCurrentUser(null);
  };

  // Trigger OAuth Popup Modal
  const handleOpenOAuthPopup = (platform: 'youtube' | 'instagram' | 'facebook' | 'tiktok') => {
    setConnectStatusMsg(null);
    setManualToken('');
    setConnectModalPlatform(platform);
  };

  const startOfficialOAuth = () => {
    if (!connectModalPlatform || !currentUser?.email) return;

    let authEndpoint = `/api/auth/connect/youtube?email=${encodeURIComponent(currentUser.email)}`;
    if (connectModalPlatform === 'instagram' || connectModalPlatform === 'facebook') {
      authEndpoint = `/api/auth/connect/meta?email=${encodeURIComponent(currentUser.email)}&platform=${connectModalPlatform}`;
    } else if (connectModalPlatform === 'tiktok') {
      authEndpoint = `/api/auth/connect/tiktok?email=${encodeURIComponent(currentUser.email)}`;
    }

    const popup = window.open(
      authEndpoint,
      `Connect_${connectModalPlatform}`,
      'width=600,height=720,status=no,toolbar=no,menubar=no,location=no'
    );

    if (!popup) {
      setConnectStatusMsg({
        type: 'error',
        text: 'Popup was blocked by your browser. Please allow popups for this site.',
      });
    } else {
      setConnectStatusMsg({
        type: 'info',
        text: 'Waiting for authorization in popup window...',
      });

      // Detect if user closes popup without completing authorization
      const checkTimer = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkTimer);
          setTimeout(() => {
            setConnectStatusMsg((prev) => {
              if (prev?.type === 'success') return prev;
              return { type: 'error', text: 'Not connected. Try later.' };
            });
          }, 500);
        }
      }, 700);
    }
  };

  const handleSaveManualToken = async () => {
    if (!manualToken.trim() || !connectModalPlatform || !currentUser?.email) return;
    setIsConnectingManual(true);
    const plat = connectModalPlatform;
    const platTitle = plat === 'youtube' ? 'YouTube' : plat === 'instagram' ? 'Instagram' : plat === 'facebook' ? 'Facebook' : plat === 'tiktok' ? 'TikTok' : plat.toUpperCase();

    try {
      const res = await fetch('/api/auth/connect/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: currentUser.email,
          platform: plat,
          accessToken: manualToken.trim(),
          accountName: `${platTitle} Account`,
        }),
      });

      if (res.ok) {
        setConnectStatusMsg({
          type: 'success',
          text: `✓ ${platTitle} account connected successfully!`,
        });
        setSelectedPlatforms((prev) => ({ ...prev, [plat]: true }));
        refreshAuthStatus();
        setTimeout(() => {
          setConnectModalPlatform(null);
          setConnectStatusMsg(null);
        }, 1500);
      } else {
        setConnectStatusMsg({
          type: 'error',
          text: 'Not connected. Try later.',
        });
      }
    } catch (err: any) {
      setConnectStatusMsg({
        type: 'error',
        text: 'Not connected. Try later.',
      });
    } finally {
      setIsConnectingManual(false);
    }
  };

  // Handle local video selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoFile(file);
    const localUrl = URL.createObjectURL(file);
    setVideoPreviewUrl(localUrl);

    if (!topic) {
      const cleanName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .trim();
      setTopic(cleanName);
    }

    uploadVideoToStaging(file);
  };

  const uploadVideoToStaging = async (file: File) => {
    setIsUploadingVideo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.publicUrl) {
        setStagedVideoUrl(data.publicUrl);
      }
    } catch (err) {
      console.error('Error uploading video:', err);
    } finally {
      setIsUploadingVideo(false);
    }
  };

  // Generate AI copy
  const handleGenerate = async () => {
    if (!topic.trim()) return;

    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          userNotes,
          tone,
          isShortForm,
        }),
      });

      const result = await res.json();
      if (res.ok && result.data) {
        setContentPack(result.data);
      } else {
        alert(result.error || 'Failed to generate copy');
      }
    } catch (err: any) {
      alert(`Generation error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const updateField = (field: keyof PlatformPack, value: any) => {
    if (!contentPack) return;
    setContentPack({
      ...contentPack,
      [activePlatform]: {
        ...contentPack[activePlatform],
        [field]: value,
      },
    });
  };

  const removeHashtag = (tagToRemove: string) => {
    if (!contentPack) return;
    const currentTags = contentPack[activePlatform].hashtags || [];
    updateField('hashtags', currentTags.filter((t) => t !== tagToRemove));
  };

  const addHashtag = (newTag: string) => {
    if (!contentPack || !newTag.trim()) return;
    const formatted = newTag.startsWith('#') ? newTag.trim() : `#${newTag.trim()}`;
    const currentTags = contentPack[activePlatform].hashtags || [];
    if (!currentTags.includes(formatted)) {
      updateField('hashtags', [...currentTags, formatted]);
    }
  };

  // Final Publish Order: Filters strictly for channels that are CONNECTED & SELECTED
  const handlePublishOrder = async () => {
    if (!contentPack) return;

    const targetUrl = stagedVideoUrl || videoPreviewUrl;
    if (!targetUrl) {
      alert('Please select a video file first.');
      return;
    }

    // Only send platforms that are both selected AND connected
    const activeTargets = {
      youtube: Boolean(selectedPlatforms.youtube && authStatus?.youtube?.connected),
      instagram: Boolean(selectedPlatforms.instagram && authStatus?.instagram?.connected),
      facebook: Boolean(selectedPlatforms.facebook && authStatus?.facebook?.connected),
      tiktok: Boolean(selectedPlatforms.tiktok && authStatus?.tiktok?.connected),
    };

    if (!Object.values(activeTargets).some(Boolean)) {
      alert('Please connect at least one account to publish.');
      return;
    }

    setIsPublishing(true);
    setShowPublishModal(true);

    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: targetUrl,
          platforms: activeTargets,
          contentPack,
          userEmail: currentUser?.email,
        }),
      });

      const data = await res.json();
      setPublishResults(data.results || {});
    } catch (err: any) {
      alert(`Publishing failed: ${err.message}`);
    } finally {
      setIsPublishing(false);
    }
  };

  // 1. Initial Loading Screen
  if (!authChecked) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <RefreshCw size={24} className="spin" color="#3B3B3B" />
      </div>
    );
  }

  // 2. Gate with Login Page if Not Authenticated
  if (!currentUser) {
    return <LoginView onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  // Count how many channels are BOTH connected and selected
  const activeConnectedCount = ['youtube', 'instagram', 'facebook', 'tiktok'].filter(
    (p) => selectedPlatforms[p as keyof typeof selectedPlatforms] && authStatus?.[p]?.connected
  ).length;

  const totalConnectedCount = ['youtube', 'instagram', 'facebook', 'tiktok'].filter(
    (p) => authStatus?.[p]?.connected
  ).length;

  // 3. Authenticated Mobile Studio
  return (
    <div className="mobile-app-wrapper fade-in">
      {/* 1. Header with User Profile */}
      <header className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              backgroundColor: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Zap size={16} color="#3B3B3B" />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '800', letterSpacing: '-0.3px', lineHeight: 1.1 }}>
              SocialPoster
            </div>
            <div style={{ fontSize: '10px', color: '#ADADAD' }}>
              {currentUser.email}
            </div>
          </div>
        </div>

        {/* Right Header: Connected Channels Count & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: '700',
              color: totalConnectedCount > 0 ? '#34D399' : '#ADADAD',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: totalConnectedCount > 0 ? '#34D399' : '#94A3B8',
              }}
            />
            <span>{totalConnectedCount}/4 Connected</span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Log Out"
            style={{
              background: 'none',
              border: 'none',
              color: '#C4C4C4',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '4px',
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* 2. Card 1: Video Ingestion & Topic */}
      <section className="minimal-card">
        {videoPreviewUrl ? (
          <div style={{ marginBottom: '14px' }}>
            <div
              style={{
                position: 'relative',
                width: '100%',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: '#000000',
                maxHeight: '260px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <video
                src={videoPreviewUrl}
                controls
                playsInline
                style={{ width: '100%', maxHeight: '260px', objectFit: 'contain' }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '8px',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: isUploadingVideo ? '#B45309' : '#047857',
                }}
              >
                {isUploadingVideo ? '● Staging video...' : '✓ Staged to Cloud'}
              </span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '1px solid var(--border-medium)',
                  background: 'none',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                }}
              >
                Change Video
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed var(--border-medium)',
              borderRadius: '8px',
              padding: '24px 14px',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: 'var(--bg-subtle)',
              marginBottom: '14px',
            }}
          >
            <Upload size={22} color="#3B3B3B" style={{ margin: '0 auto 6px auto' }} />
            <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>
              Tap to choose or record video
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              MP4, MOV, or WebM
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <div style={{ marginBottom: '10px' }}>
          <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
            What is this video about?
          </label>
          <input
            className="input-minimal"
            placeholder="e.g. 3 secret AI tools that save 10 hours a week"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <button
            type="button"
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            style={{
              background: 'none',
              border: 'none',
              padding: '2px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: '700',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <span>{showAdvancedOptions ? 'Hide custom notes & tone' : '+ Add custom notes or tone'}</span>
            {showAdvancedOptions ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {showAdvancedOptions && (
            <div className="fade-in" style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                  Key Points / Context
                </label>
                <textarea
                  className="input-minimal"
                  rows={2}
                  placeholder="Key takeaways or call to actions..."
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                    Vibe
                  </label>
                  <select
                    className="input-minimal"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    style={{ height: '38px', padding: '6px 8px' }}
                  >
                    <option value="High-energy, viral, engaging">Viral & Hype</option>
                    <option value="Authoritative, educational, clear">Educational</option>
                    <option value="Storytelling, relatable, emotional">Storytelling</option>
                    <option value="Professional, B2B, insightful">Professional</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                    Format
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsShortForm(!isShortForm)}
                    style={{
                      width: '100%',
                      height: '38px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-medium)',
                      backgroundColor: isShortForm ? '#3B3B3B' : '#FFFFFF',
                      color: isShortForm ? '#FFFFFF' : 'var(--text-primary)',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                  >
                    {isShortForm ? 'Shorts (9:16)' : 'Standard (16:9)'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating || !topic.trim()}
          className="btn-action-primary"
        >
          {isGenerating ? (
            <>
              <RefreshCw size={15} className="spin" />
              <span>Generating AI Copy...</span>
            </>
          ) : (
            <>
              <Sparkles size={15} />
              <span>Generate Platform Copy</span>
            </>
          )}
        </button>
      </section>

      {/* 3. Card 2: Proofreading Studio (Appears once generated) */}
      {contentPack && (
        <section className="minimal-card fade-in">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '800' }}>Proofread & Edit</h2>
            <span style={{ fontSize: '11px', color: '#047857', fontWeight: '700' }}>✓ AI Draft Ready</span>
          </div>

          {/* Platform Tabs */}
          <div className="platform-tabs-scroll">
            <button
              type="button"
              onClick={() => setActivePlatform('youtube')}
              className={`platform-tab-btn ${activePlatform === 'youtube' ? 'active' : ''}`}
            >
              <Youtube size={13} color={activePlatform === 'youtube' ? '#FFFFFF' : '#CC0000'} />
              <span>YouTube</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePlatform('instagram')}
              className={`platform-tab-btn ${activePlatform === 'instagram' ? 'active' : ''}`}
            >
              <Instagram size={13} color={activePlatform === 'instagram' ? '#FFFFFF' : '#C13584'} />
              <span>Instagram</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePlatform('facebook')}
              className={`platform-tab-btn ${activePlatform === 'facebook' ? 'active' : ''}`}
            >
              <Facebook size={13} color={activePlatform === 'facebook' ? '#FFFFFF' : '#1877F2'} />
              <span>Facebook</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePlatform('tiktok')}
              className={`platform-tab-btn ${activePlatform === 'tiktok' ? 'active' : ''}`}
            >
              <span style={{ fontWeight: '800' }}>TT</span>
              <span>TikTok</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {contentPack[activePlatform]?.hook && (
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>
                  Viral Hook (First 3 Seconds)
                </label>
                <input
                  className="input-minimal"
                  value={contentPack[activePlatform].hook}
                  onChange={(e) => updateField('hook', e.target.value)}
                />
              </div>
            )}

            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>
                Title
              </label>
              <input
                className="input-minimal"
                value={contentPack[activePlatform].title}
                onChange={(e) => updateField('title', e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>
                Caption / Description
              </label>
              <textarea
                className="input-minimal"
                rows={4}
                value={contentPack[activePlatform].description}
                onChange={(e) => updateField('description', e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Tags (tap tag to remove)
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                {(contentPack[activePlatform].hashtags || []).map((tag, idx) => (
                  <span
                    key={idx}
                    onClick={() => removeHashtag(tag)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      backgroundColor: 'var(--bg-subtle)',
                      border: '1px solid var(--border-medium)',
                      padding: '3px 7px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                  >
                    {tag} ✕
                  </span>
                ))}
              </div>

              <input
                placeholder="+ Add tag & press Enter"
                className="input-minimal"
                style={{ padding: '6px 10px', fontSize: '12px' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addHashtag((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
            </div>
          </div>
        </section>
      )}

      {/* 4. Bottom Launch & Connect Bar: DUAL-STATE BUTTONS */}
      <footer className="sticky-bottom-bar">
        <div className="sticky-bottom-inner">
          {/* Dual-State Channel Buttons: Unconnected says "Connect your [X] account" -> Connected toggles platform selection */}
          <div className="channel-connect-grid">
            {/* 1. YouTube */}
            {authStatus?.youtube?.connected ? (
              <button
                type="button"
                onClick={() => setSelectedPlatforms((prev) => ({ ...prev, youtube: !prev.youtube }))}
                className={`channel-pill-toggle ${selectedPlatforms.youtube ? 'active' : 'inactive'}`}
                title={`Connected: ${authStatus.youtube.accountName}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Youtube size={14} color="#CC0000" />
                  <span>YouTube</span>
                </div>
                {selectedPlatforms.youtube && <Check size={14} />}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleOpenOAuthPopup('youtube')}
                className="channel-pill-connect"
              >
                <Youtube size={13} color="#CC0000" />
                <span>Connect your YT account</span>
              </button>
            )}

            {/* 2. Instagram */}
            {authStatus?.instagram?.connected ? (
              <button
                type="button"
                onClick={() => setSelectedPlatforms((prev) => ({ ...prev, instagram: !prev.instagram }))}
                className={`channel-pill-toggle ${selectedPlatforms.instagram ? 'active' : 'inactive'}`}
                title={`Connected: ${authStatus.instagram.accountName}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Instagram size={14} color="#C13584" />
                  <span>Instagram</span>
                </div>
                {selectedPlatforms.instagram && <Check size={14} />}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleOpenOAuthPopup('instagram')}
                className="channel-pill-connect"
              >
                <Instagram size={13} color="#C13584" />
                <span>Connect your IG account</span>
              </button>
            )}

            {/* 3. Facebook */}
            {authStatus?.facebook?.connected ? (
              <button
                type="button"
                onClick={() => setSelectedPlatforms((prev) => ({ ...prev, facebook: !prev.facebook }))}
                className={`channel-pill-toggle ${selectedPlatforms.facebook ? 'active' : 'inactive'}`}
                title={`Connected: ${authStatus.facebook.accountName}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Facebook size={14} color="#1877F2" />
                  <span>Facebook</span>
                </div>
                {selectedPlatforms.facebook && <Check size={14} />}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleOpenOAuthPopup('facebook')}
                className="channel-pill-connect"
              >
                <Facebook size={13} color="#1877F2" />
                <span>Connect your FB account</span>
              </button>
            )}

            {/* 4. TikTok */}
            {authStatus?.tiktok?.connected ? (
              <button
                type="button"
                onClick={() => setSelectedPlatforms((prev) => ({ ...prev, tiktok: !prev.tiktok }))}
                className={`channel-pill-toggle ${selectedPlatforms.tiktok ? 'active' : 'inactive'}`}
                title={`Connected: ${authStatus.tiktok.accountName}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: '800', fontSize: '11px', color: '#111827' }}>TT</span>
                  <span>TikTok</span>
                </div>
                {selectedPlatforms.tiktok && <Check size={14} />}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleOpenOAuthPopup('tiktok')}
                className="channel-pill-connect"
              >
                <span style={{ fontWeight: '800', fontSize: '11px' }}>TT</span>
                <span>Connect your TT account</span>
              </button>
            )}
          </div>

          {/* Big Publish Order Button: Publishes to whatever connected channels are checked */}
          <button
            type="button"
            onClick={handlePublishOrder}
            disabled={!contentPack || isPublishing || activeConnectedCount === 0}
            className="btn-launch-order"
          >
            {isPublishing ? (
              <>
                <RefreshCw size={16} className="spin" />
                <span>Publishing to Channels...</span>
              </>
            ) : (
              <>
                <Send size={15} />
                <span>
                  {!contentPack
                    ? 'Generate copy above to publish'
                    : activeConnectedCount > 0
                    ? `Publish to ${activeConnectedCount} Channel${activeConnectedCount > 1 ? 's' : ''}`
                    : 'Connect at least 1 account to publish'}
                </span>
              </>
            )}
          </button>
        </div>
      </footer>

      {/* 5. OAuth Connection Popup Modal */}
      {connectModalPlatform && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={18} color="#3B3B3B" />
                <h3 style={{ fontSize: '16px', fontWeight: '800', textTransform: 'capitalize' }}>
                  Connect {connectModalPlatform === 'youtube' ? 'YouTube' : connectModalPlatform === 'instagram' ? 'Instagram' : connectModalPlatform === 'facebook' ? 'Facebook' : 'TikTok'} Account
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setConnectModalPlatform(null);
                  setConnectStatusMsg(null);
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#696969' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Authorize SocialPoster to publish videos to your {connectModalPlatform.toUpperCase()} channel for{' '}
              <strong>{currentUser.email}</strong>.
            </p>

            {/* Status / Error Message */}
            {connectStatusMsg && (
              <div className={`status-banner ${connectStatusMsg.type}`}>
                {connectStatusMsg.type === 'error' && <AlertCircle size={15} />}
                {connectStatusMsg.type === 'success' && <Check size={15} />}
                {connectStatusMsg.type === 'info' && <RefreshCw size={14} className="spin" />}
                <span>{connectStatusMsg.text}</span>
              </div>
            )}

            {/* Official OAuth Button */}
            <button
              type="button"
              onClick={startOfficialOAuth}
              className="btn-action-primary"
              style={{ marginBottom: '16px' }}
            >
              <ExternalLink size={15} />
              <span>Authorize with Official {connectModalPlatform === 'youtube' ? 'YouTube' : connectModalPlatform === 'instagram' ? 'Instagram' : connectModalPlatform === 'facebook' ? 'Facebook' : 'TikTok'}</span>
            </button>

            {/* Or Paste Direct Access Token (Developer Fallback) */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                OR PASTE ACCESS TOKEN DIRECTLY:
              </div>
              <input
                type="password"
                className="input-minimal"
                placeholder={`Paste your ${connectModalPlatform} access token...`}
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                style={{ marginBottom: '8px' }}
              />
              <button
                type="button"
                onClick={handleSaveManualToken}
                disabled={!manualToken.trim() || isConnectingManual}
                className="btn-action-primary"
                style={{
                  backgroundColor: '#FFFFFF',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-medium)',
                }}
              >
                {isConnectingManual ? (
                  <>
                    <RefreshCw size={13} className="spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <span>Save Token Directly</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Publishing Results Modal */}
      {showPublishModal && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800' }}>
                {isPublishing ? 'Uploading to Platforms...' : 'Publishing Complete!'}
              </h3>
              {!isPublishing && (
                <button
                  type="button"
                  onClick={() => setShowPublishModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#696969' }}
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              {isPublishing
                ? 'Dispatching your video concurrently. Please keep this screen open.'
                : 'Your video has been posted across your channels:'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {selectedPlatforms.youtube && authStatus?.youtube?.connected && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: 'var(--bg-subtle)', borderRadius: '6px', border: '1px solid var(--border-medium)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Youtube size={15} color="#CC0000" />
                    <span style={{ fontSize: '13px', fontWeight: '700' }}>YouTube</span>
                  </div>
                  {isPublishing ? (
                    <RefreshCw size={13} className="spin" color="#696969" />
                  ) : publishResults?.youtube?.success ? (
                    <a
                      href={publishResults.youtube.postUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '12px', fontWeight: '700', color: '#047857', display: 'flex', alignItems: 'center', gap: '3px' }}
                    >
                      View <ExternalLink size={11} />
                    </a>
                  ) : (
                    <span style={{ fontSize: '11px', color: '#B91C1C', fontWeight: '600' }}>
                      {publishResults?.youtube?.error || 'Failed'}
                    </span>
                  )}
                </div>
              )}

              {selectedPlatforms.instagram && authStatus?.instagram?.connected && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: 'var(--bg-subtle)', borderRadius: '6px', border: '1px solid var(--border-medium)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Instagram size={15} color="#C13584" />
                    <span style={{ fontSize: '13px', fontWeight: '700' }}>Instagram Reel</span>
                  </div>
                  {isPublishing ? (
                    <RefreshCw size={13} className="spin" color="#696969" />
                  ) : publishResults?.instagram?.success ? (
                    <a
                      href={publishResults.instagram.postUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '12px', fontWeight: '700', color: '#047857', display: 'flex', alignItems: 'center', gap: '3px' }}
                    >
                      View <ExternalLink size={11} />
                    </a>
                  ) : (
                    <span style={{ fontSize: '11px', color: '#B91C1C', fontWeight: '600' }}>
                      {publishResults?.instagram?.error || 'Failed'}
                    </span>
                  )}
                </div>
              )}

              {selectedPlatforms.facebook && authStatus?.facebook?.connected && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: 'var(--bg-subtle)', borderRadius: '6px', border: '1px solid var(--border-medium)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Facebook size={15} color="#1877F2" />
                    <span style={{ fontSize: '13px', fontWeight: '700' }}>Facebook Page</span>
                  </div>
                  {isPublishing ? (
                    <RefreshCw size={13} className="spin" color="#696969" />
                  ) : publishResults?.facebook?.success ? (
                    <a
                      href={publishResults.facebook.postUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '12px', fontWeight: '700', color: '#047857', display: 'flex', alignItems: 'center', gap: '3px' }}
                    >
                      View <ExternalLink size={11} />
                    </a>
                  ) : (
                    <span style={{ fontSize: '11px', color: '#B91C1C', fontWeight: '600' }}>
                      {publishResults?.facebook?.error || 'Failed'}
                    </span>
                  )}
                </div>
              )}

              {selectedPlatforms.tiktok && authStatus?.tiktok?.connected && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: 'var(--bg-subtle)', borderRadius: '6px', border: '1px solid var(--border-medium)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: '800', fontSize: '13px' }}>TT</span>
                    <span style={{ fontSize: '13px', fontWeight: '700' }}>TikTok</span>
                  </div>
                  {isPublishing ? (
                    <RefreshCw size={13} className="spin" color="#696969" />
                  ) : publishResults?.tiktok?.success ? (
                    <a
                      href={publishResults.tiktok.postUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '12px', fontWeight: '700', color: '#047857', display: 'flex', alignItems: 'center', gap: '3px' }}
                    >
                      Inbox <ExternalLink size={11} />
                    </a>
                  ) : (
                    <span style={{ fontSize: '11px', color: '#B91C1C', fontWeight: '600' }}>
                      {publishResults?.tiktok?.error || 'Failed'}
                    </span>
                  )}
                </div>
              )}
            </div>

            {!isPublishing && (
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                className="btn-action-primary"
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
