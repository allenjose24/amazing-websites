import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

// --- Cryptography Helper ---
// This hashes the incoming email to compare against your secret hash
async function hashEmail(email) {
  const msgUint8 = new TextEncoder().encode(email.toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function App() {
  const [session, setSession] = useState(null);
  const [isAccessDenied, setIsAccessDenied] = useState(false);

  useEffect(() => {
    // 1. Check current session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      verifyUser(session);
    });

    // 2. Listen for login/logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      verifyUser(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- THE VAULT DOOR LOGIC ---
  const verifyUser = async (currentSession) => {
    if (!currentSession) {
      setSession(null);
      return;
    }

    const userEmail = currentSession.user.email;
    const generatedHash = await hashEmail(userEmail);
    const allowedHash = import.meta.env.VITE_ALLOWED_EMAIL_HASH;

    if (generatedHash === allowedHash) {
      // Access Granted
      setSession(currentSession);
      setIsAccessDenied(false);
    } else {
      // Intruder Detected: The Trap Springs
      console.warn("Unauthorized identity detected. Purging session.");
      await supabase.auth.signOut();
      setSession(null);
      setIsAccessDenied(true);
      // NOTE: This is where we will eventually fire the DB Insert for the Honeypot!
    }
  };

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
  };

  // --- RENDER UI ---
  if (isAccessDenied) {
    return (
      <div style={{ padding: '50px', textAlign: 'center', backgroundColor: 'black', color: 'red', height: '100vh' }}>
        <h1>ACCESS DENIED</h1>
        <p>Your identity could not be verified.</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <h1>Amazing Websites Vault</h1>
        <button onClick={handleLogin} style={{ padding: '10px 20px', cursor: 'pointer' }}>
          Verify Identity (Google)
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '50px' }}>
      <h1>Welcome back.</h1>
      <p>Identity verified. The WebAuthn and Location traps will go here next.</p>
      <button onClick={() => supabase.auth.signOut()}>Lock Vault</button>
    </div>
  );
}