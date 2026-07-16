import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiCheck, FiX, FiTrash2, FiMessageSquare, FiExternalLink } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/layout/AdminLayout';
import { supabase } from '../../lib/supabase';

export default function CommentsManager() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // 'all', 'pending', 'approved', 'spam', 'trash'

  useEffect(() => {
    fetchComments();
  }, [filter]);

  async function fetchComments() {
    setLoading(true);
    let query = supabase.from('blog_comments').select('*, blogs(title, slug)').order('created_at', { ascending: false });
    
    if (filter !== 'all') {
      query = query.eq('status', filter);
    }
    
    const { data, error } = await query;
    if (error) {
      toast.error('Error fetching comments');
    } else {
      setComments(data || []);
    }
    setLoading(false);
  }

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase.from('blog_comments').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      toast.success(`Comment moved to ${newStatus}`);
      fetchComments();
    } catch (e) {
      toast.error('Failed to update comment');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this comment?')) return;
    try {
      const { error } = await supabase.from('blog_comments').delete().eq('id', id);
      if (error) throw error;
      toast.success('Comment deleted');
      fetchComments();
    } catch (e) {
      toast.error('Failed to delete comment');
    }
  };

  return (
    <AdminLayout title="Comments Moderation">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ margin: 0 }}>Moderate Comments</h3>
        <div style={{ display: 'flex', gap: 10 }}>
          {['pending', 'approved', 'spam', 'trash', 'all'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`btn ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
              style={{ textTransform: 'capitalize' }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="cms-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="cms-table">
          <thead>
            <tr>
              <th style={{ width: '25%' }}>Author</th>
              <th style={{ width: '40%' }}>Comment</th>
              <th style={{ width: '20%' }}>In Response To</th>
              <th style={{ width: '15%', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: 20 }}>Loading...</td></tr>
            ) : comments.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
                  <FiMessageSquare size={30} style={{ opacity: 0.5, marginBottom: 10 }} /><br/>
                  No {filter !== 'all' ? filter : ''} comments found
                </td>
              </tr>
            ) : (
              comments.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{c.author_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      <a href={`mailto:${c.author_email}`} style={{ color: 'inherit' }}>{c.author_email}</a>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                      {new Date(c.created_at).toLocaleString()}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                      {c.content}
                    </div>
                  </td>
                  <td>
                    {c.blogs ? (
                      <Link href={`/blogs/${c.blog_id}`} style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none' }}>
                        {c.blogs.title}
                        <FiExternalLink style={{ marginLeft: 4 }} />
                      </Link>
                    ) : (
                      <span style={{ color: 'var(--muted)', fontSize: 12 }}>Blog deleted</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      {c.status !== 'approved' && (
                        <button onClick={() => handleUpdateStatus(c.id, 'approved')} className="btn btn-ghost" style={{ padding: '4px 8px', color: 'var(--success)' }} title="Approve">
                          <FiCheck size={14} />
                        </button>
                      )}
                      {c.status !== 'spam' && (
                        <button onClick={() => handleUpdateStatus(c.id, 'spam')} className="btn btn-ghost" style={{ padding: '4px 8px', color: 'var(--warning)' }} title="Mark Spam">
                          <FiX size={14} />
                        </button>
                      )}
                      {c.status !== 'trash' ? (
                        <button onClick={() => handleUpdateStatus(c.id, 'trash')} className="btn btn-ghost" style={{ padding: '4px 8px', color: 'var(--danger)' }} title="Trash">
                          <FiTrash2 size={14} />
                        </button>
                      ) : (
                        <button onClick={() => handleDelete(c.id)} className="btn btn-ghost" style={{ padding: '4px 8px', color: 'var(--danger)' }} title="Delete Permanently">
                          <FiTrash2 size={14} /> Delete
                        </button>
                      )}
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
