import { useState, useEffect, useCallback, useRef } from 'react';
import JSZip from 'jszip';
import { storage, account, BUCKET_ID, GALLERY_EMAIL, Query, getFilePreviewUrl, getFileViewUrl } from '../lib/appwrite';

function Leaf({ className = '' }) {
  return (
    <svg viewBox="0 0 120 60" className={className} aria-hidden>
      <path d="M10 50 Q40 5 80 20 Q60 45 10 50Z" fill="currentColor" opacity="0.18" />
      <path d="M90 55 Q110 20 115 10 Q100 35 85 55Z" fill="currentColor" opacity="0.13" />
    </svg>
  );
}

function PasswordGate({ onUnlock }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(null);
  const [shaking, setShaking] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const attempt = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      try {
        await account.deleteSession('current');
      } catch (_) { /* no existing session */ }
      await account.createEmailPasswordSession(GALLERY_EMAIL, value);
      onUnlock();
    } catch (err) {
      setError(err?.code === 401 ? 'Incorrect password.' : (err?.message || 'Login failed.'));
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-garden-gradient flex flex-col items-center justify-center px-4">
      <Leaf className="fixed top-4 left-0 w-36 text-olive-500 -rotate-12 pointer-events-none" />
      <Leaf className="fixed bottom-4 right-0 w-36 text-mulberry-400 rotate-12 scale-x-[-1] pointer-events-none" />

      <div className={`card w-full max-w-sm text-center transition-transform ${shaking ? 'animate-[wiggle_0.4s_ease-in-out]' : ''}`}>
        <p className="font-serif italic text-olive-500 text-sm mb-1">Private gallery</p>
        <h2 className="font-serif text-3xl text-olive-800 mb-1">Jonathan &amp; Amanda</h2>
        <p className="font-sans text-olive-400 text-xs tracking-widest uppercase mb-6">May 16, 2026</p>

        <input
          type="password"
          value={value}
          onChange={e => { setValue(e.target.value); setError(null); }}
          onKeyDown={e => e.key === 'Enter' && attempt()}
          placeholder="Enter password"
          autoFocus
          disabled={submitting}
          className={`w-full bg-white/60 border rounded-xl px-4 py-3 font-sans text-olive-900
                      placeholder:text-olive-300 focus:outline-none transition-colors mb-1
                      ${error ? 'border-raspberry-400 focus:border-raspberry-400' : 'border-olive-200 focus:border-olive-400'}`}
        />
        {error && (
          <p className="font-sans text-xs text-raspberry-500 mb-3 text-left">{error}</p>
        )}
        <button className="btn-primary w-full mt-3" onClick={attempt} disabled={submitting}>
          {submitting ? 'Unlocking...' : 'View photos'}
        </button>
      </div>

      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="card w-full max-w-sm text-center">
        <p className="text-3xl mb-3">🗑️</p>
        <p className="font-serif text-olive-800 text-lg mb-2">Are you sure?</p>
        <p className="font-sans text-sm text-olive-500 mb-6">{message}</p>
        <div className="flex gap-3">
          <button className="btn-ghost flex-1" onClick={onCancel}>Cancel</button>
          <button
            className="flex-1 bg-raspberry-500 hover:bg-raspberry-600 active:bg-raspberry-700
                       text-white font-sans font-medium px-6 py-3 rounded-full transition-all duration-150 shadow-sm"
            onClick={onConfirm}
          >
            Delete forever
          </button>
        </div>
      </div>
    </div>
  );
}

function Lightbox({ file, onClose, onPrev, onNext, onDelete }) {
  const url = getFileViewUrl(file.$id);
  const downloadUrl = storage.getFileDownload(BUCKET_ID, file.$id);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, onPrev, onNext]);

  const guestName = file.name.replace(/_\d+\.\w+$/, '').replace(/_/g, ' ');

  return (
    <div className="fixed inset-0 z-50 bg-olive-900/90 backdrop-blur-sm flex flex-col" onClick={onClose}>
      <div className="flex items-center justify-between px-4 py-3 text-white/80" onClick={e => e.stopPropagation()}>
        <span className="font-sans text-sm truncate max-w-xs">{guestName}</span>
        <div className="flex gap-4 items-center">
          <a
            href={downloadUrl}
            download
            className="font-sans text-sm hover:text-white transition-colors"
            onClick={e => e.stopPropagation()}
          >
            ↓ Download
          </a>
          <button
            onClick={e => { e.stopPropagation(); onDelete(file); }}
            className="font-sans text-sm text-raspberry-300 hover:text-raspberry-200 transition-colors"
          >
            Delete
          </button>
          <button onClick={onClose} className="text-white/60 hover:text-white text-xl leading-none">✕</button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center relative" onClick={e => e.stopPropagation()}>
        <button onClick={onPrev} className="absolute left-2 z-10 text-white/60 hover:text-white text-3xl px-3 py-6">‹</button>
        <img src={url} alt="" className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg shadow-2xl" />
        <button onClick={onNext} className="absolute right-2 z-10 text-white/60 hover:text-white text-3xl px-3 py-6">›</button>
      </div>
    </div>
  );
}

