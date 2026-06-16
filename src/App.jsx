import { useEffect, useState } from 'react';
import Dashboard from './Dashboard';
import { supabase } from './supabaseClient';

async function hashEmail(email) {
  const msgUint8 = new TextEncoder().encode(email.toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function App() {
  const [session, setSession] = useState(null);
  const [isAccessDenied, setIsAccessDenied] = useState(false);
  const [trapSprung, setTrapSprung] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setLoading(true);
        runSecuritySequence(session);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({ 
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  };

  const runSecuritySequence = async (currentSession) => {
    console.log("DEBUG: Running security sequence...");

    let ipData = { ip: '0.0.0.0', city: 'Unknown', country_name: 'Unknown' };
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      if (!data.error) {
        ipData = { ip: data.ip || '0.0.0.0', city: data.city || 'Unknown', country_name: data.country_name || 'Unknown' };
      }
    } catch (e) {
      console.warn("IP lookup failed", e);
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const isAuthorized = await checkEmailHash(currentSession.user.email);
        await logVisit(currentSession, pos.coords.latitude, pos.coords.longitude, ipData, isAuthorized);
        
        if (isAuthorized) {
          setSession(currentSession);
          setLoading(false);
        } else {
          setTrapSprung(true);
          setLoading(false);
        }
      },
      async (err) => {
        await logVisit(currentSession, null, null, ipData, false);
        setIsAccessDenied(true);
        setLoading(false);
      }
    );
  };

  const checkEmailHash = async (email) => {
    const generatedHash = await hashEmail(email);
    return generatedHash === import.meta.env.VITE_ALLOWED_EMAIL_HASH;
  };

  const logVisit = async (session, lat, lng, ipData, isAuthorized) => {
    const metadata = session.user?.user_metadata || {};
    const fullName = metadata.full_name || metadata.name || "anonymous anonymous";
    const nameParts = fullName.split(' ');
    
    const payload = {
      visitor_email: session.user.email,
      first_name: nameParts[0] || "anonymous",
      last_name: nameParts.length > 1 ? nameParts.slice(1).join(' ') : "anonymous",
      ip_address: ipData.ip,
      location: `${ipData.city}, ${ipData.country_name}`,
      latitude: lat,
      longitude: lng,
      status: isAuthorized ? 'Authorized' : 'Denied (Trap Sprung)'
    };

    const { error } = await supabase.from('visits').insert([payload]);
    if (error) console.error("CRITICAL: Insert failed!", error);
    else console.log("SUCCESS: Database Insert Success!");
  };

  if (loading) return <div>Performing security sequence...</div>;
  if (trapSprung) return <div className="trap"><h1>HAHA GOT YOU!!</h1></div>;
  if (isAccessDenied) return (
    <div>
      <h1>ACCESS DENIED</h1>
      <button onClick={() => window.location.reload()}>Grant Permission to View</button>
    </div>
  );
  
  // Single, unified return logic
  return session ? (
    <Dashboard /> 
  ) : (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>Vault Access</h1>
      <button onClick={handleLogin}>Verify Identity</button>
    </div>
  );
}