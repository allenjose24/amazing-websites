import { useState } from 'react';
import { supabase } from './supabaseClient';

// We import the hash function we already defined in App.jsx (or keep a utility file)
async function hashEmail(email) {
  const msgUint8 = new TextEncoder().encode(email.toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function AdminPanel({ userEmail }) {
  const [form, setForm] = useState({ title: '', url: '', category: '', description: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reuse the exact same hash validation logic
    const hashedInput = await hashEmail(userEmail);
    
    if (hashedInput !== import.meta.env.VITE_ALLOWED_EMAIL_HASH) {
      alert("Unauthorized: Only the vault owner can add resources.");
      return;
    }

    const { error } = await supabase.from('resources').insert([form]);
    if (error) alert('Error: ' + error.message);
    else {
      alert('Resource added successfully!');
      setForm({ title: '', url: '', category: '', description: '' });
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #444', borderRadius: '8px', marginTop: '20px' }}>
      <h3>Add New Resource</h3>
      <form onSubmit={handleSubmit}>
        <input placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} style={{ display: 'block', margin: '5px 0', width: '100%' }} />
        <input placeholder="URL" value={form.url} onChange={e => setForm({...form, url: e.target.value})} style={{ display: 'block', margin: '5px 0', width: '100%' }} />
        <input placeholder="Category" value={form.category} onChange={e => setForm({...form, category: e.target.value})} style={{ display: 'block', margin: '5px 0', width: '100%' }} />
        <textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={{ display: 'block', margin: '5px 0', width: '100%' }} />
        <button type="submit" style={{ marginTop: '10px' }}>Add to Vault</button>
      </form>
    </div>
  );
}