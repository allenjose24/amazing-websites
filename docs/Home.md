# Welcome to the Amazing Websites (The Vault) Wiki 🏛️

Welcome to the official, exhaustive technical documentation repository for **Amazing Websites (The Vault)**. This project is a highly-curated visual database of design inspiration, animation references, font showcases, and coding repositories. 

It is designed with premium aesthetics, fluid micro-interactions, robust security (featuring location verification and strict PostgreSQL Row Level Security), and a transactional suggest-and-approve contribution pipeline.
 
This wiki is structured to cover every single line of code, architectural design, database design, and deployment steps in detail.

---

## 📖 Wiki Table of Contents

Navigate through the sections below to understand the inner workings of the platform:

| Wiki Page | Document Description | Core Technologies Highlighted |
| :--- | :--- | :--- |
| **[1. Architecture & Flows](./Architecture-&-Flows.md)** | End-to-end user flows, login cycles, location gate checks, request submission sequences, and system interaction diagrams. | React 19, Google OAuth, Deno Deploy, Supabase DB |
| **[2. Database Schema & RLS](./Database-Schema-&-RLS.md)** | Exhaustive documentation of all PostgreSQL tables (`users`, `visits`, `requests`, `resources`), check constraints, RLS triggers, security helper functions, and RPCs. | PostgreSQL, SQL Schema, Row-Level Security, RPC |
| **[3. Edge Functions](./Edge-Functions.md)** | Deep dive into Deno Deploy edge computing. Details server-side client IP resolution, integration with geolocation services, and request auditing. | Deno, TypeScript, ipapi.co, CORS Headers |
| **[4. Frontend Structure & State](./Frontend-Structure-&-State.md)** | Full breakdown of the React SPA entry points, lifecycle methods, authentication listeners, user profile syncer, and Lenis root scroll configuration. | React 19, Vite, Lenis Smooth Scroll |
| **[5. Interactive UI Components](./Interactive-UI-Components.md)** | Behind-the-scenes math and implementation details of advanced visual assets: gooey morph filters, responsive 3D card stacks, terminals, parallax sliders, and CSS submit scenes. | Framer Motion, SVGs, CSS variables, CSS Canvas filters |
| **[6. GitHub Wiki Hosting Guide](./GitHub-Wiki-Hosting-Guide.md)** | Comprehensive instructions on how to publish these wiki pages to your remote repository's official GitHub Wiki tab. | Git, GitHub Wiki Repository |

---

## 🏛️ Project Philosophy & Design Language

The Vault is not just a repository of links; it is a showcase of frontend engineering itself. The project values:
* **Rich Aesthetics**: Avoids plain web colors. It leverages a curated typography combination (serif headers + monospace codes + clean sans-serif text) and a cohesive color palette based on paper, ink, brass, and deep burgundy.
* **Separation of Concerns**: Security is enforced at the database level. Frontend components acts as the visual and UX layer, presenting gate-blocking screens when unauthorized, but the true barrier is database RLS that checks cryptographically signed geolocation logs.
* **Atmospheric Polish**: Elements morph, stack, and slide smoothly. Every scroll boundary, hover gesture, and button interaction feels deliberate and weighted.

---

## 📁 Source File Directory

If you are exploring the codebase directly, here is where each file lives:

* **Entry point**: [index.html](file:///d:/antigravity/amazing-websites/index.html) & [main.jsx](file:///d:/antigravity/amazing-websites/src/main.jsx)
* **App Shell & Auth Sync**: [App.jsx](file:///d:/antigravity/amazing-websites/src/App.jsx)
* **Access Control Screen**: [LocationGate.jsx](file:///d:/antigravity/amazing-websites/src/LocationGate.jsx)
* **Dashboard Container**: [Dashboard.jsx](file:///d:/antigravity/amazing-websites/src/Dashboard.jsx)
* **Form & Animations**: [RequestForm.jsx](file:///d:/antigravity/amazing-websites/src/RequestForm.jsx)
* **Review UI**: [ReviewPanel.jsx](file:///d:/antigravity/amazing-websites/src/ReviewPanel.jsx)
* **Card Stack Layout Engine**: [card-stack.jsx](file:///d:/antigravity/amazing-websites/src/components/ui/card-stack.jsx)
* **Gooey Text Canvas Morph**: [gooey-text-morphing.jsx](file:///d:/antigravity/amazing-websites/src/components/ui/gooey-text-morphing.jsx)
* **Client SDK Configuration**: [supabaseClient.js](file:///d:/antigravity/amazing-websites/src/supabaseClient.js)
* **Edge Function Logic**: [index.ts](file:///d:/antigravity/amazing-websites/supabase/functions/log-ip-visit/index.ts)
* **Tailwind & CSS Variables**: [index.css](file:///d:/antigravity/amazing-websites/src/index.css) & [App.css](file:///d:/antigravity/amazing-websites/src/App.css)
