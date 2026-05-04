import { useEffect, useState } from 'react';
import { supabase, type Comment } from '../lib/supabase';

interface CommentsProps {
  postId: string;
}

export default function Comments({ postId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    author_name: '',
    author_email: '',
    content: ''
  });

  useEffect(() => {
    fetchComments();
  }, [postId]);

  async function fetchComments() {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          ...formData
        });

      if (error) throw error;

      setFormData({ author_name: '', author_email: '', content: '' });
      fetchComments();
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Failed to submit comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="border-t border-gray-300 pt-16 mt-16">
      <h2 className="text-3xl font-semibold mb-12">
        Comments {comments.length > 0 && `(${comments.length})`}
      </h2>

      {loading ? (
        <p className="text-gray-500 mb-12">Loading comments...</p>
      ) : comments.length > 0 ? (
        <div className="space-y-8 mb-16">
          {comments.map((comment) => (
            <article key={comment.id} className="border-b border-gray-200 pb-8 last:border-0">
              <div className="flex items-center gap-3 mb-3">
                <span className="font-medium text-sm">{comment.author_name}</span>
                <span className="text-gray-400">•</span>
                <time className="text-sm text-gray-500">
                  {new Date(comment.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </time>
              </div>
              <p className="text-lg whitespace-pre-wrap">{comment.content}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 mb-12">No comments yet. Be the first to share your thoughts.</p>
      )}

      <div className="bg-gray-50 p-8 border border-gray-200">
        <h3 className="text-xl font-semibold mb-6">Leave a Comment</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Name"
              required
              value={formData.author_name}
              onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
              className="px-4 py-3 border border-gray-300 focus:outline-none focus:border-black text-sm"
            />
            <input
              type="email"
              placeholder="Email"
              required
              value={formData.author_email}
              onChange={(e) => setFormData({ ...formData, author_email: e.target.value })}
              className="px-4 py-3 border border-gray-300 focus:outline-none focus:border-black text-sm"
            />
          </div>
          <textarea
            placeholder="Your comment"
            required
            rows={5}
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black text-sm resize-none"
          />
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3 bg-black text-white text-sm uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:bg-gray-400"
          >
            {submitting ? 'Submitting...' : 'Submit Comment'}
          </button>
        </form>
      </div>
    </section>
  );
}
