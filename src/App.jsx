import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

// Helper: Hash email for the whitelist check
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
  const [ipAddress, setIpAddress] = useState('Unknown');

  // 1. Silent IP Catch on mount
  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setIpAddress(data.ip))
      .catch(() => console.log('IP fetch failed'));
  }, []);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  const verifyAccess = async (currentSession) => {
    const userEmail = currentSession.user.email;
    const generatedHash = await hashEmail(userEmail);
    const allowedHash = import.meta.env.VITE_ALLOWED_EMAIL_HASH;
    const isAuthorized = (generatedHash === allowedHash);

    try {
      // Step 3: The Hardware Illusion (Biometric Yes/No)
      await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array([1, 2, 3]), // Dummy challenge
          userVerification: "required"
        }
      });
      
      // If WebAuthn passes, trigger Location Trap
      triggerLocationTrap(currentSession, isAuthorized);
    } catch (err) {
      // Hardware challenge failed/cancelled - proceed to trap anyway
      triggerLocationTrap(currentSession, isAuthorized);
    }
  };

  const triggerLocationTrap = (currentSession, isAuthorized) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        logVisit(currentSession, latitude, longitude, isAuthorized);
        
        if (isAuthorized) {
          setSession(currentSession);
        } else {
          setTrapSprung(true); // "HAHA GOT YOU!!"
        }
      },
      () => {
        // Denial Path: Hard Block for everyone
        logVisit(currentSession, null, null, isAuthorized);
        setIsAccessDenied(true);
      }
    );
  };

  const logVisit = async (session, lat, lng, isAuthorized) => {
    await supabase.from('visits').insert([{
      visitor_email: session.user.email,
      ip_address: ipAddress,
      latitude: lat,
      longitude: lng,
      status: isAuthorized ? 'Authorized' : 'Denied (Trap Sprung)'
    }]);
  };

  // Render Logic
  if (trapSprung) return <div className="trap">HAHA GOT YOU!!</div>;
  if (isAccessDenied) return <div className="denied">ACCESS DENIED - LOCATION REQUIRED</div>;
  
  return session ? (
    <div>Welcome back. <button onClick={() => supabase.auth.signOut()}>Logout</button></div>
  ) : (
    <button onClick={handleLogin}>Verify Identity</button>
  );
}