# Serverless Edge Functions ⚡

This document covers the serverless edge compute layer of **Amazing Websites (The Vault)**, highlighting the design of the `log-ip-visit` Deno Edge Function and explaining its security and geocoding implementations.

---

## ⚡ Deno Deploy Edge Architecture

Supabase Edge Functions are hosted on Deno Deploy. Unlike standard Node.js applications, they run in Deno’s V8 isolate environment, providing fast startup times and low latency.

The platform uses `log-ip-visit` as an unconditional audit mechanism:
* **Fires immediately on mount**: The client invokes the function before the browser's GPS prompt displays.
* **Server-side validation**: Reads IP data directly from network headers, preventing client-side spoofing.
* **Service Role privilege**: Inserts logs into the `visits` database table, bypassing the default RLS rules that prevent direct user inserts of IP records.

---

## 📁 File Structure & Entry Point

The edge function is located at:
* **Function Entry**: [supabase/functions/log-ip-visit/index.ts](file:///d:/antigravity/amazing-websites/supabase/functions/log-ip-visit/index.ts)

---

## 🔍 Code Walkthrough & Analysis

Below is a detailed analysis of the logic in `log-ip-visit/index.ts`.

### 1. Cross-Origin Resource Sharing (CORS) Configuration
To allow browsers to invoke the edge function, it implements a CORS handshake:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

When a browser makes a cross-origin request, it sends a preflight `OPTIONS` request. The function intercepts this and returns a 200 OK response with the required headers:

```typescript
if (req.method === 'OPTIONS') {
  return new Response('ok', { headers: corsHeaders });
}
```

---

### 2. Session Cryptographic Verification
The client sends its current session JSON Web Token (JWT) in the `Authorization` header. The function validates this token to verify the user's identity:

```typescript
const authHeader = req.headers.get('Authorization');
if (!authHeader) {
  return new Response(JSON.stringify({ error: 'Missing auth header' }), {
    status: 401,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const { data: userData, error: userErr } = await supabase.auth.getUser(
  authHeader.replace('Bearer ', '')
);
if (userErr || !userData?.user) {
  return new Response(JSON.stringify({ error: 'Invalid session' }), {
    status: 401,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
const user = userData.user;
```

> [!IMPORTANT]
> **Use of the Service Role Key**: 
> The Supabase client within the edge function is initialized using the `SUPABASE_SERVICE_ROLE_KEY`. This key bypasses the database's Row-Level Security (RLS), allowing the function to write visit logs even though the user's account is restricted from performing direct write operations on the `visits` table.

---

### 3. IP Resolution
Rather than relying on client-provided IP values, the function reads the real connecting IP address directly from network headers:

```typescript
const ip =
  req.headers.get('x-real-ip') ||
  req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
  null;
```
* `x-real-ip`: The standard header injected by the Supabase edge router representing the origin client IP.
* `x-forwarded-for`: A fallback list of forwarding proxies; the first item in the list represents the client's origin IP.

---

### 4. Third-Party Geocoding Lookup
The function resolves the retrieved IP address using the `ipapi.co` geocoding service:

```typescript
let location = null, latitude = null, longitude = null;

if (ip) {
  try {
    const geoRes = await fetch(`https://ipapi.co/${ip}/json/`);
    if (geoRes.ok) {
      const geo = await geoRes.json();
      if (!geo.error) {
        location = [geo.city, geo.region, geo.country_name].filter(Boolean).join(', ');
        latitude = geo.latitude ?? null;
        longitude = geo.longitude ?? null;
      }
    }
  } catch (geoErr) {
    console.error('ipapi.co lookup failed:', geoErr);
    // Failure defaults location metadata to null while continuing the log insertion.
  }
}
```

---

### 5. Database Audit Insertion
The resolved location details are saved in the `visits` table with the `ip_only` status:

```typescript
const meta = user.user_metadata || {};
const { error: insertErr } = await supabase.from('visits').insert([{
  user_id: user.id,
  visitor_email: user.email,
  first_name: meta.given_name || meta.full_name?.split(' ')[0] || 'anonymous',
  last_name: meta.family_name || '',
  ip_address: ip,
  location,
  latitude,
  longitude,
  status: 'ip_only',
}]);
```

---

## 🚀 Supabase CLI Deploy Commands

Use the Supabase CLI to deploy or update the edge function:

```bash
# 1. Log in to your remote Supabase account
npx supabase login

# 2. Deploy function code to the active project
npx supabase functions deploy log-ip-visit
```

### Required Remote Environment Variables:
The remote edge function requires configuration variables, which are set automatically in your Supabase project dashboard:
* `SUPABASE_URL`: The API URL for your Supabase project.
* `SUPABASE_SERVICE_ROLE_KEY`: The service role API key.
