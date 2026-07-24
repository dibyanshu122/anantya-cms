import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiPlus, FiEdit2, FiTrash2, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/layout/AdminLayout';
import { supabase } from '../../lib/supabase';
import ConfirmModal from '../../components/common/ConfirmModal';

export default function AuthorsIndex() {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchAuthors();
  }, []);

  async function fetchAuthors() {
    setLoading(true);
    const { data, error } = await supabase.from('authors').select('*').order('name');
    if (error) {
      toast.error('Error fetching authors');
    } else {
      setAuthors(data || []);
    }
    setLoading(false);
  }

  const handleDelete = (id) => {
    setConfirmDelete(id);
  };

  const executeDelete = async () => {
    const id = confirmDelete;
    if (!id) return;
    
    
    try {
      const { error } = await supabase.from('authors').delete().eq('id', id);
      if (error) throw error;
      toast.success('Author deleted');
      fetchAuthors();
    } catch (e) {
      toast.error('Failed to delete author');
    }
      setConfirmDelete(null);
  };

  return (
    <AdminLayout title="Authors">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ margin: 0 }}>Manage Authors</h3>
        <button className="btn btn-primary" onClick={() => router.push('/authors/new')}>
          <FiPlus /> Add Author
        </button>
      </div>

      <div className="cms-card" style={{ overflow: 'hidden', padding: 0 }}>
        <table className="cms-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Email</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 20 }}>Loading...</td></tr>
            ) : authors.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40 }}><FiUser size={30} style={{ opacity: 0.5 }}/><br/>No authors found</td></tr>
            ) : (
              authors.map(a => (
                <tr key={a.id}>
                  <td>{a.name}</td>
                  <td>{a.slug}</td>
                  <td>{a.email}</td>
                  <td>
                    <span className={`badge badge-${a.is_active ? 'published' : 'draft'}`}>
                      {a.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <Link href={`/authors/${a.id}`} className="btn btn-ghost" style={{ padding: '4px 8px' }}>
                        <FiEdit2 size={14} />
                      </Link>
                      <button onClick={() => handleDelete(a.id)} className="btn btn-ghost" style={{ padding: '4px 8px', color: 'var(--danger)' }}>
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    
      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={executeDelete}
        title="Delete Author"
        message="Are you sure you want to delete this author? This action cannot be undone."
      />
    </AdminLayout>
  );
}
