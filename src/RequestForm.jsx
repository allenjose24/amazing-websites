import { useState, useRef, useEffect } from 'react';
import { supabase } from './supabaseClient';

// ── Animated submission scene ─────────────────────────────────────────────────
function SubmitScene({ phase }) {
  // phase: 'idle' | 'sending' | 'success' | 'error'
  if (phase === 'idle') return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '16px',
        background: 'rgba(245,245,241,0.96)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        gap: '24px',
      }}
    >
      <style>{`
        @keyframes envelope-lift {
          0%   { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
          30%  { transform: translateY(-12px) scale(1.04) rotate(-2deg); opacity: 1; }
          70%  { transform: translateY(-70px) scale(0.82) rotate(2deg); opacity: 0.9; }
          100% { transform: translateY(-110px) scale(0.5) rotate(-1deg); opacity: 0; }
        }
        @keyframes cloud-pulse {
          0%,100% { transform: scale(1); }
          50%      { transform: scale(1.06); }
        }
        @keyframes ray-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes tick-pop {
          0%   { transform: scale(0) rotate(-20deg); opacity: 0; }
          60%  { transform: scale(1.18) rotate(6deg); opacity: 1; }
          80%  { transform: scale(0.93) rotate(-2deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes success-label {
          0%   { opacity: 0; transform: translateY(6px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes dot-trail {
          0%   { opacity: 0; transform: translateY(0); }
          20%  { opacity: 1; }
          80%  { opacity: 0.6; }
          100% { opacity: 0; transform: translateY(-90px); }
        }
        .envelope-anim { animation: envelope-lift 2.4s cubic-bezier(0.4,0,0.2,1) 0.15s both; }
        .cloud-anim    { animation: cloud-pulse 1.4s ease-in-out 1.3s 3; }
        .tick-anim     { animation: tick-pop 0.55s cubic-bezier(0.34,1.56,0.64,1) 1.25s both; }
        .success-anim  { animation: success-label 0.4s ease 1.8s both; }
        .dot1 { animation: dot-trail 2.2s ease 0.3s both; }
        .dot2 { animation: dot-trail 2.2s ease 0.5s both; }
        .dot3 { animation: dot-trail 2.2s ease 0.7s both; }
      `}</style>

      {/* Envelope + trail dots + cloud scene */}
      <div style={{ position: 'relative', width: 160, height: 180, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>

        {/* Cloud (top) */}
        <div
          className={phase === 'success' ? '' : 'cloud-anim'}
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <CloudIcon success={phase === 'success'} />
        </div>

        {/* Dot trail */}
        {phase === 'sending' && (
          <>
            <div className="dot1" style={{ position: 'absolute', bottom: 72, left: '50%', width: 5, height: 5, borderRadius: '50%', background: '#b68a35', marginLeft: -2.5 }} />
            <div className="dot2" style={{ position: 'absolute', bottom: 72, left: '50%', width: 4, height: 4, borderRadius: '50%', background: '#b68a35', marginLeft: -2, opacity: 0 }} />
            <div className="dot3" style={{ position: 'absolute', bottom: 72, left: '50%', width: 3, height: 3, borderRadius: '50%', background: '#b68a35', marginLeft: -1.5, opacity: 0 }} />
          </>
        )}

        {/* Envelope */}
        {phase === 'sending' && (
          <div className="envelope-anim" style={{ position: 'absolute', bottom: 0 }}>
            <EnvelopeIcon />
          </div>
        )}
      </div>

      {/* Label */}
      {phase === 'sending' && (
        <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 12, color: 'rgba(18,21,28,0.65)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Sending request…
        </div>
      )}
      {phase === 'success' && (
        <div className="success-anim" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <p style={{ fontFamily: 'var(--font-display, serif)', fontSize: 20, color: 'rgba(18,21,28,0.95)', margin: 0, fontWeight: 500 }}>
            Request sent.
          </p>
          <p style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, color: 'rgba(18,21,28,0.6)', margin: 0, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Waiting on review
          </p>
        </div>
      )}
      {phase === 'error' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <p style={{ fontFamily: 'var(--font-display, serif)', fontSize: 18, color: '#8b2635', margin: 0, fontWeight: 500 }}>
            Something went wrong.
          </p>
          <p style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, color: 'rgba(18,21,28,0.6)', margin: 0, letterSpacing: '0.1em' }}>
            Check console for details
          </p>
        </div>
      )}
    </div>
  );
}

