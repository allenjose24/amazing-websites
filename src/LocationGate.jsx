import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { MapPin, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';

// ── LocationGate ─────────────────────────────────────────────────────────────
// Mounted between login and Dashboard. On every mount (i.e. every visit,
// per spec — this is not skipped via localStorage or similar):
//
//   1. Fires the log-ip-visit edge function immediately, unconditionally.
//      This writes an 'ip_only' visits row server-side, regardless of what
//      happens with the browser permission prompt.
//   2. Prompts for browser geolocation. If granted, logs a 'granted' row
//      with real coordinates and lets the user through. If denied, shows
//      a blocking "permission required" screen with a retry CTA.
//
// The actual access control is enforced by RLS (has_recent_granted_location
// in migration-2-location.sql) — this component is the UX layer that makes
// the gate visible and explains why nothing loads otherwise.
const BROWSER_INSTRUCTIONS = [
  {
    id: 'chrome',
    name: 'Google Chrome',
    steps: [
      'Click the site settings/lock icon in the URL bar (to the left of the address).',
      'Toggle the "Location" switch to "Allow", or click "Site settings" and set Location to "Allow".',
      'Refresh the page to apply your settings.'
    ]
  },
  {
    id: 'safari',
    name: 'Apple Safari',
    steps: [
      'Open website preferences: Safari > Settings for this website...',
      'In the dropdown next to "Location", choose "Allow".',
      'On iOS/iPadOS, go to Settings > Privacy & Security > Location Services > Safari Websites, and choose "While Using the App".'
    ]
  },
  {
    id: 'firefox',
    name: 'Mozilla Firefox',
    steps: [
      'Click the permissions/lock icon on the left of the URL bar.',
      'Under Permissions, click the "X" next to "Blocked Temporarily" to clear it.',
      'Refresh the page and select "Allow" when prompted again.'
    ]
  }
];

export default function LocationGate({ session, children }) {
  const [status, setStatus] = useState('checking'); // checking | granted | denied | error
  const [expandedBrowser, setExpandedBrowser] = useState(null);

  const toggleBrowser = (id) => {
    setExpandedBrowser((prev) => (prev === id ? null : id));
  };

  useEffect(() => {
    logIpVisit(); // fire-and-forget, always runs
    requestBrowserLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logIpVisit() {
    try {
      const { error } = await supabase.functions.invoke('log-ip-visit');
      if (error) console.error('IP visit log failed:', error);
    } catch (err) {
      console.error('IP visit log failed:', err);
    }
  }

  function requestBrowserLocation() {
    if (!navigator.geolocation) {
      setStatus('error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await recordGrantedLocation(latitude, longitude);
        setStatus('granted');
      },
      async (err) => {
        console.warn('Geolocation denied/failed:', err);
        await recordDeniedLocation();
        setStatus('denied');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
    );
  }

  async function recordGrantedLocation(latitude, longitude) {
    const meta = session.user.user_metadata || {};
    const { error } = await supabase.from('visits').insert([{
      user_id: session.user.id,
      visitor_email: session.user.email,
      first_name: meta.given_name || meta.full_name?.split(' ')[0] || 'anonymous',
      last_name: meta.family_name || '',
      latitude,
      longitude,
      status: 'granted',
    }]);
    if (error) console.error('Failed to record granted location:', error);
  }

  async function recordDeniedLocation() {
    const meta = session.user.user_metadata || {};
    const { error } = await supabase.from('visits').insert([{
      user_id: session.user.id,
      visitor_email: session.user.email,
      first_name: meta.given_name || meta.full_name?.split(' ')[0] || 'anonymous',
      last_name: meta.family_name || '',
      status: 'denied',
    }]);
    if (error) console.error('Failed to record denied location:', error);
  }

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <p className="font-mono text-sm text-ink/40">Checking location permission…</p>
      </div>
    );
  }

  if (status === 'granted') {
    return children;
  }

  // denied or error — blocking screen
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6 py-12">
      <div className="max-w-[440px] text-center flex flex-col items-center gap-[var(--s-3)] w-full">
        <div className="h-14 w-14 rounded-full bg-burgundy/10 flex items-center justify-center mb-2">
          <ShieldAlert size={26} className="text-burgundy" />
        </div>
        <h1 className="font-display font-medium text-[26px] text-ink/85 leading-[1.2]">
          Location permission required
        </h1>
        <p className="font-body text-[15px] text-ink/60 leading-[1.6]">
          For security purposes, this page needs your location to continue.
          Please allow location access in your browser to enter the vault.
        </p>
        <button
          onClick={() => { setStatus('checking'); requestBrowserLocation(); }}
          className="mt-2 inline-flex items-center gap-2 rounded-full bg-ink text-paper px-6 py-3 font-body text-sm font-medium transition-transform hover:scale-[1.03] cursor-pointer"
        >
          <MapPin size={15} />
          Allow location access
        </button>

        {/* Browser instructions accordion */}
        <div className="mt-8 pt-6 border-t border-ink/10 w-full text-left">
          <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-ink/40 mb-4 text-center sm:text-left">
            How to enable location permissions
          </p>
          <div className="flex flex-col gap-2.5">
            {BROWSER_INSTRUCTIONS.map((browser) => {
              const isExpanded = expandedBrowser === browser.id;
              return (
                <div
                  key={browser.id}
                  className="border border-ink/10 rounded-xl overflow-hidden bg-white/40 backdrop-blur-sm transition-all"
                >
                  <button
                    type="button"
                    onClick={() => toggleBrowser(browser.id)}
                    className="w-full flex items-center justify-between px-4 py-3 text-ink/75 font-mono text-[12px] uppercase tracking-wider hover:text-ink hover:bg-ink/5 transition-colors cursor-pointer"
                  >
                    <span>{browser.name}</span>
                    {isExpanded ? <ChevronUp size={14} className="text-ink/50" /> : <ChevronDown size={14} className="text-ink/50" />}
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-ink/5 bg-white/10">
                      <ol className="list-decimal pl-4 flex flex-col gap-2 font-body text-xs text-ink/65 leading-relaxed">
                        {browser.steps.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}