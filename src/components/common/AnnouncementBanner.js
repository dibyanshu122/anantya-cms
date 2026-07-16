import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { FiX } from 'react-icons/fi';

export default function AnnouncementBanner() {
  const [data, setData] = useState(null);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    async function fetchAnnouncement() {
      try {
        const { data: announcement } = await supabase
          .from('announcements')
          .select('*')
          .eq('is_active', true)
          .single();
          
        if (announcement) {
          setData(announcement);
        }
      } catch (e) {
        console.error('Error fetching announcement', e);
      }
    }
    fetchAnnouncement();
  }, []);

  if (!data || closed) return null;

  // Agar Modal Popup hai
  if (data.type === 'popup') {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, backdropFilter: 'blur(4px)' }}>
        <div style={{ background: data.background_color, color: data.text_color, padding: '30px 40px', borderRadius: 16, textAlign: 'center', maxWidth: 450, width: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', position: 'relative' }}>
          <button 
            onClick={() => setClosed(true)} 
            style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.2)', border: 'none', color: data.text_color, borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <FiX />
          </button>
          
          {data.image_url && <img src={data.image_url} alt="Popup" style={{ width: '100%', borderRadius: 8, marginBottom: 20, maxHeight: 200, objectFit: 'cover' }} />}
          
          <h3 style={{ margin: '0 0 16px 0', fontSize: 22 }}>{data.text}</h3>
          
          {data.link && (
            <a href={data.link} style={{ display: 'inline-block', padding: '12px 24px', background: '#fff', color: '#000', textDecoration: 'none', borderRadius: 8, fontWeight: 600, marginTop: 10 }}>
              Learn More
            </a>
          )}
        </div>
      </div>
    );
  }

  // Agar sirf Top Banner hai
  return (
    <div style={{ background: data.background_color, color: data.text_color, padding: '12px 20px', textAlign: 'center', position: 'relative', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
      <span style={{ fontWeight: 500 }}>{data.text}</span> 
      {data.link && <a href={data.link} style={{ color: 'inherit', textDecoration: 'underline', fontWeight: 600 }}>Click here</a>}
      <button 
        onClick={() => setClosed(true)} 
        style={{ position: 'absolute', right: 20, background: 'transparent', border: 'none', color: data.text_color, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
      >
        <FiX size={18} />
      </button>
    </div>
  );
}
