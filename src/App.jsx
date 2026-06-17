import { useState } from 'react';
import Dashboard from './Dashboard';
import LandingPage from './LandingPage';

export default function App() {
  const [session, setSession] = useState(null);

  // === DEVELOPMENT BYPASS ===
  // Instead of triggering Google Auth, we immediately inject a mock session.
  // This prevents Dashboard.jsx from crashing when it asks for user.email.
  const handleDevelopmentLogin = () => {
    console.log("DEV MODE: Bypassing security sequence...");
    const mockSession = {
      user: {
        email: "allenjose2110@gmail.com", // Your admin email to allow AdminPanel access
        user_metadata: { full_name: "Allen (Dev Mode)" }
      }
    };
    setSession(mockSession);
  };

  // If we have a session, show the Vault. Otherwise, show the Landing Page.
  return session ? (
    <Dashboard userEmail={session.user.email} /> 
  ) : (
    <LandingPage onLogin={handleDevelopmentLogin} />
  );
}