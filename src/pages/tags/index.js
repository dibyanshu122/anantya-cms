import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiPlus, FiEdit2, FiTrash2, FiTag } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/layout/AdminLayout';
import { supabase } from '../../lib/supabase';
import ConfirmModal from '../../components/common/ConfirmModal';

export default function TagsIndex() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchTags();
  }, []);

  async function fetchTags() {
    setLoading(true);
    const { data, error } = await supabase.from('tags').select('*').order('name');
    if (error) {
      toast.error('Error fetching tags');
    } else {
      setTags(data || []);
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
      const { error } = await supabase.from('tags').delete().eq('id', id);
      if (error) throw error;
      toast.success('Tag deleted');
      fetchTags();
    } catch (e) {
      toast.error('Failed to delete tag');
    }
      setConfirmDelete(null);
  };

  return (
    <AdminLayout title="Tags">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ margin: 0 }}>Manage Tags</h3>
        <button className="btn btn-primary" onClick={() => router.push('/tags/new')}>
          <FiPlus /> Add Tag
        </button>
      </div>

      <div className="cms-card" style={{ overflow: 'hidden', padding: 0 }}>
        <table className="cms-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} style={{ textAlign: 'center', padding: 20 }}>Loading...</td></tr>
            ) : tags.length === 0 ? (
              <tr><td colSpan={3} style={{ textAlign: 'center', padding: 40 }}><FiTag size={30} style={{ opacity: 0.5 }}/><br/>No tags found</td></tr>
            ) : (
              tags.map(t => (
                <tr key={t.id}>
                  <td>{t.name}</td>
                  <td>{t.slug}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <Link href={`/tags/${t.id}`} className="btn btn-ghost" style={{ padding: '4px 8px' }}>
                        <FiEdit2 size={14} />
                      </Link>
                      <button onClick={() => handleDelete(t.id)} className="btn btn-ghost" style={{ padding: '4px 8px', color: 'var(--danger)' }}>
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
        title="Delete Tag"
        message="Are you sure you want to delete this tag? This action cannot be undone."
      />
    </AdminLayout>
  );
}
