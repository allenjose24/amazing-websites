# Frontend Structure & State Management 💻

This document outlines the React 19 architecture, component lifecycles, and authentication flow for the frontend of **Amazing Websites (The Vault)**.

---

## 💻 Technical Stack Overview

* **Framework**: React 19 (managed via Vite)
* **Smooth Scrolling**: Lenis (`lenis/react`)
* **Icons**: Lucide React
* **State Management**: React state hooks (`useState`, `useRef`, `useMemo`, and `useEffect`) combined with the Supabase Auth listener.

---

## 🚀 Entry Points & App Bootstrapping

### 1. Root Renderer
The entry point [src/main.jsx](file:///d:/antigravity/amazing-websites/src/main.jsx) mounts the parent shell component [src/App.jsx](file:///d:/antigravity/amazing-websites/src/App.jsx) inside the React DOM tree.

```javascript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

---

### 2. Main Shell & Session Management
[src/App.jsx](file:///d:/antigravity/amazing-websites/src/App.jsx) manages the application's root state, including user authentication, session persistence, and profile synchronization.

```javascript
export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch current session status on application mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
      if (session?.user) syncUserProfile(session.user);
    });

    // 2. Listen for sign-in, sign-out, or token refresh events
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) syncUserProfile(session.user);
    });

    return () => listener.subscription.unsubscribe();
  }, []);
  // ...
}
```

* **Session Validation**: The client checks for an active session using `supabase.auth.getSession()` on load, then registers an event listener via `supabase.auth.onAuthStateChange()` to handle logins, logouts, or token refreshes.
* **Loading State**: The application displays a monospace loader (`Loading...`) while the session is being resolved.
* **Redirects**: If no active session is found, the application renders the `LandingPage` component. If a session is valid, it renders the `LocationGate` layout before loading the `Dashboard`.

---

## 🔄 User Profile Synchronization

When a user logs in, the application runs the `syncUserProfile` profile sync helper. This parses metadata from the OAuth provider and saves the user's details to the `users` table:

```javascript
function splitName(user) {
  const meta = user.user_metadata || {};
  
  // Prefer explicit first and last name fields from Google metadata
  if (meta.given_name || meta.family_name) {
    return { firstName: meta.given_name || '', lastName: meta.family_name || '' };
  }
  
  // Fall back to splitting full_name by whitespace
  const full = (meta.full_name || meta.name || '').trim();
  if (!full) return { firstName: '', lastName: '' };
  const parts = full.split(/\s+/);
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

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
```

---

## 📍 The Location Gate Lifecycle

The [src/LocationGate.jsx](file:///d:/antigravity/amazing-websites/src/LocationGate.jsx) component is a layout wrapper that blocks access to the dashboard until the user's location is verified.

### 1. Initialization and Auditing
The component starts the location check as soon as it mounts:

```javascript
export default function LocationGate({ session, children }) {
  const [status, setStatus] = useState('checking'); // checking | granted | denied | error

  useEffect(() => {
    logIpVisit();             // 1. Unconditional IP audit
    requestBrowserLocation(); // 2. Geolocation request
  }, []);
  // ...
}
```

* **`logIpVisit()`**: Invokes the Deno Edge Function (`log-ip-visit`) to resolve the client's connecting IP address and log it in the database.
* **`requestBrowserLocation()`**: Requests the browser's current GPS coordinates using the standard geolocation API.

### 2. Processing Geolocation Responses
The component handles browser responses using the `navigator.geolocation` API:

```javascript
function requestBrowserLocation() {
  if (!navigator.geolocation) {
    setStatus('error');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      await recordGrantedLocation(latitude, longitude);
      setStatus('granted'); // Grant access to the application
    },
    async (err) => {
      console.warn('Geolocation denied/failed:', err);
      await recordDeniedLocation();
      setStatus('denied');  // Render the gate-blocked UI screen
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
  );
}
```
* **Success Callback**: Resolves coordinates, inserts a `granted` status log in the `visits` table, updates component state to `granted`, and renders the dashboard.
* **Error Callback**: Logs a `denied` entry in the database, updates status to `denied`, and displays the block screen.

---

## 🎛️ Dashboard State & Navigation Routing

The [src/Dashboard.jsx](file:///d:/antigravity/amazing-websites/src/Dashboard.jsx) component manages the core workspace interface. It uses state hooks to handle routing, view modes, and page layouts:

* **View Modes (`mode` state)**:
  * `"index"`: Displays the curated category index.
  * `"suggest"`: Loads the [src/RequestForm.jsx](file:///d:/antigravity/amazing-websites/src/RequestForm.jsx) contribution form.
  * `"review"`: Loads the [src/ReviewPanel.jsx](file:///d:/antigravity/amazing-websites/src/ReviewPanel.jsx) queue (visible to admins only).
* **Scroll Tracking (`scrolled` state)**:
  Listens to scroll events to toggle the visibility of the glassy navigation bar:
  ```javascript
  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 24);
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  ```
  * `scrolled === false`: Displays the standard navigation header.
  * `scrolled === true`: Closes mobile menus and displays a floating navigation pill in the corner of the screen.
* **Data Reloading (`refreshTrigger` state)**:
  An integer state incremented by the user to refresh dashboard lists or form fields.

---

## 📜 Smooth Scroll Integration (Lenis)

To ensure smooth transitions and scroll animations, the application wraps authenticated components in a root Lenis container:

```javascript
import ReactLenis from "lenis/react";

return (
  <ReactLenis root>
    <LocationGate session={session}>
      <Dashboard userEmail={session.user.email} userId={session.user.id} />
    </LocationGate>
  </ReactLenis>
);
```

Lenis smooths mouse and touch wheel scrolling, enabling custom layouts (such as the sticky code cards) to perform calculations based on accurate scroll positions.
