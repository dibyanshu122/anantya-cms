import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FiSave, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/layout/AdminLayout';
import { supabase } from '../../lib/supabase';
import slugify from 'slugify';

export default function EditCategory() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!id) return;
    if (id === 'new') {
      setFetching(false);
      return;
    }
    fetchCategory();
  }, [id]);

  async function fetchCategory() {
    try {
      const { data, error } = await supabase.from('categories').select('*').eq('id', id).single();
      if (error) throw error;
      setName(data.name || '');
      setSlug(data.slug || '');
      setDescription(data.description || '');
    } catch (e) {
      toast.error('Failed to load category');
    }
    setFetching(false);
  }

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    if (!slug || slug === slugify(name.slice(0, -1), { lower: true, strict: true })) {
      setSlug(slugify(val, { lower: true, strict: true }));
    }
  };

  const handleSave = async () => {
    if (!name || !slug) {
      toast.error('Name and slug are required');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name,
        slug,
        description
      };

      if (id === 'new') {
        const { error } = await supabase.from('categories').insert([payload]);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('categories').update(payload).eq('id', id);
        if (error) throw error;
      }
      toast.success('Category saved successfully');
      router.push('/categories');
    } catch (e) {
      toast.error(e.message || 'Failed to save category');
    }
    setLoading(false);
  };

  if (fetching) return <AdminLayout><div style={{ padding: 20 }}>Loading...</div></AdminLayout>;

  return (
    <AdminLayout title={id === 'new' ? 'New Category' : 'Edit Category'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <button onClick={() => router.push('/categories')} className="btn btn-ghost">
          <FiArrowLeft /> Back
        </button>
        <button onClick={handleSave} className="btn btn-primary" disabled={loading}>
          <FiSave /> {loading ? 'Saving...' : 'Save Category'}
        </button>
      </div>

      <div className="cms-card" style={{ maxWidth: 600 }}>
        <div style={{ marginBottom: 16 }}>
          <label className="form-label">Category Name</label>
          <input type="text" className="form-input" value={name} onChange={handleNameChange} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label className="form-label">Slug</label>
          <input type="text" className="form-input" value={slug} onChange={e => setSlug(e.target.value)} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label className="form-label">Description</label>
          <textarea className="form-input" rows={4} value={description} onChange={e => setDescription(e.target.value)} />
        </div>
      </div>
    </AdminLayout>
  );
}
