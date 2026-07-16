import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiEdit2, FiUser, FiShield, FiPlus, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/layout/AdminLayout';
import { supabase } from '../../lib/supabase';

export default function UsersIndex() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', role: 'editor' });

  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    const { data, error } = await supabase.from('cms_users').select('*').order('created_at', { ascending: false });
    if (error) {
      toast.error('Error fetching users');
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  }

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.fullName) {
      toast.error('All fields are required');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');
      
      toast.success('User created successfully');
      setShowModal(false);
      setFormData({ fullName: '', email: '', password: '', role: 'editor' });
      fetchUsers();
    } catch (err) {
      toast.error(err.message);
    }
    setIsSubmitting(false);
  };

  return (
    <AdminLayout title="Users & Roles">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ margin: 0 }}>Manage Users</h3>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FiPlus /> Add New User
        </button>
      </div>

      <div className="cms-card" style={{ overflow: 'hidden', padding: 0 }}>
        <table className="cms-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 20 }}>Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40 }}><FiUser size={30} style={{ opacity: 0.5 }}/><br/>No users found</td></tr>
            ) : (
              users.map(u => (
                <tr key={u.id}>
                  <td>{u.full_name || '-'}</td>
                  <td>{u.email}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>
                      <FiShield size={12} /> {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${u.is_active ? 'published' : 'danger'}`}>
                      {u.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <Link href={`/users/${u.id}`} className="btn btn-ghost" style={{ padding: '4px 8px' }}>
                        <FiEdit2 size={14} /> Edit Role
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="cms-card" style={{ width: '100%', maxWidth: 400, position: 'relative' }}>
            <button 
              onClick={() => setShowModal(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}
            >
              <FiX size={20} />
            </button>
            <h3 style={{ marginTop: 0, marginBottom: 20 }}>Add New User</h3>
            <form onSubmit={handleCreateUser}>
              <div style={{ marginBottom: 16 }}>
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} placeholder="John Doe" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label className="form-label">Email Address (Login ID)</label>
                <input type="email" className="form-input" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="user@example.com" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label className="form-label">Password</label>
                <input type="password" className="form-input" required minLength={6} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Min 6 characters" />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label className="form-label">Role</label>
                <select className="form-select" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  <option value="editor">Editor (Can manage blogs)</option>
                  <option value="admin">Admin (Full Access)</option>
                  <option value="seo">SEO Manager</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