function PhotoGrid({ files, onSelect, onDelete }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {files.map((file, idx) => {
        const preview = getFilePreviewUrl(file.$id);
        const guestName = file.name.replace(/_\d+\.\w+$/, '').replace(/_/g, ' ');
        return (
          <div key={file.$id} className="relative aspect-square group">
            <button
              onClick={() => onSelect(idx)}
              className="w-full h-full overflow-hidden rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-400"
            >
              <img
                src={preview}
                alt=""
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-olive-900/0 group-hover:bg-olive-900/20 transition-colors rounded-xl" />
              <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-gradient-to-t from-black/40 to-transparent
                              opacity-0 group-hover:opacity-100 transition-opacity rounded-b-xl">
                <p className="font-sans text-white text-xs truncate">{guestName}</p>
              </div>
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDelete(file); }}
              className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/50 hover:bg-raspberry-500
                         text-white text-xs flex items-center justify-center
                         opacity-0 group-hover:opacity-100 transition-opacity"
              title="Delete photo"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}

function DownloadProgress({ done, total }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="card w-full max-w-sm text-center">
        <p className="font-serif text-olive-800 text-lg mb-1">Building zip...</p>
        <p className="font-sans text-sm text-olive-400 mb-4">
          {done} of {total} photos
        </p>
        <div className="w-full bg-olive-100 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-olive-500 to-mulberry-400 transition-all duration-300 rounded-full"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

async function fetchAllFiles() {
  const all = [];
  let cursor = null;
  while (true) {
    const queries = [Query.limit(50), Query.orderDesc('$createdAt')];
    if (cursor) queries.push(Query.cursorAfter(cursor));
    const res = await storage.listFiles(BUCKET_ID, queries);
    all.push(...res.files);
    if (res.files.length < 50) break;
    cursor = res.files[res.files.length - 1].$id;
  }
  return all;
}

export default function GalleryPage() {
  const [authState, setAuthState]   = useState('checking'); // 'checking' | 'locked' | 'unlocked'
  const [files, setFiles]           = useState([]);
  const [loading, setLoading]       = useState(false);
  const [cursor, setCursor]         = useState(null);
  const [hasMore, setHasMore]       = useState(true);
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const [confirmFile, setConfirmFile] = useState(null);
  const [zipProgress, setZipProgress] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const sentinelRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    account.get()
      .then(() => { if (!cancelled) setAuthState('unlocked'); })
      .catch(() => { if (!cancelled) setAuthState('locked'); });
    return () => { cancelled = true; };
  }, []);

  const handleLogout = async () => {
    try { await account.deleteSession('current'); } catch (_) {}
    setFiles([]);
    setCursor(null);
    setHasMore(true);
    setAuthState('locked');
  };

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    setLoadError(null);
    try {
      const queries = [Query.limit(50), Query.orderDesc('$createdAt')];
      if (cursor) queries.push(Query.cursorAfter(cursor));
      const res = await storage.listFiles(BUCKET_ID, queries);
      setFiles(prev => [...prev, ...res.files]);
      if (res.files.length < 50) {
        setHasMore(false);
      } else {
        setCursor(res.files[res.files.length - 1].$id);
      }
    } catch (err) {
      console.error(err);
      setLoadError(err?.message || 'Could not load photos.');
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, cursor]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore || loadError) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) loadMore();
    }, { rootMargin: '400px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore, hasMore, loadError]);

  useEffect(() => {
    if (authState === 'unlocked') loadMore();
  }, [authState]);

  const handleDeleteConfirm = async () => {
    const file = confirmFile;
    setConfirmFile(null);
    try {
      await storage.deleteFile(BUCKET_ID, file.$id);
      setFiles(prev => {
        const next = prev.filter(f => f.$id !== file.$id);
        setLightboxIdx(idx => {
          if (idx === null) return null;
          if (next.length === 0) return null;
          return Math.min(idx, next.length - 1);
        });
        return next;
      });
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const handleDownloadAll = async () => {
    setZipProgress({ done: 0, total: 0 });
    try {
      const all = await fetchAllFiles();
      setZipProgress({ done: 0, total: all.length });

      const zip = new JSZip();
      let doneCount = 0;
      const CONCURRENCY = 6;
      let cursor = 0;

      const worker = async () => {
        while (true) {
          const i = cursor++;
          if (i >= all.length) return;
          const file = all[i];
          const url = storage.getFileDownload(BUCKET_ID, file.$id);
          const res = await fetch(url, { credentials: 'include' });
          if (!res.ok) throw new Error(`Failed to fetch ${file.name}: ${res.status}`);
          const blob = await res.blob();
          zip.file(file.name, blob);
          doneCount++;
          setZipProgress({ done: doneCount, total: all.length });
        }
      };

      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, all.length) }, worker));

      const content = await zip.generateAsync({ type: 'blob', streamFiles: true });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(content);
      a.download = 'jonathan-amanda-wedding-photos.zip';
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      console.error('Download failed', err);
    } finally {
      setZipProgress(null);
    }
  };

  if (authState === 'checking') {
    return (
      <div className="min-h-screen bg-garden-gradient flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-olive-300 border-t-olive-600 rounded-full animate-spin" />
      </div>
    );
  }
  if (authState === 'locked') return <PasswordGate onUnlock={() => setAuthState('unlocked')} />;

  return (
    <div className="min-h-screen bg-garden-gradient">
      <div className="max-w-2xl mx-auto px-4 pb-16">
        <div className="flex justify-end pt-4">
          <button
            onClick={handleLogout}
            className="font-sans text-xs text-olive-400 hover:text-olive-600 tracking-widest uppercase"
          >
            Log out
          </button>
        </div>
        <div className="text-center pt-4 pb-6 relative">
          <Leaf className="absolute top-2 left-0 w-28 text-olive-500 -rotate-12 pointer-events-none" />
          <Leaf className="absolute top-2 right-0 w-28 text-mulberry-400 rotate-12 scale-x-[-1] pointer-events-none" />
          <p className="font-serif italic text-olive-500 text-sm tracking-widest uppercase mb-1">Guest photos</p>
          <h1 className="font-serif text-4xl text-olive-800">
            Jonathan <span className="text-mulberry-400">&amp;</span> Amanda
          </h1>
          <p className="font-sans text-olive-400 text-xs tracking-widest uppercase mt-2">May 16, 2026</p>
          <div className="flex items-center justify-center gap-3 mt-3">
            <div className="h-px w-12 bg-olive-200" />
            <span className="text-raspberry-400">✦</span>
            <div className="h-px w-12 bg-olive-200" />
          </div>
        </div>

        {files.length > 0 && (
          <div className="flex items-center justify-between mb-4">
            <p className="font-sans text-sm text-olive-400">
              {files.length}{hasMore ? '+' : ''} photo{files.length !== 1 ? 's' : ''}
            </p>
            <button
              className="btn-primary text-sm py-2 px-5"
              onClick={handleDownloadAll}
            >
              ↓ Download all
            </button>
          </div>
        )}

        {files.length === 0 && !loading && !loadError && (
          <div className="card text-center py-12">
            <p className="font-serif italic text-olive-400 text-xl">No photos yet</p>
            <p className="font-sans text-olive-300 text-sm mt-2">Guest photos will appear here</p>
          </div>
        )}

        {loadError && files.length === 0 && (
          <div className="card text-center py-12">
            <p className="font-serif text-raspberry-500 text-lg">Couldn't load photos</p>
            <p className="font-sans text-olive-500 text-sm mt-2">{loadError}</p>
            <button className="btn-ghost mt-4" onClick={loadMore}>Try again</button>
          </div>
        )}

        {files.length > 0 && (
          <PhotoGrid files={files} onSelect={setLightboxIdx} onDelete={setConfirmFile} />
        )}

        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-olive-300 border-t-olive-600 rounded-full animate-spin" />
          </div>
        )}

        {loadError && files.length > 0 && (
          <div className="text-center mt-6">
            <p className="font-sans text-sm text-raspberry-500 mb-2">Couldn't load more photos.</p>
            <button className="btn-ghost" onClick={loadMore}>Try again</button>
          </div>
        )}

        {hasMore && !loading && !loadError && files.length > 0 && (
          <div ref={sentinelRef} className="h-8" />
        )}
      </div>

      {lightboxIdx !== null && (
        <Lightbox
          file={files[lightboxIdx]}
          onClose={() => setLightboxIdx(null)}
          onPrev={() => setLightboxIdx(i => (i - 1 + files.length) % files.length)}
          onNext={() => setLightboxIdx(i => (i + 1) % files.length)}
          onDelete={setConfirmFile}
        />
      )}

      {confirmFile && (
        <ConfirmDialog
          message="These photos will be gone forever and cannot be recovered."
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmFile(null)}
        />
      )}

      {zipProgress && (
        <DownloadProgress done={zipProgress.done} total={zipProgress.total} />
      )}
    </div>
  );
}
