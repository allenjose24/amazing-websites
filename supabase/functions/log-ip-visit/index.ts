// supabase/functions/log-ip-visit/index.ts
//
// Deploy with: supabase functions deploy log-ip-visit
//
// Runs server-side, so the IP address it reads is the real connecting IP
// (from the request headers Supabase's edge runtime provides), not
// something the browser could fake. Called once per page load — frontend
// fires this immediately on mount, before the geolocation permission
// prompt even appears.
//
// This writes a 'ip_only' row unconditionally, satisfying "always log IP
// location regardless of permission outcome."

import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
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

    // Identify the calling user from their JWT (passed through from the client).
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

    // Supabase Edge Functions (Deno Deploy under the hood) surface the
    // real client IP in this header. Fall back to x-forwarded-for just in case.
    const ip =
      req.headers.get('x-real-ip') ||
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      null;

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
        // Still log the visit row below, just without location fields.
      }
    }

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

    if (insertErr) {
      console.error('Failed to insert visit row:', insertErr);
      return new Response(JSON.stringify({ error: insertErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, ip, location }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('log-ip-visit error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});