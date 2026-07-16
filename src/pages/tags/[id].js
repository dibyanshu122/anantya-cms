import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FiSave, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/layout/AdminLayout';
import { supabase } from '../../lib/supabase';
import slugify from 'slugify';

export default function EditTag() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  useEffect(() => {
    if (!id) return;
    if (id === 'new') {
      setFetching(false);
      return;
    }
    fetchTag();
  }, [id]);

  async function fetchTag() {
    try {
      const { data, error } = await supabase.from('tags').select('*').eq('id', id).single();
      if (error) throw error;
      setName(data.name || '');
      setSlug(data.slug || '');
    } catch (e) {
      toast.error('Failed to load tag');
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
      const payload = { name, slug };

      if (id === 'new') {
        const { error } = await supabase.from('tags').insert([payload]);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('tags').update(payload).eq('id', id);
        if (error) throw error;
      }
      toast.success('Tag saved successfully');
      router.push('/tags');
    } catch (e) {
      toast.error(e.message || 'Failed to save tag');
    }
    setLoading(false);
  };

  if (fetching) return <AdminLayout><div style={{ padding: 20 }}>Loading...</div></AdminLayout>;

  return (
    <AdminLayout title={id === 'new' ? 'New Tag' : 'Edit Tag'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <button onClick={() => router.push('/tags')} className="btn btn-ghost">
          <FiArrowLeft /> Back
        </button>
        <button onClick={handleSave} className="btn btn-primary" disabled={loading}>
          <FiSave /> {loading ? 'Saving...' : 'Save Tag'}
        </button>
      </div>

      <div className="cms-card" style={{ maxWidth: 600 }}>
        <div style={{ marginBottom: 16 }}>
          <label className="form-label">Tag Name</label>
          <input type="text" className="form-input" value={name} onChange={handleNameChange} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label className="form-label">Slug</label>
          <input type="text" className="form-input" value={slug} onChange={e => setSlug(e.target.value)} />
        </div>
      </div>
    </AdminLayout>
  );
}