function EnvelopeIcon() {
  return (
    <svg width="72" height="52" viewBox="0 0 72 52" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="1" y="1" width="70" height="50" rx="6" fill="#f5f5f1" stroke="#12151c" strokeWidth="1.5"/>
      <path d="M2 4L36 32L70 4" stroke="#12151c" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
      <path d="M2 48L24 28" stroke="#12151c" strokeWidth="1" strokeOpacity="0.4" fill="none"/>
      <path d="M70 48L48 28" stroke="#12151c" strokeWidth="1" strokeOpacity="0.4" fill="none"/>
      {/* stamp */}
      <rect x="52" y="8" width="13" height="11" rx="1.5" fill="#b68a35" opacity="0.7"/>
    </svg>
  );
}

function CloudIcon({ success }) {
  return (
    <svg width="118" height="80" viewBox="0 0 118 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* small cloud (back left) */}
      <path
        d="M30 30H12a9 9 0 01-2-17.8A11 11 0 0129 16.4 8 8 0 0130 30z"
        fill={success ? '#e8f5e0' : '#f0ede8'}
        stroke={success ? '#639922' : '#12151c'}
        strokeWidth="1.2"
        strokeLinejoin="round"
        opacity="0.85"
      />
      {/* small cloud (back right) */}
      <path
        d="M108 26H92a8 8 0 01-2-15.8A10 10 0 01107 13.5 7 7 0 01108 26z"
        fill={success ? '#e8f5e0' : '#f0ede8'}
        stroke={success ? '#639922' : '#12151c'}
        strokeWidth="1.2"
        strokeLinejoin="round"
        opacity="0.85"
      />
      {/* main cloud (front, larger) */}
      <path
        d="M90 64H29a21.3 21.3 0 01-5.3-41.9A26.7 26.7 0 0175.5 37.3 18.7 18.7 0 0190 64z"
        fill={success ? '#e8f5e0' : '#f0ede8'}
        stroke={success ? '#639922' : '#12151c'}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* success tick inside main cloud */}
      {success && (
        <g className="tick-anim" style={{ transformOrigin: '59px 48px' }}>
          <circle cx="59" cy="48" r="13.3" fill="#639922"/>
          <path d="M52.7 48.7L57.3 53.3L67.3 42.7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </g>
      )}
    </svg>
  );
}

// ── Field component ────────────────────────────────────────────────────────────
function Field({ label, tag = 'input', hint, ...props }) {
  const El = tag;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(18,21,28,0.65)' }}>
        {label}
        {props.required && <span style={{ color: '#b68a35', marginLeft: 3 }}>*</span>}
      </label>
      <El
        {...props}
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.85)',
          border: '1px solid rgba(18,21,28,0.22)',
          borderRadius: 10,
          padding: tag === 'textarea' ? '10px 14px' : '0 14px',
          height: tag === 'textarea' ? 88 : 42,
          fontFamily: 'var(--font-body, sans-serif)',
          fontSize: 14,
          color: 'rgba(18,21,28,0.95)',
          outline: 'none',
          transition: 'border-color 0.18s, box-shadow 0.18s',
          resize: 'none',
          boxSizing: 'border-box',
          ...(props.style || {}),
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#b68a35';
          e.target.style.boxShadow = '0 0 0 3px rgba(182,138,53,0.12)';
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'rgba(18,21,28,0.22)';
          e.target.style.boxShadow = 'none';
          props.onBlur?.(e);
        }}
      />
      {hint && <p style={{ margin: 0, fontFamily: 'var(--font-mono, monospace)', fontSize: 10, color: 'rgba(18,21,28,0.55)', letterSpacing: '0.06em' }}>{hint}</p>}
    </div>
  );
}

