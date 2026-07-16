import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FiSave, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/layout/AdminLayout';
import { supabase } from '../../lib/supabase';

export default function EditUser() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('editor');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchUser();
  }, [id]);

  async function fetchUser() {
    try {
      const { data, error } = await supabase.from('cms_users').select('*').eq('id', id).single();
      if (error) throw error;
      setEmail(data.email || '');
      setFullName(data.full_name || '');
      setRole(data.role || 'editor');
      setIsActive(data.is_active !== false);
    } catch (e) {
      toast.error('Failed to load user');
    }
    setFetching(false);
  }

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        full_name: fullName,
        role,
        is_active: isActive
      };
      const { error } = await supabase.from('cms_users').update(payload).eq('id', id);
      if (error) throw error;
      
      toast.success('User updated successfully');
      router.push('/users');
    } catch (e) {
      toast.error(e.message || 'Failed to update user');
    }
    setLoading(false);
  };

  if (fetching) return <AdminLayout><div style={{ padding: 20 }}>Loading...</div></AdminLayout>;

  return (
    <AdminLayout title="Edit User Role">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <button onClick={() => router.push('/users')} className="btn btn-ghost">
          <FiArrowLeft /> Back
        </button>
        <button onClick={handleSave} className="btn btn-primary" disabled={loading}>
          <FiSave /> {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="cms-card" style={{ maxWidth: 600 }}>
        <div style={{ marginBottom: 16 }}>
          <label className="form-label">Email (Read Only)</label>
          <input type="email" className="form-input" value={email} disabled style={{ opacity: 0.5 }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label className="form-label">Full Name</label>
          <input type="text" className="form-input" value={fullName} onChange={e => setFullName(e.target.value)} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label className="form-label">Role</label>
          <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
            Admins have full access. Editors can write content. Viewers can only view.
          </p>
        </div>
        <div>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
            Active Account
          </label>
          {!isActive && <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>This user is suspended and cannot log in.</p>}
        </div>
      </div>
    </AdminLayout>
  );
}
