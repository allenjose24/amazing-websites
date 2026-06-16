import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import AdminPanel from './AdminPanel';

export default function Dashboard({ session }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdminMode, setIsAdminMode] = useState(false);

  useEffect(() => {
    fetchResources();
  }, []);

  async function fetchResources() {
    setLoading(true);
    const { data, error } = await supabase.from('resources').select('*');
    if (error) console.error("Error fetching resources:", error);
    else setResources(data || []);
    setLoading(false);
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', color: '#fff' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Your Resource Collection</h1>
        <button 
          onClick={() => setIsAdminMode(!isAdminMode)}
          style={{ padding: '10px 20px', cursor: 'pointer' }}
        >
          {isAdminMode ? 'View Dashboard' : 'Add New Resource'}
        </button>
      </header>

      {isAdminMode ? (
        <AdminPanel userEmail={session?.user?.email} />
      ) : (
        loading ? <p>Loading vault...</p> : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: '20px',
            marginTop: '20px' 
          }}>
            {resources.map((res) => (
              <div key={res.id} style={{ 
                border: '1px solid #333', 
                padding: '20px', 
                borderRadius: '12px',
                backgroundColor: '#1a1a1a'
              }}>
                <span style={{ fontSize: '0.8rem', color: '#888' }}>{res.category}</span>
                <h3>{res.title}</h3>
                <p style={{ fontSize: '0.9rem', color: '#ccc' }}>{res.description}</p>
                <a href={res.url} target="_blank" rel="noopener noreferrer" style={{ color: '#0070f3' }}>Visit</a>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}