// ── Main RequestForm ────────────────────────────────────────────────────────────
// Any logged-in user can submit a resource here. It does NOT write to
// `resources` directly anymore — it writes to `requests`, which an admin
// reviews in ReviewPanel before it shows up in the vault.
const EMPTY = { title: '', url: '', category: '', description: '', preview_image: '' };
const DEFAULT_CATEGORIES = ['UI / UX Design', 'Animations', 'AI Tools', 'Fonts', 'Code & Repos'];

export default function RequestForm({ userId, userName, refreshTrigger }) {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [form, setForm] = useState(EMPTY);
  const [phase, setPhase] = useState('idle'); // idle | sending | success | error
  const wrapRef = useRef(null);

  useEffect(() => {
    async function fetchLiveCategories() {
      try {
        const { data, error } = await supabase
          .from('resources')
          .select('category');
        
        if (error) {
          console.error('Error fetching live categories:', error);
          return;
        }

        if (data) {
          const uniqueDb = Array.from(
            new Set(
              data
                .map((item) => item.category?.trim())
                .filter((c) => c && c !== '')
            )
          );

          // Find database categories that aren't already in DEFAULT_CATEGORIES
          const newCategories = uniqueDb.filter(
            (c) => !DEFAULT_CATEGORIES.some((d) => d.toLowerCase() === c.toLowerCase())
          );

          // Sort new categories alphabetically
          newCategories.sort((a, b) => a.localeCompare(b));

          // Set categories (defaults first, then sorted custom ones)
          setCategories([...DEFAULT_CATEGORIES, ...newCategories]);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    fetchLiveCategories();
  }, [refreshTrigger]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPhase('sending');

    const category = form.category === '__custom__' ? form._customCategory : form.category;

    // slight delay so the animation plays before the network call resolves
    await new Promise((r) => setTimeout(r, 2100));

    const { error } = await supabase.from('requests').insert([{
      user_id: userId,
      user_name: userName,
      title: form.title,
      url: form.url,
      category,
      description: form.description,
      preview_image: form.preview_image || null,
    }]);

    if (error) {
      console.error(error);
      setPhase('error');
      setTimeout(() => setPhase('idle'), 2800);
    } else {
      setPhase('success');
      setTimeout(() => {
        setPhase('idle');
        setForm(EMPTY);
      }, 2600);
    }
  };

  return (
    <div
      ref={wrapRef}
      style={{
        position: 'relative',
        marginTop: 8,
        borderRadius: 16,
        border: '1px solid rgba(18,21,28,0.1)',
        background: 'rgba(255,255,255,0.45)',
        backdropFilter: 'blur(8px)',
        overflow: 'hidden',
      }}
    >
      {/* overlay animation */}
      <SubmitScene phase={phase} />

      {/* header */}
      <div
        className="px-5 pt-6 pb-5 sm:px-8 sm:pt-7 sm:pb-5"
        style={{
          borderBottom: '1px solid rgba(18,21,28,0.07)',
          marginBottom: 28,
        }}
      >
        <p style={{ margin: 0, fontFamily: 'var(--font-mono, monospace)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(18,21,28,0.6)', marginBottom: 6 }}>
          Vault / Contribute
        </p>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-display, serif)', fontWeight: 500, fontSize: 26, color: 'rgba(18,21,28,0.95)', lineHeight: 1.15 }}>
          Contribute a resource
        </h2>
      </div>

      {/* form */}
      <form
        onSubmit={handleSubmit}
        className="px-5 pb-6 sm:px-8 sm:pb-8"
        style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
      >

        {/* row: title + category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Title"
            required
            placeholder="e.g. Framer Motion Docs"
            value={form.title}
            onChange={set('title')}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(18,21,28,0.65)' }}>
              Category <span style={{ color: '#b68a35' }}>*</span>
            </label>
            <select
              required
              value={form.category}
              onChange={set('category')}
              style={{
                width: '100%',
                height: 42,
                background: 'rgba(255,255,255,0.85)',
                border: '1px solid rgba(18,21,28,0.22)',
                borderRadius: 10,
                padding: '0 14px',
                fontFamily: 'var(--font-body, sans-serif)',
                fontSize: 14,
                color: form.category ? 'rgba(18,21,28,0.95)' : 'rgba(18,21,28,0.55)',
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 7L11 1' stroke='%2312151c' stroke-opacity='0.55' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 14px center',
                paddingRight: 36,
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.target.style.borderColor = '#b68a35'; e.target.style.boxShadow = '0 0 0 3px rgba(182,138,53,0.12)'; }}
              onBlur={(e)  => { e.target.style.borderColor = 'rgba(18,21,28,0.22)'; e.target.style.boxShadow = 'none'; }}
            >
              <option value="" disabled>Select category…</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              <option value="__custom__">Other…</option>
            </select>
          </div>
        </div>

        {/* custom category field */}
        {form.category === '__custom__' && (
          <Field
            label="Custom category"
            required
            placeholder="e.g. Motion Design"
            value={form._customCategory || ''}
            onChange={(e) => setForm((f) => ({ ...f, _customCategory: e.target.value }))}
          />
        )}

        {/* url */}
        <Field
          label="URL"
          required
          type="url"
          placeholder="https://"
          value={form.url}
          onChange={set('url')}
          hint="Must include https://"
        />

        {/* preview image */}
        <Field
          label="Preview image"
          type="url"
          placeholder="https://… (.webp or .webm)"
          value={form.preview_image}
          onChange={set('preview_image')}
          hint="Optional — used in card thumbnails"
        />

        {/* description */}
        <Field
          label="Description"
          tag="textarea"
          placeholder="One or two lines about why this is worth keeping…"
          value={form.description}
          onChange={set('description')}
        />

        {/* submit */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, paddingTop: 4 }}>
          <button
            type="button"
            onClick={() => setForm(EMPTY)}
            style={{
              background: 'transparent',
              border: '1px solid rgba(18,21,28,0.22)',
              borderRadius: 99,
              padding: '10px 20px',
              fontFamily: 'var(--font-body, sans-serif)',
              fontSize: 13,
              color: 'rgba(18,21,28,0.6)',
              cursor: 'pointer',
              transition: 'border-color 0.18s, color 0.18s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(18,21,28,0.45)'; e.currentTarget.style.color = 'rgba(18,21,28,0.9)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(18,21,28,0.22)'; e.currentTarget.style.color = 'rgba(18,21,28,0.6)'; }}
          >
            Clear
          </button>
          <button
            type="submit"
            disabled={phase !== 'idle'}
            style={{
              background: '#12151c',
              border: 'none',
              borderRadius: 99,
              padding: '10px 24px',
              fontFamily: 'var(--font-body, sans-serif)',
              fontSize: 13,
              fontWeight: 500,
              color: '#f5f5f1',
              cursor: phase !== 'idle' ? 'not-allowed' : 'pointer',
              opacity: phase !== 'idle' ? 0.5 : 1,
              transition: 'transform 0.15s, opacity 0.18s',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
            onMouseEnter={(e) => { if (phase === 'idle') e.currentTarget.style.transform = 'scale(1.03)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M1.5 1.5L12.5 7L1.5 12.5V8L9 7L1.5 6V1.5Z" fill="#f5f5f1" stroke="#f5f5f1" strokeWidth="0.5" strokeLinejoin="round"/>
            </svg>
            Send request
          </button>
        </div>
      </form>
    </div>
  );
}