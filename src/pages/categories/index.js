import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiPlus, FiEdit2, FiTrash2, FiFolder } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/layout/AdminLayout';
import { supabase } from '../../lib/supabase';

export default function CategoriesIndex() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (error) {
      toast.error('Error fetching categories');
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      toast.success('Category deleted');
      fetchCategories();
    } catch (e) {
      toast.error('Failed to delete category');
    }
  };

  return (
    <AdminLayout title="Categories">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ margin: 0 }}>Manage Categories</h3>
        <button className="btn btn-primary" onClick={() => router.push('/categories/new')}>
          <FiPlus /> Add Category
        </button>
      </div>

      <div className="cms-card" style={{ overflow: 'hidden', padding: 0 }}>
        <table className="cms-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Description</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: 20 }}>Loading...</td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40 }}><FiFolder size={30} style={{ opacity: 0.5 }}/><br/>No categories found</td></tr>
            ) : (
              categories.map(c => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.slug}</td>
                  <td>{c.description || '-'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <Link href={`/categories/${c.id}`} className="btn btn-ghost" style={{ padding: '4px 8px' }}>
                        <FiEdit2 size={14} />
                      </Link>
                      <button onClick={() => handleDelete(c.id)} className="btn btn-ghost" style={{ padding: '4px 8px', color: 'var(--danger)' }}>
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
    </AdminLayout>
  );
}
