import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import Dashboard from './Dashboard';
import LandingPage from './LandingPage';
import LocationGate from './LocationGate';

// Splits a Google "full_name" into first/last as best we can.
// Google's metadata sometimes gives given_name/family_name directly —
// prefer those when present, fall back to splitting full_name otherwise.
function splitName(user) {
  const meta = user.user_metadata || {};
  if (meta.given_name || meta.family_name) {
    return { firstName: meta.given_name || '', lastName: meta.family_name || '' };
  }
  const full = (meta.full_name || meta.name || '').trim();
  if (!full) return { firstName: '', lastName: '' };
  const parts = full.split(/\s+/);
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

// Upserts the logged-in user's profile row and bumps last_login.
// Runs every time a session is detected (login or token refresh on reload).
async function syncUserProfile(user) {
  const { firstName, lastName } = splitName(user);

  const { error } = await supabase.from('users').upsert(
    {
      id: user.id,
      first_name: firstName,
      last_name: lastName,
      email: user.email,
      last_login: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (error) console.error('Failed to sync user profile:', error);
}

export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Pick up an existing session on first load (e.g. page refresh).
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
      if (session?.user) syncUserProfile(session.user);
    });

    // Listen for sign-in / sign-out / token refresh events.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) syncUserProfile(session.user);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) console.error('Google sign-in failed:', error);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <p className="font-mono text-sm text-ink/40">Loading…</p>
      </div>
    );
  }

  if (!session) {
    return <LandingPage onLogin={handleLogin} />;
  }

  // LocationGate blocks rendering Dashboard until the browser geolocation
  // permission is granted (re-checked on every mount, i.e. every visit).
  // It also unconditionally logs IP-based location via an edge function,
  // regardless of the permission outcome.
  return (
    <LocationGate session={session}>
      <Dashboard userEmail={session.user.email} userId={session.user.id} />
    </LocationGate>
  );
}