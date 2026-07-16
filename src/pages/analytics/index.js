import { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { supabase } from '../../lib/supabase';
import { FiSave, FiActivity, FiSearch, FiMonitor, FiPieChart, FiCode } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AnalyticsManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [configs, setConfigs] = useState({
    ga4: { measurement_id: '', is_active: false },
    gtm: { container_id: '', is_active: false },
    gsc: { verification_code: '', is_active: false },
    bing: { verification_code: '', is_active: false },
    fb_pixel: { pixel_id: '', is_active: false }
  });

  useEffect(() => {
    fetchConfigs();
  }, []);

  async function fetchConfigs() {
    setLoading(true);
    const { data, error } = await supabase.from('analytics_config').select('*').limit(1).single();
    if (error && error.code !== 'PGRST116') {
      toast.error('Error fetching analytics configurations');
    } else if (data) {
      setConfigs({
        ga4: { measurement_id: data.ga4_measurement_id || '', is_active: data.ga4_enabled || false },
        gtm: { container_id: data.gtm_container_id || '', is_active: data.gtm_enabled || false },
        gsc: { verification_code: data.gsc_verification_code || '', is_active: data.gsc_verified || false },
        bing: { verification_code: data.bing_verification_code || '', is_active: data.bing_enabled || false },
        fb_pixel: { pixel_id: data.fb_pixel_id || '', is_active: data.fb_pixel_enabled || false }
      });
    }
    setLoading(false);
  }

  const handleToggle = (provider) => {
    setConfigs(prev => ({
      ...prev,
      [provider]: { ...prev[provider], is_active: !prev[provider].is_active }
    }));
  };

  const handleChange = (provider, field, value) => {
    setConfigs(prev => ({
      ...prev,
      [provider]: { ...prev[provider], [field]: value }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    
    const payload = {
      ga4_measurement_id: configs.ga4.measurement_id,
      ga4_enabled: configs.ga4.is_active,
      gtm_container_id: configs.gtm.container_id,
      gtm_enabled: configs.gtm.is_active,
      gsc_verification_code: configs.gsc.verification_code,
      gsc_verified: configs.gsc.is_active,
      bing_verification_code: configs.bing.verification_code,
      bing_enabled: configs.bing.is_active,
      fb_pixel_id: configs.fb_pixel.pixel_id,
      fb_pixel_enabled: configs.fb_pixel.is_active,
      updated_at: new Date().toISOString()
    };

    try {
      // Get existing row to determine if we update or insert
      const { data: existing } = await supabase.from('analytics_config').select('id').limit(1).single();
      
      let error;
      if (existing?.id) {
        ({ error } = await supabase.from('analytics_config').update(payload).eq('id', existing.id));
      } else {
        ({ error } = await supabase.from('analytics_config').insert([payload]));
      }

      if (error) throw error;
      toast.success('Analytics configuration saved successfully');
    } catch (err) {
      toast.error(err.message || 'Error saving configurations');
    }
    setSaving(false);
  };

  if (loading) {
    return <AdminLayout title="Analytics & Tracking"><div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div></AdminLayout>;
  }

  return (
    <AdminLayout title="Analytics & Tracking">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div>
          <h3 style={{ margin: 0 }}>Tracking Codes & Integrations</h3>
          <p style={{ margin: '5px 0 0 0', color: 'var(--text-muted)' }}>
            Manage your global tracking scripts, pixel IDs, and search console verifications.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <FiSave /> {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px' }}>
        
        {/* Google Analytics 4 */}
        <div className="cms-card" style={{ padding: '25px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
            <div style={{ width: '40px', height: '40px', background: 'rgba(250, 204, 21, 0.1)', color: '#FACC15', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiActivity size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: '1.1rem' }}>Google Analytics 4</h4>
              <span className={`badge ${configs.ga4.is_active ? 'badge-published' : 'badge-draft'}`} style={{ marginTop: '5px' }}>
                {configs.ga4.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div 
              className={`toggle-switch ${configs.ga4.is_active ? 'active' : ''}`}
              onClick={() => handleToggle('ga4')}
              style={{
                width: '40px', height: '22px', borderRadius: '11px', 
                background: configs.ga4.is_active ? 'var(--primary)' : 'var(--border)',
                position: 'relative', cursor: 'pointer', transition: '0.3s'
              }}
            >
              <div style={{
                width: '18px', height: '18px', borderRadius: '50%', background: 'white',
                position: 'absolute', top: '2px', left: configs.ga4.is_active ? '20px' : '2px',
                transition: '0.3s'
              }}/>
            </div>
          </div>
          <div className="form-group mb-0">
            <label className="form-label">Measurement ID</label>
            <input type="text" className="form-input" placeholder="G-XXXXXXXXXX" 
              value={configs.ga4.measurement_id}
              onChange={(e) => handleChange('ga4', 'measurement_id', e.target.value)}
              disabled={!configs.ga4.is_active}
            />
          </div>
        </div>

        {/* Google Tag Manager */}
        <div className="cms-card" style={{ padding: '25px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
            <div style={{ width: '40px', height: '40px', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiCode size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: '1.1rem' }}>Google Tag Manager</h4>
              <span className={`badge ${configs.gtm.is_active ? 'badge-published' : 'badge-draft'}`} style={{ marginTop: '5px' }}>
                {configs.gtm.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div 
              className={`toggle-switch ${configs.gtm.is_active ? 'active' : ''}`}
              onClick={() => handleToggle('gtm')}
              style={{
                width: '40px', height: '22px', borderRadius: '11px', 
                background: configs.gtm.is_active ? 'var(--primary)' : 'var(--border)',
                position: 'relative', cursor: 'pointer', transition: '0.3s'
              }}
            >
              <div style={{
                width: '18px', height: '18px', borderRadius: '50%', background: 'white',
                position: 'absolute', top: '2px', left: configs.gtm.is_active ? '20px' : '2px',
                transition: '0.3s'
              }}/>
            </div>
          </div>
          <div className="form-group mb-0">
            <label className="form-label">Container ID</label>
            <input type="text" className="form-input" placeholder="GTM-XXXXXXX" 
              value={configs.gtm.container_id}
              onChange={(e) => handleChange('gtm', 'container_id', e.target.value)}
              disabled={!configs.gtm.is_active}
            />
          </div>
        </div>

        {/* Google Search Console */}
        <div className="cms-card" style={{ padding: '25px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
            <div style={{ width: '40px', height: '40px', background: 'rgba(34, 197, 94, 0.1)', color: '#22C55E', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiSearch size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: '1.1rem' }}>Google Search Console</h4>
              <span className={`badge ${configs.gsc.is_active ? 'badge-published' : 'badge-draft'}`} style={{ marginTop: '5px' }}>
                {configs.gsc.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div 
              className={`toggle-switch ${configs.gsc.is_active ? 'active' : ''}`}
              onClick={() => handleToggle('gsc')}
              style={{
                width: '40px', height: '22px', borderRadius: '11px', 
                background: configs.gsc.is_active ? 'var(--primary)' : 'var(--border)',
                position: 'relative', cursor: 'pointer', transition: '0.3s'
              }}
            >
              <div style={{
                width: '18px', height: '18px', borderRadius: '50%', background: 'white',
                position: 'absolute', top: '2px', left: configs.gsc.is_active ? '20px' : '2px',
                transition: '0.3s'
              }}/>
            </div>
          </div>
          <div className="form-group mb-0">
            <label className="form-label">HTML Tag Verification Code</label>
            <input type="text" className="form-input" placeholder="e.g. y0JkG3..." 
              value={configs.gsc.verification_code}
              onChange={(e) => handleChange('gsc', 'verification_code', e.target.value)}
              disabled={!configs.gsc.is_active}
            />
            <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '5px' }}>Outputs: &lt;meta name="google-site-verification" content="..." /&gt;</small>
          </div>
        </div>

        {/* Facebook Pixel */}
        <div className="cms-card" style={{ padding: '25px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
            <div style={{ width: '40px', height: '40px', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiPieChart size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: '1.1rem' }}>Facebook Pixel</h4>
              <span className={`badge ${configs.fb_pixel.is_active ? 'badge-published' : 'badge-draft'}`} style={{ marginTop: '5px' }}>
                {configs.fb_pixel.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div 
              className={`toggle-switch ${configs.fb_pixel.is_active ? 'active' : ''}`}
              onClick={() => handleToggle('fb_pixel')}
              style={{
                width: '40px', height: '22px', borderRadius: '11px', 
                background: configs.fb_pixel.is_active ? 'var(--primary)' : 'var(--border)',
                position: 'relative', cursor: 'pointer', transition: '0.3s'
              }}
            >
              <div style={{
                width: '18px', height: '18px', borderRadius: '50%', background: 'white',
                position: 'absolute', top: '2px', left: configs.fb_pixel.is_active ? '20px' : '2px',
                transition: '0.3s'
              }}/>
            </div>
          </div>
          <div className="form-group mb-0">
            <label className="form-label">Pixel ID</label>
            <input type="text" className="form-input" placeholder="1234567890" 
              value={configs.fb_pixel.pixel_id}
              onChange={(e) => handleChange('fb_pixel', 'pixel_id', e.target.value)}
              disabled={!configs.fb_pixel.is_active}
            />
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
