import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FiSave, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/layout/AdminLayout';
import { supabase } from '../../lib/supabase';
import slugify from 'slugify';

export default function EditAuthor() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!id) return;
    if (id === 'new') {
      setFetching(false);
      return;
    }
    fetchAuthor();
  }, [id]);

  async function fetchAuthor() {
    try {
      const { data, error } = await supabase.from('authors').select('*').eq('id', id).single();
      if (error) throw error;
      setName(data.name || '');
      setSlug(data.slug || '');
      setEmail(data.email || '');
      setBio(data.bio || '');
      setIsActive(data.is_active !== false);
    } catch (e) {
      toast.error('Failed to load author');
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
        email,
        bio,
        is_active: isActive
      };

      if (id === 'new') {
        const { error } = await supabase.from('authors').insert([payload]);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('authors').update(payload).eq('id', id);
        if (error) throw error;
      }
      toast.success('Author saved successfully');
      router.push('/authors');
    } catch (e) {
      toast.error(e.message || 'Failed to save author');
    }
    setLoading(false);
  };

  if (fetching) return <AdminLayout><div style={{ padding: 20 }}>Loading...</div></AdminLayout>;

  return (
    <AdminLayout title={id === 'new' ? 'New Author' : 'Edit Author'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <button onClick={() => router.push('/authors')} className="btn btn-ghost">
          <FiArrowLeft /> Back
        </button>
        <button onClick={handleSave} className="btn btn-primary" disabled={loading}>
          <FiSave /> {loading ? 'Saving...' : 'Save Author'}
        </button>
      </div>

      <div className="cms-card" style={{ maxWidth: 600 }}>
        <div style={{ marginBottom: 16 }}>
          <label className="form-label">Full Name</label>
          <input type="text" className="form-input" value={name} onChange={handleNameChange} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label className="form-label">Slug</label>
          <input type="text" className="form-input" value={slug} onChange={e => setSlug(e.target.value)} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label className="form-label">Email</label>
          <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label className="form-label">Bio</label>
          <textarea className="form-input" rows={4} value={bio} onChange={e => setBio(e.target.value)} />
        </div>
        <div>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
            Active (Can be selected for blogs)
          </label>
        </div>
      </div>
    </AdminLayout>
  );
}
