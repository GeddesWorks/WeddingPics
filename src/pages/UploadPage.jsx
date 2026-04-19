import { useState, useRef, useCallback } from 'react';
import { storage, BUCKET_ID, ID } from '../lib/appwrite';

const NAME_KEY = 'weddingpics_guest_name';

function LeafDecor({ className = '' }) {
  return (
    <svg viewBox="0 0 120 60" className={className} aria-hidden>
      <path d="M10 50 Q40 5 80 20 Q60 45 10 50Z" fill="currentColor" opacity="0.18" />
      <path d="M90 55 Q110 20 115 10 Q100 35 85 55Z" fill="currentColor" opacity="0.13" />
    </svg>
  );
}

function WeddingHeader() {
  return (
    <div className="text-center pt-10 pb-6 px-4 relative">
      <LeafDecor className="absolute top-2 left-0 w-32 text-olive-600 -rotate-12" />
      <LeafDecor className="absolute top-2 right-0 w-32 text-mulberry-400 rotate-12 scale-x-[-1]" />
      <p className="font-serif italic text-olive-500 text-sm tracking-widest uppercase mb-1">
        You're invited to celebrate
      </p>
      <h1 className="font-serif text-4xl text-olive-800 leading-tight">
        Jonathan <span className="text-mulberry-400">&amp;</span> Amanda
      </h1>
      <p className="font-sans text-olive-500 text-sm mt-2 tracking-widest uppercase">
        May 16, 2026
      </p>
      <div className="flex items-center justify-center gap-3 mt-3">
        <div className="h-px w-12 bg-olive-200" />
        <span className="text-raspberry-400 text-lg">✦</span>
        <div className="h-px w-12 bg-olive-200" />
      </div>
    </div>
  );
}

function NameInput({ name, onChange }) {
  return (
    <div className="mb-5">
      <label className="block font-sans text-xs text-olive-500 uppercase tracking-widest mb-1.5">
        Your name <span className="normal-case text-olive-400">(optional)</span>
      </label>
      <input
        type="text"
        value={name}
        onChange={e => onChange(e.target.value)}
        placeholder="e.g. Sarah & Tom"
        className="w-full bg-white/60 border border-olive-200 focus:border-olive-400 focus:outline-none
                   rounded-xl px-4 py-3 font-sans text-olive-900 placeholder:text-olive-300
                   transition-colors"
      />
    </div>
  );
}

function UploadZone({ onFiles, disabled }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(e => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length) onFiles(files);
  }, [onFiles]);

  return (
    <div
      className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer
        ${dragging ? 'border-olive-400 bg-olive-50' : 'border-olive-200 hover:border-olive-300 bg-white/40'}
        ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={e => {
          const files = Array.from(e.target.files || []);
          if (files.length) onFiles(files);
          e.target.value = '';
        }}
        disabled={disabled}
      />
      <div className="text-4xl mb-3">📷</div>
      <p className="font-serif text-olive-700 text-lg mb-1">Take or choose a photo</p>
      <p className="font-sans text-olive-400 text-sm">Tap to open your camera or gallery</p>
    </div>
  );
}

function ProgressBar({ value }) {
  return (
    <div className="w-full bg-olive-100 rounded-full h-1.5 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-olive-500 to-mulberry-400 transition-all duration-300 rounded-full"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function UploadItem({ item }) {
  const statusIcon = {
    pending:    '⏳',
    uploading:  '⬆️',
    done:       '✓',
    error:      '✗',
  }[item.status];

  return (
    <div className={`flex items-center gap-3 py-2 border-b border-olive-100 last:border-0`}>
      {item.preview && (
        <img
          src={item.preview}
          alt=""
          className="w-12 h-12 object-cover rounded-lg shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-sans text-sm text-olive-700 truncate">{item.file.name}</p>
        {item.status === 'uploading' && <ProgressBar value={item.progress} />}
        {item.status === 'error' && (
          <p className="font-sans text-xs text-raspberry-500 mt-0.5">{item.error}</p>
        )}
      </div>
      <span
        className={`text-sm font-medium shrink-0 ${
          item.status === 'done'  ? 'text-olive-500' :
          item.status === 'error' ? 'text-raspberry-500' :
          'text-olive-300'
        }`}
      >
        {statusIcon}
      </span>
    </div>
  );
}

export default function UploadPage() {
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) || '');
  const [queue, setQueue] = useState([]);
  const [uploading, setUploading] = useState(false);

  const saveName = (val) => {
    setName(val);
    if (val.trim()) {
      localStorage.setItem(NAME_KEY, val.trim());
    } else {
      localStorage.removeItem(NAME_KEY);
    }
  };

  const buildFileName = (file) => {
    const ext = file.name.split('.').pop() || 'jpg';
    const guest = (name.trim() || 'guest').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').slice(0, 30);
    const ts = Date.now();
    return `${guest}_${ts}.${ext}`;
  };

  const uploadFiles = async (files) => {
    if (uploading) return;

    const items = files.map(file => ({
      id: Math.random().toString(36).slice(2),
      file,
      preview: URL.createObjectURL(file),
      status: 'pending',
      progress: 0,
      error: null,
    }));

    setQueue(prev => [...prev, ...items]);
    setUploading(true);

    for (const item of items) {
      setQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: 'uploading', progress: 10 } : i));

      try {
        const renamedFile = new File([item.file], buildFileName(item.file), { type: item.file.type });

        await storage.createFile(BUCKET_ID, ID.unique(), renamedFile);

        setQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: 'done', progress: 100 } : i));
      } catch (err) {
        setQueue(prev => prev.map(i =>
          i.id === item.id ? { ...i, status: 'error', error: err.message || 'Upload failed' } : i
        ));
      }
    }

    setUploading(false);
  };

  const doneCount = queue.filter(i => i.status === 'done').length;
  const hasActivity = queue.length > 0;

  return (
    <div className="min-h-screen bg-garden-gradient">
      <div className="max-w-md mx-auto px-4 pb-16">
        <WeddingHeader />

        <div className="card mt-2">
          <NameInput name={name} onChange={saveName} />
          <UploadZone onFiles={uploadFiles} disabled={uploading} />

          {hasActivity && (
            <div className="mt-5">
              <p className="font-sans text-xs text-olive-400 uppercase tracking-widest mb-2">
                {doneCount} of {queue.length} uploaded
              </p>
              <div>
                {queue.map(item => <UploadItem key={item.id} item={item} />)}
              </div>
            </div>
          )}

          {doneCount > 0 && !uploading && (
            <div className="mt-5 text-center">
              <p className="font-serif italic text-olive-600 text-lg">
                Thank you for sharing your memories! 🌿
              </p>
              <button
                className="btn-ghost mt-3 text-sm"
                onClick={() => setQueue([])}
              >
                Upload more photos
              </button>
            </div>
          )}
        </div>

        <p className="text-center font-sans text-xs text-olive-300 mt-6">
          Photos are shared privately with Jonathan &amp; Amanda
        </p>
      </div>
    </div>
  );
}
