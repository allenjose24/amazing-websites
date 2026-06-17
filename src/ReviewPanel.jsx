import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { Check, X, Clock } from 'lucide-react';

// ── Status pill ─────────────────────────────────────────────────────────────
function StatusPill({ status }) {
  const styles = {
    pending:  { bg: 'rgba(182,138,53,0.12)', color: '#b68a35', label: 'Pending' },
    approved: { bg: 'rgba(31,77,61,0.1)',    color: '#1f4d3d', label: 'Approved' },
    rejected: { bg: 'rgba(139,38,53,0.1)',   color: '#8b2635', label: 'Rejected' },
  }[status];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: 99,
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: 10,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        background: styles.bg,
        color: styles.color,
      }}
    >
      {styles.label}
    </span>
  );
}

// ── Single request row ──────────────────────────────────────────────────────
function RequestRow({ request, onApprove, onReject, busy }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: '18px 20px',
        borderRadius: 12,
        border: '1px solid rgba(18,21,28,0.08)',
        background: 'rgba(255,255,255,0.5)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
          <h3 style={{ margin: 0, fontFamily: 'var(--font-display, serif)', fontSize: 17, fontWeight: 500, color: 'rgba(18,21,28,0.88)' }}>
            {request.title}
          </h3>
          <a
            href={request.url}
            target="_blank"
            rel="noreferrer"
            style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, color: 'rgba(18,21,28,0.45)', textDecoration: 'underline', wordBreak: 'break-all' }}
          >
            {request.url}
          </a>
        </div>
        <StatusPill status={request.status} />
      </div>

      {request.description && (
        <p style={{ margin: 0, fontFamily: 'var(--font-body, sans-serif)', fontSize: 13.5, color: 'rgba(18,21,28,0.65)', lineHeight: 1.5 }}>
          {request.description}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-mono, monospace)', fontSize: 11, color: 'rgba(18,21,28,0.4)' }}>
          <span>{request.category}</span>
          <span>·</span>
          <span>{request.user_name}</span>
          <span>·</span>
          <span>{new Date(request.created_at).toLocaleDateString()}</span>
        </div>

        {request.status === 'pending' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => onReject(request.id)}
              disabled={busy}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'transparent',
                border: '1px solid rgba(139,38,53,0.3)',
                borderRadius: 99,
                padding: '6px 14px',
                fontFamily: 'var(--font-body, sans-serif)',
                fontSize: 12.5,
                fontWeight: 500,
                color: '#8b2635',
                cursor: busy ? 'not-allowed' : 'pointer',
                opacity: busy ? 0.5 : 1,
              }}
            >
              <X size={13} /> Reject
            </button>
            <button
              onClick={() => onApprove(request.id)}
              disabled={busy}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: '#1f4d3d',
                border: 'none',
                borderRadius: 99,
                padding: '6px 14px',
                fontFamily: 'var(--font-body, sans-serif)',
                fontSize: 12.5,
                fontWeight: 500,
                color: '#f5f5f1',
                cursor: busy ? 'not-allowed' : 'pointer',
                opacity: busy ? 0.5 : 1,
              }}
            >
              <Check size={13} /> Approve
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main ReviewPanel ─────────────────────────────────────────────────────────
// Admin-only. Lists requests (pending first) and lets the admin approve or
// reject them. Approve calls the approve_request() Postgres function, which
// atomically inserts into `resources` and increments the submitter's
// contribution count — both happen server-side so this can't be spoofed
// from the client.
export default function ReviewPanel() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [filter, setFilter] = useState('pending'); // 'pending' | 'all'

  useEffect(() => { fetchRequests(); }, []);

  async function fetchRequests() {
    setLoading(true);
    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) console.error('Error fetching requests:', error);
    else setRequests(data || []);
    setLoading(false);
  }

  async function handleApprove(id) {
    setBusyId(id);
    const { error } = await supabase.rpc('approve_request', { request_id: id });
    if (error) {
      console.error('Approve failed:', error);
      alert('Could not approve this request — check console for details.');
    } else {
      await fetchRequests();
    }
    setBusyId(null);
  }

  async function handleReject(id) {
    setBusyId(id);
    const { error } = await supabase.rpc('reject_request', { request_id: id });
    if (error) {
      console.error('Reject failed:', error);
      alert('Could not reject this request — check console for details.');
    } else {
      await fetchRequests();
    }
    setBusyId(null);
  }

  const visible = filter === 'pending'
    ? requests.filter((r) => r.status === 'pending')
    : requests;

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Clock size={15} style={{ color: 'rgba(18,21,28,0.4)' }} />
          <h2 style={{ margin: 0, fontFamily: 'var(--font-display, serif)', fontWeight: 500, fontSize: 22, color: 'rgba(18,21,28,0.88)' }}>
            Review requests
          </h2>
          {pendingCount > 0 && (
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, color: '#b68a35', background: 'rgba(182,138,53,0.12)', borderRadius: 99, padding: '2px 9px' }}>
              {pendingCount} pending
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {['pending', 'all'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                background: filter === f ? '#12151c' : 'transparent',
                color: filter === f ? '#f5f5f1' : 'rgba(18,21,28,0.5)',
                border: '1px solid rgba(18,21,28,0.12)',
                borderRadius: 99,
                padding: '5px 14px',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                cursor: 'pointer',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 13, color: 'rgba(18,21,28,0.4)' }}>Loading requests…</p>
      ) : visible.length === 0 ? (
        <p style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 13, color: 'rgba(18,21,28,0.35)' }}>
          {filter === 'pending' ? 'Nothing waiting on review.' : 'No requests yet.'}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {visible.map((req) => (
            <RequestRow
              key={req.id}
              request={req}
              onApprove={handleApprove}
              onReject={handleReject}
              busy={busyId === req.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}